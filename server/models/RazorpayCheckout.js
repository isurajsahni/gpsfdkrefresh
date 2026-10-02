const mongoose = require('mongoose');

// The cart behind each Razorpay order, saved when the order is created
// (paymentController.createRazorpayOrder). If the shopper pays and the browser
// never comes back to /verify-payment (tab closed, phone locked, network lost),
// Razorpay's webhook still makes the order from it.
const razorpayCheckoutSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  // The checkout's orderData as sent to /create-order
  orderData: { type: mongoose.Schema.Types.Mixed, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // The shopper's request context (IP, user agent, Meta cookies) and page, for
  // Meta's Purchase event when the webhook creates the order
  clientContext: { type: mongoose.Schema.Types.Mixed, default: {} },
  sourceUrl: { type: String, default: '' },
  // Razorpay retries a webhook for 24 hours; a month leaves room for support
  createdAt: { type: Date, default: Date.now, expires: 30 * 24 * 60 * 60 },
});

module.exports = mongoose.model('RazorpayCheckout', razorpayCheckoutSchema);
