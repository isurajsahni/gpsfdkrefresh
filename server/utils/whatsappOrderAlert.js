const axios = require('axios');

/**
 * WhatsApp alert to the team for every new order: customer, delivery city,
 * payment, total, and each item with its product link.
 *
 * Sent through the same Meta WhatsApp Cloud API account as the login OTPs.
 * WhatsApp only lets a business message someone first through an approved
 * template, so:
 *   - WHATSAPP_ORDER_ALERT_TEMPLATE set → that template (reliable, any time).
 *   - not set → a plain text message, which WhatsApp only delivers if the
 *     alert phone has messaged the business number in the last 24 hours.
 *
 * Never throws: a WhatsApp problem must not affect the order.
 *
 * Env vars:
 *   WHATSAPP_TOKEN, PHONE_NUMBER_ID      — required (already used for OTPs)
 *   WHATSAPP_API_VERSION                 — default v22.0
 *   ORDER_ALERT_WHATSAPP                 — recipient(s), comma-separated,
 *                                          with country code; default below
 *   WHATSAPP_ORDER_ALERT_TEMPLATE        — approved template name (see
 *                                          ORDER_ALERT_TEMPLATE_TEXT below)
 *   WHATSAPP_ORDER_ALERT_TEMPLATE_LANG   — default en_US
 */

const DEFAULT_RECIPIENTS = '916280300103';
const SITE_URL = 'https://www.gpsfdk.com';

// The body to submit in WhatsApp Manager (category: Utility) for
// WHATSAPP_ORDER_ALERT_TEMPLATE. The eight variables are filled in
// templateParams() below, in this order.
const ORDER_ALERT_TEMPLATE_TEXT = `🛒 New order {{1}}

Customer: {{2}}
Phone: {{3}}
Deliver to: {{4}}
Payment: {{5}}
Total: {{6}}

Items: {{7}}

Manage it in the admin panel: {{8}}
Sent automatically by the GPSFDK store.`;

// Meta rejects template values containing new lines, tabs or runs of spaces,
// and caps the whole message at 1024 characters.
const oneLine = (value, max = 200) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const paymentLabel = (order) => {
  if (order.paymentMethod === 'cod') return 'Cash on Delivery';
  if (order.paymentMethod === 'free') return 'Free (fully discounted)';
  return order.isPaid ? 'Paid online' : 'Online (not yet paid)';
};

const itemLines = (order) =>
  order.items.map((item) => {
    const options = ['size', 'material', 'frame', 'color'].map((k) => item.variation?.[k]).filter(Boolean).join(', ');
    const slug = item.product?.slug;
    return [
      `${item.name}${options ? ` (${options})` : ''} × ${item.quantity} — ${rupees(item.price * item.quantity)}`,
      item.customText && `Text: ${item.customText}`,
      item.uploadedImageUrl ? `Photo: ${item.uploadedImageUrl}` : slug && `${SITE_URL}/product/${slug}`,
    ].filter(Boolean).join(' · ');
  });

const summary = (order) => {
  const a = order.shippingAddress || {};
  return {
    orderNumber: order.orderNumber,
    customer: a.fullName || 'Guest',
    phone: a.phone || '—',
    deliverTo: [a.city, a.state, a.pincode, a.country && a.country !== 'India' ? a.country : ''].filter(Boolean).join(', ') || '—',
    payment: paymentLabel(order),
    total: `${rupees(order.totalPrice)}${order.couponCode ? ` (coupon ${order.couponCode})` : ''}`,
    items: itemLines(order),
    adminUrl: `${SITE_URL}/admin/orders`,
  };
};

const templateParams = (s) => [
  s.orderNumber,
  s.customer,
  s.phone,
  s.deliverTo,
  s.payment,
  s.total,
  // One line in a template, so number the items (" | " is already used in
  // nameplate text like "The Sharma Family | House No: A 507")
  s.items.map((line, i) => `${i + 1}) ${line}`).join('  '),
  s.adminUrl,
].map((text) => ({ type: 'text', text: oneLine(text, 600) || '—' }));

const textBody = (s) => [
  `🛒 New order ${s.orderNumber}`,
  '',
  `Customer: ${s.customer}`,
  `Phone: ${s.phone}`,
  `Deliver to: ${s.deliverTo}`,
  `Payment: ${s.payment}`,
  `Total: ${s.total}`,
  '',
  'Items:',
  ...s.items.map((line) => `• ${line}`),
  '',
  `Admin: ${s.adminUrl}`,
].join('\n');

const recipients = () =>
  (process.env.ORDER_ALERT_WHATSAPP || DEFAULT_RECIPIENTS)
    .split(',')
    .map((n) => n.replace(/\D/g, ''))
    .filter(Boolean);

/**
 * @param {object} order - an Order document, with items.product populated
 *   (for the product links)
 */
const sendOrderWhatsAppAlert = async (order) => {
  if (!process.env.WHATSAPP_TOKEN || !process.env.PHONE_NUMBER_ID) {
    console.warn('[WhatsApp order alert] Skipped: WHATSAPP_TOKEN / PHONE_NUMBER_ID not set');
    return;
  }
  try {
    const s = summary(order);
    const template = process.env.WHATSAPP_ORDER_ALERT_TEMPLATE;
    const message = template
      ? {
          type: 'template',
          template: {
            name: template,
            language: { code: process.env.WHATSAPP_ORDER_ALERT_TEMPLATE_LANG || 'en_US' },
            components: [{ type: 'body', parameters: templateParams(s) }],
          },
        }
      : { type: 'text', text: { preview_url: false, body: textBody(s).slice(0, 4000) } };

    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';
    const url = `https://graph.facebook.com/${apiVersion}/${process.env.PHONE_NUMBER_ID}/messages`;
    await Promise.all(recipients().map((to) =>
      axios.post(url, { messaging_product: 'whatsapp', to, ...message }, {
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      }).then(() => console.log(`[WhatsApp order alert] ${order.orderNumber} sent to ${to} (${template ? 'template' : 'text'})`))
    ));
  } catch (err) {
    const meta = err.response?.data?.error;
    console.error(
      `[WhatsApp order alert] ${order?.orderNumber} failed:`,
      meta ? `${meta.message} (code ${meta.code}${meta.error_subcode ? `/${meta.error_subcode}` : ''})` : err.message
    );
  }
};

module.exports = { sendOrderWhatsAppAlert, ORDER_ALERT_TEMPLATE_TEXT, _internal: { summary, templateParams, textBody } };
