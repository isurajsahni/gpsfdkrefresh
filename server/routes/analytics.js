const express = require('express');
const router = express.Router();
const { trackVisit, getStats, getDailyBreakdown, getDashboardData } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');
const { publicEndpointLimiter } = require('../middleware/validators');

// Public route to track a visit (rate limited)
router.post('/visit', publicEndpointLimiter, trackVisit);

// Admin-only routes
router.get('/stats', protect, admin, getStats);
router.get('/daily', protect, admin, getDailyBreakdown);
router.get('/dashboard', protect, admin, getDashboardData);

module.exports = router;
