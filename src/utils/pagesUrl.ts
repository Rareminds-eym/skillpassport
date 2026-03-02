/**
 * Pages Function URL Utility
 * 
 * Provides consistent URL generation for Cloudflare Pages Functions.
 * All APIs are now served from the same origin under /api/*
 */

/**
 * Get the base URL for Pages Functions
 * Uses the current origin (works in dev and production)
 */
export function getPagesBaseUrl(): string {
  // In development, check if we're running on localhost:3000 and need to proxy to 8788
  if (window.location.origin === 'http://localhost:3000') {
    // Check if proxy is working by testing if we can reach the API
    return window.location.origin; // This will use the Vite proxy
  }
  return window.location.origin;
}

/**
 * Get the full URL for a specific Pages Function API
 * @param apiPath - The API path (e.g., 'assessment', 'career', 'course')
 * @returns Full URL to the Pages Function
 */
export function getPagesApiUrl(apiPath: string): string {
  const base = getPagesBaseUrl();
  const cleanPath = apiPath.startsWith('/') ? apiPath.slice(1) : apiPath;
  return `${base}/api/${cleanPath}`;
}

/**
 * Get auth headers for API calls
 */
export function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
