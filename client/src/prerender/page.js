// Assembles the HTML for a page rendered by render.jsx: the app's shell
// (index.html as built, with its scripts) plus that page's head tags and a
// static copy of its content. Shared by vite.prerender.plugin.js (build time)
// and api/render.js (per request). Plain string work, no browser APIs.

const ROOT_DIV = '<div id="root"></div>';

export const esc = (value = '') =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// index.html's homepage defaults for crawlers (title, description, Open Graph)
const stripStaticSeo = (html) =>
  html.replace(/\s*<title data-static-seo>[^<]*<\/title>/, '').replace(/\s*<meta [^>]*data-static-seo[^>]*>/g, '');

// The page's own head tags, marked so SEO.jsx drops them once React has
// rendered its own
const markStatic = (head) => head.replace(/<(title|meta|link)\b/g, '<$1 data-static-seo');

// A video in the static copy would start downloading, then download again
// when React renders the page (mp4s are served no-store), so it shows its
// poster and waits
const quietVideos = (body) =>
  body.replace(
    /<video\b([^>]*)>/g,
    (_, attrs) => `<video${attrs.replace(/\s(autoplay|preload)(="[^"]*")?/gi, '')} preload="none">`,
  );

// shell: the built index.html. path: the page's URL path. { head, body }: from
// render.jsx's render().
export const buildPage = (shell, path, { head, body }) => {
  if (!head.includes('<title') || !head.includes('rel="canonical"')) {
    throw new Error(`prerender: ${path} rendered without a <title> or canonical`);
  }
  const page = stripStaticSeo(shell);
  if (/<[a-z][^>]*\sdata-static-seo/.test(page)) throw new Error('prerender: the shell has a data-static-seo tag that cannot be stripped');
  if (!page.includes(ROOT_DIV)) throw new Error(`prerender: ${ROOT_DIV} not found in the shell`);
  return page
    .replace('</head>', `${markStatic(head)}\n  </head>`)
    .replace(ROOT_DIV, `<div id="seo-static" data-path="${esc(path)}">${quietVideos(body)}</div>\n    ${ROOT_DIV}`);
};

// The app marked noindex, for URLs that don't exist
export const notFoundPage = (shell) => {
  const page = shell.replace(
    /<title data-static-seo>[^<]*<\/title>/,
    '<title data-static-seo>Page Not Found | GPSFDK</title>\n    <meta name="robots" content="noindex" data-static-seo />',
  );
  if (page === shell) throw new Error('prerender: <title data-static-seo> not found in the shell');
  return page;
};
