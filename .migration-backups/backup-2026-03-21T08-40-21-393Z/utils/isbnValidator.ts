/**
 * ISBN Validation Utility
 * Supports both ISBN-10 (pre-2007) and ISBN-13 (post-2007) formats
 */

/**
 * Clean ISBN by removing hyphens and spaces
 */
function cleanISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, '');
}

/**
 * Validate ISBN-10 with checksum
 * Format: 10 digits where last digit can be X (representing 10)
 */
function validateISBN10(isbn: string): boolean {
  const cleaned = cleanISBN(isbn);
  
  // Must be exactly 10 characters
  if (cleaned.length !== 10) return false;
  
  // First 9 must be digits, last can be digit or X
  if (!/^\d{9}[\dX]$/.test(cleaned)) return false;
  
  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  
  // Last digit
  const checkDigit = cleaned[9] === 'X' ? 10 : parseInt(cleaned[9]);
  sum += checkDigit;
  
  // Valid if sum is divisible by 11
  return sum % 11 === 0;
}

/**
 * Validate ISBN-13 with checksum
 * Format: 13 digits, usually starts with 978 or 979
 */
function validateISBN13(isbn: string): boolean {
  const cleaned = cleanISBN(isbn);
  
  // Must be exactly 13 digits
  if (cleaned.length !== 13) return false;
  
  // Must be all digits
  if (!/^\d{13}$/.test(cleaned)) return false;
  
  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleaned[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checkDigit = parseInt(cleaned[12]);
  const calculatedCheck = (10 - (sum % 10)) % 10;
  
  // Valid if check digit matches
  return checkDigit === calculatedCheck;
}

/**
 * Main ISBN validation function
 * Accepts both ISBN-10 and ISBN-13
 */
export function validateISBN(isbn: string): { valid: boolean; type: 'ISBN-10' | 'ISBN-13' | null; message: string } {
  if (!isbn || isbn.trim() === '') {
    return { valid: false, type: null, message: 'ISBN is required' };
  }
  
  const cleaned = cleanISBN(isbn);
  
  // Check length to determine type
  if (cleaned.length === 10) {
    const isValid = validateISBN10(cleaned);
    return {
      valid: isValid,
      type: 'ISBN-10',
      message: isValid ? 'Valid ISBN-10' : 'Invalid ISBN-10 checksum'
    };
  } else if (cleaned.length === 13) {
    const isValid = validateISBN13(cleaned);
    return {
      valid: isValid,
      type: 'ISBN-13',
      message: isValid ? 'Valid ISBN-13' : 'Invalid ISBN-13 checksum'
    };
  } else {
    return {
      valid: false,
      type: null,
      message: 'ISBN must be 10 or 13 digits (hyphens and spaces allowed)'
    };
  }
}

/**
 * Format ISBN with hyphens for display
 * ISBN-10: X-XXX-XXXXX-X
 * ISBN-13: XXX-X-XXX-XXXXX-X
 */
export function formatISBN(isbn: string): string {
  const cleaned = cleanISBN(isbn);
  
  if (cleaned.length === 10) {
    // Format: 1-234-56789-0
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.length === 13) {
    // Format: 978-1-234-56789-0
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7, 12)}-${cleaned.slice(12)}`;
  }
  
  return isbn;
}

/**
 * Convert ISBN-10 to ISBN-13
 * Adds 978 prefix and recalculates check digit
 */
export function convertISBN10to13(isbn10: string): string | null {
  const cleaned = cleanISBN(isbn10);
  
  if (cleaned.length !== 10 || !validateISBN10(cleaned)) {
    return null;
  }
  
  // Remove old check digit and add 978 prefix
  const base = '978' + cleaned.slice(0, 9);
  
  // Calculate new check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return base + checkDigit;
}
