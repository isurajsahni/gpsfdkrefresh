/**
 * Geo-Pricing Utility
 * 
 * Handles:
 * - Country detection from request IP
 * - Country → Currency mapping
 * - INR → Foreign currency conversion with exchange rates
 * - Clean price rounding (e.g. 47 → 49, 123 → 129)
 * - Multiplier logic: India = 1x, International = 10x
 */

const COUNTRY_CURRENCY_MAP = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  SG: 'SGD',
  AE: 'AED',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  PT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  JP: 'JPY',
  KR: 'KRW',
  MY: 'MYR',
  NZ: 'NZD',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
  NP: 'NPR',
  LK: 'LKR',
  BD: 'BDT',
};

// Approximate INR → foreign currency exchange rates
// These are conservative/rounded rates — update periodically or replace with a live API
const INR_EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012,
  GBP: 0.0095,
  EUR: 0.011,
  CAD: 0.016,
  AUD: 0.018,
  SGD: 0.016,
  AED: 0.044,
  JPY: 1.78,
  KRW: 16.5,
  MYR: 0.053,
  NZD: 0.020,
  SAR: 0.045,
  QAR: 0.044,
  KWD: 0.0037,
  BHD: 0.0045,
  OMR: 0.0046,
  NPR: 1.6,
  LKR: 3.6,
  BDT: 1.32,
};

// Currency display config
const CURRENCY_CONFIG = {
  INR: { symbol: '₹', locale: 'en-IN', decimals: 0 },
  USD: { symbol: '$', locale: 'en-US', decimals: 0 },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 0 },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 0 },
  CAD: { symbol: 'C$', locale: 'en-CA', decimals: 0 },
  AUD: { symbol: 'A$', locale: 'en-AU', decimals: 0 },
  SGD: { symbol: 'S$', locale: 'en-SG', decimals: 0 },
  AED: { symbol: 'د.إ', locale: 'ar-AE', decimals: 0 },
  JPY: { symbol: '¥', locale: 'ja-JP', decimals: 0 },
  KRW: { symbol: '₩', locale: 'ko-KR', decimals: 0 },
  MYR: { symbol: 'RM', locale: 'ms-MY', decimals: 0 },
  NZD: { symbol: 'NZ$', locale: 'en-NZ', decimals: 0 },
  SAR: { symbol: 'SAR', locale: 'ar-SA', decimals: 0 },
  QAR: { symbol: 'QAR', locale: 'ar-QA', decimals: 0 },
  KWD: { symbol: 'KWD', locale: 'ar-KW', decimals: 1 },
  BHD: { symbol: 'BHD', locale: 'ar-BH', decimals: 1 },
  OMR: { symbol: 'OMR', locale: 'ar-OM', decimals: 1 },
  NPR: { symbol: 'रू', locale: 'ne-NP', decimals: 0 },
  LKR: { symbol: 'Rs', locale: 'si-LK', decimals: 0 },
  BDT: { symbol: '৳', locale: 'bn-BD', decimals: 0 },
};

/**
 * Round a price to the nearest "clean" value.
 * Strategy:
 *   - Under 10:    round to nearest integer (e.g. 4.7 → 5)
 *   - 10-99:       round to nearest ending in 9 (e.g. 47 → 49, 23 → 29)
 *   - 100-999:     round to nearest ending in 9 (e.g. 447 → 449, 123 → 129)
 *   - 1000+:       round to nearest ending in 99 (e.g. 1847 → 1899, 4523 → 4599)
 */
const roundClean = (price) => {
  if (price <= 0) return 0;
  if (price < 10) return Math.ceil(price);

  if (price < 100) {
    // Round up to nearest number ending in 9
    return Math.ceil(price / 10) * 10 - 1;
  }

  if (price < 1000) {
    // Round up to nearest number ending in 9 (tens digit)
    return Math.ceil(price / 10) * 10 - 1;
  }

  // 1000+: round up to nearest number ending in 99
  return Math.ceil(price / 100) * 100 - 1;
};

/**
 * Detect country from Express request.
 * Priority:
 *   1. ?country= query param (manual override, for testing)
 *   2. cf-ipcountry header (Cloudflare / Render)
 *   3. x-vercel-ip-country header (Vercel)
 *   4. Free ipinfo.io API lookup
 *   5. Fallback to "IN"
 */
const detectCountry = async (req) => {
  // 1. Manual override via query param (useful for testing)
  if (req.query.country && /^[A-Z]{2}$/i.test(req.query.country)) {
    return req.query.country.toUpperCase();
  }

  // 2. CDN/Proxy headers
  const cfCountry = req.headers['cf-ipcountry'];
  if (cfCountry && cfCountry !== 'XX') return cfCountry.toUpperCase();

  const vercelCountry = req.headers['x-vercel-ip-country'];
  if (vercelCountry) return vercelCountry.toUpperCase();

  // 3. Render provides the real IP via x-forwarded-for
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;

  // Skip lookup for localhost / private IPs
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'IN';
  }

  // 4. Free geo API lookup (ipinfo.io — 50k requests/month free)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const response = await fetch(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN || ''}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.country) return data.country.toUpperCase();
    }
  } catch (err) {
    console.warn('[GeoPricing] IP lookup failed, falling back to IN:', err.message);
  }

  // 5. Default fallback
  return 'IN';
};

/**
 * Get currency code for a country.
 */
const getCurrency = (countryCode) => {
  return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
};

/**
 * Convert INR base price to target currency with geo multiplier.
 * 
 * @param {number} baseINR - The base price in INR (from database)
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {{ price: number, currency: string, symbol: string, formatted: string, multiplier: number }}
 */
const convertPrice = (baseINR, countryCode) => {
  const isIndia = countryCode === 'IN';
  const multiplier = isIndia ? 1 : 10;
  const adjustedINR = baseINR * multiplier;

  const currency = getCurrency(countryCode);
  const rate = INR_EXCHANGE_RATES[currency] || INR_EXCHANGE_RATES.USD;
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;

  let convertedPrice;
  if (currency === 'INR') {
    convertedPrice = adjustedINR;
  } else {
    convertedPrice = roundClean(adjustedINR * rate);
  }

  // Format for display
  let formatted;
  try {
    formatted = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(convertedPrice);
  } catch {
    formatted = `${config.symbol}${convertedPrice}`;
  }

  return {
    price: convertedPrice,
    currency,
    symbol: config.symbol,
    formatted,
    multiplier,
    exchangeRate: rate,
  };
};

module.exports = {
  detectCountry,
  getCurrency,
  convertPrice,
  roundClean,
  COUNTRY_CURRENCY_MAP,
  INR_EXCHANGE_RATES,
  CURRENCY_CONFIG,
};
