// Search metadata for product pages. Products whose description, metaTitle or
// metaDescription is blank in the admin would otherwise ship an empty meta
// description and schema description, so these build fallbacks from data every
// product has: its name, category, collection and variations. Whatever the
// admin fills in always takes precedence.

const PRODUCT_TYPES = {
  'wall-canvas': 'Canvas Wall Art',
  'house-nameplates': 'House Nameplate',
};

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

// Admin descriptions are rich HTML; meta tags and JSON-LD need plain text.
export const toPlainText = (html = '') =>
  String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim();

// Cut at a word boundary so the snippet doesn't end mid-word.
const truncate = (text, max) => {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(' ', max - 1);
  return `${text.slice(0, cut > 0 ? cut : max - 1)}…`;
};

const uniq = (values) => [...new Set(values.map((v) => (v || '').trim()).filter(Boolean))];

const INCH_SIZE = /^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)$/i;

// "12x18 to 36x60 in" for inch sizes, smallest to largest by area; paper sizes
// (A4, A3) follow, smallest first.
const describeSizes = (sizes) => {
  const area = (size) => {
    const [, w, h] = INCH_SIZE.exec(size);
    return Number(w) * Number(h);
  };
  const paperRank = (size) => {
    const match = /^A(\d+)$/i.exec(size);
    return match ? -Number(match[1]) : 0;
  };
  const inch = sizes.filter((s) => INCH_SIZE.test(s)).sort((a, b) => area(a) - area(b));
  const other = sizes.filter((s) => !INCH_SIZE.test(s)).sort((a, b) => paperRank(a) - paperRank(b));

  const parts = [];
  if (inch.length === 1) parts.push(`${inch[0]} in`);
  if (inch.length > 1) parts.push(`${inch[0]} to ${inch[inch.length - 1]} in`);
  if (other.length > 0) parts.push(other.join(' or '));
  return parts.join(', ');
};

const productType = (product) => PRODUCT_TYPES[product.category?.slug] || '';

// e.g. "The Sovereign canvas wall art from the Gaze of Power collection.
// Canvas: rolled or stretched, 12x18 to 36x60 in. Poster: sticker or soft board, A4 or A3."
export const productSummary = (product) => {
  const type = productType(product).toLowerCase();
  const collection = (product.subCategory || '').trim().replace(/^the\s+/i, '');
  const subject = [product.name, type].filter(Boolean).join(' ');
  // The brand is already in the title; name it here only when there's no
  // collection to anchor the sentence, which keeps most snippets under ~160.
  const lead = collection ? `${subject} from the ${collection} collection.` : `${subject} by GPSFDK.`;

  const byMaterial = new Map();
  for (const v of product.variations || []) {
    const material = (v.material || '').trim();
    const entry = byMaterial.get(material) || { frames: [], sizes: [] };
    entry.frames.push(v.frame);
    entry.sizes.push(v.size);
    byMaterial.set(material, entry);
  }

  const options = [...byMaterial].map(([material, { frames, sizes }]) => {
    const details = [uniq(frames).join(' or ').toLowerCase(), describeSizes(uniq(sizes))].filter(Boolean).join(', ');
    if (!details) return material ? `${material}.` : '';
    return `${material || 'Sizes'}: ${details}.`;
  });

  return [lead, ...options].filter(Boolean).join(' ');
};

export const productSeoTitle = (product) =>
  product.metaTitle?.trim() || `${[product.name, productType(product)].filter(Boolean).join(' ')} | GPSFDK`;

export const productSeoDescription = (product) => {
  if (product.metaDescription?.trim()) return product.metaDescription.trim();
  const plain = toPlainText(product.description);
  return plain ? truncate(plain, 160) : productSummary(product);
};

// JSON-LD takes the full description; only the meta tag needs trimming.
export const productSchemaDescription = (product) =>
  toPlainText(product.description) || product.metaDescription?.trim() || productSummary(product);
