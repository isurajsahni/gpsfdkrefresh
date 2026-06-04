const express = require('express');
const AbandonedCart = require('../models/AbandonedCart');
const { protect, admin } = require('../middleware/auth');
const { publicEndpointLimiter } = require('../middleware/validators');
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
  publicEndpointLimiter,
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required'), validate],
  async (req, res) => {
    try {
      const { email, phone, name, cartItems, cartTotal } = req.body;

      // Sanitize cart items — strip anything that could blow up the save
      const safeCartItems = Array.isArray(cartItems)
        ? cartItems.map(item => ({
            productId: item.productId ? String(item.productId) : '',
            name: String(item.name || ''),
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: String(item.image || ''),
            variation: item.variation || {},
            customText: String(item.customText || ''),
            uploadedImageUrl: String(item.uploadedImageUrl || ''),
          }))
        : [];

      // Find if there's an active abandoned cart for this email
      let cart = await AbandonedCart.findOne({ email, status: 'abandoned' });

      if (cart) {
        // Update existing
        cart.phone = phone || cart.phone;
        cart.name = name || cart.name;
        cart.cartItems = safeCartItems;
        cart.cartTotal = Number(cartTotal) || 0;
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
        });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Abandoned cart capture error:', err);
      res.status(200).json({ success: true });
    }
  }
);

// @route   GET /api/abandoned-carts
// @desc    Get all abandoned carts
// @access  Private (Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const carts = await AbandonedCart.find({}).sort('-lastActive');
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
router.post('/recover', publicEndpointLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (email && typeof email === 'string') {
      await AbandonedCart.findOneAndDelete({ email, status: 'abandoned' });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
