const router = require('express').Router();
const { createLead, getLeads } = require('../controllers/leadController');
const { protect, admin } = require('../middleware/auth');
const { leadValidation, publicEndpointLimiter } = require('../middleware/validators');

router.post('/', publicEndpointLimiter, leadValidation, createLead);
router.get('/', protect, admin, getLeads);

module.exports = router;
