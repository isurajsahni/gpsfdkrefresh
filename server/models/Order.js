const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  // Pointer to the exact variation sub-doc — used for atomic stock movement
  // on order confirmation and on cancellation. Optional so legacy orders
  // (created before this field existed) still load.
  variationId: { type: mongoose.Schema.Types.ObjectId },
  name: String,
  image: String,
  variation: {
    material: String,
    frame: String,
    size: String,
    color: String,
  },
  customText: { type: String, default: '' },
  uploadedImageUrl: { type: String, default: '' },
  price: { type: Number, required: true },
  // Making/ingredient cost snapshotted from the variation at purchase time so
  // margin reports survive later catalog cost changes. Default 0 (not required)
  // — orders must never fail because a product has no cost configured, and
  // legacy orders predate this field.
  costPrice: { type: Number, default: 0 },
  quantity: { type: Number, required: true, default: 1 },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestEmail: { type: String, default: '' },
  guestPhone: { type: String, default: '' },
  orderNumber: { type: String, unique: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  billingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  paymentMethod: { type: String, enum: ['razorpay', 'free', 'cod'], required: true },

  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String,
  },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  discountPrice: { type: Number, default: 0 },
  couponCode: { type: String, default: null },
  totalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  status: {
    type: String,
    enum: ['payment_pending', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  trackingNumber: { type: String, default: '' },
  shipmentId: { type: String, default: '' },
  awbCode: { type: String, default: '' },
  shiprocketOrderId: { type: String, default: '' },
  awb: { type: String, default: '' },
  courierName: { type: String, default: '' },
  trackingUrl: { type: String, default: '' },
  deliveredAt: Date,
  notes: { type: String, default: '' },
  trackingEmailSent: { type: Boolean, default: false },
  // Status-change emails already sent for this order — prevents duplicate
  // shipped/delivered/cancelled emails on webhook redelivery or status
  // oscillation, e.g. delivered → RTO → delivered (F7).
  notifiedStatuses: { type: [String], default: [] },
  // Shiprocket webhook tracking timeline — persisted in DB so frontend
  // can display history even when the live Shiprocket API is unavailable.
  trackingHistory: [{
    status:    { type: String },           // App status: 'processing', 'shipped', etc.
    srStatus:  { type: String },           // Raw Shiprocket status e.g. 'IN_TRANSIT'
    message:   { type: String },           // Human-readable description
    location:  { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  }],
  lastTrackingUpdate: { type: Date },      // Timestamp of latest webhook event
  // Idempotency flags for stock movements — never decrement or restore twice
  // for the same order even if a webhook retries or admin double-clicks status.
  stockDecremented: { type: Boolean, default: false },
  stockRestored: { type: Boolean, default: false },
}, { timestamps: true });

orderSchema.pre('save', function() {
  if (!this.orderNumber) {
    // Use crypto for stronger entropy (was Math.random — only 3 base-36 chars
    // of randomness, prone to E11000 collisions under burst load on a sale day).
    const crypto = require('crypto');
    this.orderNumber = 'GPS-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  }
});

// ─── Indexes ───
// User dashboard: list a user's orders, newest first.
orderSchema.index({ user: 1, createdAt: -1 });
// Admin filters / status counts.
orderSchema.index({ status: 1 });
// orderNumber lookup is already covered by the unique index declared via
// `unique: true` on the field definition above — declaring it again here
// triggers Mongoose's duplicate-index warning at startup.
// Payment-idempotency check (verifyRazorpay deduplicates by paymentResult.id).
orderSchema.index({ 'paymentResult.id': 1 });
// Shiprocket webhook lookups by AWB / shiprocket id / shipment id.
orderSchema.index({ awb: 1 });
orderSchema.index({ shiprocketOrderId: 1 });
orderSchema.index({ shipmentId: 1 });
// Guest dashboard / abandoned-cart matching.
orderSchema.index({ guestEmail: 1 });

module.exports = mongoose.model('Order', orderSchema);
