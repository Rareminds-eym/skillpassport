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
 *   allowedRoles={['learner', 'learner']}
 *   requireSubscription={true}
 * >
 *   <LearnerLayout />
 * </SubscriptionProtectedRoute>
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Loader from '@/shared/ui/Loader';
import SubscriptionBanner from './SubscriptionBanner';

import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { ACCESS_REASONS } from '@/features/subscription/model/subscriptionStore';
import { useUser, useIsAuthenticated, useAuthLoading, useUserRole } from '@/shared/model/authStore';
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
  SUBSCRIPTION_UNAVAILABLE: 'subscription_unavailable',
};

/**
 * Subscription error phases (graded error policy).
 *
 * - RETRYING:      one automatic retry is pending -> keep verifying (loader)
 * - FAIL_OPEN:     recoverable (5xx/network)      -> allow access with banner + one scheduled re-verification
 * - FAIL_CLOSED:   fatal 4xx (auth/forbidden)   -> block access behind an explicit Retry screen
 */
const ERROR_PHASES = {
  RETRYING: 'retrying',
  FAIL_OPEN: 'failure_recoverable',
  FAIL_CLOSED: 'failure_fatal',
};

/** Configuration */
const CONFIG = {
  POST_PAYMENT_MAX_RETRIES: 3,
  POST_PAYMENT_RETRY_DELAY_MS: 1000,
  POST_PAYMENT_TIMEOUT_MS: 10000,
  SUBSCRIPTION_CHECK_TIMEOUT_MS: 15000,
  SUBSCRIPTION_ERROR_AUTO_RETRY_DELAY_MS: 2000, // single automatic retry shortly after first failure
  SUBSCRIPTION_ERROR_REVERIFY_DELAY_MS: 60000, // single silent re-verification while page stays open (fail-open branch)
};

/** User type mapping from URL path */
const PATH_TO_USER_TYPE = {
  '/learner': 'learner',
  '/recruitment': 'recruiter',
  '/educator': 'educator',
  '/college-admin': 'college_admin',
  '/school-admin': 'school_admin',
  '/university-admin': 'university_admin',
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
  return 'learner'; // fallback
}

/**
 * Classify a subscription error into a graded ERROR_PHASES.FAIL_* bucket.
 *
 * NOTE: subscriptionService.getActiveSubscription() flattens API/network errors
 * (including ApiError instances that carry HTTP status) into plain
 * `Error(result.error)` messages, so the HTTP status is usually lost by the
 * time we see the error. We therefore prefer an explicit numeric `status`
 * when present and fall back to message heuristics for auth-style failures;
 * everything else (network "Failed to fetch", timeouts, unknown shapes) is
 * treated as a recoverable (5xx/network-style) failure that may fail open.
 */
