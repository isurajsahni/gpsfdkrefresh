/**
 * Shared bits for house nameplates, used by the category listing rows and the
 * product page so the two stay in step.
 */

// Not a real variation: picking it swaps the price for a "we'll call you" note
// and the Add to Cart button for a quote request.
export const CUSTOM_SIZE = 'Custom Size';

export const isNameplateProduct = (product) =>
  Boolean(product?.category?.name?.toLowerCase().includes('nameplate'));

// Orders, emails, invoices and the admin panel all carry a single customText
// string, so the house number rides along inside it rather than as a new field.
export const nameplateCustomText = (familyName, houseNumber) =>
  [familyName.trim(), houseNumber.trim() && `House No: ${houseNumber.trim()}`]
    .filter(Boolean)
    .join(' | ');
