/**
 * Global Middleware for Cloudflare Pages Functions
 *
 * This middleware handles:
 * 1. CORS for all Pages Functions with origin validation
 * 2. SSO authentication initialization (auth-core)
 *
 * It intercepts all requests and adds appropriate CORS headers.
 * Individual routes can use withAuth() for authentication.
 */

import type { PagesFunction } from '../src/functions-lib/types';
import { getCorsHeaders } from '../src/functions-lib/cors';
import { validateFileSizeConfig } from './api/storage/config/fileSizeLimits';
import { initAuth, withAuth, requireRole, requireProduct } from '@rareminds-eym/auth-core';

// ============================================================================
// INITIALIZATION - Runs once at worker startup
// ============================================================================

// Validate file size configuration at worker initialization
try {
  validateFileSizeConfig();
  console.log('✅ [Backend] File size configuration validated successfully');
} catch (error) {
  console.error('❌ [Backend] File size configuration validation failed:', error);
  throw error; // Prevent worker initialization
}

// SSO authentication initialization state
// Lazy initialization on first request to access context.env
let authInitialized = false;
let authInitError: Error | null = null;

// ============================================================================
// EXPORTS - Available to all API routes
// ============================================================================

// Export auth middleware for route protection
// Usage in routes: export const onRequestGet = withAuth(async (context) => { ... })
export { withAuth, requireRole, requireProduct };

// ============================================================================
// GLOBAL MIDDLEWARE - Runs on every request
// ============================================================================

export const onRequest: PagesFunction = async (context) => {
  // Initialize SSO auth on first request (lazy initialization)
  // This allows access to context.env for environment-specific configuration
  // Retries on every request until successful
  if (!authInitialized) {
    try {
      const env = context.env as Record<string, string>;

      // Validate all required SSO environment variables are present
      // Fails fast with a clear error message if any are missing
      if (!env.SSO_DOMAIN || !env.SSO_ISSUER || !env.SSO_AUDIENCE) {
        throw new Error(
          'Missing required SSO environment variables: ' +
          [
            !env.SSO_DOMAIN   && 'SSO_DOMAIN',
            !env.SSO_ISSUER   && 'SSO_ISSUER',
            !env.SSO_AUDIENCE && 'SSO_AUDIENCE',
          ]
            .filter(Boolean)
            .join(', ')
        );
      }

      initAuth({
        ssoDomain:    env.SSO_DOMAIN,
        issuer:       env.SSO_ISSUER,
        audience:     env.SSO_AUDIENCE,
        ssoTimeoutMs: Number(env.SSO_TIMEOUT_MS) || 5000,
      });

      // Clear any previous error — initialization succeeded
      authInitialized = true;
      authInitError = null;
      console.log('✅ [Backend] SSO auth-core initialized successfully');

    } catch (error) {
      authInitError = error instanceof Error
        ? error
        : new Error(String(error));
      console.error(
        '❌ [Backend] SSO auth-core initialization failed:',
        authInitError.message
      );
      // Do not throw — public routes must continue working
      // Protected routes will fail gracefully via withAuth middleware
    }
  }

  // If auth failed to initialize, log a warning on every request
  // so protected routes that reach withAuth() have context in logs
  if (authInitError) {
    console.warn(
      '[Backend] Auth init previously failed — protected routes may return 401.',
      'Error:', authInitError.message
    );
  }

  // Get origin from request
  const origin = context.request.headers.get('Origin');

  // Handle CORS preflight requests (OPTIONS)
  // Must return immediately without calling context.next()
  if (context.request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(origin);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Continue to the actual route handler
  // Authentication is NOT enforced here — it is opt-in per route via withAuth()
  const response = await context.next();

  // Add CORS headers to the response with origin validation
  const corsHeaders = getCorsHeaders(origin);
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};