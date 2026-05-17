const express = require('express');
const router = express.Router();
const { trackPageView, getStats, getDailyBreakdown, getDashboardData, log404 } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/validators');

// Public route to track a page view (analyticsLimiter: 120/min — SPA fires
// this on every route change, so a normal session needs more than 10/min).
router.post('/track', analyticsLimiter, trackPageView);

// Public route to log 404 — same logic, can fire several times per session.
router.post('/log-404', analyticsLimiter, log404);

// Admin-only routes (with date range query param support)
router.get('/stats', protect, admin, getStats);
router.get('/daily', protect, admin, getDailyBreakdown);
router.get('/dashboard', protect, admin, getDashboardData);

module.exports = router;
