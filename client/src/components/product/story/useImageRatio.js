import { useEffect, useState } from 'react';

/* Width ÷ height of an image, once it has loaded (null until then). The story
   draws the artwork at its own proportions and hangs it portrait or landscape
   to match. The browser caches the file, so the <img> tags showing the same
   URL don't download it again.

   The story is well below the fold, so the probe waits for the browser to go
   idle: it mustn't compete with the buy box's main image for bandwidth. */
export default function useImageRatio(url) {
  const [loaded, setLoaded] = useState({ url: '', ratio: null });

  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive && img.naturalWidth && img.naturalHeight) {
        setLoaded({ url, ratio: img.naturalWidth / img.naturalHeight });
      }
    };
    const load = () => {
      img.src = url;
    };
    const idle = typeof window.requestIdleCallback === 'function';
    const handle = idle ? window.requestIdleCallback(load, { timeout: 2500 }) : window.setTimeout(load, 1200);
    return () => {
      alive = false;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [url]);

  // Keyed by URL so a previous product's ratio is never reported for this one
  return loaded.url === url ? loaded.ratio : null;
}
