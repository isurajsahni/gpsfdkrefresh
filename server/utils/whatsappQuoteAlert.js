const Product = require('../models/Product');
const { sendTeamWhatsApp, oneLine } = require('./whatsappTeam');

/**
 * WhatsApp alert to the team when a shopper asks for a custom-size price on a
 * nameplate (the product page's "Request Price" form). The request is also
 * saved as a lead (Admin > Leads); this is so someone can call back quickly.
 *
 * The form is public, so its fields are only ever shown as text, and the
 * product name and link come from the catalogue (looked up by slug), never
 * from the request: nobody can put their own link in the team's WhatsApp.
 *
 * Never throws. Env vars (plus whatsappTeam.js's):
 *   WHATSAPP_QUOTE_ALERT_TEMPLATE        — approved template name (see
 *                                          QUOTE_ALERT_TEMPLATE_TEXT below)
 *   WHATSAPP_QUOTE_ALERT_TEMPLATE_LANG   — default en_US
 */

const SITE_URL = 'https://www.gpsfdk.com';

// The body to submit in WhatsApp Manager (category: Utility) for
// WHATSAPP_QUOTE_ALERT_TEMPLATE. The seven variables are filled in
// templateParams() below, in this order.
const QUOTE_ALERT_TEMPLATE_TEXT = `📐 Custom size price request

Product: {{1}}
Size wanted: {{2}}
Details: {{3}}

Customer: {{4}}
Phone: {{5}}
Email: {{6}}

Product page: {{7}}
Please call the customer with a price. Sent automatically by the GPSFDK store.`;

const SLUG = /^[a-z0-9-]{1,120}$/;
const field = (value, max = 120) => oneLine(typeof value === 'string' || typeof value === 'number' ? value : '', max);

/**
 * @param {object} lead - the saved Lead (name, email, phone)
 * @param {object} quote - from the request: { slug, size, material, frame,
 *   color, nameOnPlate, houseNumber, quantity }
 */
const buildSummary = async (lead, quote) => {
  const slug = typeof quote.slug === 'string' && SLUG.test(quote.slug) ? quote.slug : null;
  const product = slug ? await Product.findOne({ slug }).select('name slug').lean() : null;
  const quantity = Math.min(Math.max(parseInt(quote.quantity, 10) || 1, 1), 999);
  const details = [
    field(quote.material) && `Material: ${field(quote.material)}`,
    field(quote.frame) && `Frame: ${field(quote.frame)}`,
    field(quote.color) && `Colour: ${field(quote.color)}`,
    field(quote.nameOnPlate) && `Name on plate: ${field(quote.nameOnPlate)}`,
    field(quote.houseNumber) && `House No: ${field(quote.houseNumber)}`,
    `Qty: ${quantity}`,
  ].filter(Boolean);
  return {
    product: product?.name || 'a nameplate (product not found)',
    size: field(quote.size) || '—',
    details,
    customer: field(lead.name, 60) || '—',
    phone: field(lead.phone, 20) || '—',
    email: field(lead.email, 100) || '—',
    productUrl: product ? `${SITE_URL}/product/${product.slug}` : `${SITE_URL}/house-nameplates`,
  };
};

const templateParams = (s) => [s.product, s.size, s.details.join(' · '), s.customer, s.phone, s.email, s.productUrl];

const textBody = (s) => [
  '📐 Custom size price request',
  '',
  `Product: ${s.product}`,
  `Size wanted: ${s.size}`,
  ...s.details,
  '',
  `Customer: ${s.customer}`,
  `Phone: ${s.phone}`,
  `Email: ${s.email}`,
  '',
  `Product page: ${s.productUrl}`,
].join('\n');

const sendQuoteWhatsAppAlert = async (lead, quote) => {
  let s;
  try {
    s = await buildSummary(lead, quote || {});
  } catch (err) {
    console.error('[WhatsApp alert] price request: couldn\'t build the message:', err.message);
    return;
  }
  await sendTeamWhatsApp({
    label: `price request from ${s.customer}`,
    templateName: process.env.WHATSAPP_QUOTE_ALERT_TEMPLATE,
    templateLang: process.env.WHATSAPP_QUOTE_ALERT_TEMPLATE_LANG || 'en_US',
    params: templateParams(s),
    text: textBody(s),
  });
};

module.exports = { sendQuoteWhatsAppAlert, QUOTE_ALERT_TEMPLATE_TEXT, _internal: { buildSummary, templateParams, textBody } };
