const Product = require('../models/Product');

/**
 * Trusted catalogue context for the AI assistant.
 *
 * The assistant used to carry a hand-written "knowledge base" in its system
 * prompt, which listed collections that do not exist (Cinema / Abstract /
 * Botanical / Minimal) and no real products, prices or stock — so it had no way
 * to answer a product question except by inventing one.
 *
 * This module is the single source of truth instead: it reads the SAME product
 * documents the storefront renders, and hands the model a compact, factual
 * slice of them. Anything absent from that slice is something the assistant is
 * instructed to decline rather than guess.
 *
 * READ-ONLY by construction — `find().select().lean()`. No writes, no schema
 * change, no new indexes.
 */

// One DB read per window, not per chat message. Chat is rate-limited to 20
// req/15 min per IP, but a burst of conversations would otherwise hit Mongo on
// every turn for data that changes rarely.
const CACHE_TTL_MS = 5 * 60 * 1000;

// Keep the injected context small — it is prepended to every Gemini call, so it
// is paid for on each request.
const MAX_MATCHED_PRODUCTS = 5;
const MAX_SIZES_LISTED = 8;

let cache = { at: 0, data: null };

const clean = (s) => String(s || '').trim();

async function loadCatalog() {
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const docs = await Product.find({ isActive: true })
    .select('name subCategory slug variations.size variations.price variations.stock variations.material variations.frame')
    .lean();

  const collections = [...new Set(docs.map((d) => clean(d.subCategory)).filter(Boolean))].sort();
  const sizes = [...new Set(docs.flatMap((d) => (d.variations || []).map((v) => clean(v.size))).filter(Boolean))];
  const materials = [...new Set(docs.flatMap((d) => (d.variations || []).map((v) => clean(v.material))).filter(Boolean))].sort();
  const frames = [...new Set(docs.flatMap((d) => (d.variations || []).map((v) => clean(v.frame))).filter(Boolean))].sort();

  cache = { at: Date.now(), data: { products: docs, collections, sizes, materials, frames } };
  return cache.data;
}

/** Score products against the shopper's question; only positive scores are returned. */
function findRelevant(message, products) {
  const q = String(message || '').toLowerCase();
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 3);

  const scored = [];
  for (const p of products) {
    const name = clean(p.name).toLowerCase();
    const sub = clean(p.subCategory).toLowerCase();
    if (!name) continue;

    let score = 0;
    if (name && q.includes(name)) score += 20;          // full product name quoted
    if (sub && q.includes(sub)) score += 10;            // asked about a collection
    for (const t of tokens) {
      if (name.includes(t)) score += 3;
      else if (sub.includes(t)) score += 1;
    }
    if (score > 0) scored.push({ p, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_MATCHED_PRODUCTS).map((s) => s.p);
}

function describeProduct(p) {
  const vars = (p.variations || []).filter((v) => typeof v.price === 'number');
  if (!vars.length) {
    return `- "${clean(p.name)}" (${clean(p.subCategory) || 'uncategorised'}) — no pricing recorded; direct the customer to the product page.`;
  }

  const prices = vars.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const priceText = min === max ? `₹${min}` : `₹${min}–₹${max}`;

  const available = vars.filter((v) => Number(v.stock) > 0).map((v) => clean(v.size)).filter(Boolean);
  const uniqueAvailable = [...new Set(available)];
  let stockText;
  if (!uniqueAvailable.length) {
    stockText = 'no sizes currently showing stock';
  } else if (uniqueAvailable.length === new Set(vars.map((v) => clean(v.size))).size) {
    stockText = 'all sizes currently showing stock';
  } else {
    stockText = `currently showing stock in: ${uniqueAvailable.slice(0, MAX_SIZES_LISTED).join(', ')}`;
  }

  return `- "${clean(p.name)}" (${clean(p.subCategory) || 'uncategorised'}) — ${priceText} across ${vars.length} options; ${stockText}.`;
}

/**
 * Build the context block injected ahead of the shopper's question.
 * Returns null if the catalogue cannot be read — the caller's prompt already
 * tells the model to stay general when no context is present, so chat still
 * works rather than erroring.
 */
async function buildCatalogContext(message) {
  try {
    const { products, collections, sizes, materials, frames } = await loadCatalog();
    const matched = findRelevant(message, products);

    const lines = [
      'VERIFIED CATALOG CONTEXT (live store data — the only trusted source for product facts)',
      `Collections (${collections.length}): ${collections.join('; ')}`,
      `Sizes available: ${sizes.join(', ')}`,
      `Materials: ${materials.join(', ')} | Framing: ${frames.join(', ')}`,
      `Total active artworks: ${products.length}`,
    ];

    if (matched.length) {
      lines.push('', 'Products matching this question:', ...matched.map(describeProduct));
    } else {
      lines.push('', 'No specific product in the catalogue matches this question.');
    }

    lines.push(
      '',
      'Prices above are base catalogue prices in INR. The product page shows the current price for the customer’s region, and stock can change at any time.'
    );

    return lines.join('\n');
  } catch (err) {
    console.error('[Chat] catalogue context unavailable:', err.message);
    return null;
  }
}

module.exports = { buildCatalogContext, loadCatalog, findRelevant };
