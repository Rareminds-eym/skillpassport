/**
 * Phone number formatting utility
 * Removes non-digits and country code prefix for email-worker API
 */

/**
 * Format phone number for email-worker API
 * Removes non-digits and country code prefix
 * 
 * @param phone - Raw phone number (may contain spaces, dashes, etc.)
 * @param countryCode - Country code with + prefix (e.g., '+91')
 * @returns Cleaned phone number without country code
 * 
 * @example
 * formatPhoneNumber('+91 98765 43210', '+91') // '9876543210'
 * formatPhoneNumber('09876543210', '+91')     // '9876543210'
 * formatPhoneNumber('919876543210', '+91')    // '9876543210'
 */
export function formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Check for empty string after stripping non-digits
  if (cleaned.length === 0) {
    throw new Error('Phone number contains no digits');
  }
  
  // Remove single leading zero
  cleaned = cleaned.replace(/^0/, '');
  
  // If number starts with country code (without +), remove it
  const numericCountryCode = countryCode.replace('+', '');
  const withoutCode = cleaned.slice(numericCountryCode.length);
  if (cleaned.startsWith(numericCountryCode) && withoutCode.length >= 7) {
    cleaned = withoutCode;
  }
  
  return cleaned;
}
