const router = require('express').Router();
const { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, bulkDeleteProducts, importProducts } = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const { upload, csvUpload } = require('../middleware/upload');

router.get('/', getProducts);
router.post('/', protect, admin, upload.array('images', 10), createProduct);
router.post('/import', protect, admin, csvUpload.single('csv'), importProducts);
router.post('/bulk-delete', protect, admin, bulkDeleteProducts);
router.get('/:slug', getProductBySlug);
router.put('/:id', protect, admin, upload.array('images', 10), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
