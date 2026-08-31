const router = require('express').Router();
const { getWishlist, getWishlistIds, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

// All wishlist routes require login — a wishlist belongs to a specific user and
// syncs across their devices/website.
router.get('/', protect, getWishlist);
router.get('/ids', protect, getWishlistIds);
router.post('/:productId', protect, addToWishlist);
router.delete('/:productId', protect, removeFromWishlist);

module.exports = router;
