/**
 * Validation Configuration Constants
 * 
 * Centralized validation rules and constraints used across the application.
 * This ensures consistency and makes it easy to update validation rules.
 * 
 * @module shared/config/validation
 */

// ==================== PHONE NUMBER VALIDATION ====================

export const PHONE_VALIDATION = {
  /** Minimum phone number length (digits only) */
  MIN_LENGTH: 7,
  /** Maximum phone number length (digits only) */
  MAX_LENGTH: 15,
  /** Regex pattern for phone number (digits only) */
  PATTERN: /^\d{7,15}$/,
} as const;

// ==================== OTP VALIDATION ====================

export const OTP_VALIDATION = {
  /** OTP code length (MessageCentral provider sends 4-digit OTPs) */
  LENGTH: 4,
  /** Minimum OTP length accepted by backend */
  MIN_LENGTH: 4,
  /** Maximum OTP length accepted by backend */
  MAX_LENGTH: 8,
  /** Regex pattern for OTP (digits only) */
  PATTERN: /^\d{4}$/,
  /** OTP request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 10_000,
} as const;

// ==================== PASSWORD VALIDATION ====================

export const PASSWORD_VALIDATION = {
  /** Minimum password length */
  MIN_LENGTH: 8,
  /** Maximum password length */
  MAX_LENGTH: 128,
  /** Regex pattern for password strength (uppercase, lowercase, number) */
  STRENGTH_PATTERN: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  /** Password requirements description */
  REQUIREMENTS: 'Password must be at least 8 characters and contain uppercase, lowercase, and number',
} as const;

// ==================== EMAIL VALIDATION ====================

export const EMAIL_VALIDATION = {
  /** Regex pattern for email validation */
  PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Maximum email length */
  MAX_LENGTH: 254, // RFC 5321
} as const;

// ==================== NAME VALIDATION ====================

export const NAME_VALIDATION = {
  /** Minimum name length */
  MIN_LENGTH: 1,
  /** Maximum name length */
  MAX_LENGTH: 100,
  /** Regex pattern for name (letters, spaces, hyphens, apostrophes) */
  PATTERN: /^[a-zA-Z\s'-]+$/,
} as const;

// ==================== DATE VALIDATION ====================

export const DATE_VALIDATION = {
  /** Minimum age for registration (years) */
  MIN_AGE: 13,
  /** Maximum age for registration (years) */
  MAX_AGE: 120,
  /** Date format for display */
  DISPLAY_FORMAT: 'YYYY-MM-DD',
} as const;

// ==================== VALIDATION ERROR MESSAGES ====================

export const VALIDATION_MESSAGES = {
  // Phone
  PHONE_REQUIRED: 'Please enter your mobile number',
  PHONE_INVALID: `Please enter a valid phone number (${PHONE_VALIDATION.MIN_LENGTH}-${PHONE_VALIDATION.MAX_LENGTH} digits)`,
  PHONE_NOT_VERIFIED: 'Please verify your phone number',
  
  // OTP
  OTP_REQUIRED: 'Please enter the OTP code',
  OTP_INVALID: `Please enter a valid ${OTP_VALIDATION.LENGTH} digit OTP`,
  OTP_EXPIRED: 'Verification session expired. Please request a new OTP.',
  OTP_SEND_FAILED: 'Failed to send OTP. Please try again.',
  OTP_VERIFY_FAILED: 'Failed to verify OTP. Please try again.',
  OTP_INVALID_CODE: 'Invalid OTP',
  
  // Password
  PASSWORD_REQUIRED: 'Please enter a password',
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_VALIDATION.MIN_LENGTH} characters`,
  PASSWORD_TOO_WEAK: PASSWORD_VALIDATION.REQUIREMENTS,
  PASSWORD_MISMATCH: 'Passwords do not match',
  
  // Email
  EMAIL_REQUIRED: 'Please enter your email',
  EMAIL_INVALID: 'Please enter a valid email',
  
  // Name
  FIRST_NAME_REQUIRED: 'Please enter your first name',
  LAST_NAME_REQUIRED: 'Please enter your last name',
  NAME_INVALID: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  
  // Date
  DATE_OF_BIRTH_REQUIRED: 'Please enter your date of birth',
  DATE_OF_BIRTH_INVALID: 'Please enter a valid date of birth',
  AGE_TOO_YOUNG: `You must be at least ${DATE_VALIDATION.MIN_AGE} years old`,
  AGE_TOO_OLD: `Age must be less than ${DATE_VALIDATION.MAX_AGE} years`,
  
  // Location
  COUNTRY_REQUIRED: 'Please select your country',
  STATE_REQUIRED: 'Please select your state',
  CITY_REQUIRED: 'Please select your city',
  
  // Role
  ROLE_REQUIRED: 'Please select a user role',
  
  // Language
  LANGUAGE_REQUIRED: 'Please select your preferred language',
  
  // Terms
  TERMS_REQUIRED: 'Please agree to Terms & Privacy Policy',
  
  // Generic
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const;

// ==================== TYPE EXPORTS ====================

export type ValidationMessage = typeof VALIDATION_MESSAGES[keyof typeof VALIDATION_MESSAGES];
