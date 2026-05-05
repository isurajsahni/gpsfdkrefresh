const express = require('express');
const router = express.Router();
const {
  createCoupon,
  getCoupons,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');
const { protect, admin, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .post(protect, authorizeRoles('coupon_manager'), createCoupon)
  .get(protect, authorizeRoles('coupon_manager'), getCoupons);

router.post('/validate', validateCoupon);


router.route('/:id')
  .delete(protect, admin, deleteCoupon); // Only admin can delete

module.exports = router;
