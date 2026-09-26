const { sendTeamWhatsApp } = require('./whatsappTeam');

/**
 * WhatsApp alert to the team for every new order: customer, delivery city,
 * payment, total, and each item with its product link. Sending, recipients
 * and the template-or-text rule live in whatsappTeam.js.
 *
 * Never throws: a WhatsApp problem must not affect the order.
 *
 * Env vars (plus whatsappTeam.js's):
 *   WHATSAPP_ORDER_ALERT_TEMPLATE        — approved template name (see
 *                                          ORDER_ALERT_TEMPLATE_TEXT below)
 *   WHATSAPP_ORDER_ALERT_TEMPLATE_LANG   — default en_US
 */

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
];

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

/**
 * @param {object} order - an Order document, with items.product populated
 *   (for the product links)
 */
const sendOrderWhatsAppAlert = async (order) => {
  let s;
  try {
    s = summary(order);
  } catch (err) {
    console.error(`[WhatsApp alert] order ${order?.orderNumber}: couldn't build the message:`, err.message);
    return;
  }
  await sendTeamWhatsApp({
    label: `order ${s.orderNumber}`,
    templateName: process.env.WHATSAPP_ORDER_ALERT_TEMPLATE,
    templateLang: process.env.WHATSAPP_ORDER_ALERT_TEMPLATE_LANG || 'en_US',
    params: templateParams(s),
    text: textBody(s),
  });
};

module.exports = { sendOrderWhatsAppAlert, ORDER_ALERT_TEMPLATE_TEXT, _internal: { summary, templateParams, textBody } };
