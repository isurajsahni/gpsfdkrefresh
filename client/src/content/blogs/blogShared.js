// Helpers shared by the blog pages (BlogList, BlogPost) and the build-time
// prerender (vite.blog.plugin.js), so the static HTML crawlers read and the
// page React renders carry the same headings, ids, dates and structured data.
// Plain JS with no browser or Vite-only imports: Node loads this file too.

export const SITE_URL = 'https://www.gpsfdk.com';
export const BLOG_URL = `${SITE_URL}/blog`;
export const RSS_URL = `${SITE_URL}/rss.xml`;
export const DEFAULT_AUTHOR = 'Suraj';

export const BLOG_LIST_TITLE = 'Wall Art & Canvas Blog: Decor Guides for Indian Homes | GPSFDK';
export const BLOG_LIST_DESCRIPTION =
  'Guides on choosing, sizing, hanging and caring for canvas prints, plus wall décor trends, Vaastu ideas and gifting inspiration for Indian homes.';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2024-12-15' → '15 Dec 2024'. Parsed by hand so Node and every browser
// print the same string (the prerendered and React pages must match).
export const formatDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

export const sortByDate = (posts) =>
  [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

// Every post's markdown opens with "# <title>". The page already renders the
// title as its <h1>, so drop it to keep one h1 per page.
export const stripLeadingTitle = (markdown = '') => markdown.replace(/^\s*#\s+[^\n]*\n+/, '');

export const wordCount = (markdown = '') =>
  markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

export const readingMinutes = (markdown) => Math.max(1, Math.round(wordCount(markdown) / 200));

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const plainText = (inline) =>
  inline
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();

// The ## and ### headings of a post's (title-stripped) markdown, each with a
// unique id and the 1-based source line react-markdown reports for it. The
// renderer looks headings up by line, so repeated heading text still gets
// distinct ids and the table of contents always points at the right one.
export const extractHeadings = (markdown = '') => {
  const seen = new Map();
  const headings = [];
  let inFence = false;
  markdown.split('\n').forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) return;
    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) return;
    const text = plainText(match[2]);
    const base = slugify(text) || 'section';
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    headings.push({ depth: match[1].length, text, id: count ? `${base}-${count + 1}` : base, line: index + 1 });
  });
  return headings;
};

// Unsplash serves any width and modern formats on request; the registry's
// URLs are fixed at w=800 (cards) and w=1400 (in-article), too big for a
// phone card and too small for a retina hero. Other hosts pass through.
export const blogImage = (url, width) => {
  if (!url || !url.includes('images.unsplash.com')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    u.searchParams.set('q', '75');
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
};

export const blogSrcSet = (url, widths) => {
  if (!url || !url.includes('images.unsplash.com')) return undefined;
  return widths.map((w) => `${blogImage(url, w)} ${w}w`).join(', ');
};

// "<title> | GPSFDK" when that still fits a results-page title (~60 chars);
// long titles go out alone rather than get cut off mid-word.
export const postSeoTitle = (title) => (title.length + 9 <= 60 ? `${title} | GPSFDK` : title);

export const postUrl = (slug) => `${BLOG_URL}/${slug}`;
export const topicPath = (category) => `/blog?topic=${encodeURIComponent(category)}`;

// Same-category posts first, newest first, then the newest of the rest.
export const relatedPosts = (posts, post, count = 3) => {
  const others = sortByDate(posts.filter((p) => p.slug !== post.slug));
  const same = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...same, ...rest].slice(0, count);
};

// [{ name, count }] by post count, largest first
export const topicsOf = (posts) => {
  const counts = new Map();
  posts.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

// The core buying guides, linked as a "start here" path from the blog index
export const START_HERE_SLUGS = [
  'what-is-gallery-wrapped-canvas',
  'wall-canvas-size-guide-living-room-layouts',
  'canvas-vs-framed-prints-best-investment',
  'how-to-hang-large-canvas-prints',
];

// ─── Structured data ───

const PUBLISHER = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'GPSFDK',
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-fav.webp`, width: 300, height: 300 },
};

const breadcrumb = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, item], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    ...(item ? { item } : {}),
  })),
});

const authorOf = (post) => ({ '@type': 'Person', name: post.author || DEFAULT_AUTHOR });

export const blogListSchema = (posts) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Blog',
      '@id': `${BLOG_URL}#blog`,
      name: 'The GPSFDK Blog',
      description: BLOG_LIST_DESCRIPTION,
      url: BLOG_URL,
      inLanguage: 'en-IN',
      publisher: PUBLISHER,
      blogPost: sortByDate(posts).map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        url: postUrl(post.slug),
        image: blogImage(post.image, 1200),
        datePublished: post.date,
        dateModified: post.updated || post.date,
        author: authorOf(post),
      })),
    },
    breadcrumb([
      ['Home', `${SITE_URL}/`],
      ['Blog', BLOG_URL],
    ]),
  ],
});

export const blogPostSchema = (post, markdown) => {
  const url = postUrl(post.slug);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        headline: post.title,
        description: post.excerpt,
        image: [blogImage(post.image, 1200)],
        datePublished: post.date,
        dateModified: post.updated || post.date,
        author: authorOf(post),
        publisher: PUBLISHER,
        articleSection: post.category,
        keywords: (post.keywords || []).join(', '),
        wordCount: wordCount(markdown),
        inLanguage: 'en-IN',
        url,
        isPartOf: { '@id': `${BLOG_URL}#blog` },
      },
      breadcrumb([
        ['Home', `${SITE_URL}/`],
        ['Blog', BLOG_URL],
        [post.title, url],
      ]),
    ],
  };
};

// ─── Shared class strings ───
// Used by both the React pages and the static HTML, so the swap from the
// prerendered snapshot to the live page doesn't shift anything.

export const PROSE_CLASSES = [
  'blog-prose prose prose-lg max-w-none text-kind-ink/80',
  'prose-headings:font-heading prose-headings:text-kind-ink prose-headings:font-semibold prose-headings:tracking-tight',
  'prose-h2:text-[26px] sm:prose-h2:text-[30px] prose-h2:leading-tight prose-h2:mt-14 prose-h2:mb-4 prose-h2:scroll-mt-28',
  'prose-h3:text-[20px] sm:prose-h3:text-[22px] prose-h3:mt-9 prose-h3:mb-3 prose-h3:scroll-mt-28',
  'prose-p:leading-[1.75] prose-li:leading-[1.7] prose-li:my-1 prose-li:marker:text-kind-forest',
  'prose-strong:text-kind-ink prose-strong:font-semibold',
  'prose-blockquote:border-l-kind-lime prose-blockquote:bg-kind-mist/60 prose-blockquote:rounded-r-2xl prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-kind-ink',
  'prose-img:rounded-[20px] prose-img:w-full prose-img:my-8',
  'prose-hr:border-kind-forest/10',
  'prose-table:my-0 prose-table:text-[15px] prose-th:bg-kind-forest prose-th:text-white prose-th:px-4 prose-th:py-3 prose-th:font-semibold prose-th:text-left',
  'prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-kind-forest/10',
].join(' ');

export const TABLE_WRAP_CLASSES = 'my-8 overflow-x-auto rounded-2xl border border-kind-forest/10 [&>table]:!m-0';
