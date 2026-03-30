const router = require('express').Router();
const { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, bulkDeleteProducts, importProducts } = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const { upload, csvUpload } = require('../middleware/upload');

const productUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'thumbnailImage', maxCount: 1 }
]);

router.get('/', getProducts);
router.post('/', protect, admin, productUpload, createProduct);
router.post('/import', protect, admin, csvUpload.single('csv'), importProducts);
router.post('/bulk-delete', protect, admin, bulkDeleteProducts);
router.get('/:slug', getProductBySlug);
router.put('/:id', protect, admin, productUpload, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
