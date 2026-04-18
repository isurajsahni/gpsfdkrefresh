const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

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

// Handle canvas image upload (public)
router.post('/canvas', upload.single('image'), (req, res) => {
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
