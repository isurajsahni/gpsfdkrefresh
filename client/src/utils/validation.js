/**
 * GPSFDK — Centralized Frontend Validation Utility
 * Reusable validators, sanitizers, formatters, and Indian data constants.
 */

// ─── Indian States (dropdown data) ───
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// ─── Sanitize input (strip XSS / injection attempts) ───
export const sanitize = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')          // Strip angle brackets (XSS)
    .replace(/javascript:/gi, '')  // Strip JS protocol
    .replace(/on\w+\s*=/gi, '')    // Strip event handlers
    .replace(/\$/g, '')            // Strip MongoDB operators
    .trim();
};

// ─── Individual field validators ───
// Each returns an error string or '' (empty = valid)

export const validators = {
  fullName: (v) => {
    const val = (v || '').trim();
    if (!val) return 'Full name is required';
    if (val.length < 2) return 'Name must be at least 2 characters';
    if (val.length > 50) return 'Name must be under 50 characters';
    // \p{L} accepts accented/non-Latin letters so international customers
    // (e.g. "José", "Zoë") can check out; still blocks digits/symbols.
    if (!/^[\p{L}\s.'-]+$/u.test(val)) return 'Name can only contain letters and spaces';
    return '';
  },

  email: (v) => {
    const val = (v || '').trim();
    if (!val) return 'Email is required';
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) return 'Enter a valid email address';
    return '';
  },

  phone: (v) => {
    let val = (v || '');
    // Strip everything except + and digits
    val = val.replace(/[^0-9+]/g, '');
    if (!val) return 'Phone number is required';
    
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length < 6 || digitsOnly.length > 15) {
      return 'Phone number must be 6-15 digits';
    }
    return '';
  },

  password: (v) => {
    const val = v || '';
    if (!val) return 'Password is required';
    if (val.length < 8) return 'Password must be at least 8 characters';
    return '';
  },

  addressLine1: (v) => {
    const val = (v || '').trim();
    if (!val) return 'Address is required';
    if (val.length < 5) return 'Address must be at least 5 characters';
    if (val.length > 200) return 'Address is too long';
    return '';
  },

  city: (v) => {
    const val = (v || '').trim();
    if (!val) return 'City is required';
    // \p{L} allows accented/non-Latin city names (e.g. "São Paulo", "Zürich").
    if (!/^[\p{L}\s'.-]+$/u.test(val)) return 'City can only contain letters';
    return '';
  },

  // International postal / ZIP code — deliberately permissive since formats vary
  // wildly (US "94105", UK "SW1A 1AA", CA "K1A 0B1", or none at all in a few
  // countries). Indian orders use the stricter `pincode` validator instead.
  postalCode: (v) => {
    const val = (v || '').trim();
    if (!val) return 'Postal / ZIP code is required';
    if (!/^[A-Za-z0-9][A-Za-z0-9\s-]{1,11}$/.test(val)) return 'Enter a valid postal / ZIP code';
    return '';
  },

  state: (v) => {
    const val = (v || '').trim();
    if (!val) return 'State is required';
    if (!INDIAN_STATES.includes(val)) return 'Please select a valid state';
    return '';
  },

  pincode: (v) => {
    const val = (v || '').replace(/\D/g, '');
    if (!val) return 'Pincode is required';
    if (val.length !== 6) return 'Pincode must be exactly 6 digits';
    if (!/^[1-9]/.test(val)) return 'Enter a valid Indian pincode';
    return '';
  },

  message: (v) => {
    const val = (v || '').trim();
    if (!val) return 'Message is required';
    if (val.length < 10) return 'Message must be at least 10 characters';
    if (val.length > 2000) return 'Message is too long (max 2000 characters)';
    return '';
  },

  otp: (v) => {
    const val = (v || '').replace(/\D/g, '');
    if (!val) return 'OTP is required';
    if (val.length !== 6) return 'OTP must be exactly 6 digits';
    return '';
  },
};

// ─── Validate an entire address object ───
// Country-aware: India keeps the strict pincode + state-dropdown rules; other
// countries get free-text state/province and a relaxed postal-code check so
// international customers can actually complete checkout.
export const validateAddress = (addr) => {
  const errors = {};
  const domestic = (addr.country || 'India').toString().trim().toLowerCase();
  const isIndia = domestic === 'india' || domestic === 'in';

  errors.fullName = validators.fullName(addr.fullName);
  errors.phone = validators.phone(addr.phone);
  errors.addressLine1 = validators.addressLine1(addr.addressLine1);
  errors.city = validators.city(addr.city);

  if (isIndia) {
    errors.state = validators.state(addr.state);
    errors.pincode = validators.pincode(addr.pincode);
  } else {
    errors.state = (addr.state || '').trim() ? '' : 'State / Province / Region is required';
    errors.pincode = validators.postalCode(addr.pincode);
  }
  // Remove empty (valid) entries
  Object.keys(errors).forEach(k => { if (!errors[k]) delete errors[k]; });
  return errors;
};

// ─── Auto-formatters (for onChange handlers) ───
export const formatters = {
  phone: (v) => {
    // Strip non-digits and non-plus, limit safe length
    return v.replace(/[^0-9+]/g, '').slice(0, 18);
  },
  pincode: (v) => {
    return v.replace(/\D/g, '').slice(0, 6);
  },
  // International postal code: keep letters/digits/spaces/hyphens, uppercase it,
  // cap length. Used for non-India addresses (the strict `pincode` formatter
  // would strip letters and break e.g. UK/Canada codes).
  postalCode: (v) => {
    return v.replace(/[^A-Za-z0-9\s-]/g, '').toUpperCase().slice(0, 12);
  },
  name: (v) => {
    // Auto-capitalize first letter of each word, strip digits/symbols but keep
    // accented/non-Latin letters so international names survive typing.
    return v
      .replace(/[^\p{L}\s.'-]/gu, '')
      .replace(/(^|\s)\p{L}/gu, c => c.toUpperCase())
      .slice(0, 50);
  },
  otp: (v) => {
    return v.replace(/\D/g, '').slice(0, 6);
  },
  city: (v) => {
    return v
      .replace(/[^\p{L}\s'.-]/gu, '')
      .replace(/(^|\s)\p{L}/gu, c => c.toUpperCase())
      .slice(0, 50);
  },
};

// ─── Pincode → City/State autofill (India Post API) ───
// The upstream API (api.postalpincode.in) periodically lets its SSL cert
// expire, which causes the browser to reject the request with
// ERR_CERT_DATE_INVALID. Without a timeout, that rejection can take ~30s
// to surface — long enough that the checkout pincode spinner looks frozen
// and users assume the form is broken. We hard-cap the wait at 4s and
// return null on any failure so the caller falls back to manual entry.
export const lookupPincode = async (pincode) => {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    // AbortSignal.timeout works in all modern browsers (Chrome 103+,
    // Firefox 100+, Safari 16+) — every browser our checkout supports.
    const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout
      ? AbortSignal.timeout(4000)
      : undefined;
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal });
    const data = await res.json();
    if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return { city: po.District, state: po.State };
    }
  } catch { /* silent — caller shows toast and unblocks manual entry */ }
  return null;
};
