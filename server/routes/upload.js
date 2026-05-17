const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Guest-accessible canvas upload — must be rate-limited per IP so an
// anonymous attacker can't drain Cloudinary credits. 10 uploads / 10 min
// is plenty for any real shopper customising a canvas; abusers get a 429.
const canvasUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many uploads. Please wait a few minutes and try again.' },
});

// Handle single image upload
router.post('/', protect, admin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const url = req.file.secure_url || req.file.path || req.file.url;
    const public_id = req.file.public_id || req.file.filename;

    res.status(200).json({ url, public_id });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Handle canvas image upload (public — guests use this in CustomizeCanvasPage).
// Rate-limited above to protect Cloudinary quota.
router.post('/canvas', canvasUploadLimiter, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const url = req.file.secure_url || req.file.path || req.file.url;
    const public_id = req.file.public_id || req.file.filename;

    res.status(200).json({ url, public_id });
  } catch (error) {
    console.error('Canvas Upload Error:', error);
    res.status(500).json({ message: 'Error uploading canvas image' });
  }
});

module.exports = router;
