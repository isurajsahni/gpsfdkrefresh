const express = require('express');
const router = express.Router();

/**
 * Meta WhatsApp Cloud API Webhook
 * 
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
 */

// 1. GET method for Meta verification
// This is used by Meta when you first configure the webhook in the App Dashboard
router.get('/', (req, res) => {
  /**
   * Meta sends 3 query parameters:
   * - hub.mode: Sent as "subscribe"
   * - hub.verify_token: The token you set in Meta Dashboard
   * - hub.challenge: A random string that you must return to verify ownership
   */
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Read the secret verification token from environment variables
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Check if mode and token are in the query string
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log('✅ WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.log('❌ WEBHOOK_VERIFICATION_FAILED: Token mismatch');
      res.sendStatus(403);
    }
  } else {
    // If query params are missing
    res.sendStatus(400);
  }
});

// 2. POST method to receive WhatsApp events
router.post('/', (req, res) => {
  try {
    // 1. Log full payload for debugging (essential for production troubleshooting)
    console.log('📥 WhatsApp Webhook Payload:', JSON.stringify(req.body, null, 2));

    /**
     * 2. Safe extraction using Optional Chaining (?.)
     * Meta structure: object -> entry[] -> changes[] -> value -> messages[]
     */
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    // 3. Process the message if it exists
    if (message) {
      const sender = message.from;
      const messageBody = message.text?.body || `[Type: ${message.type}]`;

      // 4. Structured Clean Logging
      console.log('\n--- New WhatsApp Message ---');
      console.log(`From: ${sender}`);
      console.log(`Message: ${messageBody}`);
      console.log('---------------------------\n');
    } 
    /**
     * 5. Handle Status Updates
     * (e.g., message sent, delivered, or read notifications)
     */
    else if (value?.statuses?.[0]) {
      const status = value.statuses[0];
      console.log(`ℹ️ Status Update: ${status.status} for recipient ${status.recipient_id}`);
    }

    /**
     * 6. Always return HTTP 200
     * Meta requires a 200 OK within 20 seconds. If you don't send it, 
     * they will retry and eventually disable your webhook.
     */
    return res.status(200).send('EVENT_RECEIVED');

  } catch (error) {
    /**
     * 7. Graceful Error Handling
     * We log the error but still return 200 to acknowledge receipt.
     */
    console.error('❌ Webhook Processing Error:', error.message);
    return res.status(200).send('ERROR_ACKNOWLEDGED');
  }
});

module.exports = router;
