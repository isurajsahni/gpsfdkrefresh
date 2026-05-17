// Single source of truth for shipping rules — mirrors server/controllers/orderController.js
// If subtotal >= FREE_SHIPPING_THRESHOLD -> free, else FLAT_SHIPPING_FEE.
export const FREE_SHIPPING_THRESHOLD = 999;
export const FLAT_SHIPPING_FEE = 50;

/**
 * Calculate shipping fee for a given subtotal in INR.
 * @param {number} subtotal - Cart subtotal (items only, pre-discount).
 * @returns {number} shipping fee in INR.
 */
export const calculateShipping = (subtotal) => {
  if (!subtotal || subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
};
