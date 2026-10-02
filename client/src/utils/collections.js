import { CANVAS_PATH } from './categoryPath';

// The canvas collections, as stored in each product's subCategory. Mirrored
// on the server in server/data/collections.js (link previews) and in the admin
// product form — add a new collection in all three places.
export const COLLECTIONS = [
  'Ink & Interval', 'The Sassy Classic', 'Tethered Horizons', 'The Botanical Muse',
  'The Celestial Frontier', 'The Ethereal Gaze', 'The Gaze of Power',
  'The Modern Legend', 'The Gilded Bloom', 'The Velocity Suite',
  'Millionaire Art', 'Nostalgia Noir', 'The After Hour Suite', 'The Wild Eccentrics',
];

// Products per page on a collection / category listing (CategoryPage)
export const LISTING_PAGE_SIZE = 12;

// The /canvas page's "Find your art style" (one circle per collection) and,
// right under it, every canvas across the collections, best sellers first.
// That listing used to be a page of its own at /wall-canvas/all, which now
// redirects to it.
export const ART_STYLES_ID = 'art-styles';
export const ALL_CANVASES_ID = 'all-canvases';
export const ART_STYLES_PATH = `${CANVAS_PATH}#${ART_STYLES_ID}`;
export const ALL_CANVASES_PATH = `${CANVAS_PATH}#${ALL_CANVASES_ID}`;

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
