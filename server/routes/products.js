const router = require('express').Router();
const { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, bulkDeleteProducts, importProducts, getHotSellingProducts } = require('../controllers/productController');
const { getProductReviews, upsertReview, deleteOwnReview } = require('../controllers/reviewController');
const { protect, admin, optionalAuth } = require('../middleware/auth');
const { csvUpload } = require('../middleware/upload');

// Wrapper that catches multer / Cloudinary upload errors gracefully
// instead of letting them crash as unhandled 500s
const handleUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('Upload middleware error:', err.message);
      return next(err); // Pass to Express error handler which now handles MulterError
    }
    next();
  });
};

// optionalAuth so the controller can include variations.costPrice for admins
// while stripping it from public responses
router.get('/', optionalAuth, getProducts);
router.get('/hot-selling', getHotSellingProducts);
router.post('/', protect, admin, createProduct);
router.post('/import', protect, admin, handleUpload(csvUpload.single('csv')), importProducts);
router.post('/bulk-delete', protect, admin, bulkDeleteProducts);
router.get('/:slug', optionalAuth, getProductBySlug);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

// ─── Product reviews ───
// Two-segment paths — do not collide with the single-segment '/:slug' route.
// GET is public; writing/removing a review requires login (one review per user
// per product, enforced by the unique index on the Review model).
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', protect, upsertReview);
router.delete('/:productId/reviews', protect, deleteOwnReview);

module.exports = router;
