// ─── Machine-to-machine auth for ERP integration pulls ───
// Constant-time compare of the `x-api-key` header against ERP_API_KEY, kept
// separate from human JWT auth so the ERP service never needs an admin login.
// If ERP_API_KEY is unset the endpoint is closed (503) rather than open.
const crypto = require('crypto');

module.exports = function serviceKey(req, res, next) {
  const expected = process.env.ERP_API_KEY || '';
  if (!expected) return res.status(503).json({ message: 'integration not configured' });

  const provided = req.get('x-api-key') || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Length check first: timingSafeEqual throws on unequal-length buffers.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: 'invalid api key' });
  }
  next();
};
