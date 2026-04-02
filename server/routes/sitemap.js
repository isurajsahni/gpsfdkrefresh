const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Hardcoded blog slugs from client/src/content/blogs/index.js
const blogSlugs = [
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
  'transforming-home-offices-wall-canvas'
];

router.get('/', async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'https://www.gpsfdk.com';

    // Fetch dynamic data
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean()
    ]);

    // Static pages
    const staticPages = [
      '',
      '/search',
      '/blog',
      '/about',
      '/ceo',
      '/contact',
      '/faq',
      '/shipping-policy',
      '/returns-refunds',
      '/privacy-policy',
      '/terms-conditions',
      '/location/delhi',
      '/location/mumbai',
      '/location/punjab',
      '/location/himachal-pradesh'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

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

    // Add products
    products.forEach((product) => {
      xml += `
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
