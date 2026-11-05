/**
 * Hands the shopper off to AR.
 *
 * iOS goes straight to Quick Look from this page — no tab, no wait. Android
 * and desktop go to the standalone viewer, deep-linked to the same artwork,
 * format and size.
 *
 * Android deliberately does NOT use a raw Scene Viewer intent. Scene Viewer
 * 1.0 has no wall-placement parameter, so it lays a canvas flat on the floor.
 * The viewer page runs <model-viewer ar-placement="wall" ar-scale="fixed">,
 * which prefers WebXR on ARCore devices and holds the print against the wall
 * at its true size — the whole point of the feature.
 *
 * Going native on iOS rather than embedding model-viewer here means product
 * pages don't ship a 3D engine or preload a model just in case someone taps.
 */

import { detectArPlatform } from './arLink';

/**
 * Safari only recognises an AR link as Quick Look when the anchor carries
 * rel="ar" and wraps an <img>. Building and clicking it inside the original
 * tap keeps the user gesture, which Safari requires.
 *
 * The <img> is a 1x1 transparent GIF rather than a real thumbnail: it is never
 * painted, and a remote one would drag the AR host into the page's img-src.
 */
const BLANK_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function openQuickLook(usdz) {
  const a = document.createElement('a');
  a.setAttribute('rel', 'ar');
  const img = document.createElement('img');
  img.src = BLANK_PIXEL;
  a.appendChild(img);
  a.href = usdz;
  a.click();
}

/**
 * Call from a click handler — the user gesture must still be active, so don't
 * await anything before this. Returns the platform it launched for.
 *
 * `usdz` may be absent (the catalog hasn't loaded yet); iOS then takes the
 * same viewer-page route as everyone else rather than doing nothing.
 */
export function launchAr({ usdz, fallbackUrl }) {
  const platform = detectArPlatform();

  if (platform === 'ios' && usdz) {
    openQuickLook(usdz);
    return platform;
  }

  if (platform === 'desktop') {
    const w = window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    // A blocked popup returns null; don't leave the tap doing nothing.
    if (!w) window.location.href = fallbackUrl;
    return platform;
  }

  window.location.href = fallbackUrl;
  return platform;
}
