/**
 * Auth Utilities for Data Access
 *
 * Provides helpers for service files that need authenticated access.
 * These replace the legacy `supabase.auth.getSession()` / `supabase.auth.getUser()` calls.
 *
 * For new code, prefer using `apiClient` (routes through Pages Functions)
 * or `ssoClient.fetch()` (attaches SSO token automatically).
 *
 * For React components, prefer the Zustand hooks from `@/shared/model/authStore`.
 */

import { useAuthStore } from '@/shared/model/authStore';
import { ssoClient } from '@/shared/api/ssoClient';

/**
 * Get the current user from the auth store.
 * Returns the same shape as the legacy `supabase.auth.getUser()` for drop-in replacement.
 * 
 * Note: This function is now async to ensure SSO session is initialized.
 *
 * @example
 * const { data: { user }, error } = await getCurrentUser();
 */
export const getCurrentUser = async () => {
  try {
    // Ensure session is initialized (idempotent if already initialized)
    await ssoClient.initSession();
    
    const state = useAuthStore.getState();
    const user = state.user;

    if (!user) {
      return { data: { user: null }, error: null };
    }

    // Map to Supabase-compatible user shape for consumers that expect it
    const mappedUser = {
      id: user.id,
      email: user.email ?? null,
      role: user.role ?? null,
      user_metadata: user.user_metadata ?? {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: '',
    };

    return { data: { user: mappedUser }, error: null };
  } catch (err: any) {
    return { data: { user: null }, error: err };
  }
};

/**
 * Get the current session from the SSO client + auth store.
 * Returns the same shape as the legacy `supabase.auth.getSession()` for drop-in replacement.
 *
 * Note: In SSO mode, the access token is held in memory by auth-client.
 * The refresh token is an HttpOnly cookie and is never exposed to JS.
 * 
 * Note: This function is now async to ensure SSO session is initialized.
 *
 * @example
 * const { data: { session }, error } = await getCurrentSession();
 */
export const getCurrentSession = async () => {
  try {
    // Ensure session is initialized (idempotent if already initialized)
    await ssoClient.initSession();
    
    const state = useAuthStore.getState();
    const user = state.user;
    const accessToken = ssoClient.getAccessToken();

    if (!accessToken || !user) {
      return { data: { session: null }, error: null };
    }

    // Map to Supabase-compatible session shape for consumers that expect it
    const session = {
      access_token: accessToken,
      refresh_token: '', // Never exposed in SSO mode (HttpOnly cookie)
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: user.id,
        email: user.email ?? null,
        role: user.role ?? null,
        user_metadata: user.user_metadata ?? {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    };

    return { data: { session }, error: null };
  } catch (err: any) {
    return { data: { session: null }, error: err };
  }
};

/**
 * Get the current access token string (convenience helper).
 * Returns null if not authenticated.
 */
export const getAccessToken = (): string | null => {
  try {
    return ssoClient.getAccessToken();
  } catch {
    return null;
  }
};

/**
 * Get auth headers for API calls that need Bearer token.
 * Returns empty object if not authenticated.
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAccessToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
};
