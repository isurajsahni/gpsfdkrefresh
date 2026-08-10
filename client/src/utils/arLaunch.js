/**
 * Launches the device's native AR viewer directly — no in-page 3D library.
 *
 * iOS opens Quick Look, Android opens Scene Viewer, and both hang the print on
 * a real wall at true size. Desktop has no AR, so it opens the standalone
 * viewer app instead (deep-linked to the same artwork/format/size).
 *
 * Going native rather than embedding model-viewer means product pages don't
 * ship a 3D engine or preload a ~3 MB model just in case someone taps the
 * button, and the site's CSP doesn't need a third-party script origin.
 */

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

/** Android Scene Viewer intent, falling back to the web viewer without ARCore. */
export function sceneViewerUrl(glb, title, fallbackUrl) {
  const params = [
    `file=${encodeURIComponent(glb)}`,
    'mode=ar_preferred',
    title ? `title=${encodeURIComponent(title)}` : '',
  ].filter(Boolean).join('&');

  return (
    `intent://arvr.google.com/scene-viewer/1.0?${params}` +
    '#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;' +
    `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end;`
  );
}

/**
 * Safari only recognises an AR link as Quick Look when the anchor carries
 * rel="ar" and wraps an <img>. Building and clicking it inside the original
 * tap keeps the user gesture, which Safari requires.
 */
function openQuickLook(usdz) {
  const a = document.createElement('a');
  a.setAttribute('rel', 'ar');
  a.appendChild(document.createElement('img'));
  a.href = usdz;
  a.click();
}

/**
 * Call from a click handler — the user gesture must still be active.
 * Returns the platform it launched for.
 */
export function launchAr({ glb, usdz, title, fallbackUrl }) {
  const platform = detectArPlatform();

  if (platform === 'ios') {
    openQuickLook(usdz);
  } else if (platform === 'android') {
    window.location.href = sceneViewerUrl(glb, title, fallbackUrl);
  } else {
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  }

  return platform;
}
