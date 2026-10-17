/**
 * International (USD) price list.
 *
 * Orders shipped outside India are priced from this table and charged in USD
 * through Razorpay. Orders shipped to India keep the INR price stored on each
 * product variation — nothing here touches them.
 *
 * Prices are the "Suggested ($)" column of the Aug 2026 format pricing
 * benchmark (GPSFDK_Format_Pricing_Benchmark). Sticker posters are not sold
 * any more, so they have no entry.
 *
 * client/src/utils/intlPricing.js holds a copy of this table for display. Change
 * both together: checkout re-quotes from the server and create-order refuses a
 * total that differs from the one on screen, so a stale copy blocks checkout
 * rather than charging a different amount — but it would still show the wrong
 * price everywhere else.
 */
const { roundClean, INR_EXCHANGE_RATES, INTERNATIONAL_PRICE_MULTIPLIER } = require('./geoPricing');

const INTL_CURRENCY = 'USD';

// What ₹1 of a fixed INR coupon amount or minimum order is worth in USD terms.
// Same rate as the benchmark (₹95 = $1).
const USD_INR_RATE = 95;

// finish → size → USD
const INTL_USD_PRICES = {
  rolled: { '12x18': 22, '18x24': 32, '24x36': 45, '30x48': 85, '36x60': 130 },
  stretched: { '12x18': 45, '18x24': 60, '24x36': 95, '30x48': 180, '36x60': 260 },
  framed: { '12x18': 55, '18x24': 75, '24x36': 120, '30x48': 210, '36x60': 300 },
  softboard: { A4: 16, A3: 24 },
};

const norm = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, '');

// The finish a variation is sold as. Variations store it in `frame`
// ("Rolled", "Stretched", "Soft Board"); a few older ones only in `material`.
const finishOf = (variation = {}) => {
  const text = `${norm(variation.frame)} ${norm(variation.material)}`;
  if (text.includes('sticker')) return 'sticker';
  if (text.includes('softboard') || text.includes('sunboard')) return 'softboard';
  if (text.includes('stretched') || text.includes('gallery')) return 'stretched';
  if (text.includes('rolled')) return 'rolled';
  if (text.includes('framed')) return 'framed';
  return '';
};

// "24 x 36", "24x36 inch", "24X36in" → "24x36"; "a4" → "A4"
const sizeKeyOf = (size) => {
  const s = norm(size).replace(/(inches|inch|in|")$/, '');
  const dims = s.match(/^(\d+)x(\d+)$/);
  if (dims) return `${dims[1]}x${dims[2]}`;
  if (/^a\d$/.test(s)) return s.toUpperCase();
  return s;
};

// USD price from the table, or null when the format/size isn't on it.
const tablePrice = (variation) => {
  const finish = finishOf(variation);
  const row = INTL_USD_PRICES[finish];
  if (!row) return null;
  const price = row[sizeKeyOf(variation.size)];
  return Number.isFinite(price) ? price : null;
};

/**
 * USD unit price for a variation shipped abroad. Formats and sizes the table
 * doesn't cover (nameplates, paper posters, odd sizes) keep the storefront's
 * existing rule: INR price × 10, converted and rounded to a price ending in 9.
 */
const intlUnitPrice = (variation = {}) => {
  const listed = tablePrice(variation);
  if (listed !== null) return listed;
  const inr = Number(variation.price) || 0;
  return roundClean(inr * INTERNATIONAL_PRICE_MULTIPLIER * INR_EXCHANGE_RATES.USD);
};

const isIndiaDestination = (country) => {
  const c = norm(country);
  return c === '' || c === 'india' || c === 'in';
};

// The currency an order is priced and charged in: where it ships decides.
// An empty country is India — the address form and the Order model default
// to it.
const currencyForDestination = (country) => (isIndiaDestination(country) ? 'INR' : INTL_CURRENCY);

module.exports = {
  INTL_CURRENCY,
  USD_INR_RATE,
  INTL_USD_PRICES,
  finishOf,
  sizeKeyOf,
  intlUnitPrice,
  isIndiaDestination,
  currencyForDestination,
};
