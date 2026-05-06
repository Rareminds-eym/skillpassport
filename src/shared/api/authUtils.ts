import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
/**
 * Auth Utilities for Data Access
 *
 * Provides helpers for service files that need authenticated access.
 * These replace the legacy `supabase.auth.getSession()` / `supabase.auth.getUser()` calls.
 *
 * For new code, prefer using `apiClient` (routes through Pages Functions)
 * or `ssoClient.fetch()` (attaches SSO token automatically).
 */
import { ssoClient } from './ssoClient';
import { useAuthStore } from '@/shared/model/authStore';

/**
 * Get the current access token for authenticated requests.
 * Returns null if not authenticated.
 *
 * @deprecated Prefer `ssoClient.fetch()` or `apiClient` which handle tokens automatically.
 */
export function getAccessToken(): string | null {
  return ssoClient.getAccessToken();
}

/**
 * Get auth headers for manual fetch calls.
 * Returns an object with the Authorization header if authenticated.
 *
 * @deprecated Prefer `ssoClient.fetch()` which attaches headers automatically.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = ssoClient.getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Get the current authenticated user.
 * Returns null if not authenticated.
 *
 * Replaces: `const { data: { user } } = getCurrentUser()`
 */
export function getCurrentUser() {
  const user = useAuthStore.getState().user;
  if (!user) return { data: { user: null }, error: { message: 'Not authenticated' } };
  return {
    data: {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          role: user.role,
          user_role: user.role,
          name: user.name,
        },
      },
    },
    error: null,
  };
}

/**
 * Get the current session (SSO-compatible shim).
 * Returns a session-like object with the access token.
 *
 * Replaces: `const { data: { session } } = getCurrentSession()`
 */
export function getCurrentSession() {
  const token = ssoClient.getAccessToken();
  const user = useAuthStore.getState().user;

  if (!token || !user) {
    return { data: { session: null }, error: null };
  }

  return {
    data: {
      session: {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            role: user.role,
            user_role: user.role,
          },
        },
      },
    },
    error: null,
  };
}
