const router = require('express').Router();
const { createLead, getLeads } = require('../controllers/leadController');
const { protect, admin } = require('../middleware/auth');

router.post('/', createLead);
router.get('/', protect, admin, getLeads);

module.exports = router;
