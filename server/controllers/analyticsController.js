const Visitor = require('../models/Visitor');
const PageView = require('../models/PageView');
const UAParser = require('ua-parser-js');

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

// ─── Helper: Detect traffic source from UTM params or referrer ───
const detectSource = (utmSource, referrer) => {
  if (utmSource) {
    const src = utmSource.toLowerCase();
    if (src.includes('instagram')) return 'Instagram';
    if (src.includes('facebook') || src.includes('fb')) return 'Facebook';
    if (src.includes('google')) return 'Google';
    if (src.includes('youtube')) return 'YouTube';
    if (src.includes('twitter') || src.includes('x.com')) return 'Twitter/X';
    if (src.includes('whatsapp')) return 'WhatsApp';
    if (src.includes('email') || src.includes('mail')) return 'Email';
    return utmSource; // Return raw utm_source if no match
  }

  if (referrer) {
    const ref = referrer.toLowerCase();
    if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) return 'Instagram';
    if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('l.facebook.com') || ref.includes('lm.facebook.com')) return 'Facebook';
    if (ref.includes('google.com') || ref.includes('google.co.in')) return 'Google';
    if (ref.includes('youtube.com')) return 'YouTube';
    if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com')) return 'Twitter/X';
    if (ref.includes('whatsapp.com')) return 'WhatsApp';
    if (ref.includes('bing.com')) return 'Bing';
    if (ref.includes('pinterest.com')) return 'Pinterest';
    return 'Other';
  }

  return 'Direct';
};

// ─── Helper: get date range boundaries ───
const getDateRange = (range) => {
  const now = new Date();
  let start;

  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '30d':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case '7d':
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
  }

  return { start, end: now };
};

