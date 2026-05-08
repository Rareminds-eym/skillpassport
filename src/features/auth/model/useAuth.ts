/**
 * useAuth — SSO-based auth hook
 *
 * Delegates to the Zustand SSO auth store (shared/model/authStore).
 * No Supabase auth calls.
 *
 * Returns the same interface as the legacy useAuth hook for backward compatibility
 * with existing consumers (RecruiterLayout, PassportPage, Assessments, etc.).
 */
import { useCallback } from 'react';
import { useAuthStore } from '@/shared/model/authStore';
import type { User as SsoUser } from '@/shared/model/authStore';

interface UseAuthReturn {
  // State
  user: SsoUser | null;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  errorCode: string | null;

  // Role checks
  hasRole: (requiredRole: string) => boolean;
  isLearner: () => boolean;
  isEducator: () => boolean;
  isRecruiter: () => boolean;
  isAdmin: () => boolean;
  isSchoolAdmin: () => boolean;
  isCollegeAdmin: () => boolean;
  isUniversityAdmin: () => boolean;

  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);
  const errorNotification = useAuthStore((s) => s.errorNotification);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const dismissErrorNotification = useAuthStore((s) => s.dismissErrorNotification);
  const rolesList = useAuthStore((s) => s.user?.roles ?? []);

  const error = errorNotification?.message ?? null;
  const errorCode = errorNotification?.type ?? null;

  const hasRole = useCallback(
    (requiredRole: string) => rolesList.includes(requiredRole) || role === requiredRole,
    [rolesList, role],
  );

  const isLearner = useCallback(
    () =>
      rolesList.some((r) => r === 'learner'),
    [rolesList],
  );

  const isEducator = useCallback(
    () =>
      rolesList.some(
        (r) => r === 'educator' || r === 'school_educator' || r === 'college_educator',
      ),
    [rolesList],
  );

  const isRecruiter = useCallback(
    () => rolesList.some((r) => r === 'recruiter' || r === 'hr'),
    [rolesList],
  );

  const isAdmin = useCallback(
    () =>
      rolesList.some(
        (r) =>
          r === 'admin' ||
          r === 'school_admin' ||
          r === 'college_admin' ||
          r === 'university_admin' ||
          r === 'owner',
      ),
    [rolesList],
  );

  const isSchoolAdmin = useCallback(() => rolesList.includes('school_admin'), [rolesList]);
  const isCollegeAdmin = useCallback(() => rolesList.includes('college_admin'), [rolesList]);
  const isUniversityAdmin = useCallback(() => rolesList.includes('university_admin'), [rolesList]);

  const refresh = useCallback(async () => {
    await refreshSession();
  }, [refreshSession]);

  const clearError = useCallback(() => {
    dismissErrorNotification();
  }, [dismissErrorNotification]);

  return {
    user,
    role,
    isAuthenticated,
    loading,
    error,
    errorCode,
    hasRole,
    isLearner,
    isEducator,
    isRecruiter,
    isAdmin,
    isSchoolAdmin,
    isCollegeAdmin,
    isUniversityAdmin,
    refresh,
    clearError,
  };
};

export default useAuth;
