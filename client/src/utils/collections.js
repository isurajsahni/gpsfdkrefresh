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

// One line on what each collection is, shown under its listing's heading and
// used as its meta description (CategoryPage). A collection missing here
// falls back to the category's own description.
export const COLLECTION_DESCRIPTIONS = {
  'Ink & Interval': 'Geometric and abstract canvas art with bold lines and balanced shapes, made for modern living rooms and offices.',
  'The Sassy Classic': 'Playful pop-art portraits on canvas, full of attitude and colour for living rooms, bedrooms and studios.',
  'Tethered Horizons': 'Earthy, layered abstract art in copper, slate, indigo and clay tones, for calm and warm interiors.',
  'The Botanical Muse': 'Painterly floral and botanical canvas art that brings softness and colour to bedrooms and living rooms.',
  'The Celestial Frontier': 'Cosmic canvas art of planets, nebulae and night skies, striking above a bed or across a feature wall.',
  'The Ethereal Gaze': 'Dreamy, mystical portrait canvases in rich, glowing colour for bedrooms and reading corners.',
  'The Gaze of Power': 'Bold portrait and animal canvases that project confidence, made for offices, cabins and living rooms.',
  'The Modern Legend': 'Urban cityscapes and architecture on canvas, for modern apartments and workspaces.',
  'The Gilded Bloom': 'Dark floral art with gold accents: moody, luxurious canvas wall art for bedrooms and dining rooms.',
  'The Velocity Suite': 'Supercar and motorsport canvas art for car lovers, garages, game rooms and offices.',
  'Millionaire Art': 'Motivational, luxury pop-art canvases about ambition and success, for offices and study rooms.',
  'Nostalgia Noir': 'Retro, noir-style canvas art with vintage drama, for lounges, bars and statement walls.',
  'The After Hour Suite': 'Cocktail and nightlife canvas art for home bars, lounges and entertaining spaces.',
  'The Wild Eccentrics': 'Quirky, fashion-forward animal portraits on canvas that bring personality to any room.',
};

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
