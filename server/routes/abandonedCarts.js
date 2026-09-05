const express = require('express');
const AbandonedCart = require('../models/AbandonedCart');
const { protect, admin } = require('../middleware/auth');
const { abandonedCartLimiter } = require('../middleware/validators');
const { ORDER_SOURCES, normalizeOrderSource } = require('../controllers/orderController');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Simple validation helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

// @route   POST /api/abandoned-carts
// @desc    Capture or update abandoned cart data
// @access  Public (rate limited)
router.post('/',
  abandonedCartLimiter,
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required'), validate],
  async (req, res) => {
    try {
      const { email, phone, name, cartItems, cartTotal } = req.body;
      const source = normalizeOrderSource(req.body.source);

      // Sanitize cart items — strip anything that could blow up the save
      const safeCartItems = Array.isArray(cartItems)
        ? cartItems.map(item => ({
            productId: item.productId ? String(item.productId) : '',
            name: String(item.name || ''),
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: String(item.image || ''),
            variation: item.variation && typeof item.variation === 'object' ? item.variation : {},
            customText: String(item.customText || ''),
            uploadedImageUrl: String(item.uploadedImageUrl || ''),
          }))
        : [];

      // One live cart per email PER SOURCE. Somebody browsing on the site and
      // again in the app has two carts, and folding them into one row lets
      // whichever they touched last silently overwrite the other.
      //
      // Rows written before `source` existed have no such field, so a plain
      // { source: 'web' } query would miss them and strand every existing
      // website cart. Web therefore also matches the absent case.
      const sourceQuery = source === 'web'
        ? { $or: [{ source: 'web' }, { source: { $exists: false } }] }
        : { source };

      let cart = await AbandonedCart.findOne({ email, status: 'abandoned', ...sourceQuery });

      if (cart) {
        // Update existing
        cart.phone = phone || cart.phone;
        cart.name = name || cart.name;
        cart.cartItems = safeCartItems;
        cart.cartTotal = Number(cartTotal) || 0;
        cart.source = source;
        cart.lastActive = Date.now();
        await cart.save();
      } else {
        // Create new
        cart = await AbandonedCart.create({
          email,
          phone: phone || '',
          name: name || '',
          cartItems: safeCartItems,
          cartTotal: Number(cartTotal) || 0,
          source,
        });
      }

      if (!res.headersSent) res.status(200).json({ success: true });
    } catch (err) {
      console.error('Abandoned cart capture error:', err);
      // Guard against double-send if something upstream already committed a response
      if (!res.headersSent) res.status(200).json({ success: true });
    }
  }
);

// @route   GET /api/abandoned-carts
// @desc    Get all abandoned carts
// @access  Private (Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const filter = {};
    const src = String(req.query.source || 'all');
    if (src === 'app') filter.source = { $in: ['ios', 'android'] };
    else if (src === 'web') filter.$or = [{ source: 'web' }, { source: { $exists: false } }];
    else if (src !== 'all' && ORDER_SOURCES.includes(src)) filter.source = src;

    const carts = await AbandonedCart.find(filter).sort('-lastActive');
    res.json(carts);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/abandoned-carts/:id
// @desc    Delete an abandoned cart
// @access  Private (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const cart = await AbandonedCart.findByIdAndDelete(req.params.id);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    res.json({ message: 'Cart removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/abandoned-carts/recover
// @desc    Mark a cart as recovered (deleted) after successful order
// @access  Public (rate limited)
router.post('/recover', abandonedCartLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (email && typeof email === 'string') {
      // Scoped by source, so an order placed in the app doesn't clear the same
      // customer's separate website cart.
      const source = normalizeOrderSource(req.body.source);
      const sourceQuery = source === 'web'
        ? { $or: [{ source: 'web' }, { source: { $exists: false } }] }
        : { source };
      await AbandonedCart.findOneAndDelete({ email, status: 'abandoned', ...sourceQuery });
    }
    if (!res.headersSent) res.status(200).json({ success: true });
  } catch (err) {
    if (!res.headersSent) res.status(200).json({ success: true });
  }
});

module.exports = router;
