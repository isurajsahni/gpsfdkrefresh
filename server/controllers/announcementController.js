const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const pushSender = require('../utils/pushSender');

// Fields a marketing user is allowed to set — whitelisted to prevent mass
// assignment (e.g. someone trying to set createdBy or _id).
const WRITABLE = ['title', 'body', 'image', 'link', 'type', 'isActive', 'publishAt', 'expiresAt'];
const pick = (body) => WRITABLE.reduce((acc, k) => {
  if (body[k] !== undefined) acc[k] = body[k];
  return acc;
}, {});

// GET /api/announcements — public feed for the app inbox: active, already
// published, not expired, newest first.
exports.getAnnouncements = async (req, res, next) => {
  try {
    const now = new Date();
    const items = await Announcement.find({
      isActive: true,
      publishAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort('-publishAt')
      .limit(100)
      .lean();
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// GET /api/announcements/all — full list including inactive/scheduled/expired
// for the marketing dashboard.
exports.getAllAnnouncements = async (req, res, next) => {
  try {
    const items = await Announcement.find({}).sort('-createdAt').limit(500).lean();
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// POST /api/announcements — create (marketing/admin).
exports.createAnnouncement = async (req, res, next) => {
  try {
    const data = pick(req.body);
    if (!data.title || !data.body) {
      return res.status(400).json({ message: 'Title and body are required.' });
    }
    data.createdBy = req.user._id;
    const announcement = await Announcement.create(data);

    // Optionally push this announcement to installed apps. Off unless the caller
    // asks (push:true) AND FCM is configured. Fire-and-forget — a push failure
    // must never fail the announcement itself.
    if (req.body.push === true && pushSender.isConfigured()) {
      pushSender
        .sendToAll({ title: announcement.title, body: announcement.body, link: announcement.link })
        .catch((err) => console.error('[Push] Announcement broadcast failed:', err.message));
    }

    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

// PUT /api/announcements/:id — update (marketing/admin).
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement id' });
    }
    const announcement = await Announcement.findByIdAndUpdate(id, pick(req.body), {
      new: true,
      runValidators: true,
    });
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json(announcement);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/announcements/:id — remove (marketing/admin).
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid announcement id' });
    }
    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement removed' });
  } catch (error) {
    next(error);
  }
};
