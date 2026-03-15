const router = require('express').Router();
const { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, importProducts } = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', getProducts);
router.get('/:slug', getProductBySlug);
router.post('/', protect, admin, upload.array('images', 10), createProduct);
router.post('/import', protect, admin, upload.single('csv'), importProducts);
router.put('/:id', protect, admin, upload.array('images', 10), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
