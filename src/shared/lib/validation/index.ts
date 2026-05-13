/**
 * Validation Utilities
 * 
 * Reusable validation functions used across the application.
 * All validation functions return a result object with success/error.
 * 
 * @module shared/lib/validation
 */

import {
  EMAIL_VALIDATION,
  PASSWORD_VALIDATION,
  PHONE_VALIDATION,
  OTP_VALIDATION,
  NAME_VALIDATION,
  DATE_VALIDATION,
  VALIDATION_MESSAGES,
} from '@/shared/config/validation';

// ==================== TYPES ====================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

// ==================== EMAIL VALIDATION ====================

/**
 * Validate email address
 * 
 * @param email - Email address to validate
 * @returns Validation result with sanitized email if valid
 * 
 * @example
 * const result = validateEmail('user@example.com');
 * if (result.valid) {
 *   console.log('Valid email:', result.sanitized);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: VALIDATION_MESSAGES.EMAIL_REQUIRED };
  }

  const sanitized = email.trim().toLowerCase();

  if (!EMAIL_VALIDATION.PATTERN.test(sanitized)) {
    return { valid: false, error: VALIDATION_MESSAGES.EMAIL_INVALID };
  }

  if (sanitized.length > EMAIL_VALIDATION.MAX_LENGTH) {
    return { valid: false, error: VALIDATION_MESSAGES.EMAIL_INVALID };
  }

  return { valid: true, sanitized };
}

// ==================== PASSWORD VALIDATION ====================

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @returns Validation result
 * 
 * @example
 * const result = validatePassword('MyPassword123');
 * if (!result.valid) {
 *   console.error('Error:', result.error);
 * }
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: VALIDATION_MESSAGES.PASSWORD_REQUIRED };
  }

  if (password.length < PASSWORD_VALIDATION.MIN_LENGTH) {
    return { valid: false, error: VALIDATION_MESSAGES.PASSWORD_TOO_SHORT };
  }

  if (password.length > PASSWORD_VALIDATION.MAX_LENGTH) {
    return { valid: false, error: VALIDATION_MESSAGES.PASSWORD_TOO_WEAK };
  }

  if (!PASSWORD_VALIDATION.STRENGTH_PATTERN.test(password)) {
    return { valid: false, error: VALIDATION_MESSAGES.PASSWORD_TOO_WEAK };
  }

  return { valid: true };
}

/**
 * Validate password confirmation
 * 
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Validation result
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (password !== confirmPassword) {
    return { valid: false, error: VALIDATION_MESSAGES.PASSWORD_MISMATCH };
  }

  return { valid: true };
}

// ==================== PHONE VALIDATION ====================

/**
 * Sanitize phone number (remove non-digits)
 * 
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number (digits only)
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Validate phone number
 * 
 * @param phone - Phone number to validate (can contain non-digits)
 * @param required - Whether phone number is required
 * @returns Validation result with sanitized phone if valid
 * 
 * @example
 * const result = validatePhone('+1 (555) 123-4567');
 * if (result.valid) {
 *   console.log('Valid phone:', result.sanitized); // '15551234567'
 * }
 */
export function validatePhone(
  phone: string,
  required: boolean = true
): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    if (required) {
      return { valid: false, error: VALIDATION_MESSAGES.PHONE_REQUIRED };
    }
    return { valid: true, sanitized: '' };
  }

  const sanitized = sanitizePhone(phone);

  if (!sanitized && required) {
    return { valid: false, error: VALIDATION_MESSAGES.PHONE_REQUIRED };
  }

  if (!sanitized && !required) {
    return { valid: true, sanitized: '' };
  }

  if (!PHONE_VALIDATION.PATTERN.test(sanitized)) {
    return { valid: false, error: VALIDATION_MESSAGES.PHONE_INVALID };
  }

  return { valid: true, sanitized };
}

// ==================== OTP VALIDATION ====================

/**
 * Sanitize OTP (remove non-digits)
 * 
 * @param otp - OTP to sanitize
 * @returns Sanitized OTP (digits only)
 */
export function sanitizeOtp(otp: string): string {
  return otp.replace(/\D/g, '');
}

/**
 * Validate OTP code
 * 
 * @param otp - OTP code to validate
 * @returns Validation result with sanitized OTP if valid
 * 
 * @example
 * const result = validateOtp('1234');
 * if (result.valid) {
 *   console.log('Valid OTP:', result.sanitized);
 * }
 */
