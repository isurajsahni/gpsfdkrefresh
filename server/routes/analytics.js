const express = require('express');
const router = express.Router();
const { trackVisit, getStats, getDailyBreakdown, getDashboardData } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

// Public route to track a visit
router.post('/visit', trackVisit);

// Admin-only routes
router.get('/stats', protect, admin, getStats);
router.get('/daily', protect, admin, getDailyBreakdown);
router.get('/dashboard', protect, admin, getDashboardData);

module.exports = router;
