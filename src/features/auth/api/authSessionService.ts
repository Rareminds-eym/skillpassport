/**
 * Auth Session Service (SSO Adapter)
 *
 * Provides the same API shape as the legacy Supabase `supabase.auth` calls
 * but routes everything through the SSO auth-client and Zustand auth store.
 *
 * This is a backward-compatibility layer so consumers that use:
 *   `authSessionService.getUser()` / `authSessionService.getSession()`
 * continue to work without changes.
 *
 * For new code, prefer:
 *   - React components: `useUser()` / `useIsAuthenticated()` from `@/shared/model/authStore`
 *   - Service files: `getCurrentUser()` / `getCurrentSession()` from `@/shared/api/authUtils`
 */

import { useAuthStore } from '@/shared/model/authStore';
import { ssoClient } from '@/shared/api/ssoClient';

/**
 * Get the current authenticated user.
 * Returns the same shape as `supabase.auth.getUser()` for drop-in replacement.
 */
const getUser = async () => {
  try {
    const state = useAuthStore.getState();
    const user = state.user;

    if (!user) {
      return { data: { user: null }, error: null };
    }

    // Map to Supabase-compatible user shape
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
 * Get the current session (access token + user info).
 * Returns the same shape as `supabase.auth.getSession()` for drop-in replacement.
 *
 * In SSO mode, the access token is held in memory by auth-client.
 * The refresh token is an HttpOnly cookie and is never exposed to JS.
 */
const getSession = async () => {
  try {
    const state = useAuthStore.getState();
    const user = state.user;
    const accessToken = ssoClient.getAccessToken();

    if (!accessToken || !user) {
      return { data: { session: null }, error: null };
    }

    // Map to Supabase-compatible session shape
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

export const authSessionService = {
  getUser,
  getSession,
};

// Named exports for barrel re-export convenience
export { getUser, getSession };
