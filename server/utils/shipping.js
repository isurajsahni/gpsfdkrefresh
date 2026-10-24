// Domestic shipping rule (INR) — mirrors client/src/utils/shipping.js.
// Orders of FREE_SHIPPING_THRESHOLD and over ship free, the rest pay
// FLAT_SHIPPING_FEE. International orders always ship free (the USD price
// list includes shipping); that's decided where the currency is known.
const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING_FEE = 50;

const domesticShipping = (subtotal) => (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE);

module.exports = { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_FEE, domesticShipping };
