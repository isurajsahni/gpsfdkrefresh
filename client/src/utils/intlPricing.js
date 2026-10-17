// International (USD) price list — a copy of server/utils/intlPricing.js for
// display. Change both together. Checkout always re-quotes from the server and
// the server refuses a total that differs from the one on screen, so a stale
// copy can't charge a different amount, but it would show wrong prices.
//
// Prices: "Suggested ($)" from the Aug 2026 format pricing benchmark. Sticker
// posters aren't sold any more and have no entry.

export const INTL_CURRENCY = 'USD';

// finish → size → USD
const INTL_USD_PRICES = {
  rolled: { '12x18': 22, '18x24': 32, '24x36': 45, '30x48': 85, '36x60': 130 },
  stretched: { '12x18': 45, '18x24': 60, '24x36': 95, '30x48': 180, '36x60': 260 },
  framed: { '12x18': 55, '18x24': 75, '24x36': 120, '30x48': 210, '36x60': 300 },
  softboard: { A4: 16, A3: 24 },
};

// Fallback for formats/sizes not on the list — the storefront's earlier rule
const LEGACY_MULTIPLIER = 10;
const LEGACY_USD_RATE = 0.012;

const norm = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, '');

const finishOf = (variation = {}) => {
  const text = `${norm(variation.frame)} ${norm(variation.material)}`;
  if (text.includes('sticker')) return 'sticker';
  if (text.includes('softboard') || text.includes('sunboard')) return 'softboard';
  if (text.includes('stretched') || text.includes('gallery')) return 'stretched';
  if (text.includes('rolled')) return 'rolled';
  if (text.includes('framed')) return 'framed';
  return '';
};

const sizeKeyOf = (size) => {
  const s = norm(size).replace(/(inches|inch|in|")$/, '');
  const dims = s.match(/^(\d+)x(\d+)$/);
  if (dims) return `${dims[1]}x${dims[2]}`;
  if (/^a\d$/.test(s)) return s.toUpperCase();
  return s;
};

// Rounds up to a price ending in 9 (47 → 49, 1847 → 1899) — mirrors the server
export const roundClean = (price) => {
  if (price <= 0) return 0;
  if (price < 10) return Math.ceil(price);
  if (price < 1000) return Math.ceil(price / 10) * 10 - 1;
  return Math.ceil(price / 100) * 100 - 1;
};

// INR → USD for an amount that has no variation behind it (marketing copy)
export const legacyUsdFromInr = (inr) => roundClean((Number(inr) || 0) * LEGACY_MULTIPLIER * LEGACY_USD_RATE);

// USD unit price of a variation shipped abroad
export const intlUnitPrice = (variation = {}) => {
  const row = INTL_USD_PRICES[finishOf(variation)];
  const listed = row ? row[sizeKeyOf(variation.size)] : undefined;
  if (Number.isFinite(listed)) return listed;
  return legacyUsdFromInr(variation.price);
};

// Unit price of a variation in a currency: INR is the catalogue price
export const unitPriceIn = (variation, currency) =>
  (currency === INTL_CURRENCY ? intlUnitPrice(variation) : Number(variation?.price) || 0);

export const isIndiaDestination = (country) => {
  const c = norm(country);
  return c === '' || c === 'india' || c === 'in';
};

// Orders are priced in the currency of where they ship
export const currencyForDestination = (country) => (isIndiaDestination(country) ? 'INR' : INTL_CURRENCY);

export const formatMoney = (amount, currency = 'INR') => {
  const n = Number(amount) || 0;
  const usd = currency === INTL_CURRENCY;
  try {
    return new Intl.NumberFormat(usd ? 'en-US' : 'en-IN', {
      style: 'currency',
      currency: usd ? 'USD' : 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
    }).format(n);
  } catch {
    return `${usd ? '$' : '₹'}${n.toLocaleString()}`;
  }
};
