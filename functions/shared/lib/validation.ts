/**
 * Input Validation Utilities
 * 
 * Provides validation functions for API inputs to prevent injection attacks
 * and ensure data integrity.
 */

/**
 * Validate UUID format (RFC 4122)
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate email format (basic RFC 5322 compliance)
 */
export function isValidEmail(value: string): boolean {
  // Basic email validation - more permissive than strict RFC 5322
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Additional checks
  if (!emailRegex.test(value)) return false;
  if (value.length > 254) return false; // Max email length
  
  const [local, domain] = value.split('@');
  if (local.length > 64) return false; // Max local part length
  if (domain.length > 253) return false; // Max domain length
  
  return true;
}

/**
 * Validate plan code format
 */
export function isValidPlanCode(value: string): boolean {
  // Plan codes should be lowercase alphanumeric with underscores
  const planCodeRegex = /^[a-z0-9_]+$/;
  return planCodeRegex.test(value) && value.length > 0 && value.length <= 50;
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize user input
 */
export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues?: ValidationIssue[];
}

/**
 * Validate create freemium subscription request
 */
export function validateCreateFreemiumRequest(body: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const reqBody = body as Record<string, unknown>;

  // Validate userId
  if (!reqBody.userId) {
    issues.push({ path: 'userId', message: 'userId is required' });
  } else if (typeof reqBody.userId !== 'string') {
    issues.push({ path: 'userId', message: 'userId must be a string' });
  } else if (!isValidUUID(reqBody.userId)) {
    issues.push({ path: 'userId', message: 'userId must be a valid UUID' });
  }

  // Validate email
  if (!reqBody.email) {
    issues.push({ path: 'email', message: 'email is required' });
  } else if (typeof reqBody.email !== 'string') {
    issues.push({ path: 'email', message: 'email must be a string' });
  } else if (!isValidEmail(reqBody.email)) {
    issues.push({ path: 'email', message: 'email must be a valid email address' });
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true };
}

/**
 * Validate subscription upgrade request
 */
export function validateUpgradeRequest(body: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const reqBody = body as Record<string, unknown>;

  // Validate userId
  if (!reqBody.userId) {
    issues.push({ path: 'userId', message: 'userId is required' });
  } else if (typeof reqBody.userId !== 'string') {
    issues.push({ path: 'userId', message: 'userId must be a string' });
  } else if (!isValidUUID(reqBody.userId)) {
    issues.push({ path: 'userId', message: 'userId must be a valid UUID' });
  }

  // Validate planCode
  if (!reqBody.planCode) {
    issues.push({ path: 'planCode', message: 'planCode is required' });
  } else if (typeof reqBody.planCode !== 'string') {
    issues.push({ path: 'planCode', message: 'planCode must be a string' });
  } else if (!isValidPlanCode(reqBody.planCode)) {
    issues.push({ path: 'planCode', message: 'planCode must be a valid plan identifier' });
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true };
}

/**
 * Validate feature access check request
 */
export function validateFeatureAccessRequest(body: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const reqBody = body as Record<string, unknown>;

  // Validate userId
  if (!reqBody.userId) {
    issues.push({ path: 'userId', message: 'userId is required' });
  } else if (typeof reqBody.userId !== 'string') {
    issues.push({ path: 'userId', message: 'userId must be a string' });
  } else if (!isValidUUID(reqBody.userId)) {
    issues.push({ path: 'userId', message: 'userId must be a valid UUID' });
  }

  // Validate feature
  if (!reqBody.feature) {
    issues.push({ path: 'feature', message: 'feature is required' });
  } else if (typeof reqBody.feature !== 'string') {
    issues.push({ path: 'feature', message: 'feature must be a string' });
  } else if (reqBody.feature.length === 0 || reqBody.feature.length > 100) {
    issues.push({ path: 'feature', message: 'feature must be between 1 and 100 characters' });
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: { page?: unknown; limit?: unknown }): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (params.page !== undefined) {
    const page = Number(params.page);
    if (isNaN(page) || page < 1) {
      issues.push({ path: 'page', message: 'page must be a positive integer' });
    }
  }

  if (params.limit !== undefined) {
    const limit = Number(params.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      issues.push({ path: 'limit', message: 'limit must be between 1 and 100' });
    }
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true };
}

/**
 * Validate date range
 */
export function validateDateRange(startDate?: string, endDate?: string): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      issues.push({ path: 'startDate', message: 'startDate must be a valid ISO 8601 date' });
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      issues.push({ path: 'endDate', message: 'endDate must be a valid ISO 8601 date' });
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      issues.push({ path: 'dateRange', message: 'startDate must be before endDate' });
    }
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true };
}
