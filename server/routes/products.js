const router = require('express').Router();
const { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, bulkDeleteProducts, importProducts } = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
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

router.get('/', getProducts);
router.post('/', protect, admin, createProduct);
router.post('/import', protect, admin, handleUpload(csvUpload.single('csv')), importProducts);
router.post('/bulk-delete', protect, admin, bulkDeleteProducts);
router.get('/:slug', getProductBySlug);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
