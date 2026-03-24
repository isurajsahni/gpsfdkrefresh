const Visit = require('../models/Visit');

// Track a new visit for today
exports.trackVisit = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    let visit = await Visit.findOne({ date: today });
    if (visit) {
      visit.count += 1;
      await visit.save();
    } else {
      visit = await Visit.create({ date: today, count: 1 });
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

    // Get today's visits
    const todayVisit = await Visit.findOne({ date: today });
    const todayCount = todayVisit ? todayVisit.count : 0;

    // Get past 7 days visits
    const past7DaysVisits = await Visit.find({
      date: { $gte: sevenDaysAgo, $lte: today }
    });
    const past7DaysCount = past7DaysVisits.reduce((acc, curr) => acc + curr.count, 0);

    // Get total visits
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
    visits.forEach(v => { visitMap[v.date] = v.count; });

    const daily = days.map(date => {
      const views = visitMap[date] || 0;
      return {
        date,
        views,
        visitors: 0,
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

    // Calculate totals and percentage growth
    const totalViews = daily.reduce((s, d) => s + d.views, 0);

    // Get previous 7 days for growth comparison
    const prevDays = [];
    for (let i = 13; i >= 7; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      prevDays.push(d.toISOString().split('T')[0]);
    }
    const prevVisits = await Visit.find({ date: { $in: prevDays } });
    const prevTotalViews = prevVisits.reduce((s, v) => s + v.count, 0);

    const viewsGrowth = prevTotalViews > 0
      ? Math.round(((totalViews - prevTotalViews) / prevTotalViews) * 100)
      : (totalViews > 0 ? 100 : 0);

    res.status(200).json({
      success: true,
      daily,
      summary: {
        views: { total: totalViews, growth: viewsGrowth },
        visitors: { total: 0, growth: 0 },
        likes: { total: 0, growth: 0 },
        comments: { total: 0, growth: 0 },
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get full dashboard data (most viewed, referrers, locations)
// Returns empty data — plug in real queries when available
exports.getDashboardData = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      mostViewed: { postsAndPages: [], archive: [] },
      referrers: [],
      locations: { countries: [], regions: [], cities: [] }
    });
  } catch (error) {
    next(error);
  }
};
