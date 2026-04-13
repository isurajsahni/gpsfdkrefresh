const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getCouponUsage,
  getUsageTrend,
  getPerformance,
  getMarketingUsers,
} = require('../controllers/marketingController');
const { protect, admin, marketing } = require('../middleware/auth');

// Marketing user routes (marketing + admin can access)
router.get('/dashboard', protect, marketing, getDashboard);
router.get('/coupon-usage', protect, marketing, getCouponUsage);
router.get('/trend', protect, marketing, getUsageTrend);

// Admin-only routes
router.get('/admin/performance', protect, admin, getPerformance);
router.get('/admin/users', protect, admin, getMarketingUsers);

module.exports = router;
