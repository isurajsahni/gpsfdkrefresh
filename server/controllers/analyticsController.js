const Visit = require('../models/Visit');

// Helper: get country from IP using free API
const getCountryFromIP = async (ip) => {
  try {
    // Skip for localhost/private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return { name: 'Local', code: 'LO' };
    }
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`);
    const data = await res.json();
    if (data.country) {
      return { name: data.country, code: data.countryCode };
    }
    return null;
  } catch {
    return null;
  }
};

// Track a new visit for today
exports.trackVisit = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get visitor's IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    const country = await getCountryFromIP(ip);

    let visit = await Visit.findOne({ date: today });
    if (visit) {
      visit.count += 1;
      visit.visitors += 1;

      // Update country count
      if (country) {
        const existing = visit.countries.find(c => c.code === country.code);
        if (existing) {
          existing.count += 1;
        } else {
          visit.countries.push({ name: country.name, code: country.code, count: 1 });
        }
      }

      await visit.save();
    } else {
      const countries = country ? [{ name: country.name, code: country.code, count: 1 }] : [];
      visit = await Visit.create({ date: today, count: 1, visitors: 1, countries });
    }

    res.status(200).json({ success: true, visit });
  } catch (error) {
    next(error);
  }
};

// Get visitor statistics
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    const sevenDaysAgo = sevenDaysAgoDate.toISOString().split('T')[0];

    const todayVisit = await Visit.findOne({ date: today });
    const todayCount = todayVisit ? todayVisit.count : 0;

    const past7DaysVisits = await Visit.find({
      date: { $gte: sevenDaysAgo, $lte: today }
    });
    const past7DaysCount = past7DaysVisits.reduce((acc, curr) => acc + curr.count, 0);

    const allVisits = await Visit.aggregate([
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]);
    const totalCount = allVisits.length > 0 ? allVisits[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        today: todayCount,
        past7Days: past7DaysCount,
        total: totalCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get daily breakdown for the last 7 days
exports.getDailyBreakdown = async (req, res, next) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const visits = await Visit.find({ date: { $in: days } });
    const visitMap = {};
    visits.forEach(v => { visitMap[v.date] = v; });

    const daily = days.map(date => {
      const visit = visitMap[date];
      return {
        date,
        views: visit ? visit.count : 0,
        visitors: visit ? (visit.visitors || visit.count) : 0,
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

    const totalViews = daily.reduce((s, d) => s + d.views, 0);
    const totalVisitors = daily.reduce((s, d) => s + d.visitors, 0);

    // Get previous 7 days for growth comparison
    const prevDays = [];
    for (let i = 13; i >= 7; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      prevDays.push(d.toISOString().split('T')[0]);
    }
    const prevVisits = await Visit.find({ date: { $in: prevDays } });
    const prevTotalViews = prevVisits.reduce((s, v) => s + v.count, 0);
    const prevTotalVisitors = prevVisits.reduce((s, v) => s + (v.visitors || v.count), 0);

    const viewsGrowth = prevTotalViews > 0
      ? Math.round(((totalViews - prevTotalViews) / prevTotalViews) * 100)
      : (totalViews > 0 ? 100 : 0);
    const visitorsGrowth = prevTotalVisitors > 0
      ? Math.round(((totalVisitors - prevTotalVisitors) / prevTotalVisitors) * 100)
      : (totalVisitors > 0 ? 100 : 0);

    res.status(200).json({
      success: true,
      daily,
      summary: {
        views: { total: totalViews, growth: viewsGrowth },
        visitors: { total: totalVisitors, growth: visitorsGrowth },
        likes: { total: 0, growth: 0 },
        comments: { total: 0, growth: 0 },
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get full dashboard data (most viewed, referrers, locations)
exports.getDashboardData = async (req, res, next) => {
  try {
    // Aggregate country data from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const since = sevenDaysAgo.toISOString().split('T')[0];

    const visits = await Visit.find({ date: { $gte: since } });

    // Merge country counts across all days
    const countryMap = {};
    visits.forEach(v => {
      if (v.countries && v.countries.length) {
        v.countries.forEach(c => {
          if (!countryMap[c.code]) {
            countryMap[c.code] = { name: c.name, code: c.code, views: 0 };
          }
          countryMap[c.code].views += c.count;
        });
      }
    });

    const countries = Object.values(countryMap).sort((a, b) => b.views - a.views);

    res.status(200).json({
      success: true,
      mostViewed: { postsAndPages: [], archive: [] },
      referrers: [],
      locations: { countries, regions: [], cities: [] }
    });
  } catch (error) {
    next(error);
  }
};
