/**
 * Browser Fingerprinting Utility
 * 
 * Generates a unique, stable fingerprint for the current browser/device.
 * Used to bind authentication tokens to specific devices.
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;

/**
 * Initialize FingerprintJS (singleton pattern)
 */
function initFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * Get browser fingerprint
 * @returns Unique fingerprint hash for this browser/device
 */
export async function getBrowserFingerprint(): Promise<string> {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    // Fallback to basic fingerprint
    return generateBasicFingerprint();
  }
}

/**
 * Fallback fingerprint using basic browser properties
 */
function generateBasicFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ];
  
  const fingerprint = components.join('|');
  return hashString(fingerprint);
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get additional device context for validation
 */
export function getDeviceContext() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionId: getOrCreateSessionId(),
  };
}

/**
 * Get or create a session ID stored in sessionStorage
 * This will be different in incognito mode
 */
function getOrCreateSessionId(): string {
  try {
    const key = '__device_session_id';
    let sessionId = sessionStorage.getItem(key);
    
    if (!sessionId) {
      sessionId = generateRandomId();
      sessionStorage.setItem(key, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // SessionStorage might be blocked
    return 'no-session';
  }
}

/**
 * Generate a random session ID
 */
function generateRandomId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
