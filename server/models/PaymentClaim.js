const mongoose = require('mongoose');

// Who is creating the order for a Razorpay payment. The browser
// (/verify-payment) and Razorpay's webhook usually arrive within the same
// second; the one that inserts this document (its _id is the payment id, so
// only one insert can succeed) creates the order, the other waits for it.
// Deleted again if no order came of it, so the other can try.
const paymentClaimSchema = new mongoose.Schema({
  _id: { type: String }, // Razorpay payment id
  razorpayOrderId: { type: String, default: '' },
  claimedAt: { type: Date, default: Date.now },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  // Once the order exists it is found by its payment id, so the claim can go
  createdAt: { type: Date, default: Date.now, expires: 30 * 24 * 60 * 60 },
});

module.exports = mongoose.model('PaymentClaim', paymentClaimSchema);
