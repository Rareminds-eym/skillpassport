/**
 * Application Constants
 * 
 * Centralized location for all magic numbers and configuration values.
 * Using named constants improves code readability, maintainability,
 * and ensures consistency across the codebase.
 */

// =============================================================================
// AUTHENTICATION CONSTANTS
// =============================================================================

/**
 * Authentication-related constants
 */
export const AUTH_CONSTANTS = {
    /**
     * Minimum password length (NIST SP 800-63B recommendation)
     * Balances security with usability
     */
    PASSWORD_MIN_LENGTH: 8,

    /**
     * Maximum password length
     * Prevents DoS attacks via bcrypt processing
     */
    PASSWORD_MAX_LENGTH: 128,

    /**
     * Access token expiry time in seconds (15 minutes)
     * Short-lived for security, requires refresh token for longer sessions
     */
    ACCESS_TOKEN_EXPIRY_SECONDS: 15 * 60,

    /**
     * Refresh token expiry time in seconds (7 days)
     * Allows users to stay logged in for a week
     */
    REFRESH_TOKEN_EXPIRY_SECONDS: 7 * 24 * 60 * 60,

    /**
     * Refresh token cookie max age (7 days in seconds)
     * Must match REFRESH_TOKEN_EXPIRY_SECONDS
     */
    REFRESH_TOKEN_COOKIE_MAX_AGE: 604800, // 7 days
} as const;

// Type-safe access
export type AuthConstants = typeof AUTH_CONSTANTS;

// =============================================================================
// ONBOARDING CONSTANTS
// =============================================================================

/**
 * Recruiter onboarding flow constants
 */
export const ONBOARDING_CONSTANTS = {
    /**
     * Total number of onboarding steps
     * Used for progress tracking and validation
     */
    TOTAL_STEPS: 4,

    /**
     * Step 1: Company Name
     */
    STEP_COMPANY_NAME: 1,

    /**
     * Step 2: Company Details
     */
    STEP_COMPANY_DETAILS: 2,

    /**
     * Step 3: Organization Verification
     */
    STEP_VERIFICATION: 3,

    /**
     * Step 4: Review & Complete
     */
    STEP_REVIEW: 4,

    /**
     * Maximum organization name length
     */
    MAX_ORG_NAME_LENGTH: 100,

    /**
     * Timeout for NULL organization names (24 hours)
     * After this time, accounts with NULL names should be flagged
     */
    NULL_NAME_TIMEOUT_HOURS: 24,

    /**
     * Timeout in milliseconds (24 hours)
     */
    NULL_NAME_TIMEOUT_MS: 24 * 60 * 60 * 1000,
} as const;

// Type-safe access
export type OnboardingConstants = typeof ONBOARDING_CONSTANTS;

// =============================================================================
// ORGANIZATION CONSTANTS
// =============================================================================

/**
 * Organization-related constants
 */
export const ORGANIZATION_CONSTANTS = {
    /**
     * Maximum number of recruiters for free tier
     */
    FREE_TIER_MAX_RECRUITERS: 10,

    /**
     * Default plan tier for new organizations
     */
    DEFAULT_PLAN_TIER: 'starter' as const,

    /**
     * Organization roles
     */
    ROLES: {
        OWNER: 'owner',
        ADMIN: 'company_admin',
        RECRUITER: 'recruiter',
        VIEWER: 'viewer',
    } as const,
} as const;

// Type-safe access
export type OrganizationConstants = typeof ORGANIZATION_CONSTANTS;

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

/**
 * Validation-related constants
 */
