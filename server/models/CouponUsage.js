const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  orderId: {
    type: String,
    required: true,
  },
  orderAmount: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

// Compound index for fast marketing dashboard queries
couponUsageSchema.index({ couponId: 1, createdAt: -1 });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
