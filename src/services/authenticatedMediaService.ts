/**
 * Authenticated Media Service
 * 
 * Handles fetching authenticated URLs for course media (videos, PDFs, etc.)
 * Ensures media can only be accessed by enrolled users on their registered device.
 */

import { supabase } from '../lib/supabaseClient';
import { getBrowserFingerprint, getDeviceContext } from '../utils/fingerprint';

interface AuthenticatedUrlResponse {
  success: boolean;
  url?: string;
  expiresIn?: number;
  expiresAt?: string;
  error?: string;
}

/**
 * Get authenticated URL for a media file
 * @param fileUrl - Original file URL or key
 * @param courseId - Course ID
 * @param lessonId - Optional lesson ID
 * @returns Authenticated URL that only works for the current user and device
 */
export async function getAuthenticatedMediaUrl(
  fileUrl: string,
  courseId: string,
  lessonId?: string
): Promise<string | null> {
  try {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('[AuthMedia] No active session');
      return null;
    }

    // Get browser fingerprint and session ID
    const fingerprint = await getBrowserFingerprint();
    const deviceContext = getDeviceContext();
    const sessionId = deviceContext.sessionId;

    // Call authenticated URL endpoint
    const response = await fetch('/api/storage/get-authenticated-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fileUrl,
        courseId,
        lessonId,
        fingerprint,
        sessionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[AuthMedia] Failed to get authenticated URL:', error);
      return null;
    }

    const data: AuthenticatedUrlResponse = await response.json();
    
    if (!data.success || !data.url) {
      console.error('[AuthMedia] Invalid response:', data);
      return null;
    }

    // Append fingerprint to URL for validation (NOT session ID - that's validated separately)
    const urlWithFp = `${data.url}&fp=${encodeURIComponent(fingerprint)}`;
    return urlWithFp;
  } catch (error) {
    console.error('[AuthMedia] Error getting authenticated URL:', error);
    return null;
  }
}

/**
 * Batch get authenticated URLs for multiple files
 * @param files - Array of file info
 * @param courseId - Course ID
 * @param lessonId - Optional lesson ID
 * @returns Map of original URL to authenticated URL
 */
export async function getAuthenticatedMediaUrls(
  files: Array<{ url: string; lessonId?: string }>,
  courseId: string
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  // Process in parallel
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const authUrl = await getAuthenticatedMediaUrl(
        file.url,
        courseId,
        file.lessonId
      );
      return { original: file.url, authenticated: authUrl };
    })
  );

  // Collect successful results
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.authenticated) {
      urlMap.set(result.value.original, result.value.authenticated);
    }
  });

  return urlMap;
}

/**
 * Check if a URL needs authentication
 * @param url - URL to check
 * @returns True if URL is from R2 storage and needs authentication
 */
export function needsAuthentication(url: string): boolean {
  if (!url) return false;
  
  // Check if it's an R2 URL
  if (url.includes('.r2.cloudflarestorage.com') || url.includes('.r2.dev')) {
    return true;
  }
  
  // Check if it's a file key (starts with 'courses/' or contains '/lessons/')
  if (url.startsWith('courses/') || url.includes('/lessons/')) {
    return true;
  }
  
  // Already authenticated proxy URL
  if (url.includes('/api/storage/media-proxy')) {
    return false;
  }
  
  return false;
}

/**
 * Extract file key from URL
 * @param url - URL to extract from
 * @returns File key or null
 */
export function extractFileKey(url: string): string | null {
  if (!url) return null;
  
  try {
    // Direct file key
    if (!url.includes('://') && !url.startsWith('/')) {
      return url;
    }

    // R2 presigned URL
    if (url.includes('.r2.cloudflarestorage.com/')) {
      const match = url.match(/\.r2\.cloudflarestorage\.com\/[^/]+\/(.+?)(\?|$)/);
      if (match) {
        return decodeURIComponent(match[1]);
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
    console.error('[AuthMedia] Error extracting file key:', error);
    return null;
  }
}
