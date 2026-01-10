/**
 * Type declarations for useAuth hook
 */

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  school_id?: string;
  college_id?: string;
  university_id?: string;
  school_name?: string;
  college_name?: string;
  university_name?: string;
  user_metadata?: {
    user_role?: string;
    role?: string;
    [key: string]: unknown;
  };
  raw_user_meta_data?: {
    user_role?: string;
    role?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface UseAuthReturn {
  // State
  user: AuthUser | null;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  
  // Role checks
  hasRole: (requiredRole: string) => boolean;
  isStudent: () => boolean;
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

export function useAuth(): UseAuthReturn;
export default useAuth;
