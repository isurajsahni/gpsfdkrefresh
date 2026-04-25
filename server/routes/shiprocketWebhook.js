/**
 * Shiprocket Tracking Webhook Route
 *
 * GET  /api/webhook/tracking → Health check (Shiprocket verifies URL is live)
 * POST /api/webhook/tracking → Handles tracking status updates
 *
 * Shiprocket sends the token in the `x-api-key` header.
 * The "Test Webhook" button in Shiprocket dashboard may send without a token,
 * so auth validation is done inside the handler (reject only if key is present but wrong).
 */

const express = require('express');
const router = express.Router();
const { handleTrackingUpdate } = require('../controllers/shiprocketWebhookController');

// ─── API Key Auth Middleware ───
// Accepts: correct token OR no token (Shiprocket test ping)
// Rejects: wrong token (unauthorized third party)
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.SHIPROCKET_WEBHOOK_SECRET || process.env.VERIFY_TOKEN;

  // If a key is provided but doesn't match → reject (unauthorized third party)
  if (apiKey && apiKey !== expectedKey) {
    console.warn(`🚫 [Shiprocket Webhook] Unauthorized: invalid x-api-key from ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // If no key provided → log warning but allow (Shiprocket test ping)
  if (!apiKey) {
    console.warn(`⚠️ [Shiprocket Webhook] No x-api-key header from ${req.ip} — allowing (test ping)`);
  }

  next();
};

// GET /api/webhook/tracking — Health check (open access, no auth)
router.get('/tracking', (req, res) => {
  res.status(200).json({ message: 'Webhook endpoint is live' });
});

// POST /api/webhook/tracking — Webhook handler
router.post('/tracking', validateApiKey, handleTrackingUpdate);

module.exports = router;
