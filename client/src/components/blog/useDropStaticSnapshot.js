import { useLayoutEffect } from 'react';

// The build ships each blog page with a static copy of its content in
// #blog-static (see vite.blog.plugin.js) for crawlers and a fast first paint.
// Drop it before the browser paints the live page in its place.
const useDropStaticSnapshot = () => {
  useLayoutEffect(() => {
    const snapshot = document.getElementById('blog-static');
    if (!snapshot) return;
    snapshot.remove();
    // A link to /blog/<slug>#<section> scrolled to that heading inside the
    // snapshot; scroll to the live page's copy of it instead
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
};

export default useDropStaticSnapshot;
