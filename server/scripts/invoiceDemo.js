/**
 * Render sample GST invoices from made-up orders, to check the layout and the
 * tax maths before switching invoices on. No database, no emails.
 *
 *   node scripts/invoiceDemo.js [outDir]
 *
 * Uses the same SELLER_* / GST_RATE / INVOICE_HSN env vars as production, so
 * setting them in .env previews exactly what customers will receive.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { buildInvoiceData, renderPdf, financialYear } = require('../utils/invoice');

const outDir = path.resolve(process.argv[2] || 'invoice-demo');
fs.mkdirSync(outDir, { recursive: true });

const fy = financialYear();
const now = new Date();

const samples = {
  // Delivered inside Punjab → CGST + SGST. Cash on delivery.
  'intra-state-cod': {
    orderNumber: 'GPS-DEMO-0001',
    invoiceNumber: `GPS/${fy}/000001`,
    invoiceDate: now,
    createdAt: now,
    items: [
      { name: 'Golden Temple at Dusk — Canvas Print', variation: { size: '24x36 in', material: 'Canvas', frame: 'Black Frame' }, price: 3499, quantity: 1 },
      { name: 'Custom Family Nameplate', variation: { size: '12x6 in', material: 'Acrylic' }, customText: 'The Sandhu Family', price: 1299, quantity: 2 },
    ],
    shippingAddress: { fullName: 'Harpreet Kaur', phone: '+91 98765 43210', addressLine1: 'House 21, Green Avenue', city: 'Bathinda', state: 'Punjab', pincode: '151001', country: 'India' },
    itemsPrice: 6097, shippingPrice: 0, discountPrice: 0, totalPrice: 6097,
    paymentMethod: 'cod', isPaid: false,
  },
  // Delivered to Haryana → IGST. Paid online, with a coupon and shipping.
  'inter-state-prepaid': {
    orderNumber: 'GPS-DEMO-0002',
    invoiceNumber: `GPS/${fy}/000002`,
    invoiceDate: now,
    createdAt: now,
    items: [
      { name: 'Minimalist Mountain Triptych (Set of 3)', variation: { size: '16x20 in each', material: 'Canvas', frame: 'Frameless' }, price: 4599, quantity: 1 },
    ],
    shippingAddress: { fullName: 'Aarav Mehta', phone: '+91 91234 56789', addressLine1: 'Flat 402, Lotus Apartments', addressLine2: 'Sector 43', city: 'Gurugram', state: 'Haryana', pincode: '122002', country: 'India' },
    itemsPrice: 4599, shippingPrice: 149, discountPrice: 460, couponCode: 'WELCOME10', totalPrice: 4288,
    paymentMethod: 'razorpay', isPaid: true, paidAt: now, paymentResult: { id: 'pay_DEMO9x8y7z6w5v' },
  },
};

(async () => {
  for (const [name, order] of Object.entries(samples)) {
    const data = buildInvoiceData(order, { email: 'customer@example.com' });
    const file = path.join(outDir, `${name}.pdf`);
    fs.writeFileSync(file, await renderPdf(data));
    console.log(`${file}\n  total ${data.total}  taxable ${data.taxable}  ` +
      data.taxLines.map((t) => `${t.label}: ${t.amount}`).join('  '));
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
