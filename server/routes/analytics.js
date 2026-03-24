const express = require('express');
const router = express.Router();
const { trackVisit, getStats } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

// Public route to track a visit
router.post('/visit', trackVisit);

// Admin-only route to get site statistics
router.get('/stats', protect, admin, getStats);

module.exports = router;
