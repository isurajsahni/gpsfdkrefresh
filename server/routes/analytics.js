const express = require('express');
const router = express.Router();
const { trackPageView, getStats, getDailyBreakdown, getDashboardData } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');
const { publicEndpointLimiter } = require('../middleware/validators');

// Public route to track a page view (rate limited)
router.post('/track', publicEndpointLimiter, trackPageView);

// Admin-only routes (with date range query param support)
router.get('/stats', protect, admin, getStats);
router.get('/daily', protect, admin, getDailyBreakdown);
router.get('/dashboard', protect, admin, getDashboardData);

module.exports = router;
