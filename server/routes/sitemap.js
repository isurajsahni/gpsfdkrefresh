const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Blog slugs come from the client's blog registry when it's deployed alongside
// the server, else from a fallback list (see utils/blogRegistry.js).
const { blogPosts } = require('../utils/blogRegistry');
const { COLLECTIONS, collectionSlug } = require('../data/collections');

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
      Product.find({ isActive: true }).select('slug updatedAt images category subCategory').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean()
    ]);

    // An empty category page is a soft 404 (the client marks it noindex), so
    // only list categories that currently have active products.
    const stockedCategoryIds = new Set(products.map((p) => String(p.category)));

    // Static pages. '/' is the homepage's canonical URL (with its slash).
    const staticPages = [
      '/',
      '/blog',
      '/about',
      '/ceo',
      '/vision',
      '/support',
      // Two separate pages: /consultancy is the services pitch (it used to be
      // served at /contact), /contact is general contact.
      '/consultancy',
      '/contact',
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
    <priority>${page === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Add categories. Wall Canvas's landing page is /canvas; /wall-canvas
    // only 301s there, and a sitemap should list the final URL.
    categories.filter((category) => stockedCategoryIds.has(String(category._id))).forEach((category) => {
      const path = category.slug === 'wall-canvas' ? '/canvas' : `/${category.slug}`;
      xml += `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${category.updatedAt ? category.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    // Add canvas collections (/wall-canvas/<collection>) that have active
    // products: the listing CategoryPage shows for each, matched the same way
    // as its API request (wall-canvas category, exact subCategory). An empty
    // one is noindex, so it's left out.
    const wallCanvas = categories.find((category) => category.slug === 'wall-canvas');
    COLLECTIONS.forEach((name) => {
      const inCollection = wallCanvas
        ? products.filter((p) => String(p.category) === String(wallCanvas._id) && p.subCategory === name)
        : [];
      if (inCollection.length === 0) return;
      const lastmod = new Date(Math.max(...inCollection.map((p) => new Date(p.updatedAt || 0).getTime())));
      xml += `
  <url>
    <loc>${baseUrl}/wall-canvas/${collectionSlug(name)}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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

    // Add blogs (lastmod and the cover image when the client registry is
    // deployed alongside the server; see utils/blogRegistry.js)
    blogPosts.forEach((post) => {
      xml += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>${/^\d{4}-\d{2}-\d{2}$/.test(post.date) ? `
    <lastmod>${post.date}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${post.image ? `
    <image:image>
      <image:loc>${escXml(post.image)}</image:loc>
    </image:image>` : ''}
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
