import { cachedGet } from './api';
import { COLLECTIONS, ALL_PRODUCTS_SLUG, collectionPath, lowestPrice } from './collections';
import { toPlainText } from './productSeo';

/*
 * Site search runs in the browser over the whole catalogue. It is small
 * (~125 products, ~25 KB gzipped), so it's fetched once per visit and every
 * keystroke is answered instantly instead of waiting a second on the API.
 * Fuse gives typo and partial matching ("ganesh" → Ganesha, "sentinal" →
 * The Sentinel); plurals are handled by also trying the singular. Fuse itself
 * is only downloaded when search is first opened.
 */

const CATEGORY_ENTRIES = [
  { name: 'Canvas', keywords: 'canvas wall art prints paintings decor', path: '/canvas' },
  { name: 'House Nameplates', keywords: 'nameplate name plate house door home', path: '/house-nameplates' },
  { name: 'Custom Canvas', keywords: 'custom photo upload personalised personalized gift', path: '/customize-canvas' },
];

const COLLECTION_ENTRIES = [
  { name: 'All Canvas Wall Art', keywords: 'all canvas', path: `/wall-canvas/${ALL_PRODUCTS_SLUG}` },
  ...COLLECTIONS.map((name) => ({ name, keywords: '', path: collectionPath(name) })),
];

// Results scoring worse than this (0 = exact, 1 = anything) are noise
const MAX_SCORE = 0.5;

const toDoc = (product) => ({
  id: product._id,
  slug: product.slug,
  name: product.name,
  collection: product.subCategory || '',
  category: product.category?.name || '',
  tags: product.tags || [],
  description: toPlainText(product.description).slice(0, 400),
  image: product.images?.[0]?.url || '',
  price: lowestPrice(product),
  featured: Boolean(product.featured),
  product, // the full record, for the results page's product cards
});

export const buildSearchIndex = (products, Fuse) => {
  const docs = products.map(toDoc);
  return {
    docs,
    // Every field, weighted towards the name and collection
    products: new Fuse(docs, {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'collection', weight: 2 },
        { name: 'tags', weight: 2 },
        { name: 'category', weight: 1.5 },
        { name: 'description', weight: 0.5 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 2,
    }),
    // Names alone, more forgiving: catches misspellings without letting the
    // long descriptions match everything
    names: new Fuse(docs, { keys: ['name'], threshold: 0.4, ignoreLocation: true, ignoreFieldNorm: true, includeScore: true }),
    groups: new Fuse([...CATEGORY_ENTRIES, ...COLLECTION_ENTRIES], {
      keys: [{ name: 'name', weight: 2 }, { name: 'keywords', weight: 1 }],
      threshold: 0.35,
      ignoreLocation: true,
      includeScore: true,
    }),
  };
};

// The query as typed, plus its singular ("lions" → "lion")
const queryVariants = (query) => {
  const variants = [query];
  if (query.length > 3 && /s$/i.test(query)) variants.push(query.replace(/(es|s)$/i, ''));
  return variants;
};

/**
 * @returns {{ products: object[], collections: object[], categories: object[] }}
 *   products are search docs ({ slug, name, collection, image, price, … }),
 *   best match first; collections/categories are { name, path }.
 */
export const searchCatalogue = (index, rawQuery) => {
  const query = rawQuery.trim();
  if (!index || query.length < 2) return { products: [], collections: [], categories: [] };

  const best = new Map(); // doc index -> score
  const keep = (hit, maxScore) => {
    if (hit.score > maxScore) return;
    const current = best.get(hit.refIndex);
    if (current === undefined || hit.score < current) best.set(hit.refIndex, hit.score);
  };
  const groupHits = new Map();
  for (const variant of queryVariants(query)) {
    index.products.search(variant).forEach((hit) => keep(hit, MAX_SCORE));
    index.names.search(variant).forEach((hit) => keep(hit, 0.35));
    index.groups.search(variant).forEach((hit) => {
      if (hit.score <= MAX_SCORE && !groupHits.has(hit.item.path)) groupHits.set(hit.item.path, hit.item);
    });
  }

  const products = [...best.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([i]) => index.docs[i]);
  const groups = [...groupHits.values()];
  return {
    products,
    collections: groups.filter((g) => COLLECTION_ENTRIES.includes(g)),
    categories: groups.filter((g) => CATEGORY_ENTRIES.includes(g)),
  };
};

// Shown before anything is typed, and when nothing matches
export const popularProducts = (index, count = 4) => {
  if (!index) return [];
  const featured = index.docs.filter((d) => d.featured);
  return (featured.length >= count ? featured : index.docs).slice(0, count);
};

export const POPULAR_COLLECTIONS = COLLECTION_ENTRIES.filter((c) =>
  ['All Canvas Wall Art', 'The Botanical Muse', 'Ink & Interval', 'Millionaire Art'].includes(c.name)
);

export const SEARCH_CATEGORIES = CATEGORY_ENTRIES;

let indexPromise = null;

// The catalogue index, fetched once per visit and shared by every caller
export const loadSearchIndex = () => {
  if (!indexPromise) {
    indexPromise = Promise.all([
      cachedGet('/products', { params: { limit: 500 } }, 30 * 60 * 1000),
      import('fuse.js'),
    ])
      .then(([data, { default: Fuse }]) => buildSearchIndex(data.products || [], Fuse))
      .catch((err) => {
        indexPromise = null; // let the next open try again
        throw err;
      });
  }
  return indexPromise;
};
