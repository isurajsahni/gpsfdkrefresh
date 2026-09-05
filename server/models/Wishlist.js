const mongoose = require('mongoose');

// One document per (user, product) "like". Modelled as individual entries
// rather than an array on the user so concurrent adds from two devices can't
// clobber each other, and the unique index makes a repeat add a no-op instead
// of a duplicate. This is what lets a customer's likes follow them across the
// app, the website and a reinstall (they live server-side, keyed to the user).
const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  // Which client the like happened in. Mirrors Order.source (and AbandonedCart)
  // so saves can be compared with orders on the same terms. Entries written
  // before this field existed have no value; they are all website likes.
  source: { type: String, enum: ['web', 'ios', 'android'], default: 'web' },
}, { timestamps: true });

wishlistSchema.index({ user: 1, product: 1 }, { unique: true });
// Fast "list my wishlist, newest first".
wishlistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
