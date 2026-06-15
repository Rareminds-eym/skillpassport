import { AuthClient } from '@rareminds-eym/auth-client';

const SSO_BASE_URL = import.meta.env.VITE_SSO_URL;

if (!SSO_BASE_URL) {
  console.warn('[ssoClient] VITE_SSO_URL is not set. SSO auth will not work.');
}

/**
 * SSO AuthClient singleton.
 *
 * Handles login, signup, token refresh, cross-tab sync, and authenticated fetch.
 * The refresh token is stored as an HttpOnly cookie by the SSO worker.
 * The access token is held in memory only (never localStorage).
 */
export const ssoClient = new AuthClient({
  baseURL: SSO_BASE_URL || '',
  onSessionExpired: () => {
    // Dispatch event to auth store instead of hard page reload to avoid infinite redirect loops
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sso-session-expired'));
    }
  },
  debug: import.meta.env.DEV,
});
