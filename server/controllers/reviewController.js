const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');

// Keep comment length sane — the schema has no cap, and this is the only write
// path, so bound it here to stop multi-KB comments being stored.
const MAX_COMMENT_CHARS = 2000;

// Recompute and persist the product's cached rating + review count from the
// Review collection. Called after every review create/update/delete so
// Product.rating and Product.numReviews always reflect real reviews (they were
// stuck at 0 before, because nothing ever wrote them).
const recalcProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = stats.length ? stats[0].avg : 0;
  const count = stats.length ? stats[0].count : 0;
  await Product.findByIdAndUpdate(productId, {
    // One decimal place is enough for a star display and avoids long floats.
    rating: Math.round(avg * 10) / 10,
    numReviews: count,
  });
};

// GET /api/products/:productId/reviews — public list of a product's reviews.
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .lean();
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:productId/reviews — create or update the current user's
// review for a product. One review per user per product (enforced by the unique
// index on the model); a repeat submission edits the existing one.
exports.upsertReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5.' });
    }
    const comment = String(req.body.comment || '').trim().slice(0, MAX_COMMENT_CHARS);

    // Product must exist before we attach a review to it.
    const product = await Product.findById(productId).select('_id');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const review = await Review.findOneAndUpdate(
      { product: productId, user: req.user._id },
      { $set: { rating, comment } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate('user', 'name avatar');

    await recalcProductRating(productId);

    res.status(201).json(review);
  } catch (error) {
    // A race between two concurrent first-time submissions can trip the unique
    // index; surface it as a clean conflict rather than a 500.
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this product.' });
    }
    next(error);
  }
};

// DELETE /api/products/:productId/reviews — remove the current user's own review.
exports.deleteOwnReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const deleted = await Review.findOneAndDelete({ product: productId, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Review not found' });

    await recalcProductRating(productId);
    res.json({ message: 'Review removed' });
  } catch (error) {
    next(error);
  }
};
