/**
 * Global CORS Middleware for Cloudflare Pages Functions
 * 
 * This middleware handles CORS for all Pages Functions automatically.
 * It intercepts all requests and adds appropriate CORS headers with origin validation.
 */

import { validateFileSizeConfig } from './api/storage/config/fileSizeLimits';
import { getCorsHeaders } from './lib/cors';
import type { PagesFunction } from './lib/types';

// Validate file size configuration at worker initialization
try {
  validateFileSizeConfig();
  console.log('✅ [Backend] File size configuration validated successfully');
} catch (error) {
  console.error('❌ [Backend] File size configuration validation failed:', error);
  throw error; // Prevent worker initialization
}

export const onRequest: PagesFunction = async (context) => {
  // Get origin from request
  const origin = context.request.headers.get('Origin');

  // Handle CORS preflight requests
  if (context.request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(origin);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // --- Edge-Level Auth Guard ---
  // Intercept requests to guest-only routes
  const url = new URL(context.request.url);
  let path = url.pathname;

  // Normalize trailing slash
  if (path.endsWith('/') && path.length > 1) {
    path = path.slice(0, -1);
  }

  const exactGuestRoutes = ['/login', '/signup', '/forgot-password', '/internal-testing'];
  const isGuestRoute = exactGuestRoutes.includes(path) ||
    path.startsWith('/login/') ||
    path.startsWith('/signup/') ||
    path.startsWith('/signin/') ||
    path.startsWith('/register/');

  // If visiting a guest route and SSO_SERVICE is available
  if (isGuestRoute && context.env.SSO_SERVICE) {
    const cookieHeader = context.request.headers.get('Cookie');
    let refreshToken = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)rm_sso_session=([^;]+)/);
      if (match) refreshToken = match[1];
    }

    if (refreshToken) {
      try {
        const { valid, roles } = await context.env.SSO_SERVICE.validateSession(refreshToken);

        if (valid && roles.length > 0) {
          // Check for deep linking parameters (with open-redirect protection)
          const rawReturnUrl = url.searchParams.get('returnUrl') || url.searchParams.get('redirect');
          let targetPath: string | null = null;

          // Validate returnUrl: must be a relative path, no protocol-relative URLs, 
          // no external domains, and must not redirect back to a guest route (loop prevention)
          if (rawReturnUrl
            && rawReturnUrl.startsWith('/')
            && !rawReturnUrl.startsWith('//')
            && !rawReturnUrl.includes('://')) {
            // Prevent redirect loops back to guest-only routes
            const returnNormalized = rawReturnUrl.split('?')[0]; // strip query params for matching
            const isGuestReturn = exactGuestRoutes.includes(returnNormalized) ||
              returnNormalized.startsWith('/signup/') ||
              returnNormalized.startsWith('/signin/') ||
              returnNormalized.startsWith('/register/') ||
              returnNormalized.startsWith('/login');
            if (!isGuestReturn) {
              targetPath = rawReturnUrl;
            }
          }

          if (!targetPath) {
            // MIRROR of ROLE_DASHBOARD_MAP in src/features/auth/lib/roleBasedRouter.ts — keep in sync
            const EDGE_ROLE_DASHBOARD_MAP: Record<string, string> = {
              learner: '/learner/dashboard',
              educator: '/educator/dashboard',
              school_educator: '/educator/dashboard',
              college_educator: '/educator/dashboard',
              college_admin: '/college-admin/dashboard',
              school_admin: '/school-admin/dashboard',
              university_admin: '/university-admin/dashboard',
              recruiter: '/recruitment/overview',
              hr: '/recruitment/overview',
              company_admin: '/recruitment/overview',
              admin: '/',
              owner: '/',
            };
            const primaryRole = roles[0] ?? 'learner';
            targetPath = EDGE_ROLE_DASHBOARD_MAP[primaryRole] ?? '/';
          }

          // Return a 302 Redirect before serving the SPA HTML
          return Response.redirect(new URL(targetPath, url.origin).toString(), 302);
        }
      } catch (err) {
        console.error('[Edge Guard] Session validation failed:', err);
        // Continue to serve the page if validation fails
      }
    }
  }
  // -----------------------------

  // Continue to the actual function handler
  const response = await context.next();

  // Do not wrap WebSocket upgrade responses (101) — the webSocket property
  // is non-serializable and would be lost by new Response(response.body, ...).
  if (response.status === 101) {
    return response;
  }

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
