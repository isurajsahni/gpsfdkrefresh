const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const crypto = require('crypto');
const { upload, mediaUpload, cloudinary } = require('../middleware/upload');

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

// Signed direct upload for the canvas customiser. The browser sends the photo
// straight to Cloudinary (with real upload progress) instead of streaming it
// through this server, which roughly halved the wait. Shares the per-IP limiter
// with the route below, so a signature counts as an upload. Each signature is
// pinned to one fresh public_id: re-using it can only overwrite that one asset,
// never create more, so the quota protection holds.
const CANVAS_UPLOAD_FOLDER = 'gpsfdk/custom-canvas';
router.post('/canvas/signature', canvasUploadLimiter, (req, res) => {
  const { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret } = cloudinary.config();
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ message: 'Image upload is not configured' });
  }
  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: CANVAS_UPLOAD_FOLDER,
    public_id: crypto.randomUUID(),
    allowed_formats: 'jpg,jpeg,png,webp',
  };
  res.json({
    ...params,
    signature: cloudinary.utils.api_sign_request(params, apiSecret),
    apiKey,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  });
});

// Handle canvas image upload (public — guests use this in CustomizeCanvasPage).
// Rate-limited above to protect Cloudinary quota. Still used as the fallback
// when a signed direct upload can't be started.
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
