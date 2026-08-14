const express = require('express');
const router = express.Router();
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getAllCouponUsage
} = require('../controllers/couponController');
const { protect, admin, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { publicEndpointLimiter } = require('../middleware/validators');

router.route('/')
  .post(protect, authorizeRoles('coupon_manager'), createCoupon)
  .get(protect, authorizeRoles('coupon_manager'), getCoupons);

router.get('/usage', protect, authorizeRoles('coupon_manager'), getAllCouponUsage);
// Rate-limit /validate so attackers can't brute-force valid codes
// (10 req/min/IP is enough for any real shopper).
// optionalAuth so validateCoupon can see `req.user` when the shopper is logged
// in — it enforces maxUsesPerUser against it. Without it userId was always null,
// so a customer who had already used up a coupon was told it was valid and only
// hit the rejection at order placement. Still public: guests validate too.
router.post('/validate', publicEndpointLimiter, optionalAuth, validateCoupon);


router.route('/:id')
  .put(protect, authorizeRoles('coupon_manager'), updateCoupon)
  .delete(protect, authorizeRoles('coupon_manager'), deleteCoupon);

module.exports = router;
