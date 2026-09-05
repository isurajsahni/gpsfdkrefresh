const router = require('express').Router();
const { getWishlist, getWishlistIds, addToWishlist, removeFromWishlist, getTopWishlisted } = require('../controllers/wishlistController');
const { protect, admin } = require('../middleware/auth');

// All wishlist routes require login — a wishlist belongs to a specific user and
// syncs across their devices/website.
router.get('/', protect, getWishlist);
router.get('/ids', protect, getWishlistIds);
// Declared before the /:productId routes so 'top' is never read as a product id.
router.get('/top', protect, admin, getTopWishlisted);
router.post('/:productId', protect, addToWishlist);
router.delete('/:productId', protect, removeFromWishlist);

module.exports = router;
