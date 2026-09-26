/**
 * Send one sample new-order WhatsApp alert, to check the setup without placing
 * a real order (which would also create a Shiprocket shipment). Uses the same
 * env vars as the live alert. No database.
 *
 *   node scripts/testOrderAlert.js
 *
 * Prints the WhatsApp template text to submit in WhatsApp Manager, then the
 * result of sending. Code 131047 ("Re-engagement message") means no approved
 * template is set and the alert phone hasn't messaged the business number in
 * the last 24 hours.
 */
require('dotenv').config();
const { sendOrderWhatsAppAlert, ORDER_ALERT_TEMPLATE_TEXT } = require('../utils/whatsappOrderAlert');

const sampleOrder = {
  orderNumber: 'TEST-0001',
  paymentMethod: 'cod',
  isPaid: false,
  totalPrice: 4799,
  shippingAddress: { fullName: 'Test Customer', phone: '9999999999', city: 'Ludhiana', state: 'Punjab', pincode: '141001', country: 'India' },
  items: [
    { name: 'Golden Heritage', quantity: 1, price: 4799, variation: { size: '18X12' }, customText: 'The Sharma Family | House No: A 507', product: { slug: 'golden-heritage' } },
  ],
};

console.log('Template body for WhatsApp Manager (category: Utility):\n');
console.log(ORDER_ALERT_TEMPLATE_TEXT, '\n');
console.log(`Using: ${process.env.WHATSAPP_ORDER_ALERT_TEMPLATE ? `template "${process.env.WHATSAPP_ORDER_ALERT_TEMPLATE}"` : 'plain text (no WHATSAPP_ORDER_ALERT_TEMPLATE set)'}\n`);
sendOrderWhatsAppAlert(sampleOrder);
