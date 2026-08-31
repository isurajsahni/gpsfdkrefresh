const DeviceToken = require('../models/DeviceToken');

const PLATFORMS = ['ios', 'android', 'web'];

// POST /api/devices — register (or refresh) this device's push token for the
// logged-in user. Idempotent: upserted by token, so re-registering the same
// device updates its owner/platform/last-seen rather than duplicating.
exports.registerDevice = async (req, res, next) => {
  try {
    const token = String(req.body.token || '').trim();
    if (!token) return res.status(400).json({ message: 'Device token is required' });
    const platform = PLATFORMS.includes(req.body.platform) ? req.body.platform : 'android';

    await DeviceToken.updateOne(
      { token },
      { $set: { user: req.user._id, platform, lastSeenAt: new Date() } },
      { upsert: true },
    );
    res.status(201).json({ message: 'Device registered' });
  } catch (error) {
    // Concurrent first-time upsert of the same token races the unique index.
    if (error && error.code === 11000) {
      return res.status(201).json({ message: 'Device registered' });
    }
    next(error);
  }
};

// DELETE /api/devices/:token — unregister a device (e.g. on logout). Scoped to
// the current user so one user can't delete another's token by guessing it.
exports.unregisterDevice = async (req, res, next) => {
  try {
    const token = String(req.params.token || '').trim();
    if (!token) return res.status(400).json({ message: 'Device token is required' });
    await DeviceToken.deleteOne({ token, user: req.user._id });
    res.json({ message: 'Device unregistered' });
  } catch (error) {
    next(error);
  }
};
