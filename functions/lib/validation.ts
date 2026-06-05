/**
 * Shared validation utilities for API endpoints
 */

/**
 * Validate email format using a permissive regex that balances
 * security with usability. Avoids rejecting valid but uncommon email formats.
 * 
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Permissive regex that focuses on basic structure
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate that a string field is present and not empty/whitespace
 * 
 * @param value - Value to validate
 * @returns true if valid, false if missing or empty/whitespace
 */
export function isValidStringField(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate required fields in an object before type assertion
 * 
 * @param obj - Object to validate
 * @param fields - Array of required field names
 * @returns true if all fields are present and valid strings
 */
export function validateRequiredStringFields(obj: unknown, fields: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const typedObj = obj as Record<string, unknown>;
  return fields.every(field => isValidStringField(typedObj[field]));
}