import { useCallback, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/shared/api';
import { checkAuthentication } from '@/features/auth/api';
import {
    AUTH_ERROR_CODES,
    generateCorrelationId,
    logAuthEvent,
} from '@/features/auth/lib';

/**
 * Custom hook for managing authentication state
 * Industrial-grade implementation with comprehensive error handling
 * 
 * Features:
 * - Automatic session refresh
 * - Error state management
 * - Loading state handling
 * - Memory leak prevention
 * - Correlation ID tracking
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_CHECK_DEBOUNCE_MS = 100;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// ============================================================================
// TYPES
// ============================================================================

interface AuthResult {
  user: User | null;
  role: string | null;
  isAuthenticated: boolean;
  error?: string | null;
  errorCode?: string | null;
}

interface UseAuthReturn {
  // State
  user: User | null;
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

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  
  // Refs for cleanup and preventing memory leaks
  const isMountedRef = useRef(true);
  const initializingRef = useRef(false);
  const retryCountRef = useRef(0);

  /**
   * Safe state update that checks if component is still mounted
   */
  const safeSetState = useCallback((setter: any, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  /**
   * Initialize authentication state with retry logic
   */
  const initializeAuth = useCallback(async () => {
    // Prevent concurrent initialization
    if (initializingRef.current) {
      return;
    }
    
    initializingRef.current = true;
    const correlationId = generateCorrelationId();
    
    try {
      logAuthEvent('info', 'Initializing auth state', { correlationId });
      
      const authResult = await checkAuthentication() as AuthResult;
      
      if (!isMountedRef.current) return;
      
      if (authResult.error && retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        // Retry on transient errors
        retryCountRef.current += 1;
        logAuthEvent('warn', `Auth init retry ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}`, { correlationId });
        
        setTimeout(() => {
          initializingRef.current = false;
          initializeAuth();
        }, RETRY_DELAY_MS * retryCountRef.current);
        return;
      }
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      safeSetState(setUser, authResult.user);
      safeSetState(setRole, authResult.role);
      safeSetState(setIsAuthenticated, authResult.isAuthenticated);
      safeSetState(setError, authResult.error || null);
      safeSetState(setErrorCode, authResult.errorCode || null);
      
      logAuthEvent('info', 'Auth state initialized', { 
        correlationId, 
        isAuthenticated: authResult.isAuthenticated,
        role: authResult.role,
      });
      
    } catch (err) {
      logAuthEvent('error', 'Auth initialization failed', { correlationId });
      
      if (!isMountedRef.current) return;
      
      safeSetState(setError, 'Unable to verify authentication status');
      safeSetState(setErrorCode, AUTH_ERROR_CODES.UNEXPECTED_ERROR);
    } finally {
      if (isMountedRef.current) {
        safeSetState(setLoading, false);
      }
      initializingRef.current = false;
    }
  }, [safeSetState]);

  /**
   * Handle auth state changes from Supabase
   */
  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    const correlationId = generateCorrelationId();
    
    logAuthEvent('info', `Auth state change: ${event}`, { correlationId });
    
    if (!isMountedRef.current) return;
    
    if (session && session.user) {
      // Check for user_role first (set by UnifiedSignup), then fall back to role
      const userRole = session.user.user_metadata?.user_role ||
                      session.user.user_metadata?.role || 
                      session.user.raw_user_meta_data?.user_role ||
                      session.user.raw_user_meta_data?.role || 
                      null;
      
      safeSetState(setUser, session.user);
      safeSetState(setRole, userRole);
      safeSetState(setIsAuthenticated, true);
      safeSetState(setError, null);
      safeSetState(setErrorCode, null);
    } else {
      safeSetState(setUser, null);
      safeSetState(setRole, null);
      safeSetState(setIsAuthenticated, false);
    }
    
    safeSetState(setLoading, false);
  }, [safeSetState]);

  // Initialize auth on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Debounce initialization to prevent rapid re-renders
    const timeoutId = setTimeout(() => {
      initializeAuth();
    }, AUTH_CHECK_DEBOUNCE_MS);

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [initializeAuth, handleAuthStateChange]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((requiredRole: string) => {
    return role === requiredRole;
  }, [role]);

  /**
   * Check if user is a student
   */
  const isStudent = useCallback(() => {
    return role === 'student';
  }, [role]);

  /**
   * Check if user is an educator
   */
  const isEducator = useCallback(() => {
    return role === 'educator';
  }, [role]);

  /**
   * Check if user is a recruiter
   */
  const isRecruiter = useCallback(() => {
    return role === 'recruiter';
  }, [role]);

  /**
   * Check if user is an admin
   */
  const isAdmin = useCallback(() => {
    return role === 'admin' || 
           role === 'school_admin' || 
           role === 'college_admin' || 
           role === 'university_admin';
  }, [role]);

  /**
   * Check if user is a school admin
   */
  const isSchoolAdmin = useCallback(() => {
    return role === 'school_admin';
  }, [role]);

  /**
   * Check if user is a college admin
   */
  const isCollegeAdmin = useCallback(() => {
    return role === 'college_admin';
  }, [role]);

  /**
   * Check if user is a university admin
   */
  const isUniversityAdmin = useCallback(() => {
    return role === 'university_admin';
  }, [role]);

  /**
   * Refresh authentication state
   */
  const refresh = useCallback(async () => {
    const correlationId = generateCorrelationId();
    
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    safeSetState(setErrorCode, null);
    
    try {
      logAuthEvent('info', 'Refreshing auth state', { correlationId });
      
      const authResult = await checkAuthentication() as AuthResult;
      
      if (!isMountedRef.current) return;
      
      safeSetState(setUser, authResult.user);
      safeSetState(setRole, authResult.role);
      safeSetState(setIsAuthenticated, authResult.isAuthenticated);
      safeSetState(setError, authResult.error || null);
      safeSetState(setErrorCode, authResult.errorCode || null);
      
      logAuthEvent('info', 'Auth state refreshed', { correlationId });
      
    } catch (err) {
      logAuthEvent('error', 'Auth refresh failed', { correlationId });
      
      if (!isMountedRef.current) return;
      
      safeSetState(setError, 'Unable to refresh authentication');
      safeSetState(setErrorCode, AUTH_ERROR_CODES.UNEXPECTED_ERROR);
    } finally {
      if (isMountedRef.current) {
        safeSetState(setLoading, false);
      }
    }
  }, [safeSetState]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    safeSetState(setError, null);
    safeSetState(setErrorCode, null);
  }, [safeSetState]);

  return {
    // State
    user,
    role,
    isAuthenticated,
    loading,
    error,
    errorCode,
    
    // Role checks
    hasRole,
    isStudent,
    isEducator,
    isRecruiter,
    isAdmin,
    isSchoolAdmin,
    isCollegeAdmin,
    isUniversityAdmin,
    
    // Actions
    refresh,
    clearError,
  };
};

export default useAuth;
