const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Fallback blog slugs — complete list mirroring client/src/content/blogs/index.js.
// Used when the client folder isn't present (e.g. on the Render deployment,
// which only ships the server/ directory).
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
  'why-uv-resistant-canvas-prints-matter-india'
];

// At module load, try to extract slugs from the client blog registry so the
// sitemap stays in sync automatically in local/monorepo deployments.
const loadBlogSlugs = () => {
  try {
    const blogIndexPath = path.resolve(__dirname, '..', '..', 'client', 'src', 'content', 'blogs', 'index.js');
    const source = fs.readFileSync(blogIndexPath, 'utf8');
    const slugs = [];
    const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = slugRegex.exec(source)) !== null) {
      slugs.push(match[1]);
    }
    if (slugs.length > 0) return slugs;
  } catch (err) {
    // Client folder not deployed alongside server — expected on Render.
  }
  return FALLBACK_BLOG_SLUGS;
};

const blogSlugs = loadBlogSlugs();

// In-memory cache of the generated XML — sitemap data changes rarely, so skip
// the DB queries for an hour at a time.
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes
let cachedXml = null;
let cachedAt = 0;

router.get('/', async (req, res) => {
  try {
    if (cachedXml && Date.now() - cachedAt < CACHE_TTL_MS) {
      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600');
      return res.send(cachedXml);
    }

    const baseUrl = process.env.CLIENT_URL || 'https://www.gpsfdk.com';

    // Fetch dynamic data (images included so product entries can carry
    // <image:image> tags for Google Images indexing)
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt images').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean()
    ]);

    // Static pages
    const staticPages = [
      '',
      '/blog',
      '/about',
      '/ceo',
      // Renamed from /contact, which 301s here — a sitemap must list the
      // destination, never the redirect, or Search Console flags every hit.
      '/consultancy',
      '/faq',
      '/customize-canvas',
      '/premium-wall-canvas-india',
      '/shipping-policy',
      '/returns-refunds',
      '/privacy-policy',
      '/terms-conditions',
      '/location/delhi',
      '/location/mumbai',
      '/location/punjab',
      '/location/himachal-pradesh',
      '/location/bangalore',
      '/location/hyderabad',
      '/location/chennai',
      '/location/pune'
    ];

    // Escape XML-special characters for <loc> values (image URLs contain '&')
    const escXml = (value = '') =>
      String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    // Add static pages
    staticPages.forEach((page) => {
      xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Add categories
    categories.forEach((category) => {
      xml += `
  <url>
    <loc>${baseUrl}/${category.slug}</loc>
    <lastmod>${category.updatedAt ? category.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    // Add products (with first image for Google Images indexing)
    products.forEach((product) => {
      const imageUrl = product.images && product.images[0] && product.images[0].url;
      xml += `
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>${imageUrl ? `
    <image:image>
      <image:loc>${escXml(imageUrl)}</image:loc>
    </image:image>` : ''}
  </url>`;
    });

    // Add blogs
    blogSlugs.forEach((slug) => {
      xml += `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    xml += `\n</urlset>`;

    cachedXml = xml;
    cachedAt = Date.now();

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
