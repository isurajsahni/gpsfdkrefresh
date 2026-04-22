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
    // Log full webhook payload for debugging
    // This helps in understanding different event types (messages, status updates, etc.)
    console.log('📥 Incoming WhatsApp Webhook Payload:', JSON.stringify(req.body, null, 2));

    // Extracting message details
    // The structure is nested: object -> entry[] -> changes[] -> value -> messages[]
    if (req.body.object) {
      if (
        req.body.entry &&
        req.body.entry[0].changes &&
        req.body.entry[0].changes[0] &&
        req.body.entry[0].changes[0].value.messages &&
        req.body.entry[0].changes[0].value.messages[0]
      ) {
        const message = req.body.entry[0].changes[0].value.messages[0];
        const sender = message.from; // Sender's phone number
        const messageText = message.text ? message.text.body : '[Non-text message]';

        // Print cleanly in the console as requested
        console.log('\n--- NEW WHATSAPP MESSAGE ---');
        console.log(`FROM: ${sender}`);
        console.log(`TEXT: ${messageText}`);
        console.log('----------------------------\n');
      }
    }

    // Always send a 200 OK response to Meta within 20 seconds.
    // If you don't return 200, Meta will keep retrying and might eventually disable the webhook.
    res.status(200).send('EVENT_RECEIVED');

  } catch (error) {
    console.error('⚠️ Webhook Error:', error);
    // Even on error, we send 200 to acknowledge receipt and prevent retries
    res.status(200).send('EVENT_RECEIVED_WITH_ERROR');
  }
});

module.exports = router;
