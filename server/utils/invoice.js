/**
 * GST tax invoice — numbering, tax breakdown and PDF rendering.
 *
 * Store prices are GST-INCLUSIVE: what the customer paid is the grand total,
 * and the invoice works the taxable value and GST back out of it. Nothing
 * about checkout or the amount charged changes.
 *
 * OPT-IN: nothing is issued or emailed unless INVOICE_ENABLED=true.
 * GST is on only when SELLER_GSTIN is set; without it the PDF is a plain
 * invoice — no GSTIN, HSN or tax breakdown.
 */
const path = require('path');
const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const Counter = require('../models/Counter');

const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Inter-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Inter-SemiBold.ttf');
// PNG copy of the site logo (client/src/assets/vite.webp) — PDFs can't embed WebP.
const LOGO = path.join(__dirname, '../assets/logo.png');

const BRAND = '#0B5D3B';
const INK = '#1a1a1a';
const MUTED = '#6b7280';
const RULE = '#e5e7eb';

// GST state codes (first two digits of a GSTIN). Place of supply is printed
// as "State (code)" and decides CGST+SGST (same state) vs IGST (other state).
const STATE_CODES = {
  'jammu and kashmir': '01', 'himachal pradesh': '02', punjab: '03', chandigarh: '04',
  uttarakhand: '05', haryana: '06', delhi: '07', rajasthan: '08', 'uttar pradesh': '09',
  bihar: '10', sikkim: '11', 'arunachal pradesh': '12', nagaland: '13', manipur: '14',
  mizoram: '15', tripura: '16', meghalaya: '17', assam: '18', 'west bengal': '19',
  jharkhand: '20', odisha: '21', chhattisgarh: '22', 'madhya pradesh': '23', gujarat: '24',
  'dadra and nagar haveli and daman and diu': '26', maharashtra: '27', karnataka: '29',
  goa: '30', lakshadweep: '31', kerala: '32', 'tamil nadu': '33', puducherry: '34',
  'andaman and nicobar islands': '35', telangana: '36', 'andhra pradesh': '37', ladakh: '38',
};

const normState = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim();

const getConfig = () => {
  const env = process.env;
  const gstin = (env.SELLER_GSTIN || '').trim();
  return {
    enabled: env.INVOICE_ENABLED === 'true',
    gst: Boolean(gstin),
    prefix: (env.INVOICE_PREFIX || 'GPS').trim(),
    legalName: env.SELLER_LEGAL_NAME || 'GPS FDK Refresh',
    gstin,
    addressLines: (env.SELLER_ADDRESS || 'GPS, Circular Road, Near More Store|Faridkot, Punjab 151203|India')
      .split('|').map((l) => l.trim()).filter(Boolean),
    state: env.SELLER_STATE || 'Punjab',
    email: env.SELLER_EMAIL || 'support@gpsfdk.com',
    phone: env.SELLER_PHONE || '+91 62803-10103',
    gstRate: Number(env.GST_RATE || 18),
    hsn: env.INVOICE_HSN || '4911',
  };
};

// ─── Money / dates ───

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const money = (n) => '₹' + round2(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
});

