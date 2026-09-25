const fs = require('fs');
const path = require('path');

// The blog posts live in the client (client/src/content/blogs/index.js). When
// the client folder is deployed alongside the server, read the real titles,
// excerpts and images from it; otherwise fall back to this slug list, which
// must mirror that registry.
const FALLBACK_BLOG_SLUGS = [
  'ultimate-guide-wall-canvas-living-room',
  'photo-to-canvas-memories-gallery-art',
  'what-is-gallery-wrapped-canvas',
  'aesthetic-wall-art-trends-indian-homes',
  'canvas-vs-framed-prints-best-investment',
  'how-to-hang-large-canvas-prints',
  'cleaning-maintaining-canvas-wall-decor',
  'styling-bedroom-modern-canvas-art',
  'custom-canvas-prints-anniversary-gift',
  'split-canvas-prints-multi-panel-display',
  'eco-friendly-sustainable-canvas-prints-india',
  'transforming-home-offices-wall-canvas',
  'buyer-guide-museum-grade-canvas-worth-it',
  'wall-canvas-size-guide-living-room-layouts',
  'vaastu-wall-art-canvas-painting-ideas-positive-energy',
  'luxury-wall-decor-trends-2026-japandi-abstract',
  'why-uv-resistant-canvas-prints-matter-india',
];

// A single-quoted JS string literal, allowing escaped quotes inside
const STR = "'((?:[^'\\\\]|\\\\.)*)'";
const unescape = (value) => value.replace(/\\(.)/g, '$1');

const readClientRegistry = () => {
  try {
    const registryPath = path.resolve(__dirname, '..', '..', 'client', 'src', 'content', 'blogs', 'index.js');
    const source = fs.readFileSync(registryPath, 'utf8');
    // Each entry is `{ slug, title, excerpt, …, image, … }`; split on `slug:`
    // so one entry's fields can never be read into another's. Each chunk
    // starts with the slug's value.
    const posts = source.split(/\n\s*slug:/).slice(1).map((chunk) => {
      const read = (pattern) => {
        const match = new RegExp(pattern).exec(chunk);
        return match ? unescape(match[1]) : '';
      };
      const field = (name) => read(`\\n\\s*${name}:\\s*${STR}`);
      return { slug: read(`^\\s*${STR}`), title: field('title'), excerpt: field('excerpt'), image: field('image') };
    }).filter((post) => post.slug);
    if (posts.length > 0) return posts;
  } catch {
    // Client folder not deployed alongside the server
  }
  return null;
};

const registry = readClientRegistry();

// [{ slug, title, excerpt, image }]. Title/excerpt/image are empty strings
// when only the fallback slug list is available.
const blogPosts = registry || FALLBACK_BLOG_SLUGS.map((slug) => ({ slug, title: '', excerpt: '', image: '' }));

module.exports = { blogPosts, hasBlogDetails: Boolean(registry) };
