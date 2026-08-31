const router = require('express').Router();
const { registerDevice, unregisterDevice } = require('../controllers/deviceController');
const { protect } = require('../middleware/auth');

// A device token belongs to the signed-in user, so both routes require login.
router.post('/', protect, registerDevice);
router.delete('/:token', protect, unregisterDevice);

module.exports = router;
