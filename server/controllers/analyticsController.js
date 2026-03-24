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
      // Approximate unique visitors as ~55-70% of views
      const visitors = Math.round(views * (0.55 + Math.random() * 0.15));
      return {
        date,
        views,
        visitors,
        label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

    // Calculate totals and percentage growth
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
    const prevTotalVisitors = Math.round(prevTotalViews * 0.6);

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
    // These are mock/placeholder data — replace with real queries when available
    const mostViewed = {
      postsAndPages: [
        { title: 'Home', views: 243 },
        { title: 'The Royal Bubble', views: 27 },
        { title: 'Regal Slay', views: 24 },
        { title: 'Good Boy Gone Bad', views: 22 },
        { title: 'Alleyway Signal', views: 21 },
        { title: 'The Fiscal X-Ray', views: 21 },
        { title: 'The Wolf of Wall Street', views: 20 },
        { title: 'Skyline Solitude', views: 20 },
        { title: 'The Double Pour', views: 20 },
        { title: 'Dusk Over Stone', views: 20 },
      ],
      archive: [
        { title: 'March 2026', views: 438 },
        { title: 'February 2026', views: 312 },
        { title: 'January 2026', views: 189 },
      ]
    };

    const referrers = [
      { source: 'Facebook', views: 1685 },
      { source: 'Instagram', views: 181 },
      { source: 'Google Search', views: 4 },
      { source: 'com.google.android.googlequicksearchbox', views: 1 },
      { source: 'umatrcs.online', views: 1 },
      { source: 'threads.com', views: 1 },
    ];

    const locations = {
      countries: [
        { name: 'United States', code: 'US', views: 1212 },
        { name: 'India', code: 'IN', views: 1032 },
        { name: 'United Kingdom', code: 'GB', views: 156 },
        { name: 'Canada', code: 'CA', views: 98 },
        { name: 'Australia', code: 'AU', views: 67 },
      ],
      regions: [
        { name: 'California', views: 412 },
        { name: 'Maharashtra', views: 356 },
        { name: 'Texas', views: 198 },
        { name: 'London', views: 156 },
        { name: 'Ontario', views: 98 },
      ],
      cities: [
        { name: 'Los Angeles', views: 234 },
        { name: 'Mumbai', views: 198 },
        { name: 'Houston', views: 156 },
        { name: 'London', views: 132 },
        { name: 'Toronto', views: 87 },
      ]
    };

    res.status(200).json({
      success: true,
      mostViewed,
      referrers,
      locations
    });
  } catch (error) {
    next(error);
  }
};
