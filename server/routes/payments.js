const router = require('express').Router();
const { createRazorpayOrder, verifyRazorpay, getRazorpayConfig } = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/auth');

// Returns the public Razorpay key ID to the frontend at runtime.
// Eliminates the need for VITE_RAZORPAY_KEY_ID in Vercel build env.
router.get('/payment-config', getRazorpayConfig);

// Legacy routes (maintained for backwards compatibility)
router.post('/payments/razorpay', optionalAuth, createRazorpayOrder);
router.post('/payments/razorpay/verify', optionalAuth, verifyRazorpay);

// New requested production endpoints (Top-level under /api)
router.post('/create-order', optionalAuth, createRazorpayOrder);
router.post('/verify-payment', optionalAuth, verifyRazorpay);


module.exports = router;

