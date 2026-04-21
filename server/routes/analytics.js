const express = require('express');
const router = express.Router();
const { trackPageView, getStats, getDailyBreakdown, getDashboardData, log404 } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');
const { publicEndpointLimiter } = require('../middleware/validators');

// Public route to track a page view (rate limited)
router.post('/track', publicEndpointLimiter, trackPageView);

// Public route to log 404
router.post('/log-404', publicEndpointLimiter, log404);

// Admin-only routes (with date range query param support)
router.get('/stats', protect, admin, getStats);
router.get('/daily', protect, admin, getDailyBreakdown);
router.get('/dashboard', protect, admin, getDashboardData);

module.exports = router;