function classifySubscriptionError(error) {
  if (!error) return null;

  // Explicit status wins (present when ApiError survives the fetch layer).
  const status = typeof error.status === 'number' ? error.status : undefined;
  if (status != null) {
    return status >= 500 ? ERROR_PHASES.FAIL_OPEN : ERROR_PHASES.FAIL_CLOSED;
  }

  const message = String(error.message || '');
  if (
    /\b(40[0-9])\b/i.test(message) ||
    /unauthorized|forbidden|not[ _-]?authenticated|unauthenticated|permission[ _-]?denied|invalid[ _-]?(api[ _-]?key|token)/i.test(message)
  ) {
    return ERROR_PHASES.FAIL_CLOSED;
  }

  // Network errors, timeouts, 5xx-style messages and unknown shapes -> recoverable
  return ERROR_PHASES.FAIL_OPEN;
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
function usePostPaymentSync(isPostPayment, hasAccess, refreshSubscription) {
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
        await refreshSubscription();
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
  }, [isPostPayment, hasAccess, refreshSubscription, syncState.status]);

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
  subscriptionErrorPhase,
  isPostPayment,
  postPaymentSync,
}) {
  const [state, setState] = useState(GUARD_STATES.INITIALIZING);
  const prevStateRef = useRef(state);

  // Compute the current state based on all inputs
  const computedState = useMemo(() => {
    // Step 1: Auth loading
    if (authLoading) {
      log.info('Step 1: authLoading=true → CHECKING_AUTH');
      return GUARD_STATES.CHECKING_AUTH;
    }

    // Step 2: Not authenticated
    if (!isAuthenticated) {
      log.info('Step 2: isAuthenticated=false → ACCESS_DENIED');
      return GUARD_STATES.ACCESS_DENIED;
    }

    // Step 3: Role check - be lenient for admin roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      // Check if this is an admin role mismatch that should be allowed
      const isAdminRoute = allowedRoles.some(r => r.includes('_admin'));
      const userIsAdmin = role === 'admin' || role?.includes('_admin');

      if (!(isAdminRoute && userIsAdmin)) {
        log.info('Step 3: Role mismatch → ACCESS_DENIED. role=', role, 'allowedRoles=', allowedRoles);
        return GUARD_STATES.ACCESS_DENIED;
      }
      // Admin exception - continue to subscription check
    }

    // Step 4: Subscription not required
    if (!requireSubscription) {
      log.info('Step 4: requireSubscription=false → ACCESS_GRANTED');
      return GUARD_STATES.ACCESS_GRANTED;
    }

    // Step 5: Post-payment sync in progress
    if (isPostPayment && postPaymentSync.isSyncing) {
      log.info('Step 5: Post-payment syncing → POST_PAYMENT_SYNC');
      return GUARD_STATES.POST_PAYMENT_SYNC;
    }

    // Step 6: Subscription loading or refetching
    if (subscriptionLoading || (!hasAccess && isRefetching)) {
      log.info('Step 6: subscriptionLoading=', subscriptionLoading, 'isRefetching=', isRefetching, '→ CHECKING_SUBSCRIPTION');
      return GUARD_STATES.CHECKING_SUBSCRIPTION;
    }

    // Step 7: Subscription error — graded policy (see useSubscriptionFailureRecovery):
    // while an automatic retry is pending we keep verifying; 4xx failures close
    // the route; recoverable (5xx/network) failures fail open with a banner.
    if (subscriptionError) {
      if (subscriptionErrorPhase === ERROR_PHASES.RETRYING) {
        log.info('Step 7: subscriptionError, auto-retry pending → CHECKING_SUBSCRIPTION');
        return GUARD_STATES.CHECKING_SUBSCRIPTION;
      }
      if (subscriptionErrorPhase === ERROR_PHASES.FAIL_CLOSED) {
        log.warn('Step 7: subscriptionError is a 4xx failure → SUBSCRIPTION_UNAVAILABLE (fail-closed)');
        return GUARD_STATES.SUBSCRIPTION_UNAVAILABLE;
      }
      log.warn('Step 7: subscriptionError is recoverable (5xx/network) → ERROR (fail-open with banner)');
      return GUARD_STATES.ERROR;
    }

    // Step 8: Check access
    if (hasAccess) {
      log.info('Step 8: hasAccess=true → ACCESS_GRANTED');
      return GUARD_STATES.ACCESS_GRANTED;
    }

    // Step 9: Post-payment sync failed but we should still grant access
    // The user has already paid — blocking them here creates a redirect loop to plans.
    if (isPostPayment && postPaymentSync.syncFailed) {
      log.info('Step 9: Post-payment sync failed, granting access to prevent redirect loop');
      return GUARD_STATES.ACCESS_GRANTED;
    }

    log.info('Step 10: Fallback → ACCESS_DENIED', {
      hasAccess, subscriptionLoading, isRefetching, accessReason: subscriptionError?.message,
      isPostPayment, postPaymentSync
    });
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
    subscriptionErrorPhase,
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
// CUSTOM HOOK: useSubscriptionFailureRecovery
// ============================================================================

/**
 * Hook implementing the graded subscription-error policy:
 *
 * 1. On the first subscription error, ONE automatic retry is scheduled after
 *    SUBSCRIPTION_ERROR_AUTO_RETRY_DELAY_MS (2s) — while pending the guard
 *    stays in CHECKING_SUBSCRIPTION (loader).
 * 2. If the error persists:
 *    - FAIL_OPEN (5xx/network): the route guard will allow access with the
 *      existing error banner AND one silent automatic re-verification is
 *      scheduled after SUBSCRIPTION_ERROR_REVERIFY_DELAY_MS (60s). If that
 *      verification succeeds, the error clears and access is granted normally.
 *    - FAIL_CLOSED (4xx: auth/forbidden/etc): the guard fails CLOSED — an
 *      explicit Retry screen is shown and there is NO dashboard passthrough.
 *
 * A successful verification resets the entire cycle (the automatic retry and
 * re-verification flags included), and `manualRetry` restarts the full graded
 * cycle for explicit user retries.
 *
 * Returns { phase, manualRetry } where phase is one of ERROR_PHASES or null.
 */
function useSubscriptionFailureRecovery(subscriptionError, refreshSubscription) {
  // Latest fetcher / error kept in refs so the scheduling effects below are
  // not re-armed (or cancelled) by unstable callback/error identities.
  const refreshRef = useRef(refreshSubscription);
  const errorRef = useRef(subscriptionError);

  const [retrying, setRetrying] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0); // bumped by manual retry to restart the cycle
  const autoRetryRanRef = useRef(false);
  const reverifyRanRef = useRef(false);
  const retryTimerRef = useRef(null);
  const reverifyTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (reverifyTimerRef.current) {
      clearTimeout(reverifyTimerRef.current);
      reverifyTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  // Keep refs in sync BEFORE any effect/callback reads them.
  useEffect(() => {
    refreshRef.current = refreshSubscription;
    errorRef.current = subscriptionError;
  }, [subscriptionError, refreshSubscription]);

  // A successful verification resets the whole failure cycle.
  useEffect(() => {
    if (subscriptionError) return;
    clearTimers();
    autoRetryRanRef.current = false;
    reverifyRanRef.current = false;
    setRetrying(false);
  }, [subscriptionError, clearTimers]);

  // 1) Single automatic retry shortly after the first failure.
  useEffect(() => {
    if (!subscriptionError || autoRetryRanRef.current) return undefined;
    autoRetryRanRef.current = true;
    setRetrying(true);
    log.warn(
      'Subscription check failed; retrying once after',
      CONFIG.SUBSCRIPTION_ERROR_AUTO_RETRY_DELAY_MS,
      'ms:',
      subscriptionError
    );
    retryTimerRef.current = setTimeout(() => {
      // Skip when unmounted or already recovered while the timer was pending.
      if (!mountedRef.current || !errorRef.current) return;
      setRetrying(false);
      refreshRef.current();
    }, CONFIG.SUBSCRIPTION_ERROR_AUTO_RETRY_DELAY_MS);
    // No cleanup here: a new error object while pending must not cancel the
    // in-flight retry; unmount handles cancellation.
    return undefined;
  }, [subscriptionError, retryNonce]);

  // 2) Persistent-error branches: schedule the single re-verification for
  //    recoverable (5xx/network) errors and alert on fatal 4xx ones.
  useEffect(() => {
    if (!subscriptionError || retrying) return undefined;

    const grade = classifySubscriptionError(subscriptionError);
    if (grade === ERROR_PHASES.FAIL_OPEN) {
      if (reverifyRanRef.current) return undefined;
      reverifyRanRef.current = true;
      log.warn(
        'Recoverable subscription error; scheduling one re-verification after',
        CONFIG.SUBSCRIPTION_ERROR_REVERIFY_DELAY_MS,
        'ms'
      );
      toast.error(
        'Unable to verify subscription status. Some features may be limited. We will re-check automatically.',
        { duration: 8000 }
      );
      reverifyTimerRef.current = setTimeout(() => {
        if (!mountedRef.current || !errorRef.current) return; // unmounted or recovered meanwhile
        refreshRef.current();
      }, CONFIG.SUBSCRIPTION_ERROR_REVERIFY_DELAY_MS);
      return undefined;
    }

    if (grade === ERROR_PHASES.FAIL_CLOSED) {
      // Deduplicated: never spam toasts while the Retry screen is up.
      toast.error('Subscription verification failed. Please retry.', { id: 'subscription-fail-closed' });
    }
    return undefined;
  }, [subscriptionError, retrying]);

  // Manual retry restarts the full graded cycle (single retry -> re-grade).
  const manualRetry = useCallback(() => {
    if (!errorRef.current) return;
    log.info('Manual subscription retry requested');
    clearTimers();
    autoRetryRanRef.current = false;
    reverifyRanRef.current = false;
    setRetrying(true);
    setRetryNonce((n) => n + 1);
  }, [clearTimers]);

  const phase = useMemo(() => {
    if (!subscriptionError) return null;
    if (retrying) return ERROR_PHASES.RETRYING;
    return classifySubscriptionError(subscriptionError);
  }, [subscriptionError, retrying]);

  return { phase, manualRetry };
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
  const isAuthenticated = useIsAuthenticated();
  const { role } = useUserRole();
  const authLoading = useAuthLoading();
  const user = useUser();
  const location = useLocation();

  // Debug logging for redirect loop investigation
  useEffect(() => {
    if (DEBUG) {
      console.log('[SubscriptionGuard] Mount/Update:', {
        path: location.pathname,
        isAuthenticated,
        role,
        authLoading,
        userId: user?.id,
        allowedRoles,
        requireSubscription,
      });
    }
  }, [location.pathname, isAuthenticated, role, authLoading, user?.id, allowedRoles, requireSubscription]);

  const {
    hasAccess,
    accessReason,
    loading: subscriptionLoading,
    showWarning,
    warningType,
    warningMessage,
    error: subscriptionError,
    isRefetching,
    refreshSubscription,
  } = useSubscriptionQuery();

  // Detect post-payment navigation
  const isPostPayment = location.state?.fromPayment === true;

  // Post-payment synchronization
  const postPaymentSync = usePostPaymentSync(isPostPayment, hasAccess, refreshSubscription);

  // Graded subscription-error policy:
  // retry once automatically -> fail-open (5xx/network, banner + re-verification)
  //                          -> fail-closed (4xx, explicit Retry screen)
  const { phase: subscriptionErrorPhase, manualRetry: manualSubscriptionRetry } =
    useSubscriptionFailureRecovery(subscriptionError, refreshSubscription);

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
    subscriptionErrorPhase,
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

  log.state('guardState', guardState);

  // Loading states
  if (
    guardState === GUARD_STATES.INITIALIZING ||
    guardState === GUARD_STATES.CHECKING_AUTH ||
    guardState === GUARD_STATES.CHECKING_SUBSCRIPTION ||
    guardState === GUARD_STATES.POST_PAYMENT_SYNC
  ) {
    return <Loader />;
  }

  // Subscription unavailable (4xx client error) - fail CLOSED:
  // explicit Retry screen, NO dashboard passthrough and no redirect loops.
  if (guardState === GUARD_STATES.SUBSCRIPTION_UNAVAILABLE) {
    log.error('Subscription check failed with a client error, blocking access:', subscriptionError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center max-w-md shadow-sm">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Subscription unavailable
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            We could not verify your subscription. Your session may have expired, or you
            may not have permission to this area. Please retry or sign in again.
          </p>
          <button
            type="button"
            onClick={manualSubscriptionRetry}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Error state - fail-open for recoverable (5xx/network) errors only:
  // keep the existing prominent banner + children; ONE automatic
  // re-verification is scheduled by useSubscriptionFailureRecovery.
  if (guardState === GUARD_STATES.ERROR) {
    log.error('Subscription check error (recoverable), allowing access with warning:', subscriptionError);
    return (
      <>
        <SubscriptionBanner
          type="error"
          message="Unable to verify subscription status. Some features may be limited. We will re-check automatically shortly."
        />
        {children}
      </>
    );
  }

  // Access denied - determine redirect
  if (guardState === GUARD_STATES.ACCESS_DENIED) {
    // Not authenticated
    if (!isAuthenticated) {
      const redirectPath = location.pathname.includes('learner')
        ? loginFallbackPath
        : '/';
      log.info('Not authenticated, redirecting to:', redirectPath);
      return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    // Role mismatch - but be lenient for admin roles
    // Allow 'admin' role to access school_admin, college_admin, university_admin routes
    // This handles the case where the role in metadata is 'admin' but the route expects a specific admin type
    const roleMatches = allowedRoles.length === 0 || allowedRoles.includes(role);
    const isAdminRoute = allowedRoles.some(r => r.includes('_admin'));
    const userIsAdmin = role === 'admin' || role?.includes('_admin');
    const adminRoleException = isAdminRoute && userIsAdmin;

    if (!roleMatches && !adminRoleException) {
      // Role doesn't match and no admin exception applies
      const expectedRole = allowedRoles[0] || 'learner';
      log.info('Role mismatch, redirecting to plans. Expected:', allowedRoles, 'Got:', role);
      return <Navigate to={`/subscription/plans?type=${expectedRole}`} replace />;
    }

    // Role matches (or admin exception applies) but no subscription access
    const fallbackUrl = getSubscriptionFallbackUrl();
    let message = 'A subscription is required to access this area.';

    if (accessReason === ACCESS_REASONS.EXPIRED) {
      message = 'Your subscription has expired. Please renew to continue.';
    } else if (accessReason === ACCESS_REASONS.CANCELLED) {
      message = 'Your subscription has ended. Subscribe again to access.';
    }

    log.info('No subscription access, redirecting to:', fallbackUrl, 'Reason:', accessReason, 'Role:', role, 'AdminException:', adminRoleException);
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
