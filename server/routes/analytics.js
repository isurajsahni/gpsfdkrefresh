const express = require('express');
const router = express.Router();
const { trackVisit, getStats } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// Public route to track a visit
router.post('/visit', trackVisit);

// Admin-only route to get site statistics
router.get('/stats', protect, authorize('admin', 'superadmin'), getStats);

module.exports = router;
