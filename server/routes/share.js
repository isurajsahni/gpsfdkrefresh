const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { collectionBySlug } = require('../data/collections');
const { SHARE_PAGES } = require('../data/sharePages');
const { blogPosts } = require('../utils/blogRegistry');

// Social-share preview endpoint.
//
// WhatsApp / Facebook / Twitter link scrapers do not execute JavaScript, so they
// never see the Open Graph tags the React SPA injects via react-helmet-async.
// vercel.json rewrites bot requests (matched by User-Agent) for product,
// collection, blog and fixed pages to the routes below, each of which returns a
// minimal HTML page whose only job is to carry correct OG/Twitter meta. Google is deliberately NOT routed here — it renders
// the real SPA, and serving it a meta-only page would be thin-content cloaking.

const SITE_URL = 'https://www.gpsfdk.com';

// Escape a value for safe injection into HTML attribute/text context
const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// 1200x630 social crop for Cloudinary-hosted images; other hosts pass through.
const shareImage = (url) => {
  if (!url) return `${SITE_URL}/graph.webp`;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/f_auto')) {
    const [head, tail] = url.split('/upload/');
    return `${head}/upload/c_fill,w_1200,h_630,g_auto,q_auto,f_auto/${tail}`;
  }
  return url;
};

const DEFAULT_DESCRIPTION = 'Premium wall canvas prints and custom house nameplates by GPSFDK.';

const renderShareHtml = ({ title, description, image, url, price, type = 'product' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="${esc(type)}" />
<meta property="og:site_name" content="GPSFDK" />
<meta property="og:locale" content="en_IN" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(title)}" />
${price ? `<meta property="product:price:amount" content="${esc(price)}" />
<meta property="product:price:currency" content="INR" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<meta http-equiv="refresh" content="0;url=${esc(url)}" />
</head>
<body>
<p>Redirecting to <a href="${esc(url)}">${esc(title)}</a>…</p>
</body>
</html>`;

router.get('/product/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .select('name slug metaTitle metaDescription description images basePrice')
      .lean();

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // description is admin-entered rich HTML — strip tags before using it as meta text
    const plainDescription = (product.metaDescription || product.description || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);

    const html = renderShareHtml({
      title: product.metaTitle || `${product.name} | GPSFDK`,
      description: plainDescription || DEFAULT_DESCRIPTION,
      image: shareImage(product.images && product.images[0] && product.images[0].url),
      url: `${SITE_URL}/product/${product.slug}`,
      price: product.basePrice,
    });

    res.header('Content-Type', 'text/html; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(html);
  } catch (error) {
    console.error('Share preview error:', error);
    // Fail open: redirect the scraper/visitor to the real page rather than erroring
    res.redirect(302, `${SITE_URL}/product/${encodeURIComponent(req.params.slug)}`);
  }
});

// Send a non-product preview; `null` meta means the page doesn't exist
const sendPage = (res, meta) => {
  if (!meta) return res.status(404).send('Page not found');
  res.header('Content-Type', 'text/html; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=3600');
  res.send(renderShareHtml({ type: 'website', ...meta }));
};

// On failure, send the scraper on to the real page rather than erroring
const failOpen = (res, path, error) => {
  console.error('Share preview error:', error);
  res.redirect(302, `${SITE_URL}${path}`);
};

// First image of the newest active product matching `filter`
const firstProductImage = async (filter) => {
  const product = await Product.findOne({ isActive: true, 'images.0': { $exists: true }, ...filter })
    .sort({ featured: -1, createdAt: -1 })
    .select('images')
    .lean();
  return product?.images?.[0]?.url;
};

// /wall-canvas/:slug — a canvas collection, or "all"
router.get('/collection/:slug', async (req, res) => {
  const { slug } = req.params;
  const path = `/wall-canvas/${slug}`;
  try {
    const isAll = slug === 'all';
    const name = isAll ? 'All Canvas Wall Art' : collectionBySlug.get(slug);
    if (!name) return sendPage(res, null);

    const wallCanvas = await Category.findOne({ slug: 'wall-canvas' }).select('_id').lean();
    const filter = isAll ? { category: wallCanvas?._id } : { subCategory: name };
    sendPage(res, {
      title: `${name} | Premium Custom Designs India`,
      description: isAll
        ? 'Every GPSFDK canvas in one place, best sellers first. Premium canvas wall art, rolled or stretched, delivered across India.'
        : `Shop ${name.replace(/^the\s+/i, 'the ')} canvas wall art collection by GPSFDK. Premium canvas prints, rolled or stretched, delivered across India.`,
      image: shareImage(await firstProductImage(filter)),
      url: `${SITE_URL}${path}`,
    });
  } catch (error) {
    failOpen(res, path, error);
  }
});

// /blog/:slug
router.get('/blog/:slug', (req, res) => {
  const post = blogPosts.find((p) => p.slug === req.params.slug);
  if (!post) return sendPage(res, null);
  const fallbackTitle = post.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  sendPage(res, {
    title: `${post.title || fallbackTitle} | GPSFDK Blog`,
    description: post.excerpt || SHARE_PAGES.blog.description,
    image: shareImage(post.image),
    url: `${SITE_URL}/blog/${post.slug}`,
  });
});

// /:page — a fixed page from data/sharePages.js, else a category (e.g.
// /house-nameplates)
router.get('/page/:page', async (req, res) => {
  const { page } = req.params;
  const path = `/${page}`;
  const fixed = SHARE_PAGES[page];
  if (fixed) {
    return sendPage(res, { ...fixed, image: shareImage(null), url: `${SITE_URL}${path}` });
  }
  try {
    const category = await Category.findOne({ slug: page, isActive: true }).select('_id name description image').lean();
    if (!category) return sendPage(res, null);
    const nameTitle = page === 'house-nameplates'
      ? `${category.name} | Premium Custom Designs India`
      : `${category.name} | Shop Custom Designs in India`;
    sendPage(res, {
      title: nameTitle,
      description: (category.description || '').trim() || DEFAULT_DESCRIPTION,
      image: shareImage(category.image?.url || await firstProductImage({ category: category._id })),
      url: `${SITE_URL}${path}`,
    });
  } catch (error) {
    failOpen(res, path, error);
  }
});

module.exports = router;
