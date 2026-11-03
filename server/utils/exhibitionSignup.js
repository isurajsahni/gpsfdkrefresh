const axios = require('axios');

// Helpers for accounts staff create at an exhibition (see createExhibitionSignup
// in authController). The customer later signs in by the normal OTP.

// Every account needs a unique email, but a customer may only give a WhatsApp
// number. `.invalid` can never receive mail, and sendEmail skips it. The client
// hides this same domain: see utils/contactEmail.js.
const PLACEHOLDER_EMAIL_DOMAIN = 'exhibition.invalid';

const placeholderEmail = (phone) => `whatsapp-${phone.replace(/\D/g, '')}@${PLACEHOLDER_EMAIL_DOMAIN}`;

// Returns the number as +<country code><number>, or null if it isn't valid.
// Exhibitions are in India, so a bare 10-digit number is taken as Indian; any
// other country needs its + prefix.
const normalizeSignupPhone = (raw) => {
  const value = String(raw).trim();
  const digits = value.replace(/\D/g, '');
  if (value.startsWith('+')) return /^[1-9]\d{9,14}$/.test(digits) ? `+${digits}` : null;
  const national = digits.replace(/^(0|91)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(national) ? `+91${national}` : null;
};

const isWelcomeWhatsAppConfigured = () =>
  !!(process.env.WHATSAPP_WELCOME_TEMPLATE && process.env.WHATSAPP_TOKEN && process.env.PHONE_NUMBER_ID);

/**
 * WhatsApp only lets a business message someone first through an approved
 * template, so nothing is sent until one is approved and configured.
 *
 * Never throws: a failed welcome must not affect the account behind it.
 *
 * Env vars:
 *   WHATSAPP_WELCOME_TEMPLATE      — approved template, body {{1}} = customer name
 *   WHATSAPP_WELCOME_TEMPLATE_LANG — default en_US
 */
const sendWelcomeWhatsApp = async (phone, name) => {
  if (!isWelcomeWhatsAppConfigured()) return;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';
  try {
    await axios.post(
      `https://graph.facebook.com/${apiVersion}/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone.replace(/\D/g, ''),
        type: 'template',
        template: {
          name: process.env.WHATSAPP_WELCOME_TEMPLATE,
          language: { code: process.env.WHATSAPP_WELCOME_TEMPLATE_LANG || 'en_US' },
          // Meta rejects template values containing new lines or runs of spaces
          components: [{ type: 'body', parameters: [{ type: 'text', text: name.replace(/\s+/g, ' ') }] }],
        },
      },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Exhibition welcome] WhatsApp failed:', error.response?.data?.error?.message || error.message);
  }
};

module.exports = {
  PLACEHOLDER_EMAIL_DOMAIN,
  placeholderEmail,
  normalizeSignupPhone,
  isWelcomeWhatsAppConfigured,
  sendWelcomeWhatsApp,
};
