import { AuthClient } from '@rareminds-eym/auth-client';

const SSO_BASE_URL = '/api';

/**
 * SSO AuthClient singleton.
 *
 * Handles login, signup, token refresh, cross-tab sync, and authenticated fetch.
 * The refresh token is stored as an HttpOnly cookie by the SSO worker.
 * The access token is held in memory only (never localStorage).
 *
 * Uses Pages Functions API proxy to SSO Worker:
 * - baseURL: '/api' → AuthClient appends 'auth/' → becomes '/api/auth/'
 * - AuthClient calls: POST /api/auth/login, POST /api/auth/signup, etc.
 * - Pages Functions [[path]].ts catch-all routes these to SSO Worker via service binding
 * - Specific endpoints (password reset, change password, delete account) → /api/auth/admin-reset-password, etc.
 * - No direct VITE_SSO_URL needed - frontend never exposes SSO URL
 */
export const ssoClient = new AuthClient({
  baseURL: SSO_BASE_URL,
  onSessionExpired: () => {
    // Dispatch event to auth store instead of hard page reload to avoid infinite redirect loops
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sso-session-expired'));
    }
  },
  debug: import.meta.env.DEV,
});
