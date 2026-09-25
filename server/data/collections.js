// The canvas collections, as stored in Product.subCategory. Mirrors
// SUBCATEGORIES in client/src/pages/CategoryPage.jsx and the admin product
// form's subcategory list — add a new collection in all three places.
const COLLECTIONS = [
  'Ink & Interval', 'The Sassy Classic', 'Tethered Horizons', 'The Botanical Muse',
  'The Celestial Frontier', 'The Ethereal Gaze', 'The Gaze of Power',
  'The Modern Legend', 'The Gilded Bloom', 'The Velocity Suite',
  'Millionaire Art', 'Nostalgia Noir', 'The After Hour Suite', 'The Wild Eccentrics',
];

// The URL slug the client uses for a collection (/wall-canvas/<slug>). Same
// rule as CategoryPage's generateSlug, including its quirks: "Ink & Interval"
// becomes "ink--interval".
const collectionSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

const collectionBySlug = new Map(COLLECTIONS.map((name) => [collectionSlug(name), name]));

module.exports = { COLLECTIONS, collectionSlug, collectionBySlug };
