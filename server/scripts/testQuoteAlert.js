/**
 * Send one sample custom-size price-request WhatsApp alert, to check the setup
 * without submitting the form (which would also save a lead). Reads the
 * database only to look up the product name; writes nothing.
 *
 *   node scripts/testQuoteAlert.js
 *
 * Prints the template text to submit in WhatsApp Manager, then the result.
 * Code 132001 means the template name or language doesn't match an approved
 * template in the WhatsApp account that owns PHONE_NUMBER_ID.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { sendQuoteWhatsAppAlert, QUOTE_ALERT_TEMPLATE_TEXT } = require('../utils/whatsappQuoteAlert');

(async () => {
  console.log('Template body for WhatsApp Manager (category: Utility):\n');
  console.log(QUOTE_ALERT_TEMPLATE_TEXT, '\n');
  console.log(`Using: ${process.env.WHATSAPP_QUOTE_ALERT_TEMPLATE ? `template "${process.env.WHATSAPP_QUOTE_ALERT_TEMPLATE}"` : 'plain text (no WHATSAPP_QUOTE_ALERT_TEMPLATE set)'}\n`);
  if (process.env.MONGO_URI) await connectDB();
  await sendQuoteWhatsAppAlert(
    { name: 'Test Customer', phone: '9999999999', email: 'test@example.com' },
    { slug: process.env.MONGO_URI ? 'golden-heritage' : '', size: '24 x 16 inches', nameOnPlate: 'The Sharma Family', houseNumber: 'A 507', quantity: 1 }
  );
  await mongoose.disconnect();
})();
