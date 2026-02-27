/**
 * Token Crypto Utilities
 * 
 * Generates and validates HMAC-signed tokens for authenticated media access.
 * Tokens are time-limited and tied to specific users, courses, and files.
 */

interface TokenPayload {
  userId: string;
  courseId: string;
  lessonId?: string;
  fileKey: string;
  exp: number;
  iat: number;
}

/**
 * Generate HMAC-SHA256 signature
 */
async function generateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Verify HMAC-SHA256 signature
 */
async function verifySignature(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateSignature(data, secret);
  return signature === expectedSignature;
}

/**
 * Generate authenticated token for media access
 */
export async function generateMediaToken(
  userId: string,
  courseId: string,
  fileKey: string,
  secret: string,
  expiresInSeconds: number = 3600,
  lessonId?: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const payload: TokenPayload = {
    userId,
    courseId,
    lessonId,
    fileKey,
    exp: now + expiresInSeconds,
    iat: now,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = btoa(payloadStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const signature = await generateSignature(payloadB64, secret);

  return `${payloadB64}.${signature}`;
}

/**
 * Validate and decode media token
 */
export async function validateMediaToken(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: TokenPayload; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [payloadB64, signature] = parts;

    // Verify signature
    const isValid = await verifySignature(payloadB64, signature, secret);
    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode payload
    const payloadStr = atob(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    );
    const payload: TokenPayload = JSON.parse(payloadStr);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    // Validate required fields
    if (!payload.userId || !payload.courseId || !payload.fileKey) {
      return { valid: false, error: 'Missing required fields' };
    }

    return { valid: true, payload };
  } catch (error) {
    console.error('[TokenCrypto] Validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Extract file key from various URL formats
 */
export function extractFileKey(url: string): string | null {
  try {
    // Direct file key
    if (!url.includes('://') && !url.startsWith('/')) {
      return url;
    }

    // URL with key parameter
    if (url.includes('?key=')) {
      const urlObj = new URL(url);
      return decodeURIComponent(urlObj.searchParams.get('key') || '');
    }

    // R2 presigned URL
    if (url.includes('.r2.cloudflarestorage.com/')) {
      // Match everything after bucket name
      // URL format: https://account.r2.cloudflarestorage.com/bucket-name/path/to/file?params
      const match = url.match(/\.r2\.cloudflarestorage\.com\/[^/]+\/(.+?)(?:\?|$)/);
      if (match) {
        const extracted = decodeURIComponent(match[1]);
        console.log('[extractFileKey] R2 URL extracted:', { url, extracted });
        
        // If the extracted path doesn't start with 'courses/' but contains '/lessons/',
        // it might be missing the 'courses/' prefix - add it
        if (!extracted.startsWith('courses/') && extracted.includes('/lessons/')) {
          const withPrefix = `courses/${extracted}`;
          console.log('[extractFileKey] Added courses/ prefix:', withPrefix);
          return withPrefix;
        }
        
        return extracted;
      }
    }

    // Public R2 URL
    if (url.includes('.r2.dev/')) {
      const parts = url.split('.r2.dev/');
      if (parts.length > 1) {
        return decodeURIComponent(parts[1].split('?')[0]);
      }
    }

    // Path-based URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
    
    // Return if it looks like a valid file key
    // Support both formats: courses/... or courseId/lessons/...
    if (key.includes('courses/') || key.includes('/lessons/')) {
      return decodeURIComponent(key);
    }

    return null;
  } catch (error) {
    console.error('[TokenCrypto] Error extracting file key:', error);
    return null;
  }
}