// ─── POST /api/analytics/track ───
// Called on every page view from the client
exports.trackPageView = async (req, res, next) => {
  try {
    const { visitorId, pageUrl, referrer, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = req.body;

    if (!visitorId) {
      return res.status(400).json({ message: 'visitorId is required' });
    }

    // Parse user agent
    const ua = new UAParser(req.headers['user-agent']);
    const browser = ua.getBrowser().name || '';
    const deviceType = ua.getDevice().type || 'desktop'; // mobile, tablet, or desktop
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';

    // Detect traffic source
    const source = detectSource(utmSource, referrer);

    // Upsert visitor — country is backfilled in the background so a slow
    // ip-api.com response can never hold this request open
    const existingVisitor = await Visitor.findOne({ visitorId });
    let isReturning = false;
    let needsGeo = false;

    if (existingVisitor) {
      isReturning = true;
      existingVisitor.lastVisitAt = new Date();
      existingVisitor.totalVisits += 1;
      existingVisitor.returning = true;
      needsGeo = !existingVisitor.country;
      await existingVisitor.save();
    } else {
      needsGeo = true;
      await Visitor.create({
        visitorId,
        firstVisitAt: new Date(),
        lastVisitAt: new Date(),
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

    res.status(200).json({ success: true, returning: isReturning });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/stats?range=7d|30d|today ───
exports.getStats = async (req, res, next) => {
  try {
    const range = req.query.range || '7d';
    const { start, end } = getDateRange(range);

    // Total page views in range
    const totalViews = await PageView.countDocuments({
      timestamp: { $gte: start, $lte: end },
    });

    // Unique visitors in range (distinct visitorIds)
    const uniqueVisitorIds = await PageView.distinct('visitorId', {
      timestamp: { $gte: start, $lte: end },
    });
    const uniqueVisitors = uniqueVisitorIds.length;

    // Returning visitors (visitors who existed before this range)
    const returningCount = await Visitor.countDocuments({
      visitorId: { $in: uniqueVisitorIds },
      returning: true,
    });

    // Previous period for growth calculation
    const periodMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodMs);
    const prevEnd = start;

    const prevViews = await PageView.countDocuments({
      timestamp: { $gte: prevStart, $lt: prevEnd },
    });
    const prevVisitorIds = await PageView.distinct('visitorId', {
      timestamp: { $gte: prevStart, $lt: prevEnd },
    });

    const viewsGrowth = prevViews > 0
      ? Math.round(((totalViews - prevViews) / prevViews) * 100)
      : (totalViews > 0 ? 100 : 0);
    const visitorsGrowth = prevVisitorIds.length > 0
      ? Math.round(((uniqueVisitors - prevVisitorIds.length) / prevVisitorIds.length) * 100)
      : (uniqueVisitors > 0 ? 100 : 0);

    // All-time totals
    const allTimeViews = await PageView.countDocuments();
    const allTimeVisitors = (await Visitor.countDocuments());

    res.json({
      success: true,
      stats: {
        today: await PageView.countDocuments({
          timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        }),
        past7Days: await PageView.countDocuments({
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
        total: allTimeViews,
      },
      summary: {
        views: { total: totalViews, growth: viewsGrowth },
        visitors: { total: uniqueVisitors, growth: visitorsGrowth },
        returning: { total: returningCount, growth: 0 },
      },
      allTime: {
        views: allTimeViews,
        visitors: allTimeVisitors,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/daily?range=7d|30d|today ───
exports.getDailyBreakdown = async (req, res, next) => {
  try {
    const range = req.query.range || '7d';
    const days = range === '30d' ? 30 : range === 'today' ? 1 : 7;
    const { start } = getDateRange(range);

    // Aggregate page views by day
    const viewsByDay = await PageView.aggregate([
      { $match: { timestamp: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          views: { $sum: 1 },
          visitors: { $addToSet: '$visitorId' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build day-by-day array
    const dayMap = {};
    viewsByDay.forEach(d => {
      dayMap[d._id] = { views: d.views, visitors: d.visitors.length };
    });

    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = dayMap[dateStr] || { views: 0, visitors: 0 };
      daily.push({
        date: dateStr,
        views: entry.views,
        visitors: entry.visitors,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    const totalViews = daily.reduce((s, d) => s + d.views, 0);
    const totalVisitors = daily.reduce((s, d) => s + d.visitors, 0);

    // Previous period comparison
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - days);

    const prevViews = await PageView.countDocuments({
      timestamp: { $gte: prevStart, $lt: start },
    });
    const prevVisitorIds = await PageView.distinct('visitorId', {
      timestamp: { $gte: prevStart, $lt: start },
    });

    const viewsGrowth = prevViews > 0
      ? Math.round(((totalViews - prevViews) / prevViews) * 100)
      : (totalViews > 0 ? 100 : 0);
    const visitorsGrowth = prevVisitorIds.length > 0
      ? Math.round(((totalVisitors - prevVisitorIds.length) / prevVisitorIds.length) * 100)
      : (totalVisitors > 0 ? 100 : 0);

    // Returning visitors count
    const currentVisitorIds = await PageView.distinct('visitorId', {
      timestamp: { $gte: start },
    });
    const returningCount = await Visitor.countDocuments({
      visitorId: { $in: currentVisitorIds },
      returning: true,
    });

    res.json({
      success: true,
      daily,
      summary: {
        views: { total: totalViews, growth: viewsGrowth },
        visitors: { total: totalVisitors, growth: visitorsGrowth },
        returning: { total: returningCount, growth: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/dashboard?range=7d|30d|today ───
exports.getDashboardData = async (req, res, next) => {
  try {
    const range = req.query.range || '7d';
    const { start } = getDateRange(range);

    // ── Traffic Sources ──
    const sourceAgg = await PageView.aggregate([
      { $match: { timestamp: { $gte: start } } },
      { $group: { _id: '$source', views: { $sum: 1 }, visitors: { $addToSet: '$visitorId' } } },
      { $project: { source: '$_id', views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { views: -1 } },
      { $limit: 15 },
    ]);

    // ── Top Pages ──
    const topPages = await PageView.aggregate([
      { $match: { timestamp: { $gte: start } } },
      { $group: { _id: '$pageUrl', views: { $sum: 1 }, visitors: { $addToSet: '$visitorId' } } },
      { $project: { page: '$_id', views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    // ── UTM Campaign Performance ──
    const campaigns = await PageView.aggregate([
      { $match: { timestamp: { $gte: start }, utmCampaign: { $ne: '' } } },
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

    // ── Referrers (raw referrer domains) ──
    const referrers = await PageView.aggregate([
      { $match: { timestamp: { $gte: start }, referrer: { $ne: '' } } },
      { $group: { _id: '$referrer', views: { $sum: 1 } } },
      { $project: { source: '$_id', views: 1 } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    // ── Active visitors in range (timestamp index) — avoids a $lookup over
    // the whole visitors collection for the device/country breakdowns ──
    const activeVisitorIds = await PageView.distinct('visitorId', {
      timestamp: { $gte: start },
    });

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
      sources: sourceAgg,
      topPages,
      campaigns,
      referrers,
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
