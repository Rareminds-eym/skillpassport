/**
 * Secure Storage Wrapper for Supabase Auth Tokens
 *
 * This provides stable session persistence for Supabase auth.
 * Uses a stable obfuscation key stored in localStorage to prevent
 * session loss when browser/screen properties change.
 */

const STORAGE_KEY_NAME = 'sb-storage-key';

// Get or create a stable obfuscation key
const getOrCreateStableKey = (): string => {
  let key = localStorage.getItem(STORAGE_KEY_NAME);
  if (!key) {
    // Generate a random key and store it
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(STORAGE_KEY_NAME, key);
  }
  return key;
};

const obfuscate = (data: string): string => {
  try {
    const key = getOrCreateStableKey();
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    // Base64 encode to make it safe for storage
    return btoa(result);
  } catch {
    // If obfuscation fails, store as-is
    return data;
  }
};

const deobfuscate = (data: string, key: string): string => {
  try {
    const decoded = atob(data);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return '';
  }
};

// Try to deobfuscate with current key, handling legacy data gracefully
const tryDeobfuscate = (data: string): string | null => {
  const key = getOrCreateStableKey();

  // First, try to deobfuscate with current key
  const deobfuscated = deobfuscate(data, key);
  if (deobfuscated) {
    try {
      JSON.parse(deobfuscated);
      return deobfuscated;
    } catch {
      // Not valid JSON after deobfuscation
    }
  }

  // Check if data is already valid JSON (unobfuscated/legacy data)
  try {
    JSON.parse(data);
    return data;
  } catch {
    // Not valid JSON
  }

  // Data is corrupted or from old obfuscation key - return null to trigger re-auth
  return null;
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

    const result = tryDeobfuscate(item);
    if (result === null) {
      // Data is corrupted - remove it to prevent repeated failures
      // This will trigger Supabase to request re-authentication
      console.warn(`[secureStorage] Removing corrupted session data for key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }
    return result;
  },

  setItem(key: string, value: string): void {
    try {
      const obfuscated = obfuscate(value);
      localStorage.setItem(key, obfuscated);
    } catch (e) {
      // Fallback to plain storage if obfuscation fails
      console.warn('[secureStorage] Obfuscation failed, storing plain:', e);
      localStorage.setItem(key, value);
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    // Preserve the storage key when clearing
    const storageKey = localStorage.getItem(STORAGE_KEY_NAME);
    localStorage.clear();
    if (storageKey) {
      localStorage.setItem(STORAGE_KEY_NAME, storageKey);
    }
  },
};

export default secureStorage;
