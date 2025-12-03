/**
 * Secure Storage Wrapper for Supabase Auth Tokens
 * 
 * This provides obfuscation of auth tokens in localStorage.
 * Note: True client-side encryption is limited since the key must be accessible,
 * but this prevents casual inspection of tokens in browser dev tools.
 */

// Simple XOR-based obfuscation with a derived key
const getObfuscationKey = (): string => {
  // Derive key from browser fingerprint-like data
  const baseKey = [
    navigator.userAgent.length.toString(36),
    screen.width.toString(36),
    screen.height.toString(36),
    new Date().getTimezoneOffset().toString(36),
  ].join('-');
  return baseKey;
};

const obfuscate = (data: string): string => {
  const key = getObfuscationKey();
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  // Base64 encode to make it safe for storage
  return btoa(result);
};

const deobfuscate = (data: string): string => {
  try {
    const key = getObfuscationKey();
    const decoded = atob(data);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    // If decoding fails, return empty string
    return '';
  }
};

export const secureStorage: Storage = {
  get length(): number {
    return localStorage.length;
  },

  key(index: number): string | null {
    return localStorage.key(index);
  },

  getItem(key: string): string | null {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    
    try {
      // Try to deobfuscate
      const deobfuscated = deobfuscate(item);
      // Validate it's valid JSON (Supabase stores JSON)
      JSON.parse(deobfuscated);
      return deobfuscated;
    } catch {
      // If deobfuscation fails, might be legacy unencrypted data
      // Return as-is for backward compatibility
      return item;
    }
  },

  setItem(key: string, value: string): void {
    const obfuscated = obfuscate(value);
    localStorage.setItem(key, obfuscated);
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};

export default secureStorage;
