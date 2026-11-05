/**
 * AR catalog — which products have true-scale AR models, and which .glb/.usdz
 * matches the variation the shopper is looking at.
 *
 * The models live in a separate Vercel project (the AR repo), so everything
 * here is keyed off VITE_AR_CATALOG_URL via arLink.js. With that var unset the
 * helpers resolve to "no AR" and the button never renders.
 *
 * This module is only ever loaded on demand — the product page decides whether
 * to show the button from the generated manifest, which is a fraction of the
 * size. The catalog proper is fetched once, and only when a shopper is about to
 * launch AR on iOS, where the .usdz filename is actually needed.
 */

import { AR_MODEL_BASE, AR_ENABLED, norm } from './arLink';

const CATALOG_URL = (import.meta.env.VITE_AR_CATALOG_URL || '').trim();

let catalogPromise = null;

/**
 * The AR catalog's artworks, or [] if AR isn't configured / the fetch failed.
 * Never rejects — callers treat an empty catalog as "no AR for this product".
 */
export function getArCatalog() {
  if (!AR_ENABLED) return Promise.resolve([]);
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

/** The catalog entry for a product slug, or null if it has no AR models. */
export function findArArtwork(catalog, slug) {
  if (!slug) return null;
  return catalog.find((a) => a.id === slug) || null;
}

/**
 * Which product/size the viewer should open on. `format` is an AR catalog
 * product id — 'stretched', 'rolled' or 'poster' — already worked out from
 * the shopper's material and frame, because the two canvas finishes are
 * genuinely different objects: one is wrapped over a wooden frame, the other
 * is the bare printed sheet.
 *
 * `exact` says whether the size really matched. Callers must check it: the
 * fallback index is 0, which is 12x18, so a near-miss would quietly hang a
 * small portrait canvas on the wall for someone buying a 48x48 square.
 */
export function resolveArSelection(artwork, format, size) {
  const fmt = norm(format);
  const pi = artwork.products.findIndex((p) => norm(p.id) === fmt);
  const productIndex = pi >= 0 ? pi : 0;

  const sizes = artwork.products[productIndex]?.sizes ?? [];
  const want = norm(size);
  const si = sizes.findIndex((s) => norm(s.label) === want);

  return {
    productIndex,
    sizeIndex: si >= 0 ? si : 0,
    exact: si >= 0,
  };
}

/**
 * Absolute model URLs for the shopper's current selection — what the AR launch
 * hands to Quick Look (usdz) and the viewer (glb).
 */
export function getArModelUrls(artwork, format, size) {
  const { productIndex, sizeIndex, exact } = resolveArSelection(artwork, format, size);
  const prod = artwork.products[productIndex];
  const s = prod?.sizes?.[sizeIndex];
  if (!s) return null;
  return {
    glb: AR_MODEL_BASE + s.glb,
    usdz: AR_MODEL_BASE + s.usdz,
    format: prod.id,
    label: s.label,
    exact,
  };
}
