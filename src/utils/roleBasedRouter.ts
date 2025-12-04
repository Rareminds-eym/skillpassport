import { NavigateFunction } from 'react-router-dom';
import { UserRole } from '../services/unifiedAuthService';

/**
 * Role-based routing configuration
 * Maps user roles to their respective dashboard routes
 */
const ROLE_ROUTES: Record<UserRole, string> = {
  student: '/student/dashboard',
  recruiter: '/recruitment/overview',
  educator: '/educator/dashboard',
  school_admin: '/school-admin/dashboard',
  college_admin: '/college-admin/dashboard',
  university_admin: '/university-admin/dashboard',
};

/**
 * Get the dashboard route for a specific role
 * @param role - User role
 * @returns Dashboard route path
 */
export const getRouteForRole = (role: UserRole): string => {
  return ROLE_ROUTES[role] || '/';
};

/**
 * Redirect user to their role-specific dashboard
 * @param role - User role
 * @param navigate - React Router navigate function
 */
export const redirectToRoleDashboard = (role: UserRole, navigate: NavigateFunction): void => {
  const route = getRouteForRole(role);
  navigate(route, { replace: true });
};

/**
 * Check if a route is valid for a given role
 * @param role - User role
 * @param route - Route to check
 * @returns True if route is valid for role
 */
export const isValidRouteForRole = (role: UserRole, route: string): boolean => {
  const validRoute = ROLE_ROUTES[role];
  return route.startsWith(validRoute.split('/')[1]);
};