export function validateOtp(otp: string): ValidationResult {
  if (!otp || typeof otp !== 'string') {
    return { valid: false, error: VALIDATION_MESSAGES.OTP_REQUIRED };
  }

  const sanitized = sanitizeOtp(otp);

  if (sanitized.length !== OTP_VALIDATION.LENGTH) {
    return { valid: false, error: VALIDATION_MESSAGES.OTP_INVALID };
  }

  if (!OTP_VALIDATION.PATTERN.test(sanitized)) {
    return { valid: false, error: VALIDATION_MESSAGES.OTP_INVALID };
  }

  return { valid: true, sanitized };
}

// ==================== NAME VALIDATION ====================

/**
 * Validate name (first name or last name)
 * 
 * @param name - Name to validate
 * @param fieldName - Field name for error message ('firstName' or 'lastName')
 * @returns Validation result with sanitized name if valid
 * 
 * @example
 * const result = validateName('John', 'firstName');
 * if (result.valid) {
 *   console.log('Valid name:', result.sanitized);
 * }
 */
export function validateName(
  name: string,
  fieldName: 'firstName' | 'lastName' = 'firstName'
): ValidationResult {
  if (!name || typeof name !== 'string') {
    const error =
      fieldName === 'firstName'
        ? VALIDATION_MESSAGES.FIRST_NAME_REQUIRED
        : VALIDATION_MESSAGES.LAST_NAME_REQUIRED;
    return { valid: false, error };
  }

  const sanitized = name.trim();

  if (sanitized.length < NAME_VALIDATION.MIN_LENGTH) {
    const error =
      fieldName === 'firstName'
        ? VALIDATION_MESSAGES.FIRST_NAME_REQUIRED
        : VALIDATION_MESSAGES.LAST_NAME_REQUIRED;
    return { valid: false, error };
  }

  if (sanitized.length > NAME_VALIDATION.MAX_LENGTH) {
    return { valid: false, error: VALIDATION_MESSAGES.NAME_INVALID };
  }

  if (!NAME_VALIDATION.PATTERN.test(sanitized)) {
    return { valid: false, error: VALIDATION_MESSAGES.NAME_INVALID };
  }

  return { valid: true, sanitized };
}

// ==================== DATE VALIDATION ====================

/**
 * Calculate age from date of birth
 * 
 * @param dateOfBirth - Date of birth (YYYY-MM-DD format)
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Validate date of birth
 * 
 * @param dateOfBirth - Date of birth to validate (YYYY-MM-DD format)
 * @returns Validation result
 * 
 * @example
 * const result = validateDateOfBirth('2000-01-01');
 * if (!result.valid) {
 *   console.error('Error:', result.error);
 * }
 */
export function validateDateOfBirth(dateOfBirth: string): ValidationResult {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    return { valid: false, error: VALIDATION_MESSAGES.DATE_OF_BIRTH_REQUIRED };
  }

  const date = new Date(dateOfBirth);

  if (isNaN(date.getTime())) {
    return { valid: false, error: VALIDATION_MESSAGES.DATE_OF_BIRTH_INVALID };
  }

  const age = calculateAge(dateOfBirth);

  if (age < DATE_VALIDATION.MIN_AGE) {
    return { valid: false, error: VALIDATION_MESSAGES.AGE_TOO_YOUNG };
  }

  if (age > DATE_VALIDATION.MAX_AGE) {
    return { valid: false, error: VALIDATION_MESSAGES.AGE_TOO_OLD };
  }

  return { valid: true };
}

// ==================== GENERIC VALIDATION ====================

/**
 * Validate required field
 * 
 * @param value - Value to validate
 * @param fieldName - Field name for error message
 * @returns Validation result
 */
export function validateRequired(
  value: string | null | undefined,
  fieldName: string
): ValidationResult {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: `${fieldName} is required` };
  }

  return { valid: true };
}

/**
 * Validate selection (dropdown, radio, etc.)
 * 
 * @param value - Selected value
 * @param fieldName - Field name for error message
 * @returns Validation result
 */
export function validateSelection(
  value: string | null | undefined,
  fieldName: string
): ValidationResult {
  if (!value) {
    return { valid: false, error: `Please select ${fieldName}` };
  }

  return { valid: true };
}

// ==================== EXPORTS ====================

export {
  EMAIL_VALIDATION,
  PASSWORD_VALIDATION,
  PHONE_VALIDATION,
  OTP_VALIDATION,
  NAME_VALIDATION,
  DATE_VALIDATION,
  VALIDATION_MESSAGES,
} from '@/shared/config/validation';
