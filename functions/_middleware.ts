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
import { getCorsHeaders, handleCorsPreflightRequest } from '../src/functions-lib/cors';
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

// Initialize SSO authentication at module level (runs once)
// This configures auth-core to verify JWTs from the SSO worker
// Note: In Cloudflare Pages Functions, env is not available at module level
// So we use hardcoded values here (can be overridden in production via wrangler.toml)
try {
  initAuth({
    ssoDomain: 'https://sso-api.dark-mode-d021.workers.dev',
    issuer: 'sso-api',
    audience: 'sso-client',
    ssoTimeoutMs: 5000,
  });
  console.log('✅ [Backend] SSO auth-core initialized successfully');
} catch (error) {
  console.error('❌ [Backend] SSO auth-core initialization failed:', error);
  // Re-throw to prevent worker startup with broken auth
  // This ensures we fail fast rather than serve requests with undefined auth behavior
  throw error;
}

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
  // Get origin from request
  const origin = context.request.headers.get('Origin');

  // Handle CORS preflight requests (OPTIONS)
  // This must return immediately without calling context.next()
  if (context.request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(origin);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Continue to the actual function handler
  // Note: Authentication is NOT enforced here - it's opt-in per route via withAuth()
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
