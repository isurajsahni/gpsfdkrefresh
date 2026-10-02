const Visitor = require('../models/Visitor');
const PageView = require('../models/PageView');
const UAParser = require('ua-parser-js');
const { isBot } = require('ua-parser-js/helpers');
const { detectSource, storedViewSource, referrerHost, SITE_HOSTS } = require('../utils/trafficSource');

// ─── Helper: Get country from IP (non-blocking, best-effort) ───
// ip-api.com free tier allows ~45 req/min, so cache successful lookups per IP
const GEO_CACHE_MAX = 5000;
const geoCache = new Map();

const getCountryFromIP = async (ip) => {
  try {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return { name: 'Local', code: 'LO' };
    }
    if (geoCache.has(ip)) {
      return geoCache.get(ip);
    }
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`, {
      signal: AbortSignal.timeout(2000),
    });
    const data = await res.json();
    if (data.country) {
      const geo = { name: data.country, code: data.countryCode };
      if (geoCache.size >= GEO_CACHE_MAX) {
        geoCache.delete(geoCache.keys().next().value);
      }
      geoCache.set(ip, geo);
      return geo;
    }
    return null;
  } catch {
    return null;
  }
};

// ─── Helper: Backfill visitor country after the response is sent ───
// Fire-and-forget: atomic update only where country is still unset, never throws
const backfillVisitorCountry = (visitorId, ip) => {
  getCountryFromIP(ip)
    .then((geo) => {
      if (!geo) return;
      return Visitor.updateOne(
        { visitorId, country: '' },
        { $set: { country: geo.name, countryCode: geo.code } }
      );
    })
    .catch(() => {});
};

// ─── Who counts as a visitor ───
// The admin and marketing dashboards and invoice previews aren't shop traffic
const INTERNAL_PATH = /^\/(admin|marketing|invoice-preview)(\/|$)/;

// Crawlers that run the site's JavaScript (Googlebot renders every page it
// indexes, and each render posted a page view) and headless test browsers
const isAutomated = (userAgent, browserName) =>
  isBot(userAgent) || /headless|lighthouse|pagespeed|gtmetrix|pingdom/i.test(`${userAgent} ${browserName}`);

// Page views sent by local development or preview copies of the site carry
// their own Origin; only the live site's count
const SITE_ORIGINS = new Set(
  [process.env.CLIENT_URL, 'https://www.gpsfdk.com', 'https://gpsfdk.com'].filter(Boolean).map((url) => url.replace(/\/+$/, '')),
);

// A page view more than 30 minutes after the visitor's last one starts a new
// visit (the usual session rule); until then it's the same visit
const VISIT_GAP_MS = 30 * 60 * 1000;

// ─── Dates: days and "today" in Indian time (UTC+5:30, no daylight saving) ───
const TZ = 'Asia/Kolkata';
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const istMidnight = (ms) => new Date(Math.floor((ms + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS);
const istDateString = (date) => new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
const RANGE_DAYS = { today: 1, '7d': 7, '30d': 30 };

// The range's calendar days in Indian time, today included; the comparison
// period is the same length of time just before it
const getDateRange = (range) => {
  const days = RANGE_DAYS[range] || 7;
  const end = new Date();
  const start = new Date(istMidnight(end.getTime()).getTime() - (days - 1) * DAY_MS);
  const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
  return { days, start, end, prevStart };
};

// Page views by people: not the admin pages, and not headless test browsers
// (recorded before those were turned away at /track). Merged into each query.
const humanViews = async () => {
  const automated = await Visitor.distinct('visitorId', { browser: /headless/i });
  return { pageUrl: { $not: INTERNAL_PATH }, ...(automated.length ? { visitorId: { $nin: automated } } : {}) };
};

const growth = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;

// Visitors in the range who first came before it
const countReturning = (visitorIds, start) =>
  Visitor.countDocuments({ visitorId: { $in: visitorIds }, firstVisitAt: { $lt: start } });

// ─── POST /api/analytics/track ───
// Called on every page view from the client
exports.trackPageView = async (req, res, next) => {
  try {
    const { visitorId, pageUrl, referrer, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, clickSource } = req.body;

    if (!visitorId) {
      return res.status(400).json({ message: 'visitorId is required' });
    }

    // Parse user agent
    const userAgent = req.headers['user-agent'] || '';
    const ua = new UAParser(userAgent);
    const browser = ua.getBrowser().name || '';
    const deviceType = ua.getDevice().type || 'desktop'; // mobile, tablet, or desktop
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';

    // Not a shopper: answer as usual but record nothing
    const origin = req.get('origin');
    if (isAutomated(userAgent, browser) || INTERNAL_PATH.test(pageUrl || '') || (origin && !SITE_ORIGINS.has(origin))) {
      return res.status(200).json({ success: true, counted: false });
    }

    // Detect traffic source
    const source = detectSource({ utmSource, referrer, clickSource });

    // Upsert visitor — country is backfilled in the background so a slow
    // ip-api.com response can never hold this request open
    const now = new Date();
    const existingVisitor = await Visitor.findOne({ visitorId });
    let returning = false;
    let needsGeo = false;

    if (existingVisitor) {
      if (now - existingVisitor.lastVisitAt > VISIT_GAP_MS) {
        existingVisitor.totalVisits += 1;
        existingVisitor.returning = true;
      }
      existingVisitor.lastVisitAt = now;
      returning = existingVisitor.returning;
      needsGeo = !existingVisitor.country;
      await existingVisitor.save();
    } else {
      needsGeo = true;
      await Visitor.create({
        visitorId,
        firstVisitAt: now,
        lastVisitAt: now,
        totalVisits: 1,
        device: deviceType,
        browser,
        ip,
        returning: false,
        country: '',
        countryCode: '',
      });
    }

    if (needsGeo) {
      backfillVisitorCountry(visitorId, ip);
    }

    // Log page view (always)
    await PageView.create({
      visitorId,
      pageUrl: pageUrl || '/',
      referrer: referrer || '',
      utmSource: utmSource || '',
      utmMedium: utmMedium || '',
      utmCampaign: utmCampaign || '',
      utmTerm: utmTerm || '',
      utmContent: utmContent || '',
      source,
    });

    res.status(200).json({ success: true, returning });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/stats?range=7d|30d|today ───
exports.getStats = async (req, res, next) => {
  try {
    const { start, end, prevStart } = getDateRange(req.query.range || '7d');
    const human = await humanViews();
    const inRange = { timestamp: { $gte: start, $lte: end }, ...human };
    const inPrev = { timestamp: { $gte: prevStart, $lt: start }, ...human };

    const [totalViews, visitorIds, prevViews, prevVisitorIds, allTimeViews, allTimeVisitorIds, today, past7Days] = await Promise.all([
      PageView.countDocuments(inRange),
      PageView.distinct('visitorId', inRange),
      PageView.countDocuments(inPrev),
      PageView.distinct('visitorId', inPrev),
      PageView.countDocuments(human),
      PageView.distinct('visitorId', human),
      PageView.countDocuments({ timestamp: { $gte: istMidnight(Date.now()) }, ...human }),
      PageView.countDocuments({ timestamp: { $gte: getDateRange('7d').start }, ...human }),
    ]);
    const returningCount = await countReturning(visitorIds, start);

    res.json({
      success: true,
      stats: { today, past7Days, total: allTimeViews },
      summary: {
        views: { total: totalViews, growth: growth(totalViews, prevViews) },
        visitors: { total: visitorIds.length, growth: growth(visitorIds.length, prevVisitorIds.length) },
        returning: { total: returningCount, growth: 0 },
      },
      allTime: {
        views: allTimeViews,
        visitors: allTimeVisitorIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/daily?range=7d|30d|today ───
exports.getDailyBreakdown = async (req, res, next) => {
  try {
    const { days, start, end, prevStart } = getDateRange(req.query.range || '7d');
    const human = await humanViews();
    const inRange = { timestamp: { $gte: start, $lte: end }, ...human };
    const inPrev = { timestamp: { $gte: prevStart, $lt: start }, ...human };

    // Page views and visitors per Indian calendar day
    const [viewsByDay, visitorIds, prevViews, prevVisitorIds] = await Promise.all([
      PageView.aggregate([
        { $match: inRange },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: TZ } },
            views: { $sum: 1 },
            visitors: { $addToSet: '$visitorId' },
          },
        },
        { $project: { views: 1, visitors: { $size: '$visitors' } } },
      ]),
      PageView.distinct('visitorId', inRange),
      PageView.countDocuments(inPrev),
      PageView.distinct('visitorId', inPrev),
    ]);

    const dayMap = Object.fromEntries(viewsByDay.map((d) => [d._id, d]));
    const daily = Array.from({ length: days }, (_, i) => {
      const date = istDateString(new Date(start.getTime() + i * DAY_MS));
      const entry = dayMap[date] || { views: 0, visitors: 0 };
      return {
        date,
        views: entry.views,
        visitors: entry.visitors,
        label: new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      };
    });

    const totalViews = daily.reduce((sum, d) => sum + d.views, 0);
    // Each visitor once over the whole range, however many days they came back
    const totalVisitors = visitorIds.length;
    const returningCount = await countReturning(visitorIds, start);

    res.json({
      success: true,
      daily,
      summary: {
        views: { total: totalViews, growth: growth(totalViews, prevViews) },
        visitors: { total: totalVisitors, growth: growth(totalVisitors, prevVisitorIds.length) },
        returning: { total: returningCount, growth: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Adds a visitor and their page views to a running total by key
const tally = (totals, key, views) => {
  const entry = totals.get(key) || { visitors: 0, views: 0 };
  entry.visitors += 1;
  entry.views += views;
  totals.set(key, entry);
};

const ranked = (totals, keyName, limit) =>
  [...totals]
    .map(([key, t]) => ({ [keyName]: key, visitors: t.visitors, views: t.views }))
    .sort((a, b) => b.visitors - a.visitors || b.views - a.views)
    .slice(0, limit);

// ─── GET /api/analytics/dashboard?range=7d|30d|today ───
exports.getDashboardData = async (req, res, next) => {
  try {
    const { start, end } = getDateRange(req.query.range || '7d');
    const inRange = { timestamp: { $gte: start, $lte: end }, ...(await humanViews()) };

    // ── Traffic sources and referring sites, per visitor ──
    // A visitor's source is the first one their page views in the range show
    // that isn't Direct. Earlier versions of the site sent the landing page view
    // before reading the source, so it usually only shows up from the second
    // page view on; and older rows are relabelled by today's rules
    // (storedViewSource).
    const perVisitor = await PageView.aggregate([
      { $match: inRange },
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: '$visitorId',
          views: { $sum: 1 },
          hits: { $push: { referrer: '$referrer', utmSource: '$utmSource', source: '$source' } },
        },
      },
      { $project: { views: 1, hits: { $slice: ['$hits', 50] } } },
    ]).allowDiskUse(true);

    const sourceTotals = new Map();
    const referrerTotals = new Map();
    for (const visitor of perVisitor) {
      const source = visitor.hits.map(storedViewSource).find((s) => s !== 'Direct') || 'Direct';
      tally(sourceTotals, source, visitor.views);
      const site = visitor.hits.map((hit) => referrerHost(hit.referrer)).find((host) => host && !SITE_HOSTS.test(host));
      if (site) tally(referrerTotals, site, visitor.views);
    }

    // ── Top Pages ──
    const topPages = await PageView.aggregate([
      { $match: inRange },
      { $group: { _id: '$pageUrl', views: { $sum: 1 }, visitors: { $addToSet: '$visitorId' } } },
      { $project: { page: '$_id', views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    // ── UTM Campaign Performance ──
    const campaigns = await PageView.aggregate([
      { $match: { ...inRange, utmCampaign: { $ne: '' } } },
      {
        $group: {
          _id: { campaign: '$utmCampaign', source: '$utmSource', medium: '$utmMedium' },
          views: { $sum: 1 },
          visitors: { $addToSet: '$visitorId' },
        },
      },
      {
        $project: {
          campaign: '$_id.campaign',
          source: '$_id.source',
          medium: '$_id.medium',
          views: 1,
          visitors: { $size: '$visitors' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    const activeVisitorIds = perVisitor.map((visitor) => visitor._id);

    // ── Device breakdown ──
    const devices = await Visitor.aggregate([
      { $match: { visitorId: { $in: activeVisitorIds } } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Country breakdown ──
    const countries = await Visitor.aggregate([
      { $match: { visitorId: { $in: activeVisitorIds }, country: { $ne: '' } } },
      { $group: { _id: { country: '$country', code: '$countryCode' }, visitors: { $sum: 1 } } },
      { $project: { name: '$_id.country', code: '$_id.code', views: '$visitors' } },
      { $sort: { views: -1 } },
      { $limit: 15 },
    ]);

    res.json({
      success: true,
      sources: ranked(sourceTotals, 'source', 15),
      topPages,
      campaigns,
      // Referring websites (by domain), per visitor
      referrers: ranked(referrerTotals, 'source', 10),
      devices,
      locations: { countries, regions: [], cities: [] },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/analytics/log-404 ───
const NotFoundLog = require('../models/NotFoundLog');
exports.log404 = async (req, res, next) => {
  try {
    const { path, referrer, userAgent } = req.body;
    
    if (!path) {
      return res.status(400).json({ message: 'Path is required' });
    }

    await NotFoundLog.create({
      path,
      referrer: referrer || '',
      userAgent: userAgent || ''
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
