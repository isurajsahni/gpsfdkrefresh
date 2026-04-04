/**
 * Weight & Dimension Mapping by Product Size
 * 
 * Maps product variation sizes to their after-packing weight (kg)
 * and approximate packed dimensions (cm) for Shiprocket shipping.
 */

// Size → Weight (kg) after packing
const WEIGHT_MAP = {
  '12x18': 3,
  '18x24': 3.5,
  '24x36': 4.2,
  '30x48': 6.5,
  '36x60': 9.5,
  '12x12': 3,
  '18x18': 3.5,
  '24x24': 4,
  '36x36': 6.5,
  '48x48': 10.5,
};

// Size → Packed dimensions { length, breadth, height } in cm
const DIMENSION_MAP = {
  '12x18': { length: 35, breadth: 50, height: 8 },
  '18x24': { length: 50, breadth: 65, height: 8 },
  '24x36': { length: 65, breadth: 95, height: 10 },
  '30x48': { length: 80, breadth: 125, height: 10 },
  '36x60': { length: 95, breadth: 155, height: 12 },
  '12x12': { length: 35, breadth: 35, height: 8 },
  '18x18': { length: 50, breadth: 50, height: 8 },
  '24x24': { length: 65, breadth: 65, height: 10 },
  '36x36': { length: 95, breadth: 95, height: 10 },
  '48x48': { length: 125, breadth: 125, height: 12 },
};

const DEFAULT_WEIGHT = 1; // kg — safe fallback for unknown sizes
const DEFAULT_DIMENSIONS = { length: 30, breadth: 30, height: 8 };

/**
 * Normalize a size string for lookup.
 * Handles variations like "12 x 18", "12X18", "12 X 18 inches", etc.
 */
function normalizeSize(size) {
  if (!size || typeof size !== 'string') return '';
  return size
    .toLowerCase()
    .replace(/\s+/g, '')       // remove all spaces
    .replace(/inches|inch|in|cm|"|″/gi, '') // remove unit suffixes
    .replace(/×/g, 'x')       // replace × with x
    .trim();
}

/**
 * Get the after-packing weight in kg for a given product size.
 * @param {string} size - Product size string (e.g. "12x18", "24x36")
 * @returns {number} Weight in kg
 */
function getWeightBySize(size) {
  const normalized = normalizeSize(size);
  const weight = WEIGHT_MAP[normalized];
  if (weight !== undefined) return weight;

  console.warn(`[WeightMapping] Unknown size "${size}" (normalized: "${normalized}"), using default ${DEFAULT_WEIGHT}kg`);
  return DEFAULT_WEIGHT;
}

/**
 * Get the packed dimensions in cm for a given product size.
 * @param {string} size - Product size string
 * @returns {{ length: number, breadth: number, height: number }}
 */
function getDimensionsBySize(size) {
  const normalized = normalizeSize(size);
  const dims = DIMENSION_MAP[normalized];
  if (dims) return { ...dims };

  console.warn(`[WeightMapping] No dimensions for size "${size}", using defaults`);
  return { ...DEFAULT_DIMENSIONS };
}

module.exports = {
  getWeightBySize,
  getDimensionsBySize,
  WEIGHT_MAP,
  DIMENSION_MAP,
  DEFAULT_WEIGHT,
  DEFAULT_DIMENSIONS,
};
