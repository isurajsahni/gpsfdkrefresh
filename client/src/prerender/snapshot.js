// A page rendered ahead of time (the build's prerender, or api/render.js)
// ships a static copy of its content in #seo-static, shown until React has
// rendered the live page. SEO.jsx calls this when a page renders its <SEO>,
// which pages do along with their content; a page that can't show its content
// (a failed load) calls it too, so the copy's lifeless buttons don't linger.
export const dropStaticSnapshot = () => {
  const snapshot = document.getElementById('seo-static');
  if (!snapshot) return;
  snapshot.remove();
  // A link to a #section scrolled to that heading inside the copy; scroll to
  // the live page's
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (id) document.getElementById(id)?.scrollIntoView();
};
