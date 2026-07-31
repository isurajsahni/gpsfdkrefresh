const router = require('express').Router();
const { createRazorpayOrder, verifyRazorpay, getRazorpayConfig, getPaymentHealth } = require('../controllers/paymentController');
const { optionalAuth, protect, admin } = require('../middleware/auth');

// Returns the public Razorpay key ID to the frontend at runtime.
// Eliminates the need for VITE_RAZORPAY_KEY_ID in Vercel build env.
router.get('/payment-config', getRazorpayConfig);

// Gateway diagnostics (see controller) — ADMIN ONLY, and it must stay that way.
// This is not a liveness probe: every call mints a REAL, payable ₹1 Razorpay
// order on the live key and, on failure, returns gateway internals (key-id
// prefix, gateway error code/description, status code). Unauthenticated, that
// let anyone (a) spam the merchant's order log and (b) harvest diagnostics —
// and worse, hand out payable order ids that were not produced by the checkout
// price calculation (see the amount-verification comment in verifyRazorpay).
// Nothing in the client calls this endpoint; it is operator-only tooling, so
// `protect, admin` — the convention used by every other admin route here —
// costs nothing. Do not re-open it for uptime monitoring: point monitors at a
// route that does not touch the payment gateway.
router.get('/payment-health', protect, admin, getPaymentHealth);

// Legacy routes (maintained for backwards compatibility)
router.post('/payments/razorpay', optionalAuth, createRazorpayOrder);
router.post('/payments/razorpay/verify', optionalAuth, verifyRazorpay);

// New requested production endpoints (Top-level under /api)
router.post('/create-order', optionalAuth, createRazorpayOrder);
router.post('/verify-payment', optionalAuth, verifyRazorpay);


module.exports = router;

