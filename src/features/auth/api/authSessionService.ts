/**
 * Auth Session Service (SSO Adapter)
 *
 * This module previously called supabase.auth directly.
 * It now delegates to the SSO auth store for backward compatibility
 * with the 20+ consumer files that import it.
 *
 * @deprecated Consumers should migrate to using `useAuthStore` or `useUser()` directly.
 */
import { useAuthStore } from '@/shared/model/authStore';

/**
 * Get current user from the SSO auth store.
 * @deprecated Use `useAuthStore.getState().user` or `useUser()` hook instead.
 */
export const getUser = async () => {
  const { user } = useAuthStore.getState();
  if (!user) {
    return { data: { user: null }, error: { message: 'Not authenticated' } };
  }
  return {
    data: {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          role: user.role,
          user_role: user.role,
        },
      },
    },
    error: null,
  };
};

/**
 * Get current session info from the SSO auth store.
 * @deprecated Use `useAuthStore.getState().isAuthenticated` instead.
 */
export const getSession = async () => {
  const { user, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !user) {
    return { data: { session: null }, error: null };
  }
  return {
    data: {
      session: {
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
};

/**
 * Bundled service object for backward compatibility.
 * @deprecated Import individual functions or use the auth store directly.
 */
export const authSessionService = {
  getUser,
  getSession,
};

export default authSessionService;