// Indian financial year (April–March) in IST, e.g. "2026-27".
const financialYear = (date = new Date()) => {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${start}-${String(start + 1).slice(2)}`;
};

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const twoDigits = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`);
const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', r ? twoDigits(r) : ''].filter(Boolean).join(' ');
};
// Indian numbering: crore / lakh / thousand.
const intToWords = (n) => {
  if (n === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  if (crore) parts.push(`${intToWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return parts.join(' ');
};
const amountInWords = (amount) => {
  const rupees = Math.floor(round2(amount));
  const paise = Math.round((round2(amount) - rupees) * 100);
  return `Rupees ${intToWords(rupees)}${paise ? ` and ${twoDigits(paise)} Paise` : ''} Only`;
};

// ─── Numbering ───

/**
 * Give the order its invoice number if it doesn't have one yet. Idempotent:
 * a resent confirmation email reuses the number already stored. The number
 * comes from a per-financial-year counter, as GST requires a consecutive
 * series (GPS/2026-27/000001, …).
 */
const ensureInvoiceNumber = async (order) => {
  if (order.invoiceNumber) return order;
  const { prefix } = getConfig();
  const invoiceDate = new Date();
  const fy = financialYear(invoiceDate);
  const seq = await Counter.next(`invoice-${fy}`);
  const invoiceNumber = `${prefix}/${fy}/${String(seq).padStart(6, '0')}`;

  // Conditional write so two concurrent callers can't both stamp the order;
  // the loser adopts the winner's number.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, invoiceNumber: null },
    { $set: { invoiceNumber, invoiceDate } },
    { new: true, projection: { invoiceNumber: 1, invoiceDate: 1 } }
  ) || await Order.findById(order._id, { invoiceNumber: 1, invoiceDate: 1 });

  order.invoiceNumber = updated.invoiceNumber;
  order.invoiceDate = updated.invoiceDate;
  return order;
};

// ─── Invoice data ───

const addressLines = (a) => {
  if (!a) return [];
  return [
    a.addressLine1,
    a.addressLine2,
    [a.city, a.state, a.pincode].filter(Boolean).join(', '),
    a.country,
    a.phone ? `Phone: ${a.phone}` : '',
  ].filter(Boolean);
};

const hasAddress = (a) => Boolean(a && (a.addressLine1 || a.city));

/** Everything the PDF prints, derived from the order. Pure — no DB access. */
const buildInvoiceData = (order, customer = {}) => {
  const cfg = getConfig();
  const shipTo = order.shippingAddress || {};
  const billTo = hasAddress(order.billingAddress) ? order.billingAddress : shipTo;

  // Place of supply for goods is where they're delivered.
  const isIndia = !shipTo.country || /^india$/i.test(shipTo.country.trim());
  const posCode = isIndia ? STATE_CODES[normState(shipTo.state)] : null;
  const placeOfSupply = isIndia
    ? `${shipTo.state || '—'}${posCode ? ` (${posCode})` : ''}`
    : `Outside India (${shipTo.country})`;
  const intraState = isIndia && normState(shipTo.state) === normState(cfg.state);

  const total = round2(order.totalPrice);
  const rate = cfg.gstRate;
  const taxable = round2(total / (1 + rate / 100));
  const tax = round2(total - taxable);
  const cgst = intraState ? round2(tax / 2) : 0;
  const taxLines = intraState
    ? [
        { label: `CGST @ ${rate / 2}%`, amount: cgst },
        { label: `SGST @ ${rate / 2}%`, amount: round2(tax - cgst) },
      ]
    : [{ label: `IGST @ ${rate}%`, amount: tax }];

  const items = (order.items || []).map((item) => {
    const v = item.variation || {};
    const details = [v.size, v.material, v.frame, v.color].filter(Boolean).join(' · ');
    return {
      name: item.name || 'Item',
      details: [details, item.customText ? `Custom: ${item.customText}` : ''].filter(Boolean).join('\n'),
      hsn: cfg.hsn,
      qty: item.quantity,
      rate: item.price,
      amount: round2(item.price * item.quantity),
    };
  });

  const payment = order.paymentMethod === 'cod'
    ? { method: 'Cash on Delivery', status: order.isPaid ? 'Paid' : 'Payable on delivery' }
    : order.paymentMethod === 'free'
      ? { method: 'No payment required', status: 'Paid' }
      : {
          method: 'Paid online (Razorpay)',
          status: order.isPaid ? `Paid on ${fmtDate(order.paidAt || order.createdAt)}` : 'Pending',
          reference: order.paymentResult?.id,
        };

  return {
    seller: cfg,
    gst: cfg.gst,
    invoiceNumber: order.invoiceNumber || '—',
    invoiceDate: fmtDate(order.invoiceDate || new Date()),
    orderNumber: order.orderNumber,
    orderDate: fmtDate(order.createdAt || new Date()),
    placeOfSupply,
    billTo: { name: billTo.fullName || customer.name || 'Customer', email: customer.email, lines: addressLines(billTo) },
    shipTo: { name: shipTo.fullName || customer.name || 'Customer', lines: addressLines(shipTo) },
    items,
    itemsTotal: round2(order.itemsPrice),
    shipping: round2(order.shippingPrice),
    discount: round2(order.discountPrice),
    couponCode: order.couponCode,
    total,
    taxable,
    taxLines,
    totalTax: tax,
    amountInWords: amountInWords(total),
    payment,
  };
};

// ─── PDF ───

const PAGE = { left: 40, right: 555, bottom: 780 };

const renderPdf = (d) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Invoice ${d.invoiceNumber}`, Author: d.seller.legalName } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.registerFont('R', FONT_REGULAR);
  doc.registerFont('B', FONT_BOLD);

  const text = (str, x, y, opts = {}) => {
    const { font = 'R', size = 9, color = INK, tabular = false, ...rest } = opts;
    // calt off: Inter otherwise turns "9x8" into "9×8", corrupting payment IDs.
    // tnum (amount columns only): fixed-width digits so figures line up; it
    // also widens hyphens, so it stays off for IDs and dates.
    doc.font(font).fontSize(size).fillColor(color)
      .text(String(str ?? ''), x, y, { lineBreak: true, features: { calt: false, tnum: tabular }, ...rest });
    return doc.y;
  };
  const rule = (y, color = RULE, width = 0.75) => {
    doc.moveTo(PAGE.left, y).lineTo(PAGE.right, y).lineWidth(width).strokeColor(color).stroke();
  };

  let y = 40;

  // Header — seller on the left, invoice meta on the right.
  const headerTop = y;
  doc.image(LOGO, PAGE.left, y, { height: 64 });
  y += 72;
  y = text(d.seller.legalName, PAGE.left, y, { font: 'B', size: 10 });
  for (const line of d.seller.addressLines) y = text(line, PAGE.left, y, { color: MUTED });
  if (d.gst) y = text(`GSTIN: ${d.seller.gstin}`, PAGE.left, y + 2, { font: 'B', size: 9 });
  y = text(`${d.seller.email}  ·  ${d.seller.phone}`, PAGE.left, y, { color: MUTED });
  const leftBottom = y;

  const metaX = 340;
  let my = text(d.gst ? 'TAX INVOICE' : 'INVOICE', metaX, headerTop, { font: 'B', size: 16, width: PAGE.right - metaX, align: 'right' }) + 6;
  const meta = [
    ['Invoice No.', d.invoiceNumber],
    ['Invoice Date', d.invoiceDate],
    ['Order No.', d.orderNumber],
    ['Order Date', d.orderDate],
    ...(d.gst ? [['Place of Supply', d.placeOfSupply]] : []),
  ];
  for (const [label, value] of meta) {
    text(label, metaX, my, { color: MUTED, width: 85 });
    my = text(value, metaX + 85, my, { font: 'B', width: PAGE.right - metaX - 85, align: 'right' }) + 2;
  }

  y = Math.max(leftBottom, my) + 14;
  rule(y);
  y += 14;

  // Bill to / Ship to
  const colW = (PAGE.right - PAGE.left - 20) / 2;
  const party = (title, p, x) => {
    let py = text(title.toUpperCase(), x, y, { font: 'B', size: 8, color: MUTED, characterSpacing: 0.8 }) + 3;
    py = text(p.name, x, py, { font: 'B', size: 10, width: colW });
    if (p.email) py = text(p.email, x, py, { color: MUTED, width: colW });
    for (const line of p.lines) py = text(line, x, py, { color: MUTED, width: colW });
    return py;
  };
  y = Math.max(party('Bill to', d.billTo, PAGE.left), party('Ship to', d.shipTo, PAGE.left + colW + 20)) + 18;

  // Items table
  // Without GST there's no HSN column; the item column takes its space.
  const cols = [
    { key: 'n', label: '#', x: PAGE.left + 6, w: 18 },
    { key: 'item', label: 'Item', x: PAGE.left + 26, w: d.gst ? 230 : 275 },
    ...(d.gst ? [{ key: 'hsn', label: 'HSN', x: 300, w: 45 }] : []),
    { key: 'qty', label: 'Qty', x: 345, w: 35, align: 'right' },
    { key: 'rate', label: 'Rate', x: 385, w: 80, align: 'right' },
    { key: 'amount', label: 'Amount', x: 465, w: 84, align: 'right' },
  ];
  const col = Object.fromEntries(cols.map((c) => [c.key, c]));
  const tableHeader = () => {
    doc.rect(PAGE.left, y, PAGE.right - PAGE.left, 22).fill('#f3f4f6');
    for (const c of cols) text(c.label, c.x, y + 7, { font: 'B', size: 8, color: MUTED, width: c.w, align: c.align || 'left' });
    y += 28;
  };
  tableHeader();

  d.items.forEach((it, i) => {
    doc.font('B').fontSize(9);
    let h = doc.heightOfString(it.name, { width: col.item.w });
    if (it.details) h += doc.font('R').fontSize(8).heightOfString(it.details, { width: col.item.w }) + 2;
    if (y + h > PAGE.bottom - 40) {
      doc.addPage();
      y = 40;
      tableHeader();
    }
    const rowTop = y;
    text(i + 1, col.n.x, rowTop, { color: MUTED, width: col.n.w });
    let iy = text(it.name, col.item.x, rowTop, { font: 'B', width: col.item.w });
    if (it.details) iy = text(it.details, col.item.x, iy + 1, { size: 8, color: MUTED, width: col.item.w });
    if (col.hsn) text(it.hsn, col.hsn.x, rowTop, { color: MUTED, width: col.hsn.w });
    text(it.qty, col.qty.x, rowTop, { width: col.qty.w, align: 'right' });
    text(money(it.rate), col.rate.x, rowTop, { width: col.rate.w, align: 'right', tabular: true });
    text(money(it.amount), col.amount.x, rowTop, { font: 'B', width: col.amount.w, align: 'right', tabular: true });
    y = Math.max(iy, rowTop + h) + 8;
    rule(y - 4);
  });

  // Totals (right) and amount in words + payment (left). Kept together.
  if (y > PAGE.bottom - 230) {
    doc.addPage();
    y = 40;
  }
  y += 8;
  const totalsX = 330;
  const totalsW = PAGE.right - totalsX;
  const row = (label, value, opts = {}) => {
    const { bold = false, color = INK, size = 9 } = opts;
    text(label, totalsX, y, { font: bold ? 'B' : 'R', size, color: bold ? INK : MUTED, width: totalsW - 100 });
    text(value, totalsX + totalsW - 100, y, { font: bold ? 'B' : 'R', size, color, width: 100, align: 'right', tabular: true });
    y = doc.y + 5;
  };
  const blockTop = y;
  row('Items total', money(d.itemsTotal));
  row('Shipping', d.shipping > 0 ? money(d.shipping) : 'Free');
  if (d.discount > 0) row(`Discount${d.couponCode ? ` (${d.couponCode})` : ''}`, `−${money(d.discount)}`, { color: '#16a34a' });
  doc.moveTo(totalsX, y).lineTo(PAGE.right, y).lineWidth(1).strokeColor(BRAND).stroke();
  y += 7;
  row(d.gst ? 'Total (incl. GST)' : 'Total', money(d.total), { bold: true, size: 11, color: BRAND });
  if (d.gst) {
    y += 4;
    row('Taxable value', money(d.taxable));
    for (const t of d.taxLines) row(t.label, money(t.amount));
    row('Total GST', money(d.totalTax), { bold: true });
  }
  const totalsBottom = y;

  const leftW = totalsX - PAGE.left - 24;
  let ly = text('AMOUNT IN WORDS', PAGE.left, blockTop, { font: 'B', size: 8, color: MUTED, characterSpacing: 0.8 }) + 3;
  ly = text(d.amountInWords, PAGE.left, ly, { font: 'B', width: leftW }) + 12;
  ly = text('PAYMENT', PAGE.left, ly, { font: 'B', size: 8, color: MUTED, characterSpacing: 0.8 }) + 3;
  ly = text(d.payment.method, PAGE.left, ly, { width: leftW });
  ly = text(d.payment.status, PAGE.left, ly, { color: MUTED, width: leftW });
  if (d.payment.reference) ly = text(`Ref: ${d.payment.reference}`, PAGE.left, ly, { color: MUTED, width: leftW });

  y = Math.max(totalsBottom, ly) + 24;
  rule(y);
  y += 10;
  const notes = [
    ...(d.gst ? ['Prices are inclusive of GST. Tax payable on reverse charge: No.'] : []),
    'This is a computer-generated invoice and does not require a signature.',
    `Questions about this invoice? Write to ${d.seller.email}.`,
  ];
  for (const n of notes) y = text(n, PAGE.left, y, { size: 8, color: MUTED, width: PAGE.right - PAGE.left }) + 2;
  text('Thank you for shopping with GPSFDK.', PAGE.left, y + 8, { font: 'B', size: 9, color: BRAND });

  doc.end();
});

/**
 * Issue (number if needed) and render the invoice for an order.
 * Returns a Resend-ready attachment: { filename, content }.
 */
// Orders that can be invoiced: anything placed and not cancelled. A Razorpay
// order still awaiting payment hasn't been sold yet.
const canIssueInvoice = (order) => !['cancelled', 'payment_pending'].includes(order.status);

const invoiceFilename = (order) => `Invoice-${String(order.invoiceNumber).replace(/[^A-Za-z0-9-]+/g, '-')}.pdf`;

const createInvoiceAttachment = async (order, customer) => {
  await ensureInvoiceNumber(order);
  const content = await renderPdf(buildInvoiceData(order, customer));
  return { filename: invoiceFilename(order), content };
};

module.exports = {
  getConfig,
  financialYear,
  amountInWords,
  ensureInvoiceNumber,
  buildInvoiceData,
  renderPdf,
  canIssueInvoice,
  invoiceFilename,
  createInvoiceAttachment,
};
