import { Navigate, useLocation } from 'react-router-dom';

import Loader from '@/shared/ui/Loader';

import { useAuthLoading, useIsAuthenticated, useUserRole } from '@/shared/model/authStore';

/**
 * Map a specific role to the general category this route guard recognises.
 *
 * ⚠️ UX-ONLY semantics — this is NOT the canonical category map. It intentionally
 * keeps the per-role buckets this guard has always used for routing (e.g.
 * `school_admin` → `school_admin`, `college_admin` → `college_admin`, rather than
 * collapsing them all into the broad `admin` category). The canonical role→category
 * grouping now lives in `ROLE_CATEGORIES` (`@/shared/types/generated/roles`).
 *
 * This map should IDEALLY derive from `ROLE_CATEGORIES`, but its buckets differ from
 * the canonical ones, so changing it would alter which routes a role can navigate to.
 * Behavior preservation is required (RBAC spec task 14.2), so the mapping is left
 * exactly as-is. Because this guard is UX-only (see the `ProtectedRoute` doc comment),
 * any divergence from the canonical categories is a cosmetic/navigation concern, never
 * a security one — server-side Functions enforce the real authorization.
 *
 * Exported additively for behavior-preservation testing (RBAC spec task 14.2 /
 * Property 10, PC-1). The mapping table is the golden routing contract.
 */
export const getRoleCategory = (role) => {
  const roleMap = {
    learner: 'learner',
    school_educator: 'educator',
    college_educator: 'educator',
    school_admin: 'school_admin',
    college_admin: 'college_admin',
    university_admin: 'university_admin',
    recruiter: 'recruiter',
    admin: 'admin',
  };
  return roleMap[role] || role;
};

/**
 * ProtectedRoute — a **UX-ONLY** client-side route guard.
 *
 * Purpose: improve UX by not rendering a page the user cannot use. It:
 *   - redirects UNAUTHENTICATED users to `/login` (preserving the return path), and
 *   - redirects AUTHENTICATED users whose role is not in `allowedRoles` to `/`.
 *
 * ⚠️ THIS IS NOT A SECURITY / AUTHORIZATION BOUNDARY. ⚠️
 * It runs entirely in the browser and is trivially bypassable client-side
 * (devtools, editing bundle state, calling APIs directly, etc.). Treat the
 * `role`/`isAuthenticated` values it reads as RENDER HINTS only.
 *
 * Real authorization is enforced SERVER-SIDE by the Cloudflare Pages Functions
 * backing each route's data and actions. Those handlers are wrapped with the
 * auth-core middleware (`withAuth` + `requireRole` / `requireAdmin` /
 * `requireProduct` / `requireFeatureAccess`) and authorize from the SSO-verified
 * JWT, never from client input. The invariant "every exported Function handler is
 * guarded or explicitly marked public" (CC-2 / FC-9) is enforced by the
 * guard-presence test at `src/__tests__/rbac/guardPresence.property.test.ts`
 * (RBAC spec task 11.4). That test — not this component — is the server-enforcement
 * guarantee.
 *
 * Role source: `useUserRole` here is the **auth-store** hook (JWT-derived `role`
 * from the verified SSO session), NOT the `useUserRole` resolver in
 * `@/entities/user/model/useUserRole`. No role resolution happens in this guard.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The protected subtree to render when access is allowed.
 * @param {string[]} [props.allowedRoles=[]] - Roles/categories allowed to view the route. Empty = any authenticated user.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = useIsAuthenticated();
  const { role } = useUserRole();
  const loading = useAuthLoading();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // Check if user's role (or its category) is in allowed roles
  const roleCategory = getRoleCategory(role);
  const hasAccess = allowedRoles.length === 0 ||
    allowedRoles.includes(role) ||
    allowedRoles.includes(roleCategory);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
