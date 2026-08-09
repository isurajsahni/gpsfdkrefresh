/**
 * AR catalog — which products have true-scale AR models, and which .glb/.usdz
 * matches the variation the shopper is looking at.
 *
 * The models live in a separate Vercel project (the AR repo), so everything
 * here is keyed off VITE_AR_CATALOG_URL. With that var unset the helpers
 * resolve to "no AR", and product pages fall back to the 2D camera overlay.
 *
 * The catalog is a single ~100 KB JSON shared by every product page, so the
 * request is cached module-wide rather than refetched per mount.
 */

const CATALOG_URL = import.meta.env.VITE_AR_CATALOG_URL || '';

/** Models are served from the same folder as catalog.json. */
export const AR_MODEL_BASE = CATALOG_URL.replace(/catalog\.json.*$/, '');

let catalogPromise = null;

/**
 * The AR catalog's artworks, or [] if AR isn't configured / the fetch failed.
 * Never rejects — callers treat an empty catalog as "no AR for this product".
 */
export function getArCatalog() {
  if (!CATALOG_URL) return Promise.resolve([]);
  if (!catalogPromise) {
    catalogPromise = fetch(CATALOG_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`AR catalog ${r.status}`);
        return r.json();
      })
      .then((d) => d.artworks ?? [])
      .catch(() => {
        // Drop the cached rejection so a later page view can retry.
        catalogPromise = null;
        return [];
      });
  }
  return catalogPromise;
}

// Size labels arrive as "12x18" (store) and occasionally "12×18" with a
// multiplication sign (catalog). Materials come off the store with stray
// casing/whitespace (" Canvas"), so fold all of that away before comparing.
const norm = (s) => (s || '').toLowerCase().replace(/×/g, 'x').replace(/\s+/g, '');

/** The catalog entry for a product slug, or null if it has no AR models. */
export function findArArtwork(catalog, slug) {
  if (!slug) return null;
  return catalog.find((a) => a.id === slug) || null;
}

/**
 * Which format/size the viewer should open on, given the variation the shopper
 * selected on the product page.
 *
 * The store's sizes line up with the AR set for every current product, but an
 * unmatched size falls back to the format's first size rather than failing —
 * AR that opens on the wrong size still beats no AR at all.
 */
export function resolveArSelection(artwork, material, size) {
  const fmt = norm(material);
  const pi = artwork.products.findIndex((p) => norm(p.id) === fmt || norm(p.name) === fmt);
  const productIndex = pi >= 0 ? pi : 0;

  const sizes = artwork.products[productIndex]?.sizes ?? [];
  const want = norm(size);
  const si = sizes.findIndex((s) => norm(s.label) === want);

  return {
    productIndex,
    sizeIndex: si >= 0 ? si : 0,
    // Whether AR is showing the exact size the shopper picked.
    exact: si >= 0,
  };
}
