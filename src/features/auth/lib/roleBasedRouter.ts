import { getOrgContext } from '@/entities/recruitment/api/orgContextService';
import { NavigateFunction } from 'react-router-dom';

/**
 * Role-based routing configuration
 * Maps user roles to their respective dashboard routes
 *
 * This is the single source of truth for role → dashboard URL mapping.
 * All SPA components and helpers MUST import from here instead of
 * maintaining their own local copies.
 */
export const ROLE_DASHBOARD_MAP: Record<string, string> = {
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

/**
 * Get the dashboard route for a specific role
 * @param role - User role
 * @returns Dashboard route path, falling back to '/' for unknown roles
 */
export const getRouteForRole = (role: string): string =>
  ROLE_DASHBOARD_MAP[role] ?? '/';

/**
 * Redirect user to their role-specific dashboard
 * For recruiters, checks organization context to determine if they should go to admin dashboard
 * @param role - User role
 * @param navigate - React Router navigate function
 */
export const redirectToRoleDashboard = async (
  role: string,
  navigate: NavigateFunction
): Promise<void> => {
  console.log('[roleBasedRouter] Redirecting to dashboard', { role });

  // Special handling for recruiters - check if they're an admin
  if (role === 'recruiter') {
    try {
      console.log('[roleBasedRouter] Fetching org context for recruiter...');
      const orgContext = await getOrgContext();

      console.log('[roleBasedRouter] Org context fetched', {
        hasContext: !!orgContext,
        recruitmentRole: orgContext?.recruitmentRole,
        orgId: orgContext?.orgId,
        orgName: orgContext?.orgName,
      });

      // If user is a company admin, redirect to admin dashboard
      if (orgContext?.recruitmentRole === 'company_admin') {
        console.log('[roleBasedRouter] User is company_admin, redirecting to /recruitment/admin');
        navigate('/recruitment/admin', { replace: true });
        return;
      }

      console.log('[roleBasedRouter] User is not company_admin, using default recruiter route');
    } catch (error) {
      // If org context fetch fails, fall back to default recruiter route
      console.error('[roleBasedRouter] Failed to fetch org context for routing:', error);
    }
  }

  // Default routing for all other roles and non-admin recruiters
  const route = getRouteForRole(role);
  console.log('[roleBasedRouter] Navigating to default route', { role, route });
  navigate(route, { replace: true });
};

/**
 * Check if a route is valid for a given role
 * @param role - User role
 * @param route - Route to check
 * @returns True if route is valid for role
 */
export const isValidRouteForRole = (role: string, route: string): boolean => {
  const validRoute = ROLE_DASHBOARD_MAP[role];
  if (!validRoute) return false;
  return route.startsWith(validRoute.split('/')[1]);
};
