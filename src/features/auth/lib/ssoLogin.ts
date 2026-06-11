/**
 * SSO Login Helper
 *
 * Shared login flow for role-specific login pages (LoginAdmin, LoginLearner, etc.).
 * Performs SSO authentication via auth-client, verifies the user has the expected role,
 * and returns a typed result. UI components handle errors and redirects.
 */
import { AuthFetchError } from '@rareminds-eym/auth-client';
import { useAuthStore } from '@/shared/model/authStore';
import { PASSWORD_MIN } from '@/shared/constants';
import type { UserRole } from '@/features/auth/api';

export interface SsoLoginResult {
  success: boolean;
  error?: string;
  /** The role the user was authenticated as (from the JWT). */
  role?: string;
  /** All roles the user has. */
  roles?: string[];
}

/**
 * Map auth-client errors to user-friendly messages.
 */
function mapAuthError(err: unknown): string {
  if (err instanceof AuthFetchError) {
    if (err.status === 401) return 'Invalid email or password';
    if (err.status === 403) return 'Your account is not active. Contact support.';
    if (err.status === 429) return 'Too many attempts. Please try again in a few minutes.';
    if (err.status >= 500) return 'The authentication service is unavailable. Please try again.';
    return err.message || 'Authentication failed';
  }
  return (err as Error)?.message ?? 'An unexpected error occurred.';
}

/**
 * Perform SSO login and verify the user has at least one of the expected roles.
 *
 * @param email - User's email
 * @param password - User's password
 * @param expectedRoles - If provided, the user must have at least one of these roles
 * @returns Result with success flag and the matched role (if any)
 */
export async function ssoLoginWithRoleCheck(
  email: string,
  password: string,
  expectedRoles?: UserRole[],
): Promise<SsoLoginResult> {
  if (!email || !password) {
    return { success: false, error: 'Please enter both email and password' };
  }

  if (password.length < PASSWORD_MIN) {
    return { success: false, error: `Password must be at least ${PASSWORD_MIN} characters` };
  }

  try {
    const store = useAuthStore.getState();
    await store.login(email, password);

    const userRoles = useAuthStore.getState().user?.roles ?? [];

    if (expectedRoles && expectedRoles.length > 0) {
      const matchedRole = expectedRoles.find((r) => userRoles.includes(r));
      if (!matchedRole) {
        // User authenticated but doesn't have the required role — log them out
        await store.logout();
        return {
          success: false,
          error: `You do not have access to this portal.`,
        };
      }

      // Update the primary role to match what the user logged in as
      useAuthStore.setState({ role: matchedRole });

      return { success: true, role: matchedRole, roles: userRoles };
    }

    return {
      success: true,
      role: useAuthStore.getState().role ?? undefined,
      roles: userRoles,
    };
  } catch (err) {
    return { success: false, error: mapAuthError(err) };
  }
}
