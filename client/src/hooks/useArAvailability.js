/**
 * Decides whether this product, in the variation the shopper has selected,
 * can be seen in AR — and launches it.
 *
 * Availability comes from a small generated manifest rather than the AR
 * catalog itself, so a product page costs no third-party request. The catalog
 * is only fetched on iOS, where Quick Look needs the .usdz filename, and only
 * once the shopper has started a tap.
 *
 * The match is deliberately exact. resolveArSelection falls back to size index
 * 0 — which is 12x18 — so accepting a near miss would hang a small portrait
 * canvas on the wall for someone buying a 48x48 square.
 *
 * `launch` runs start to finish synchronously. Safari only honours Quick Look
 * while the user gesture is live, and a desktop `window.open` that happens
 * after an await is treated as a popup and blocked. That is why arLink and
 * arLaunch are imported statically (a few hundred bytes between them) while
 * the manifest and the catalog — the parts with real weight — are not.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AR_ENABLED, arViewerDeepLink, detectArPlatform, norm } from '../utils/arLink';
import { launchAr } from '../utils/arLaunch';

export default function useArAvailability(slug, selectedVariation) {
  const [manifest, setManifest] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);
  // The catalog, once iOS has had reason to fetch it. A ref, not state,
  // because the click handler must read it without waiting for a render.
  const catalog = useRef(null);

  useEffect(() => {
    if (!AR_ENABLED) return undefined;
    let alive = true;
    import('../data/arManifest.generated')
      .then((m) => alive && setManifest(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /** { format, label } when AR can show exactly this variation, else null. */
  const arTarget = useMemo(() => {
    if (!manifest || !slug) return null;
    const family = manifest.FAMILIES[manifest.SLUGS[slug]];
    if (!family) return null;

    const material = norm(selectedVariation?.material);
    const format = material.includes('canvas') ? 'canvas'
      : material.includes('poster') ? 'poster'
        : null;
    if (!format) return null;

    const wanted = norm(selectedVariation?.size);
    const label = (family[format] || []).find((l) => norm(l) === wanted);
    return label ? { format, label } : null;
  }, [manifest, slug, selectedVariation?.material, selectedVariation?.size]);

  // Two targets for the same selection: the browsable 3D viewer for desktop,
  // and the same page told to open AR immediately for phones.
  const viewerUrl = arTarget ? arViewerDeepLink(slug, arTarget.format, arTarget.label) : '';
  const arUrl = arTarget
    ? arViewerDeepLink(slug, arTarget.format, arTarget.label, { autoLaunch: true })
    : '';

  /**
   * iOS only: start pulling the catalog as the finger goes down, so the click
   * itself never has to wait. If it hasn't arrived in time the tap falls
   * through to the viewer page rather than doing nothing.
   */
  const prefetch = useCallback(() => {
    if (!arTarget || catalog.current || detectArPlatform() !== 'ios') return;
    import('../utils/arCatalog')
      .then((cat) => cat.getArCatalog().then((artworks) => {
        catalog.current = { artworks, cat };
      }))
      .catch(() => {});
  }, [arTarget]);

  const launch = useCallback(() => {
    if (!arTarget) return;

    const ready = catalog.current;
    let usdz = '';
    if (ready) {
      const artwork = ready.cat.findArArtwork(ready.artworks, slug);
      const urls = artwork
        ? ready.cat.getArModelUrls(artwork, selectedVariation?.material, selectedVariation?.size)
        : null;
      // A non-exact hit means the manifest has drifted from the catalog. Send
      // them to the viewer rather than show the wrong size.
      if (urls?.exact) usdz = urls.usdz;
      else if (urls) console.warn('[ar] manifest drift:', slug, selectedVariation?.size);
    }

    // Desktop opens a new tab and this page stays put, so there is nothing to
    // wait for and nothing to reset the button. Only the handoffs that leave
    // the page (Quick Look, the viewer on Android) get the pending state.
    if (detectArPlatform() !== 'desktop') setIsLaunching(true);
    launchAr({ usdz, viewerUrl, arUrl });
  }, [arTarget, viewerUrl, arUrl, slug, selectedVariation?.material, selectedVariation?.size]);

  // Quick Look returns to this very page, so the button has to stop spinning
  // when the shopper comes back. Navigations away unmount it anyway.
  useEffect(() => {
    if (!isLaunching) return undefined;
    const done = () => setIsLaunching(false);
    window.addEventListener('pageshow', done);
    document.addEventListener('visibilitychange', done);
    // If the handoff never happens — no ARCore, a declined prompt — don't
    // leave the button stuck.
    const giveUp = setTimeout(done, 10000);
    return () => {
      clearTimeout(giveUp);
      window.removeEventListener('pageshow', done);
      document.removeEventListener('visibilitychange', done);
    };
  }, [isLaunching]);

  return { arTarget, isLaunching, prefetch, launch };
}
