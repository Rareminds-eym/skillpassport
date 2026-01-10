/**
 * SubscriptionProtectedRoute
 * 
 * Industrial-grade route guard that protects routes requiring active subscription.
 * Combines authentication check + role check + subscription access check.
 * 
 * Features:
 * - State machine for predictable state transitions
 * - Retry logic with exponential backoff
 * - Post-payment navigation handling with cache synchronization
 * - Comprehensive error handling and recovery
 * - Debug logging for troubleshooting
 * - Safety timeouts to prevent infinite loading
 * 
 * Usage:
 * <SubscriptionProtectedRoute 
 *   allowedRoles={['school_student', 'college_student']}
 *   requireSubscription={true}
 * >
 *   <StudentLayout />
 * </SubscriptionProtectedRoute>
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ACCESS_REASONS, useSubscriptionContext } from '../../context/SubscriptionContext';
import Loader from '../Loader';
import SubscriptionBanner from './SubscriptionBanner';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEBUG = import.meta.env.DEV || localStorage.getItem('DEBUG_SUBSCRIPTION') === 'true';

/** Route guard states */
const GUARD_STATES = {
  INITIALIZING: 'initializing',
  CHECKING_AUTH: 'checking_auth',
  CHECKING_ROLE: 'checking_role',
  CHECKING_SUBSCRIPTION: 'checking_subscription',
  POST_PAYMENT_SYNC: 'post_payment_sync',
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  ERROR: 'error',
};

/** Configuration */
const CONFIG = {
  POST_PAYMENT_MAX_RETRIES: 3,
  POST_PAYMENT_RETRY_DELAY_MS: 1000,
  POST_PAYMENT_TIMEOUT_MS: 10000,
  SUBSCRIPTION_CHECK_TIMEOUT_MS: 15000,
};

/** User type mapping from URL path */
const PATH_TO_USER_TYPE = {
  '/student': 'student',
  '/recruitment': 'recruiter',
  '/educator': 'educator',
  '/college-admin': 'college_admin',
  '/school-admin': 'school_admin',
  '/university-admin': 'university_admin',
  '/admin': 'admin',
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Debug logger that only logs in development or when DEBUG flag is set
 */
const log = {
  info: (...args) => DEBUG && console.log('[SubscriptionGuard]', ...args),
  warn: (...args) => DEBUG && console.warn('[SubscriptionGuard]', ...args),
  error: (...args) => console.error('[SubscriptionGuard]', ...args),
  state: (state, data = {}) => DEBUG && console.log('[SubscriptionGuard] State:', state, data),
};

/**
 * Get the user type for subscription plans based on current URL path
 */
function getUserTypeFromPath(pathname) {
  for (const [prefix, userType] of Object.entries(PATH_TO_USER_TYPE)) {
    if (pathname.startsWith(prefix)) {
      return userType;
    }
  }
  return 'student'; // fallback
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries, baseDelayMs, onRetry) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        onRetry?.(attempt + 1, delay, error);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

// ============================================================================
// CUSTOM HOOK: usePostPaymentSync
// ============================================================================

/**
 * Hook to handle post-payment subscription synchronization
 * Ensures subscription cache is refreshed before allowing access
 */
function usePostPaymentSync(isPostPayment, hasAccess, refreshAccess) {
  const [syncState, setSyncState] = useState({
    status: 'idle', // 'idle' | 'syncing' | 'synced' | 'failed'
    attempts: 0,
    error: null,
  });
  
  const syncStartedRef = useRef(false);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Perform sync when coming from payment
  useEffect(() => {
    // Skip if not post-payment, already has access, or already started sync
    if (!isPostPayment || hasAccess || syncStartedRef.current) {
      return;
    }

    syncStartedRef.current = true;
    setSyncState({ status: 'syncing', attempts: 0, error: null });
    log.info('Post-payment sync started');

    // Set overall timeout
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && syncState.status === 'syncing') {
        log.warn('Post-payment sync timeout reached');
        setSyncState(prev => ({
          ...prev,
          status: 'failed',
          error: new Error('Sync timeout'),
        }));
      }
    }, CONFIG.POST_PAYMENT_TIMEOUT_MS);

    // Perform sync with retries
    retryWithBackoff(
      async () => {
        await refreshAccess();
        // Small delay to ensure React Query cache is updated
        await sleep(100);
      },
      CONFIG.POST_PAYMENT_MAX_RETRIES,
      CONFIG.POST_PAYMENT_RETRY_DELAY_MS,
      (attempt, delay, error) => {
        log.warn(`Post-payment sync retry ${attempt}/${CONFIG.POST_PAYMENT_MAX_RETRIES} after ${delay}ms`, error);
        if (mountedRef.current) {
          setSyncState(prev => ({ ...prev, attempts: attempt }));
        }
      }
    )
      .then(() => {
        if (mountedRef.current) {
          log.info('Post-payment sync completed successfully');
          setSyncState({ status: 'synced', attempts: 0, error: null });
        }
      })
      .catch((error) => {
        if (mountedRef.current) {
          log.error('Post-payment sync failed after all retries', error);
          setSyncState({ status: 'failed', attempts: CONFIG.POST_PAYMENT_MAX_RETRIES, error });
        }
      })
      .finally(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      });
  }, [isPostPayment, hasAccess, refreshAccess, syncState.status]);

  // Reset sync state when hasAccess becomes true
  useEffect(() => {
    if (hasAccess && syncState.status === 'syncing') {
      log.info('Access granted during sync, marking as synced');
      setSyncState({ status: 'synced', attempts: 0, error: null });
    }
  }, [hasAccess, syncState.status]);

  return {
    isSyncing: syncState.status === 'syncing',
    isSynced: syncState.status === 'synced' || syncState.status === 'idle',
    syncFailed: syncState.status === 'failed',
    syncAttempts: syncState.attempts,
    syncError: syncState.error,
  };
}

