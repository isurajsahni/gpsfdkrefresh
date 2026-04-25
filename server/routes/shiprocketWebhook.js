/**
 * Shiprocket Tracking Webhook Route
 *
 * POST /api/webhook/tracking
 *
 * Secured via x-api-key header validation.
 * Shiprocket sends tracking status updates to this endpoint.
 */

const express = require('express');
const router = express.Router();
const { handleTrackingUpdate } = require('../controllers/shiprocketWebhookController');

// ─── API Key Auth Middleware ───
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.SHIPROCKET_WEBHOOK_SECRET || process.env.VERIFY_TOKEN;

  if (!apiKey || apiKey !== expectedKey) {
    console.warn(`🚫 [Shiprocket Webhook] Unauthorized request from ${req.ip} — invalid x-api-key`);
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
};

// POST /api/webhook/tracking
router.post('/tracking', validateApiKey, handleTrackingUpdate);

module.exports = router;
