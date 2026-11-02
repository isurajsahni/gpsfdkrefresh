/**
 * Product catalogue as a CSV, one row per sellable variation, for working from
 * in Excel or Google Sheets and copying into marketplace upload templates.
 *
 * Only the listed columns leave the server. In particular variations.costPrice
 * is left out: this file is meant to be handed around.
 */
const { WEIGHT_MAP, DIMENSION_MAP } = require('./weightMapping');

const SITE_URL = 'https://www.gpsfdk.com';

// Amazon takes 9 images per listing; more columns than that are never useful.
const MAX_IMAGES = 9;

// Not "Canvas Wall Art" as on the site: the Wall Canvas category also holds the
// poster variations, and a listing title has to be true of its one variation.
const PRODUCT_TYPES = {
  'wall-canvas': 'Wall Art',
  'house-nameplates': 'House Nameplate',
};

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

// Admin descriptions are rich HTML; a spreadsheet cell needs plain text.
const toPlainText = (html = '') =>
  String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim();

const clean = (value) => String(value ?? '').trim();

const skuPart = (value, length) => clean(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length);

// Built from the product id, which never changes, so the same variation gets
// the same SKU on every export even if the product is renamed. Short enough for
// Amazon's 40-character limit: GPS-5EE178-CAN-STR-24X36.
const parentSku = (product) => `GPS-${String(product._id).slice(-6).toUpperCase()}`;

const generatedSku = (product, v) =>
  [parentSku(product), skuPart(v.material, 3), skuPart(v.frame, 3), skuPart(v.color, 3), skuPart(v.size, 12)]
    .filter(Boolean)
    .join('-');

// Marketplaces don't take WebP. Cloudinary serves any upload in the format the
// URL's extension asks for, so a .webp upload is also available as a .jpg.
const marketplaceImageUrl = (url) =>
  url.includes('res.cloudinary.com') ? url.replace(/\.webp$/i, '.jpg') : url;

const productImages = (product) => {
  const urls = [...(product.images || []).map((img) => img.url), product.thumbnailImage?.url]
    .map(clean)
    .filter(Boolean)
    .map(marketplaceImageUrl);
  return [...new Set(urls)].slice(0, MAX_IMAGES);
};

const displaySize = (size) => (/^\d+(\.\d+)?\s*x\s*\d+(\.\d+)?$/i.test(size) ? `${size} in` : size);

const listingTitle = (product, v) => {
  const type = PRODUCT_TYPES[product.category?.slug] || '';
  const options = [clean(v.material), clean(v.frame), displaySize(clean(v.size))].filter(Boolean).join(', ');
  return [clean(product.name), type].filter(Boolean).join(' ') + (options ? ` - ${options}` : '');
};

// Most products have no description in the admin, and a marketplace won't take
// a listing without one. Fall back to the facts this variation is known to have.
const describeVariation = (product, v) => {
  const written = toPlainText(product.description);
  if (written) return written;

  const type = (PRODUCT_TYPES[product.category?.slug] || '').toLowerCase();
  const collection = clean(product.subCategory).replace(/^the\s+/i, '');
  const subject = [clean(product.name), type].filter(Boolean).join(' ');
  const lead = collection ? `${subject} from the ${collection} collection.` : `${subject} by GPSFDK.`;
  const options = [clean(v.material), clean(v.frame).toLowerCase(), displaySize(clean(v.size))].filter(Boolean).join(', ');
  const print = /canvas/i.test(v.material || '') ? 'Printed on 350 GSM canvas with eco-solvent inks.' : '';
  return [lead, options && `${options}.`, print].filter(Boolean).join(' ');
};

const positive = (value) => (Number(value) > 0 ? Number(value) : '');

const buildRows = (products) => {
  // Products with no variations still get a row, priced from basePrice, so
  // nothing silently goes missing from the file.
  const items = products.flatMap((product) =>
    (product.variations?.length ? product.variations : [{}]).map((v) => ({ product, v }))
  );

  const existingCount = new Map();
  for (const { v } of items) {
    const sku = clean(v.sku);
    if (sku) existingCount.set(sku, (existingCount.get(sku) || 0) + 1);
  }

  const used = new Set(existingCount.keys());
  const uniqueGenerated = (base) => {
    let sku = base;
    for (let n = 2; used.has(sku); n++) sku = `${base}-${n}`;
    used.add(sku);
    return sku;
  };

  const imageColumnCount = Math.max(1, ...products.map((p) => productImages(p).length));

  return items.map(({ product, v }) => {
    const existing = clean(v.sku);
    const size = clean(v.size);
    const sizeKey = size.toLowerCase().replace(/\s+/g, '');
    const dims = DIMENSION_MAP[sizeKey];
    const images = productImages(product);

    const row = {
      SKU: existing || uniqueGenerated(generatedSku(product, v)),
      'SKU Source': !existing ? 'Generated' : existingCount.get(existing) > 1 ? 'Duplicate - fix before upload' : 'From admin',
      'Parent SKU': parentSku(product),
      'Product Name': clean(product.name),
      'Listing Title': listingTitle(product, v),
      Description: describeVariation(product, v),
      Category: clean(product.category?.name),
      Collection: clean(product.subCategory),
      Material: clean(v.material),
      Frame: clean(v.frame),
      Size: size,
      Color: clean(v.color),
      'Price (₹)': v.price ?? product.basePrice ?? '',
      'Compare Price (₹)': positive(v.comparePrice),
      Stock: v.stock ?? '',
      // Same packed figures Shiprocket gets. Blank, not guessed, for sizes with
      // no measured weight (posters, nameplates).
      'Packed Weight (kg)': WEIGHT_MAP[sizeKey] ?? '',
      'Packed Length (cm)': dims?.length ?? '',
      'Packed Breadth (cm)': dims?.breadth ?? '',
      'Packed Height (cm)': dims?.height ?? '',
    };
    for (let i = 0; i < imageColumnCount; i++) {
      row[i === 0 ? 'Main Image URL' : `Image ${i + 1} URL`] = images[i] || '';
    }
    row['Product URL'] = product.slug ? `${SITE_URL}/product/${product.slug}` : '';
    row.Status = product.isActive === false ? 'Inactive' : 'Active';
    return row;
  });
};

const csvCell = (value) => {
  if (typeof value === 'number') return String(value);
  let text = String(value ?? '');
  // Excel and Sheets run a cell starting with one of these as a formula
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// The byte order mark is what makes Excel read the file as UTF-8. Without it ₹
// and the curly apostrophe in names like The CEO’s Greed come out garbled.
const toCsv = (rows) => {
  if (rows.length === 0) return '﻿';
  const columns = Object.keys(rows[0]);
  const lines = [columns, ...rows.map((row) => columns.map((c) => row[c]))].map((cells) => cells.map(csvCell).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
};

module.exports = { buildRows, toCsv };
