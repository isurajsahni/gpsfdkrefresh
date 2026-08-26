const router = require('express').Router();
const {
  getAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect, marketing } = require('../middleware/auth');

// Public feed consumed by the app's notification inbox.
router.get('/', getAnnouncements);

// Marketing/admin management (the `marketing` guard also allows admins).
router.get('/all', protect, marketing, getAllAnnouncements);
router.post('/', protect, marketing, createAnnouncement);
router.put('/:id', protect, marketing, updateAnnouncement);
router.delete('/:id', protect, marketing, deleteAnnouncement);

module.exports = router;
