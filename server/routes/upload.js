const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { upload, mediaUpload } = require('../middleware/upload');

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

// Handle single image OR video upload (admin only). mediaUpload accepts the
// same images as before plus mp4 (Cloudinary resource_type 'video'), so product
// reels can be attached to Product.videos. The field name stays 'image' so the
// existing admin image upload is unaffected.
router.post('/', protect, admin, mediaUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const url = req.file.secure_url || req.file.path || req.file.url;
    const public_id = req.file.public_id || req.file.filename;

    res.status(200).json({ url, public_id });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Error uploading file' });
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
