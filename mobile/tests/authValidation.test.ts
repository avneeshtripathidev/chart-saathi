import {
  validateEmail,
  validateFullName,
  validateMobileNumber,
  validateOtp,
} from '../src/utils/authValidation';

describe('Auth Validation Utilities', () => {
  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      expect(validateEmail('user@example.com').isValid).toBe(true);
      expect(validateEmail('john.doe@sub.domain.org').isValid).toBe(true);
      expect(validateEmail('traveler+rail@gmail.com').isValid).toBe(true);
    });

    it('rejects empty or whitespace email', () => {
      expect(validateEmail('').isValid).toBe(false);
      expect(validateEmail('   ').isValid).toBe(false);
    });

    it('rejects malformed email addresses', () => {
      expect(validateEmail('notanemail').isValid).toBe(false);
      expect(validateEmail('@domain.com').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
      expect(validateEmail('user@domain').isValid).toBe(false);
    });
  });

  describe('validateFullName', () => {
    it('accepts valid English full names', () => {
      expect(validateFullName('Avanish Sharma').isValid).toBe(true);
      expect(validateFullName('R. K. Narayan').isValid).toBe(true);
    });

    it('accepts multilingual names in Unicode scripts', () => {
      expect(validateFullName('अवनीश शर्मा').isValid).toBe(true); // Devanagari
      expect(validateFullName('சுப்பிரமணிய பாரதி').isValid).toBe(true); // Tamil
      expect(validateFullName('محمد أحمد').isValid).toBe(true); // Arabic
    });

    it('rejects empty or whitespace-only names', () => {
      expect(validateFullName('').isValid).toBe(false);
      expect(validateFullName('     ').isValid).toBe(false);
    });

    it('rejects names shorter than 2 characters', () => {
      expect(validateFullName('A').isValid).toBe(false);
    });

    it('rejects names exceeding 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(validateFullName(longName).isValid).toBe(false);
    });
  });

  describe('validateMobileNumber', () => {
    it('accepts valid 10-digit Indian mobile numbers (+91)', () => {
      expect(validateMobileNumber('9876543210', '+91').isValid).toBe(true);
      expect(validateMobileNumber('8123456789', '+91').isValid).toBe(true);
      expect(validateMobileNumber('7000000000', '+91').isValid).toBe(true);
      expect(validateMobileNumber('6999999999', '+91').isValid).toBe(true);
    });

    it('normalizes formatting characters (spaces, dashes)', () => {
      expect(validateMobileNumber('98765-43210', '+91').isValid).toBe(true);
      expect(validateMobileNumber('9876 543 210', '+91').isValid).toBe(true);
    });

    it('rejects Indian mobile numbers starting with 0-5', () => {
      expect(validateMobileNumber('5876543210', '+91').isValid).toBe(false);
      expect(validateMobileNumber('0876543210', '+91').isValid).toBe(false);
      expect(validateMobileNumber('1234567890', '+91').isValid).toBe(false);
    });

    it('rejects Indian mobile numbers with incorrect length', () => {
      expect(validateMobileNumber('987654321', '+91').isValid).toBe(false); // 9 digits
      expect(validateMobileNumber('98765432100', '+91').isValid).toBe(false); // 11 digits
    });

    it('validates other countries with 6-15 digit range', () => {
      expect(validateMobileNumber('2025550143', '+1').isValid).toBe(true); // USA
      expect(validateMobileNumber('7911123456', '+44').isValid).toBe(true); // UK
      expect(validateMobileNumber('123', '+1').isValid).toBe(false); // too short
    });
  });

  describe('validateOtp', () => {
    it('accepts valid 6-digit OTP codes', () => {
      expect(validateOtp('123456').isValid).toBe(true);
      expect(validateOtp('000000').isValid).toBe(true);
      expect(validateOtp('999999').isValid).toBe(true);
    });

    it('rejects empty or whitespace OTP', () => {
      expect(validateOtp('').isValid).toBe(false);
      expect(validateOtp('      ').isValid).toBe(false);
    });

    it('rejects codes with length other than 6', () => {
      expect(validateOtp('12345').isValid).toBe(false);
      expect(validateOtp('1234567').isValid).toBe(false);
    });

    it('rejects non-numeric characters', () => {
      expect(validateOtp('12a456').isValid).toBe(false);
      expect(validateOtp('abcdef').isValid).toBe(false);
    });
  });
});
