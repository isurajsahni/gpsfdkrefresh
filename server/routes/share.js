const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Social-share preview endpoint.
//
// WhatsApp / Facebook / Twitter link scrapers do not execute JavaScript, so they
// never see the Open Graph tags the React SPA injects via react-helmet-async.
// vercel.json rewrites bot requests for /product/:slug (matched by User-Agent)
// to this route, which returns a minimal HTML page whose only job is to carry
// correct OG/Twitter meta. Google is deliberately NOT routed here — it renders
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

const renderShareHtml = ({ title, description, image, url, price }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="product" />
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
      description: plainDescription || 'Premium wall canvas prints and custom house nameplates by GPSFDK.',
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

module.exports = router;
