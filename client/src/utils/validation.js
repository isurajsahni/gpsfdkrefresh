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
    if (!/^[a-zA-Z\s.'-]+$/.test(val)) return 'Name can only contain letters and spaces';
    return '';
  },

  email: (v) => {
    const val = (v || '').trim();
    if (!val) return 'Email is required';
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) return 'Enter a valid email address';
    return '';
  },

  phone: (v) => {
    const val = (v || '').replace(/\D/g, '');
    if (!val) return 'Phone number is required';
    if (val.length !== 10) return 'Phone number must be 10 digits';
    if (!/^[6-9]/.test(val)) return 'Phone number must start with 6-9';
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
    if (!/^[a-zA-Z\s'-]+$/.test(val)) return 'City can only contain letters';
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
export const validateAddress = (addr) => {
  const errors = {};
  errors.fullName = validators.fullName(addr.fullName);
  errors.phone = validators.phone(addr.phone);
  errors.addressLine1 = validators.addressLine1(addr.addressLine1);
  errors.city = validators.city(addr.city);
  errors.state = validators.state(addr.state);
  errors.pincode = validators.pincode(addr.pincode);
  // Remove empty (valid) entries
  Object.keys(errors).forEach(k => { if (!errors[k]) delete errors[k]; });
  return errors;
};

// ─── Auto-formatters (for onChange handlers) ───
export const formatters = {
  phone: (v) => {
    // Strip non-digits and limit to 10
    return v.replace(/\D/g, '').slice(0, 10);
  },
  pincode: (v) => {
    return v.replace(/\D/g, '').slice(0, 6);
  },
  name: (v) => {
    // Auto-capitalize first letter of each word, strip numbers and special chars
    return v
      .replace(/[^a-zA-Z\s.'-]/g, '')
      .replace(/\b\w/g, c => c.toUpperCase())
      .slice(0, 50);
  },
  otp: (v) => {
    return v.replace(/\D/g, '').slice(0, 6);
  },
  city: (v) => {
    return v
      .replace(/[^a-zA-Z\s'-]/g, '')
      .replace(/\b\w/g, c => c.toUpperCase())
      .slice(0, 50);
  },
};

// ─── Pincode → City/State autofill (India Post API) ───
export const lookupPincode = async (pincode) => {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return { city: po.District, state: po.State };
    }
  } catch { /* silent */ }
  return null;
};
