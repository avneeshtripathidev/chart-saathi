// Authentication & Profile Validation Utilities

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates user's email address
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  return { isValid: true };
}

/**
 * Validates full name:
 * - Must not be empty or whitespace only
 * - Between 2 and 100 characters
 * - Supports any script (Unicode letters including Devanagari, Tamil, etc.)
 */
export function validateFullName(name: string): ValidationResult {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full name is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters.' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Full name must not exceed 100 characters.' };
  }
  return { isValid: true };
}

/**
 * Validates mobile number according to selected country code:
 * - Strips non-digit characters
 * - For India (+91): exactly 10 digits starting with 6, 7, 8, or 9
 * - For other countries: 6 to 15 digits
 */
export function validateMobileNumber(mobile: string, countryCode: string = '+91'): ValidationResult {
  const cleaned = (mobile || '').replace(/\D/g, '');
  if (!cleaned) {
    return { isValid: false, error: 'Mobile number is required.' };
  }

  if (countryCode === '+91') {
    if (cleaned.length !== 10) {
      return { isValid: false, error: 'Indian mobile number must be exactly 10 digits.' };
    }
    if (!/^[6-9]/.test(cleaned)) {
      return { isValid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9.' };
    }
  } else {
    if (cleaned.length < 6 || cleaned.length > 15) {
      return { isValid: false, error: 'Please enter a valid mobile number (6–15 digits).' };
    }
  }

  return { isValid: true };
}

/**
 * Validates 6-digit OTP format
 */
export function validateOtp(otp: string): ValidationResult {
  const cleaned = (otp || '').trim();
  if (!cleaned) {
    return { isValid: false, error: 'Please enter the 6-digit verification code.' };
  }
  if (!/^\d{6}$/.test(cleaned)) {
    return { isValid: false, error: 'Verification code must be exactly 6 digits.' };
  }
  return { isValid: true };
}

/**
 * Supported country codes with default +91 (India)
 */
export const COUNTRY_CODES = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
] as const;
