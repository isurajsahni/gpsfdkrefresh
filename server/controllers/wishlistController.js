const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// GET /api/wishlist — the current user's wishlist, populated with product cards,
// newest first. Entries whose product was since deleted are skipped.
exports.getWishlist = async (req, res, next) => {
  try {
    const entries = await Wishlist.find({ user: req.user._id })
      .populate('product', 'name slug images thumbnailImage rating numReviews variations subCategory')
      .sort('-createdAt')
      .lean();
    const products = entries.map((e) => e.product).filter(Boolean);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// GET /api/wishlist/ids — just the product ids, for cheap "is this liked?" UI
// state without shipping full product payloads.
exports.getWishlistIds = async (req, res, next) => {
  try {
    const entries = await Wishlist.find({ user: req.user._id }).select('product').lean();
    res.json(entries.map((e) => e.product.toString()));
  } catch (error) {
    next(error);
  }
};

// POST /api/wishlist/:productId — add a product to the wishlist. Idempotent:
// adding something already liked returns the same 200 rather than erroring.
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findById(productId).select('_id');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await Wishlist.updateOne(
      { user: req.user._id, product: productId },
      { $setOnInsert: { user: req.user._id, product: productId } },
      { upsert: true },
    );
    res.json({ message: 'Added to wishlist', productId });
  } catch (error) {
    // Concurrent duplicate add races the unique index — treat as success.
    if (error && error.code === 11000) {
      return res.json({ message: 'Added to wishlist', productId: req.params.productId });
    }
    next(error);
  }
};

// DELETE /api/wishlist/:productId — remove a product. Idempotent: removing
// something not in the wishlist still returns 200.
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    await Wishlist.deleteOne({ user: req.user._id, product: productId });
    res.json({ message: 'Removed from wishlist', productId });
  } catch (error) {
    next(error);
  }
};

// GET /api/wishlist/top — most-liked products, for the admin panel.
//
// This is demand that hasn't converted: what customers saved but didn't buy.
// Aggregated in Mongo rather than by loading every user's wishlist, because the
// collection grows with customers × saves and the panel only wants the head of
// the list.
//
// There is no app-vs-website split here: unlike Order, the Wishlist model does
// not record where a like happened. Adding a `source` field would make that
// possible, and would cost one line on the model plus one on addToWishlist.
exports.getTopWishlisted = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100);

    const rows = await Wishlist.aggregate([
      { $group: { _id: '$product', likes: { $sum: 1 }, lastLikedAt: { $max: '$createdAt' } } },
      { $sort: { likes: -1, lastLikedAt: -1 } },
      { $limit: limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          likes: 1,
          lastLikedAt: 1,
          name: '$product.name',
          slug: '$product.slug',
          image: { $arrayElemAt: ['$product.images.url', 0] },
        },
      },
    ]);

    res.json(rows);
  } catch (error) {
    next(error);
  }
};
