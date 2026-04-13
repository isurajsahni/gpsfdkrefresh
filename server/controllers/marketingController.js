const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get marketing dashboard stats for the logged-in marketing user
// @route   GET /api/marketing/dashboard
// @access  Private/Marketing
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find coupons assigned to this marketing user
    const coupons = await Coupon.find({ assignedTo: userId });

    if (!coupons.length) {
      return res.json({
        coupons: [],
        totals: { totalUses: 0 },
      });
    }

    const couponIds = coupons.map(c => c._id);

    // Aggregate usage stats per coupon
    const stats = await CouponUsage.aggregate([
      { $match: { couponId: { $in: couponIds } } },
      {
        $group: {
          _id: '$couponId',
          totalUses: { $sum: 1 },
        },
      },
    ]);

    // Map stats to coupons
    const statsMap = {};
    stats.forEach(s => { statsMap[s._id.toString()] = s; });

    const couponStats = coupons.map(coupon => {
      const s = statsMap[coupon._id.toString()] || { totalUses: 0 };
      return {
        couponId: coupon._id,
        couponCode: coupon.code,
        totalUses: s.totalUses,
      };
    });

    // Overall totals
    const totals = couponStats.reduce((acc, c) => ({
      totalUses: acc.totalUses + c.totalUses,
    }), { totalUses: 0 });

    res.json({ coupons: couponStats, totals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get coupon usage history for marketing user (paginated)
// @route   GET /api/marketing/coupon-usage
// @access  Private/Marketing
const getCouponUsage = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const month = req.query.month; // e.g. "2026-04"

    // Find coupons assigned to this user
    const coupons = await Coupon.find({ assignedTo: userId }).select('_id code');
    const couponIds = coupons.map(c => c._id);

    if (!couponIds.length) {
      return res.json({ usages: [], total: 0, page, totalPages: 0 });
    }

    // Build match filter
    const match = { couponId: { $in: couponIds } };
    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      match.createdAt = { $gte: start, $lt: end };
    }

    const total = await CouponUsage.countDocuments(match);
    const totalPages = Math.ceil(total / limit);

    const usages = await CouponUsage.find(match)
      .select('-orderAmount -discountAmount')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Attach coupon code to each usage
    const codeMap = {};
    coupons.forEach(c => { codeMap[c._id.toString()] = c.code; });
    usages.forEach(u => { u.couponCode = codeMap[u.couponId.toString()] || 'N/A'; });

    res.json({ usages, total, page, totalPages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly trend data for marketing user's coupons
// @route   GET /api/marketing/trend
// @access  Private/Marketing
const getUsageTrend = async (req, res) => {
  try {
    const userId = req.user._id;

    const coupons = await Coupon.find({ assignedTo: userId }).select('_id');
    const couponIds = coupons.map(c => c._id);

    if (!couponIds.length) {
      return res.json({ trend: [] });
    }

    const trend = await CouponUsage.aggregate([
      { $match: { couponId: { $in: couponIds } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          uses: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    const formatted = trend.map(t => ({
      label: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
      uses: t.uses,
    }));

    res.json({ trend: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN-ONLY ENDPOINTS ────────────────────────────────────────

// @desc    Get all marketing users' performance (leaderboard)
// @route   GET /api/marketing/admin/performance
// @access  Private/Admin
const getPerformance = async (req, res) => {
  try {
    // Get all coupons that have an assignedTo
    const coupons = await Coupon.find({ assignedTo: { $ne: null } })
      .populate('assignedTo', 'name email')
      .lean();

    if (!coupons.length) {
      return res.json({ performance: [] });
    }

    const couponIds = coupons.map(c => c._id);

    const stats = await CouponUsage.aggregate([
      { $match: { couponId: { $in: couponIds } } },
      {
        $group: {
          _id: '$couponId',
          totalUses: { $sum: 1 },
          totalRevenue: { $sum: '$orderAmount' },
          totalDiscount: { $sum: '$discountAmount' },
        },
      },
    ]);

    const statsMap = {};
    stats.forEach(s => { statsMap[s._id.toString()] = s; });

    const performance = coupons.map(coupon => {
      const s = statsMap[coupon._id.toString()] || { totalUses: 0, totalRevenue: 0, totalDiscount: 0 };
      return {
        couponId: coupon._id,
        couponCode: coupon.code,
        commissionRate: coupon.commissionRate,
        userName: coupon.assignedTo?.name || 'Unknown',
        userEmail: coupon.assignedTo?.email || '',
        userId: coupon.assignedTo?._id || null,
        totalUses: s.totalUses,
        totalRevenue: s.totalRevenue,
        totalDiscount: s.totalDiscount,
        estimatedEarnings: Math.round((s.totalRevenue * coupon.commissionRate) / 100),
      };
    });

    // Sort by revenue descending (leaderboard)
    performance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({ performance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all marketing users (for coupon assignment dropdown)
// @route   GET /api/marketing/admin/users
// @access  Private/Admin
const getMarketingUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['marketing', 'admin_marketing'] } }).select('name email _id').sort('name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboard,
  getCouponUsage,
  getUsageTrend,
  getPerformance,
  getMarketingUsers,
};
