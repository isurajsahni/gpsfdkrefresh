const router = require('express').Router();
const { createRazorpayOrder, verifyRazorpay, createStripeSession } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/razorpay', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpay);
router.post('/stripe', protect, createStripeSession);

module.exports = router;
