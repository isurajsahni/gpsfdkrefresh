/**
 * The AR bits the click handler needs *synchronously*.
 *
 * Everything else about AR — the catalog, the launch — loads on demand, so the
 * product page doesn't carry it. These few things can't: `window.open` called
 * after an `await` is treated as a popup rather than a click, and Safari drops
 * the user gesture that Quick Look requires. So the handler has to be able to
 * work out where it is sending the shopper without waiting for anything.
 *
 * With VITE_AR_CATALOG_URL unset every helper here resolves to "no AR" and the
 * button never renders.
 */

const RAW = (import.meta.env.VITE_AR_CATALOG_URL || '').trim();

/** Whether AR is configured at all. Vite inlines this at build time. */
export const AR_ENABLED = Boolean(RAW);

/** Models sit in the same folder as catalog.json. */
export const AR_MODEL_BASE = RAW.replace(/catalog\.json.*$/, '');

/** Origin of the standalone viewer — the deep-link target. */
export const AR_SITE_BASE = RAW.replace(/\/models\/catalog\.json.*$/, '').replace(/\/+$/, '');

/**
 * Size labels arrive as "12x18" from the store and sometimes "12×18" from the
 * catalog; materials carry stray casing and whitespace (" Canvas"). Fold all of
 * that away before comparing.
 */
export const norm = (s) => (s || '').toLowerCase().replace(/×/g, 'x').replace(/\s+/g, '');

/** 'ios' | 'android' | 'desktop' */
export function detectArPlatform() {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  // iPadOS 13+ reports a Macintosh UA, so touch points are what separate an
  // iPad from a desktop Mac.
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

/**
 * Deep link into the standalone viewer, landing on this exact artwork, format
 * and size. The viewer matches `art` with a case-sensitive `===` against the
 * catalog id, so the slug must be passed through untouched.
 */
export function arViewerDeepLink(slug, format, sizeLabel, { autoLaunch = false } = {}) {
  const q = [
    `art=${encodeURIComponent(slug)}`,
    format ? `format=${encodeURIComponent(format)}` : '',
    sizeLabel ? `size=${encodeURIComponent(sizeLabel)}` : '',
    // ar=1 tells the viewer to hide its browsing UI and go straight into AR.
    // Only ever sent to a phone: on a desktop it would strip the page down
    // and then fail, because there is no AR to launch.
    autoLaunch ? 'ar=1' : '',
  ].filter(Boolean).join('&');
  return `${AR_SITE_BASE}/?${q}`;
}
