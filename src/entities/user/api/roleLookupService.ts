import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
// Canonical SSO `UserRole` — single source of truth (Phase P1, task 6.2).
// The `lookup-user-roles` action returns SSO roles (learner / recruiter /
// educator / school_admin / college_admin / university_admin — all members of
// `SSO_ROLES`), so the canonical `UserRole` is the correct type here.
import { UserRole } from '@/shared/types/generated/roles';

const logger = getLogger('role-lookup-service');

export interface UserData {
  id: string;
  email: string;
  name?: string;
  school_id?: string;
  university_college_id?: string;
  [key: string]: any;
}

export interface RoleLookupResult {
  role: UserRole | null;
  roles?: UserRole[]; // Multiple roles if user has more than one
  userData: UserData | null;
  allUserData?: UserData[]; // All user data for each role
  error?: string;
}

/**
 * Role Lookup Service — ADVISORY / UX (login-time role discovery).
 *
 * Thin client over the enforcing Function `/user/actions`
 * (`action: 'lookup-user-roles'`). Used at login to discover which role(s) a
 * user has so the app can route to the correct dashboard. It is NOT an
 * authorization boundary: the destination Functions independently enforce
 * access (auth-core guards + `resolveSchoolRole`), so this result only affects
 * routing/UX, never a security decision.
 *
 * NOTE (§7.5/§7.10): `lookup-user-roles` is the legacy frontend-resolver path,
 * allowlisted for task 13 in the JWT-only test (12.3). This task makes the
 * CLIENT advisory only; fully neutralizing/replacing the server lookup endpoint
 * (re-pointing to the SSO JWT as the canonical source) is broader and is
 * deferred to the `lookup-user-roles` reconciliation per the handler's TODO.
 * It must only ever be invoked for the current (authenticated) user. In
 * practice the production login flow already resolves the role from the auth
 * store (`features/auth/api` `getUserRole`), so this service is advisory-only.
 */

/**
 * Determine user role(s) for login-time routing/UX (ADVISORY — not authz).
 *
 * Calls the enforcing Function `/user/actions` (`lookup-user-roles`). The
 * returned role/roles drive dashboard routing only; the destination Functions
 * enforce real authorization.
 *
 * @param userId - the (current) authenticated user's id
 * @param email - the user's email
 * @returns RoleLookupResult with role(s) and user data
 */
export const getUserRole = async (userId: string, email: string): Promise<RoleLookupResult> => {
  try {
    const response: any = await apiPost('/user/actions', { action: 'lookup-user-roles', userId, email });
    return response?.data ?? { role: null, userData: null, error: 'System error. Please try again' };
  } catch (error) {
    logger.error('Role lookup error', error as Error);
    return {
      role: null,
      userData: null,
      error: 'System error. Please try again'
    };
  }
};
