// The canvas collections, as stored in each product's subCategory. Mirrored
// on the server in server/data/collections.js (link previews) and in the admin
// product form — add a new collection in all three places.
export const COLLECTIONS = [
  'Ink & Interval', 'The Sassy Classic', 'Tethered Horizons', 'The Botanical Muse',
  'The Celestial Frontier', 'The Ethereal Gaze', 'The Gaze of Power',
  'The Modern Legend', 'The Gilded Bloom', 'The Velocity Suite',
  'Millionaire Art', 'Nostalgia Noir', 'The After Hour Suite', 'The Wild Eccentrics',
];

// /wall-canvas/all: every canvas across the collections, best sellers first.
export const ALL_PRODUCTS_SLUG = 'all';

// URL slug for a collection. Existing links depend on this exact rule,
// including "Ink & Interval" → "ink--interval".
export const collectionSlug = (text) =>
  text ? text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : '';

export const collectionPath = (name) => `/wall-canvas/${collectionSlug(name)}`;

// Lowest price a product sells at, across its variations
export const lowestPrice = (product) => {
  const prices = [product.basePrice, ...(product.variations || []).map((v) => v.price)]
    .filter((p) => typeof p === 'number' && p > 0);
  return prices.length > 0 ? Math.min(...prices) : (product.basePrice || 0);
};
