const router = require('express').Router();
const { createRazorpayOrder, verifyRazorpay, createStripeSession } = require('../controllers/paymentController');
const { protect, optionalAuth } = require('../middleware/auth');

// Legacy routes (maintained for backwards compatibility)
router.post('/payments/razorpay', optionalAuth, createRazorpayOrder);
router.post('/payments/razorpay/verify', optionalAuth, verifyRazorpay);
router.post('/payments/stripe', protect, createStripeSession);

// New requested production endpoints (Top-level under /api)
router.post('/create-order', optionalAuth, createRazorpayOrder);
router.post('/verify-payment', optionalAuth, verifyRazorpay);

// Also offer stripe session at top-level if needed, but keeping it simple for now
router.post('/stripe', protect, createStripeSession);


module.exports = router;

