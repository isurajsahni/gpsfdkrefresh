import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import API from '../utils/api';

const CurrencyContext = createContext();

/* The last detected currency, so a returning visitor sees their own prices
   straight away instead of ₹ for a second first. It's still re-checked in the
   background on every load, and dropped after a week. */
const GEO_CACHE_KEY = 'gpsfdk_geo_pricing';
const GEO_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const readCachedGeo = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(GEO_CACHE_KEY));
    if (cached?.data && Date.now() - cached.at < GEO_CACHE_MAX_AGE_MS) return cached.data;
  } catch {
    // Unreadable or blocked storage: detect afresh
  }
  return null;
};

const writeCachedGeo = (data) => {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ data, at: Date.now() }));
  } catch {
    // Storage full or blocked: the cache is only a nicety
  }
};

/**
 * CurrencyProvider
 * 
 * Detects user's country via backend API, stores currency metadata,
 * and provides a `formatPrice()` function that converts INR base prices
 * into the user's local currency with proper formatting.
 * 
 * Usage:
 *   const { formatPrice, currency, country } = useCurrency();
 *   <span>{formatPrice(400)}</span>  // "$49" for US, "₹400" for IN
 */
export const CurrencyProvider = ({ children }) => {
  const [geoData, setGeoData] = useState(() => {
    const cached = readCachedGeo();
    return cached ? { ...cached, loaded: true } : {
      country: 'IN',
      currency: 'INR',
      symbol: '₹',
      multiplier: 1,
      exchangeRate: 1,
      locale: 'en-IN',
      decimals: 0,
      loaded: false,
    };
  });

  // Allow manual country override (optional feature)
  const [manualCountry, setManualCountry] = useState(null);

  // Fetch geo data from backend on mount
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const url = manualCountry ? `/pricing?country=${manualCountry}` : '/pricing';
        const { data } = await API.get(url);
        setGeoData({ ...data, loaded: true });
        // Only the visitor's own detected location is remembered
        if (!manualCountry) writeCachedGeo(data);
      } catch (err) {
        console.warn('[Currency] Geo detection failed, using INR default:', err.message);
        setGeoData(prev => ({ ...prev, loaded: true }));
      }
    };

    fetchGeo();
  }, [manualCountry]);

  /**
   * Clean rounding logic (mirrors backend)
   * Rounds prices to "clean" numbers like 9, 19, 49, 99, 149, 499, 1499
   */
  const roundClean = useCallback((price) => {
    if (price <= 0) return 0;
    if (price < 10) return Math.ceil(price);
    if (price < 1000) return Math.ceil(price / 10) * 10 - 1;
    return Math.ceil(price / 100) * 100 - 1;
  }, []);

  /**
   * Format an INR base price for the user's detected currency.
   * 
   * @param {number} inrPrice - The base price in INR
   * @param {object} options
   * @param {boolean} options.raw - If true, return just the number without symbol
   * @param {boolean} options.noConvert - If true, skip conversion (for already-converted values like order totals)
   * @returns {string|number} Formatted price string or raw number
   */
  const formatPrice = useCallback((inrPrice, options = {}) => {
    if (inrPrice === null || inrPrice === undefined) return geoData.symbol + '0';

    const { raw = false, noConvert = false } = options;

    let finalPrice;
    if (noConvert || geoData.currency === 'INR') {
      finalPrice = inrPrice;
    } else {
      const adjustedINR = inrPrice * geoData.multiplier;
      finalPrice = roundClean(adjustedINR * geoData.exchangeRate);
    }

    if (raw) return finalPrice;

    try {
      return new Intl.NumberFormat(geoData.locale, {
        style: 'currency',
        currency: geoData.currency,
        minimumFractionDigits: geoData.decimals,
        maximumFractionDigits: geoData.decimals,
      }).format(finalPrice);
    } catch {
      return `${geoData.symbol}${finalPrice.toLocaleString()}`;
    }
  }, [geoData, roundClean]);

  /**
   * Get just the numeric converted price (no formatting)
   */
  const getPrice = useCallback((inrPrice) => {
    return formatPrice(inrPrice, { raw: true });
  }, [formatPrice]);

  const value = useMemo(() => ({
    country: geoData.country,
    currency: geoData.currency,
    symbol: geoData.symbol,
    multiplier: geoData.multiplier,
    locale: geoData.locale,
    loaded: geoData.loaded,
    formatPrice,
    getPrice,
    setCountryOverride: setManualCountry,
  }), [geoData, formatPrice, getPrice]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};

export default CurrencyContext;
