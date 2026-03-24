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
