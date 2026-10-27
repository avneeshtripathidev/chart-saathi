// Authentication & Profile Validation Utilities

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export type PasswordStrength = 'WEAK' | 'MEDIUM' | 'STRONG';

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
 * Validates password and assesses strength:
 * - Minimum 6 characters
 * - Stronger if includes numbers, uppercase, special characters
 */
export function validatePassword(password: string): ValidationResult & { strength: PasswordStrength } {
  const p = password || '';
  if (!p) {
    return { isValid: false, error: 'Password is required.', strength: 'WEAK' };
  }
  if (p.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters.', strength: 'WEAK' };
  }

  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  let strength: PasswordStrength = 'WEAK';
  if (score >= 3) {
    strength = 'STRONG';
  } else if (score >= 2) {
    strength = 'MEDIUM';
  }

  return { isValid: true, strength };
}

/**
 * Validates username:
 * - 3 to 30 characters
 * - Lowercase letters, numbers, and underscores only
 * - Must start with a letter
 * - Reserved words prevented
 */
const RESERVED_USERNAMES = new Set(['admin', 'root', 'support', 'chartsaathi', 'official', 'help', 'system']);

export function validateUsername(username: string): ValidationResult {
  const cleaned = (username || '').trim().toLowerCase();
  if (!cleaned) {
    return { isValid: false, error: 'Username is required.' };
  }
  if (cleaned.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters.' };
  }
  if (cleaned.length > 30) {
    return { isValid: false, error: 'Username must not exceed 30 characters.' };
  }
  if (!/^[a-z]/.test(cleaned)) {
    return { isValid: false, error: 'Username must start with a lowercase letter.' };
  }
  if (!/^[a-z0-9_]+$/.test(cleaned)) {
    return { isValid: false, error: 'Username can only contain lowercase letters, numbers, and underscores.' };
  }
  if (RESERVED_USERNAMES.has(cleaned)) {
    return { isValid: false, error: 'This username is reserved. Please pick another.' };
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

/**
 * Preset avatar badges for travelers
 */
export const AVATAR_PRESETS = [
  { id: 'rajdhani', label: 'Express Traveler', icon: '🚂', bg: '#E45F60' },
  { id: 'vande', label: 'Vande Bharat Ace', icon: '⚡', bg: '#3B82F6' },
  { id: 'station', label: 'Platform Master', icon: '🚉', bg: '#10B981' },
  { id: 'ticket', label: 'Confirmed Rider', icon: '🎫', bg: '#8B5CF6' },
  { id: 'compass', label: 'Route Navigator', icon: '🧭', bg: '#F59E0B' },
  { id: 'star', label: 'IRCTC Expert', icon: '⭐', bg: '#EC4899' },
];
