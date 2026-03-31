import { useState, useEffect } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Common country codes for the dropdown (Top 20 most frequent roughly)
const COMMON_COUNTRIES = [
  { code: '+91', label: '+91 (IN)' },
  { code: '+1', label: '+1 (US/CA)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+61', label: '+61 (AU)' },
  { code: '+971', label: '+971 (AE)' },
  { code: '+65', label: '+65 (SG)' },
  { code: '+49', label: '+49 (DE)' },
  { code: '+33', label: '+33 (FR)' },
  { code: '+81', label: '+81 (JP)' },
  { code: '+86', label: '+86 (CN)' },
  { code: '+39', label: '+39 (IT)' },
  { code: '+34', label: '+34 (ES)' },
  { code: '+7', label: '+7 (RU/KZ)' },
  { code: '+55', label: '+55 (BR)' },
  { code: '+27', label: '+27 (ZA)' },
  { code: '+92', label: '+92 (PK)' },
  { code: '+880', label: '+880 (BD)' },
  { code: '+94', label: '+94 (LK)' },
  { code: '+977', label: '+977 (NP)' }
];

const SmartPhoneInput = ({ value, onChange, onBlur, error, placeholder = "9876543210" }) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  // Initialize from value prop
  useEffect(() => {
    if (!value) {
      setPhoneNumber('');
      return;
    }

    // Check if we are already perfectly synced
    if (value === `${countryCode}${phoneNumber}`) {
       return;
    }

    // Attempt to parse with libphonenumber-js
    const parsed = parsePhoneNumberFromString(value);
    if (parsed) {
      setCountryCode(`+${parsed.countryCallingCode}`);
      setPhoneNumber(parsed.nationalNumber);
    } else {
      // Fallback manual split for cases where parsing fails
      if (value.startsWith('+')) {
        const match = value.match(/^(\+\d{1,4})(\d*)$/);
        if (match) {
          setCountryCode(match[1]);
          setPhoneNumber(match[2]);
          // Add to common countries dynamically if not exists
          if (!COMMON_COUNTRIES.find(c => c.code === match[1])) {
             COMMON_COUNTRIES.push({ code: match[1], label: match[1] });
          }
        } else {
          setPhoneNumber(value.replace(/[^0-9+]/g, ''));
        }
      } else {
        setPhoneNumber(value.replace(/\D/g, ''));
      }
    }
  }, [value, countryCode, phoneNumber]); // only sync down when value prop changes entirely

  const handleInputChange = (e) => {
    // 1. Remove spaces and extra chars, allow '+' at start
    const inputVal = e.target.value.replace(/\s+/g, '');

    // 2. Detect if value starts with "+" (Browser autofill case)
    if (inputVal.startsWith('+')) {
      const parsed = parsePhoneNumberFromString(inputVal);
      // 3 & 4. Extract country code dynamically and extract remaining number
      if (parsed) {
        const extractedCode = `+${parsed.countryCallingCode}`;
        const extractedNum = parsed.nationalNumber;
        
        // Ensure the code is in our dropdown options
        if (!COMMON_COUNTRIES.find(c => c.code === extractedCode)) {
           COMMON_COUNTRIES.push({ code: extractedCode, label: extractedCode });
        }
        
        setCountryCode(extractedCode);
        setPhoneNumber(extractedNum);
        onChange(`${extractedCode}${extractedNum}`);
        return;
      } else {
        // Basic grouping if libphonenumber needs more digits to evaluate
        const match = inputVal.match(/^(\+\d{1,4})(\d*)$/);
        if (match) {
          setCountryCode(match[1]);
          setPhoneNumber(match[2]);
          onChange(`${match[1]}${match[2]}`);
          return;
        }
      }
    }

    // Else: Regular typing (just numbers)
    // Strip all non-numeric characters
    const onlyNums = inputVal.replace(/[^0-9]/g, '');
    
    // UI limits (max 14 digits is safe for all countries)
    if (onlyNums.length > 14) return;
    
    setPhoneNumber(onlyNums);
    onChange(`${countryCode}${onlyNums}`);
  };

  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    onChange(`${newCode}${phoneNumber}`);
  };

  return (
    <div>
      <div className={`flex items-stretch bg-primary border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 overflow-hidden transition-all group relative`}>
        {/* Country Code Selector */}
        <div className="relative flex items-center bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors shrink-0">
          <select 
            value={countryCode} 
            onChange={handleCountryCodeChange}
            className="h-full pl-4 pr-7 py-3.5 bg-transparent text-secondary font-semibold text-sm focus:outline-none cursor-pointer appearance-none z-10"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
          >
            {COMMON_COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
          {/* Custom Chevron icon */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-secondary transition-colors">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        {/* Phone Number Input */}
        <input
          type="tel"
          autoComplete="tel"
          inputMode="numeric"
          value={phoneNumber}
          onChange={handleInputChange}
          onBlur={onBlur}
          className="flex-1 w-full px-4 py-3.5 bg-transparent focus:outline-none text-secondary"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default SmartPhoneInput;
