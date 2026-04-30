const express = require('express');
const router = express.Router();
const { detectCountry, getCurrency, convertPrice, CURRENCY_CONFIG, INR_EXCHANGE_RATES } = require('../utils/geoPricing');

/**
 * GET /api/pricing
 * 
 * Returns geo-based pricing metadata for the requesting user.
 * The frontend uses this to know which currency/symbol to show.
 * 
 * Query params:
 *   ?country=US  — manual override for testing
 *   ?price=400   — optional: convert a specific INR price (for quick checks)
 * 
 * Response:
 *   {
 *     country: "US",
 *     currency: "USD",
 *     symbol: "$",
 *     multiplier: 10,
 *     exchangeRate: 0.012,
 *     locale: "en-US",
 *     // If ?price was provided:
 *     convertedPrice: 49,
 *     formatted: "$49"
 *   }
 */
router.get('/', async (req, res) => {
  try {
    const country = await detectCountry(req);
    const currency = getCurrency(country);
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
    const isIndia = country === 'IN';
    const multiplier = isIndia ? 1 : 10;
    const exchangeRate = INR_EXCHANGE_RATES[currency] || INR_EXCHANGE_RATES.USD;

    const response = {
      country,
      currency,
      symbol: config.symbol,
      multiplier,
      exchangeRate,
      locale: config.locale,
      decimals: config.decimals,
    };

    // Optional: convert a specific price if provided
    if (req.query.price) {
      const baseINR = parseFloat(req.query.price);
      if (!isNaN(baseINR) && baseINR >= 0) {
        const converted = convertPrice(baseINR, country);
        response.convertedPrice = converted.price;
        response.formatted = converted.formatted;
      }
    }

    // Cache for 1 hour — geo data doesn't change frequently
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.json(response);
  } catch (error) {
    console.error('[GeoPricing] API Error:', error.message);
    // Fallback: return Indian pricing so the site still works
    res.json({
      country: 'IN',
      currency: 'INR',
      symbol: '₹',
      multiplier: 1,
      exchangeRate: 1,
      locale: 'en-IN',
      decimals: 0,
    });
  }
});

/**
 * POST /api/pricing/convert
 * 
 * Batch convert multiple INR prices at once.
 * Useful for product listings or cart pages.
 * 
 * Body:
 *   { prices: [400, 800, 1200] }
 * 
 * Response:
 *   {
 *     country: "US",
 *     currency: "USD",
 *     symbol: "$",
 *     results: [
 *       { inr: 400, price: 49, formatted: "$49" },
 *       { inr: 800, price: 99, formatted: "$99" },
 *       { inr: 1200, price: 149, formatted: "$149" }
 *     ]
 *   }
 */
router.post('/convert', async (req, res) => {
  try {
    const { prices } = req.body;
    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({ message: 'prices array is required' });
    }

    // Cap at 100 prices per request to prevent abuse
    if (prices.length > 100) {
      return res.status(400).json({ message: 'Maximum 100 prices per request' });
    }

    const country = await detectCountry(req);
    const currency = getCurrency(country);
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;

    const results = prices.map((inrPrice) => {
      const baseINR = parseFloat(inrPrice);
      if (isNaN(baseINR) || baseINR < 0) {
        return { inr: inrPrice, price: 0, formatted: `${config.symbol}0` };
      }
      const converted = convertPrice(baseINR, country);
      return {
        inr: baseINR,
        price: converted.price,
        formatted: converted.formatted,
      };
    });

    res.json({
      country,
      currency,
      symbol: config.symbol,
      results,
    });
  } catch (error) {
    console.error('[GeoPricing] Batch Convert Error:', error.message);
    res.status(500).json({ message: 'Pricing conversion failed' });
  }
});

module.exports = router;
