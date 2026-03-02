/**
 * Server-side Fingerprint Validation
 * 
 * Validates that requests come from the same device that generated the token.
 * Prevents URL sharing across different devices/browsers.
 */

/**
 * Device context stored in token
 */
export interface DeviceContext {
  fingerprint: string;
  userAgent: string;
  platform?: string;
  language?: string;
}

/**
 * Validate device fingerprint matches token
 * @param tokenFingerprint - Fingerprint stored in token
 * @param requestFingerprint - Fingerprint from current request
 * @param tokenUserAgent - User-Agent stored in token
 * @param requestUserAgent - User-Agent from current request
 * @returns True if device matches
 */
export function validateDeviceFingerprint(
  tokenFingerprint: string,
  requestFingerprint: string,
  tokenUserAgent: string,
  requestUserAgent: string
): { valid: boolean; reason?: string } {
  // Fingerprint must match exactly
  if (tokenFingerprint !== requestFingerprint) {
    return {
      valid: false,
      reason: 'Device fingerprint mismatch - token was generated on a different device',
    };
  }

  // User-Agent must match (with some tolerance for minor version changes)
  if (!userAgentsMatch(tokenUserAgent, requestUserAgent)) {
    return {
      valid: false,
      reason: 'Browser mismatch - token was generated in a different browser',
    };
  }

  return { valid: true };
}

/**
 * Check if two User-Agent strings are from the same browser
 * Allows minor version differences but not major browser changes
 */
function userAgentsMatch(ua1: string, ua2: string): boolean {
  // Exact match
  if (ua1 === ua2) return true;

  // Extract browser name and major version
  const browser1 = extractBrowserInfo(ua1);
  const browser2 = extractBrowserInfo(ua2);

  // Browser name must match
  if (browser1.name !== browser2.name) return false;

  // Major version must match (allow minor version changes)
  if (browser1.majorVersion !== browser2.majorVersion) return false;

  // OS must match
  if (browser1.os !== browser2.os) return false;

  return true;
}

/**
 * Extract browser information from User-Agent
 */
function extractBrowserInfo(userAgent: string): {
  name: string;
  majorVersion: string;
  os: string;
} {
  let name = 'unknown';
  let majorVersion = '0';
  let os = 'unknown';

  // Detect browser
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    majorVersion = match ? match[1] : '0';
  } else if (userAgent.includes('Firefox/')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    majorVersion = match ? match[1] : '0';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    majorVersion = match ? match[1] : '0';
  } else if (userAgent.includes('Edg/')) {
    name = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    majorVersion = match ? match[1] : '0';
  }

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  return { name, majorVersion, os };
}

/**
 * Validate Referer header
 * @param referer - Referer header from request
 * @param allowedDomains - List of allowed domains
 * @returns True if referer is valid
 */
export function validateReferer(
  referer: string | null,
  allowedDomains: string[]
): { valid: boolean; reason?: string } {
  // Allow empty referer for direct navigation (first load)
  if (!referer) {
    return { valid: true };
  }

  try {
    const refererUrl = new URL(referer);
    const refererHost = refererUrl.hostname;

    // Check if referer matches any allowed domain
    const isAllowed = allowedDomains.some(domain => {
      return refererHost === domain || refererHost.endsWith(`.${domain}`);
    });

    if (!isAllowed) {
      return {
        valid: false,
        reason: `Request from unauthorized domain: ${refererHost}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: 'Invalid referer header',
    };
  }
}