// ============================================================================
// CUSTOM HOOK: useGuardState
// ============================================================================

/**
 * Hook to manage the route guard state machine
 */
function useGuardState({
  authLoading,
  isAuthenticated,
  role,
  allowedRoles,
  requireSubscription,
  subscriptionLoading,
  hasAccess,
  isRefetching,
  subscriptionError,
  isPostPayment,
  postPaymentSync,
}) {
  const [state, setState] = useState(GUARD_STATES.INITIALIZING);
  const prevStateRef = useRef(state);

  // Compute the current state based on all inputs
  const computedState = useMemo(() => {
    // Step 1: Auth loading
    if (authLoading) {
      return GUARD_STATES.CHECKING_AUTH;
    }

    // Step 2: Not authenticated
    if (!isAuthenticated) {
      return GUARD_STATES.ACCESS_DENIED;
    }

    // Step 3: Role check
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return GUARD_STATES.ACCESS_DENIED;
    }

    // Step 4: Subscription not required
    if (!requireSubscription) {
      return GUARD_STATES.ACCESS_GRANTED;
    }

    // Step 5: Post-payment sync in progress
    if (isPostPayment && postPaymentSync.isSyncing) {
      return GUARD_STATES.POST_PAYMENT_SYNC;
    }

    // Step 6: Subscription loading or refetching
    if (subscriptionLoading || (!hasAccess && isRefetching)) {
      return GUARD_STATES.CHECKING_SUBSCRIPTION;
    }

    // Step 7: Subscription error (allow with warning)
    if (subscriptionError) {
      return GUARD_STATES.ERROR;
    }

    // Step 8: Check access
    if (hasAccess) {
      return GUARD_STATES.ACCESS_GRANTED;
    }

    // Step 9: Post-payment sync failed but we should still check access
    if (isPostPayment && postPaymentSync.syncFailed) {
      // Even if sync failed, check if we have access now
      return hasAccess ? GUARD_STATES.ACCESS_GRANTED : GUARD_STATES.ACCESS_DENIED;
    }

    return GUARD_STATES.ACCESS_DENIED;
  }, [
    authLoading,
    isAuthenticated,
    role,
    allowedRoles,
    requireSubscription,
    subscriptionLoading,
    hasAccess,
    isRefetching,
    subscriptionError,
    isPostPayment,
    postPaymentSync,
  ]);

  // Update state when computed state changes
  useEffect(() => {
    if (computedState !== prevStateRef.current) {
      log.state(computedState, {
        from: prevStateRef.current,
        hasAccess,
        isPostPayment,
        syncStatus: postPaymentSync,
      });
      prevStateRef.current = computedState;
      setState(computedState);
    }
  }, [computedState, hasAccess, isPostPayment, postPaymentSync]);

  return state;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SubscriptionProtectedRoute = ({ 
  children, 
  allowedRoles = [],
  requireSubscription = true,
  subscriptionFallbackPath = '/subscription/plans',
  loginFallbackPath = '/login',
}) => {
  const { isAuthenticated, role, loading: authLoading } = useAuth();
  const location = useLocation();
  
  const {
    hasAccess,
    accessReason,
    isLoading: subscriptionLoading,
    showWarning,
    warningType,
    warningMessage,
    error: subscriptionError,
    isRefetching,
    refreshAccess,
  } = useSubscriptionContext();

  // Detect post-payment navigation
  const isPostPayment = location.state?.fromPayment === true;

  // Post-payment synchronization
  const postPaymentSync = usePostPaymentSync(isPostPayment, hasAccess, refreshAccess);

  // Guard state machine
  const guardState = useGuardState({
    authLoading,
    isAuthenticated,
    role,
    allowedRoles,
    requireSubscription,
    subscriptionLoading,
    hasAccess,
    isRefetching,
    subscriptionError,
    isPostPayment,
    postPaymentSync,
  });

  // Build subscription fallback URL
  const getSubscriptionFallbackUrl = useCallback(() => {
    if (subscriptionFallbackPath.includes('type=')) {
      return subscriptionFallbackPath;
    }
    const userType = getUserTypeFromPath(location.pathname);
    const separator = subscriptionFallbackPath.includes('?') ? '&' : '?';
    return `${subscriptionFallbackPath}${separator}type=${userType}`;
  }, [subscriptionFallbackPath, location.pathname]);

  // Build redirect state for subscription plans
  const buildRedirectState = useCallback((message) => ({
    from: location,
    reason: accessReason,
    userRole: role,
    message,
  }), [location, accessReason, role]);

  // ============================================================================
  // RENDER BASED ON STATE
  // ============================================================================

  // Loading states
  if (
    guardState === GUARD_STATES.INITIALIZING ||
    guardState === GUARD_STATES.CHECKING_AUTH ||
    guardState === GUARD_STATES.CHECKING_SUBSCRIPTION ||
    guardState === GUARD_STATES.POST_PAYMENT_SYNC
  ) {
    return <Loader />;
  }

  // Error state - allow access with warning
  if (guardState === GUARD_STATES.ERROR) {
    log.error('Subscription check error, allowing access with warning:', subscriptionError);
    return (
      <>
        <SubscriptionBanner 
          type="error"
          message="Unable to verify subscription status. Some features may be limited."
        />
        {children}
      </>
    );
  }

  // Access denied - determine redirect
  if (guardState === GUARD_STATES.ACCESS_DENIED) {
    // Not authenticated
    if (!isAuthenticated) {
      const redirectPath = location.pathname.includes('student') 
        ? loginFallbackPath 
        : '/';
      log.info('Not authenticated, redirecting to:', redirectPath);
      return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    // Role mismatch
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      const expectedRole = allowedRoles[0] || 'student';
      log.info('Role mismatch, redirecting to plans. Expected:', allowedRoles, 'Got:', role);
      return <Navigate to={`/subscription/plans?type=${expectedRole}`} replace />;
    }

    // No subscription access
    const fallbackUrl = getSubscriptionFallbackUrl();
    let message = 'A subscription is required to access this area.';

    if (accessReason === ACCESS_REASONS.EXPIRED) {
      message = 'Your subscription has expired. Please renew to continue.';
    } else if (accessReason === ACCESS_REASONS.CANCELLED) {
      message = 'Your subscription has ended. Subscribe again to access.';
    }

    log.info('No subscription access, redirecting to:', fallbackUrl, 'Reason:', accessReason);
    return (
      <Navigate 
        to={fallbackUrl} 
        state={buildRedirectState(message)}
        replace 
      />
    );
  }

  // Access granted
  if (guardState === GUARD_STATES.ACCESS_GRANTED) {
    log.info('Access granted');
    return (
      <>
        {showWarning && (
          <SubscriptionBanner 
            type={warningType}
            message={warningMessage}
          />
        )}
        {children}
      </>
    );
  }

  // Fallback - should never reach here
  log.error('Unexpected guard state:', guardState);
  return <Loader />;
};

export default SubscriptionProtectedRoute;
