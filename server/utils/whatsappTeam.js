const axios = require('axios');

/**
 * Sends a WhatsApp alert to the team (new orders, custom-size price requests)
 * through the same Meta WhatsApp Cloud API account as the login OTPs.
 *
 * WhatsApp only lets a business message someone first through an approved
 * template, so an alert goes as its template when one is configured, and as
 * plain text otherwise, which WhatsApp only delivers within 24 hours of the
 * alert phone messaging the business number.
 *
 * Never throws: an alert failing must not affect the order or request behind it.
 *
 * Env vars:
 *   WHATSAPP_TOKEN, PHONE_NUMBER_ID — required (already used for OTPs)
 *   WHATSAPP_API_VERSION            — default v22.0
 *   ORDER_ALERT_WHATSAPP            — recipient(s) for every team alert,
 *                                     comma-separated, with country code
 */

const DEFAULT_RECIPIENTS = '916280300103';

// Meta rejects template values containing new lines, tabs or runs of spaces,
// and caps the whole message at 1024 characters.
const oneLine = (value, max = 200) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const recipients = () =>
  (process.env.ORDER_ALERT_WHATSAPP || DEFAULT_RECIPIENTS)
    .split(',')
    .map((n) => n.replace(/\D/g, ''))
    .filter(Boolean);

/**
 * @param {object} alert
 * @param {string} alert.label - for the logs, e.g. "order GPS-10234"
 * @param {string} [alert.templateName] - approved template; plain text if unset
 * @param {string} [alert.templateLang] - default en_US
 * @param {string[]} alert.params - template body values, in {{1}}, {{2}}… order
 * @param {string} alert.text - the plain-text version
 */
const sendTeamWhatsApp = async ({ label, templateName, templateLang = 'en_US', params, text }) => {
  if (!process.env.WHATSAPP_TOKEN || !process.env.PHONE_NUMBER_ID) {
    console.warn(`[WhatsApp alert] ${label}: skipped, WHATSAPP_TOKEN / PHONE_NUMBER_ID not set`);
    return;
  }
  try {
    const message = templateName
      ? {
          type: 'template',
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [{
              type: 'body',
              parameters: params.map((value) => ({ type: 'text', text: oneLine(value, 600) || '—' })),
            }],
          },
        }
      : { type: 'text', text: { preview_url: false, body: String(text).slice(0, 4000) } };

    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';
    const url = `https://graph.facebook.com/${apiVersion}/${process.env.PHONE_NUMBER_ID}/messages`;
    await Promise.all(recipients().map((to) =>
      axios.post(url, { messaging_product: 'whatsapp', to, ...message }, {
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      }).then(() => console.log(`[WhatsApp alert] ${label} sent to ${to} (${templateName ? 'template' : 'text'})`))
    ));
  } catch (err) {
    const meta = err.response?.data?.error;
    console.error(
      `[WhatsApp alert] ${label} failed:`,
      meta ? `${meta.message} (code ${meta.code}${meta.error_subcode ? `/${meta.error_subcode}` : ''})` : err.message
    );
  }
};

module.exports = { sendTeamWhatsApp, oneLine };
