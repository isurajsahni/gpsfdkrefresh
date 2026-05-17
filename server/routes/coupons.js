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
const { protect, admin, authorizeRoles } = require('../middleware/auth');
const { publicEndpointLimiter } = require('../middleware/validators');

router.route('/')
  .post(protect, authorizeRoles('coupon_manager'), createCoupon)
  .get(protect, authorizeRoles('coupon_manager'), getCoupons);

router.get('/usage', protect, authorizeRoles('coupon_manager'), getAllCouponUsage);
// Rate-limit /validate so attackers can't brute-force valid codes
// (10 req/min/IP is enough for any real shopper).
router.post('/validate', publicEndpointLimiter, validateCoupon);


router.route('/:id')
  .put(protect, authorizeRoles('coupon_manager'), updateCoupon)
  .delete(protect, authorizeRoles('coupon_manager'), deleteCoupon);

module.exports = router;
