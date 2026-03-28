const mongoose = require('mongoose');

const abandonedCartSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  name: { type: String, trim: true, default: '' },
  cartItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: Number,
      image: String,
      variation: mongoose.Schema.Types.Mixed,
      customText: String
    }
  ],
  cartTotal: { type: Number, default: 0 },
  status: { type: String, enum: ['abandoned', 'recovered'], default: 'abandoned' },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Create a compound index on email and status to easily find/update recent carts
abandonedCartSchema.index({ email: 1, status: 1 });

module.exports = mongoose.model('AbandonedCart', abandonedCartSchema);