export const VALIDATION_CONSTANTS = {
    /**
     * Email validation regex (RFC 5322 simplified)
     */
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    /**
     * Maximum email length (RFC 5321)
     */
    EMAIL_MAX_LENGTH: 254,

    /**
     * Password requirements regex
     * At least one uppercase, one lowercase, one number, 8+ chars
     */
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,

    /**
     * Sequential characters pattern (123, abc, etc.)
     */
    SEQUENTIAL_CHARS_REGEX: /(?:012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,

    /**
     * Repeated characters pattern (aaa, 111, etc.)
     */
    REPEATED_CHARS_REGEX: /(.)\1{2,}/,

    /**
     * Common weak passwords to reject
     */
    WEAK_PASSWORDS: [
        'password',
        'Password1',
        'Welcome1',
        '12345678',
        'Qwerty1',
        'Abc12345',
        'Password123',
        'Admin123',
        'User1234',
        'Test1234',
    ] as const,
} as const;

// Type-safe access
export type ValidationConstants = typeof VALIDATION_CONSTANTS;

// =============================================================================
// FILE UPLOAD CONSTANTS
// =============================================================================

/**
 * File upload-related constants
 */
export const FILE_UPLOAD_CONSTANTS = {
    /**
     * Maximum file size for verification documents (10MB)
     */
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,

    /**
     * Maximum file size in human-readable format
     */
    MAX_FILE_SIZE_MB: 10,

    /**
     * Allowed file types for verification documents
     */
    ALLOWED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'] as const,

    /**
     * Allowed file extensions
     */
    ALLOWED_FILE_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'] as const,
} as const;

// Type-safe access
export type FileUploadConstants = typeof FILE_UPLOAD_CONSTANTS;

// =============================================================================
// HTTP CONSTANTS
// =============================================================================

/**
 * HTTP-related constants
 */
export const HTTP_CONSTANTS = {
    /**
     * CORS allowed methods
     */
    CORS_METHODS: 'POST, OPTIONS, GET, PUT, DELETE',

    /**
     * CORS allowed headers
     */
    CORS_HEADERS: 'Content-Type, Authorization',

    /**
     * Cookie settings for refresh token
     */
    REFRESH_TOKEN_COOKIE: {
        PATH: '/',
        HTTP_ONLY: true,
        SECURE: true,
        SAME_SITE: 'Strict' as const,
    } as const,
} as const;

// Type-safe access
export type HttpConstants = typeof HTTP_CONSTANTS;

// =============================================================================
// TIMEOUT CONSTANTS
// =============================================================================

/**
 * Timeout-related constants
 */
export const TIMEOUT_CONSTANTS = {
    /**
     * Default API timeout in milliseconds (30 seconds)
     */
    API_TIMEOUT_MS: 30 * 1000,

    /**
     * Database query timeout in milliseconds (10 seconds)
     */
    DB_QUERY_TIMEOUT_MS: 10 * 1000,

    /**
     * Email send timeout in milliseconds (15 seconds)
     */
    EMAIL_SEND_TIMEOUT_MS: 15 * 1000,

    /**
     * Auto-redirect delay after success in milliseconds (1.5 seconds)
     */
    SUCCESS_REDIRECT_DELAY_MS: 1500,
} as const;

// Type-safe access
export type TimeoutConstants = typeof TIMEOUT_CONSTANTS;

// =============================================================================
// ERROR MESSAGES
// =============================================================================

/**
 * Standard error messages for consistency
 */
export const ERROR_MESSAGES = {
    // Authentication
    AUTH_REQUIRED: 'Authentication required',
    AUTH_INVALID: 'Invalid authentication credentials',
    AUTH_EXPIRED: 'Authentication token expired',

    // Validation
    VALIDATION_FAILED: 'Validation failed',
    REQUIRED_FIELD: (field: string) => `${field} is required`,
    INVALID_FORMAT: (field: string) => `Invalid ${field} format`,

    // Generic
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again later.',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',

    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
} as const;

// Type-safe access
export type ErrorMessages = typeof ERROR_MESSAGES;

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

/**
 * Standard success messages for consistency
 */
export const SUCCESS_MESSAGES = {
    // Authentication
    SIGNUP_SUCCESS: 'Account created successfully',
    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',

    // Invitation
    INVITATION_ACCEPTED: 'Invitation accepted successfully',
    INVITATION_SENT: 'Invitation sent successfully',

    // Organization
    ORGANIZATION_CREATED: 'Organization created successfully',
    ORGANIZATION_UPDATED: 'Organization updated successfully',
} as const;

// Type-safe access
export type SuccessMessages = typeof SUCCESS_MESSAGES;

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * All constants grouped for easy import
 */
export const CONSTANTS = {
    AUTH: AUTH_CONSTANTS,
    ONBOARDING: ONBOARDING_CONSTANTS,
    ORGANIZATION: ORGANIZATION_CONSTANTS,
    VALIDATION: VALIDATION_CONSTANTS,
    FILE_UPLOAD: FILE_UPLOAD_CONSTANTS,
    HTTP: HTTP_CONSTANTS,
    TIMEOUT: TIMEOUT_CONSTANTS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
} as const;

// Default export for convenience
export default CONSTANTS;
