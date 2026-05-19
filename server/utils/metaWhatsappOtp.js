const axios = require('axios');

/**
 * Send a Meta WhatsApp Cloud API OTP using the configured Authentication
 * template. Single source of truth for the payload shape so the registration,
 * passwordless-login, and checkout-OTP flows can't drift apart.
 *
 * Returns the underlying axios Promise so each caller can decide how to
 * surface errors (some swallow + log, some bubble to the client).
 *
 * Env vars:
 *   WHATSAPP_TOKEN, PHONE_NUMBER_ID — required
 *   WHATSAPP_API_VERSION           — default v22.0
 *   WHATSAPP_OTP_TEMPLATE          — default new_login_template
 *   WHATSAPP_OTP_TEMPLATE_LANG     — default en_US ("English (US)" in Meta)
 */
function sendWhatsappOtpTemplate(phone, otp) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.PHONE_NUMBER_ID) {
    return Promise.reject(new Error('WhatsApp not configured (WHATSAPP_TOKEN / PHONE_NUMBER_ID)'));
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE || 'new_login_template';
  const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'en_US';
  const url = `https://graph.facebook.com/${apiVersion}/${process.env.PHONE_NUMBER_ID}/messages`;
  const cleanPhone = String(phone).replace(/\D/g, '');

  return axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLang },
        // Meta Authentication template: 1 body param (OTP) + 1 button param
        // (same OTP — drives copy-code / one-tap autofill).
        components: [
          { type: 'body', parameters: [{ type: 'text', text: otp }] },
          { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] }
        ]
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

module.exports = { sendWhatsappOtpTemplate };
