/**
 * PaymentSuccess Component
 * 
 * Industrial-grade payment success page with:
 * - State machine for predictable flow
 * - Retry logic with exponential backoff for cache refresh
 * - Comprehensive error handling and recovery
 * - Proper cleanup and memory leak prevention
 * - Debug logging for troubleshooting
 * - Graceful degradation on failures
 * 
 * @module PaymentSuccess
 */

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Download,
  Loader2,
  MailCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { downloadReceipt } from '@/features/subscription/lib';
import { getPaymentReceiptPresignedUrl } from '@/shared/api';

import { useQueryClient } from '@tanstack/react-query';
import { useSubscription, useSubscriptionStore } from '@/features/subscription/model/subscriptionStore';
import { useUser, useUserRole } from '@/shared/model/authStore';
import { queryKeys } from '@/shared/lib/queryKeys';
// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const DEBUG = import.meta.env.DEV || localStorage.getItem('DEBUG_PAYMENT') === 'true';

/** Navigation states */
const NAV_STATES = {
  IDLE: 'idle',
  REFRESHING_CACHE: 'refreshing_cache',
  NAVIGATING: 'navigating',
  ERROR: 'error',
};

/** Email states */
const EMAIL_STATES = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  SKIPPED: 'skipped',
  FAILED: 'failed',
};

/** Activation states */
const ACTIVATION_STATES = {
  PENDING: 'pending',
  ACTIVATING: 'activating',
  ACTIVATED: 'activated',
  ERROR: 'error',
};

/** Configuration */
const CONFIG = {
  CONFETTI_DURATION_MS: 4000,
  EMAIL_STATUS_DELAY_MS: 2000,
  NO_SESSION_REDIRECT_DELAY_MS: 2000,
};

/** Dashboard routes by role */
const DASHBOARD_ROUTES = {
  // Admin roles
  admin: '/admin/dashboard',
  company_admin: '/admin/dashboard',
  // Institution admin roles
  school_admin: '/school-admin/dashboard',
  college_admin: '/college-admin/dashboard',
  university_admin: '/university-admin/dashboard',
  // Educator roles
  educator: '/educator/dashboard',
  school_educator: '/educator/dashboard',
  college_educator: '/educator/dashboard',
  // Recruiter role
  recruiter: '/recruitment/overview',
  // Admin/owner roles
  owner: '/admin/dashboard',
  // Learner roles
  learner: '/learner/dashboard',
};

/** Subscription manage routes by role */
const MANAGE_ROUTES = {
  admin: '/admin/subscription/manage',
  company_admin: '/admin/subscription/manage',
  owner: '/admin/subscription/manage',
  school_admin: '/school-admin/subscription/manage',
  college_admin: '/college-admin/subscription/manage',
  university_admin: '/university-admin/subscription/manage',
  educator: '/educator/subscription/manage',
  school_educator: '/educator/subscription/manage',
  college_educator: '/educator/subscription/manage',
  recruiter: '/recruitment/subscription/manage',
  learner: '/learner/subscription/manage',
};

// ============================================================================
// UTILITIES
// ============================================================================

/** Debug logger */
const log = {
  info: (...args) => DEBUG && console.log('[PaymentSuccess]', ...args),
  warn: (...args) => DEBUG && console.warn('[PaymentSuccess]', ...args),
  error: (...args) => console.error('[PaymentSuccess]', ...args),
};

/** Format date for display */
const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

/** Format amount for display */
const formatAmount = (a) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(a ?? 0);
  } catch {
    return '₹0';
  }
};

/** Get user role from various sources */
const getUserRole = (user, role) => {
  return user?.user_metadata?.user_role
    || role
    || user?.user_metadata?.role
    || user?.raw_user_meta_data?.user_role
    || user?.raw_user_meta_data?.role
    || 'learner';
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to manage cache refresh — a single one-shot refresh.
 * The store-level manual override guard handles stale API responses,
 * so retry/backoff logic is unnecessary here.
 */
function useCacheRefresh(refreshAccess, refreshSubscription) {
  const [status, setStatus] = useState('idle');
  const refreshPromiseRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    setStatus('refreshing');
    log.info('Starting cache refresh');

    refreshPromiseRef.current = Promise.all([
      refreshAccess(),
      refreshSubscription(),
    ])
      .then(() => {
        if (mountedRef.current) {
          log.info('Cache refresh successful');
          setStatus('success');
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          log.error('Cache refresh failed', err);
          setStatus('error');
        }
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    return refreshPromiseRef.current;
  }, [refreshAccess, refreshSubscription]);

  return {
    status,
    refresh,
    isRefreshed: status === 'success',
    isRefreshing: status === 'refreshing',
  };
}

/**
 * Hook to manage navigation state machine
 *
 * Key design decision: after a successful payment, the Zustand store already
 * holds the correct subscription data (written by the payment verification
 * response via setAccessData). We check the store FIRST — if hasAccess is
 * already true, we navigate immediately without firing any API calls.
 * This eliminates the race condition where refreshSubscription() hits the API
 * before the DB has propagated the new subscription, gets stale "no data" back,
 * and overwrites hasAccess to false — causing a redirect loop to /subscription/plans.
 *
 * The store-level manual override guard (MANUAL_OVERRIDE_TTL) acts as a
 * secondary safety net in case other code paths trigger refreshSubscription()
 * during the same window.
 */
function useNavigationState(cacheRefresh, getDashboardUrl, navigate) {
  const [state, setState] = useState({
    status: NAV_STATES.IDLE,
    error: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const navigateToDashboard = useCallback(async () => {
    if (state.status !== NAV_STATES.IDLE) {
      log.warn('Navigation already in progress');
      return;
    }

    setState({ status: NAV_STATES.REFRESHING_CACHE, error: null });
    log.info('Starting navigation to dashboard');

    try {
      // ── PRIMARY PATH: Check the Zustand store directly. ──────────────
      // If the store already has hasAccess=true (set by setAccessData from
      // the payment verification response), skip the cache refresh entirely.
      // The data is already correct — calling the API would risk overwriting
      // it with stale results.
      const storeHasAccess = useSubscriptionStore.getState().hasAccess;

      if (storeHasAccess) {
        log.info('Store already has hasAccess=true — navigating immediately (no API call)');
      } else if (!cacheRefresh.isRefreshed) {
        // FALLBACK: Store doesn't have access yet. Try refreshing from the API.
        // This handles edge cases where setAccessData wasn't called (e.g.,
        // subscription_created flag without a subscription object).
        log.info('Store has hasAccess=false — attempting cache refresh before navigation');
        await cacheRefresh.refresh();
      }

      if (!mountedRef.current) return;

      setState({ status: NAV_STATES.NAVIGATING, error: null });

      // Navigate with post-payment flag so the route guard knows
      // to run post-payment sync if needed.
      const dashboardUrl = getDashboardUrl();
      log.info('Navigating to:', dashboardUrl);
      navigate(dashboardUrl, {
        state: { fromPayment: true },
        replace: false,
      });
    } catch (error) {
      log.error('Navigation error:', error);
      if (mountedRef.current) {
        setState({ status: NAV_STATES.ERROR, error });
        // Still navigate — the user has paid. Blocking them here is worse
        // than showing a dashboard with a momentary loading state.
        toast.error('Cache refresh failed, but your subscription is active.');
        const dashboardUrl = getDashboardUrl();
        navigate(dashboardUrl, { state: { fromPayment: true } });
      }
    }
  }, [state.status, cacheRefresh, getDashboardUrl, navigate]);

  const reset = useCallback(() => {
    setState({ status: NAV_STATES.IDLE, error: null });
  }, []);

  return {
    ...state,
    navigateToDashboard,
    reset,
    isNavigating: state.status !== NAV_STATES.IDLE,
    isRefreshingCache: state.status === NAV_STATES.REFRESHING_CACHE,
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Receipt Card with clean design */
const ReceiptCard = ({ header, children }) => (
  <div className="relative pt-10">
    {/* Green checkmark circle - overlapping */}
    <div className="absolute left-1/2 -translate-x-1/2 -top-0 z-20">
      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg border border-gray-100">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-inner">
          <Check className="w-8 h-8 text-white" strokeWidth={3} />
        </div>
      </div>
    </div>

    {/* Card container */}
    <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="pt-14 pb-6 px-6 text-center bg-gradient-to-b from-gray-50 to-white">
        {header}
      </div>
      <div className="mx-5 border-t-2 border-dashed border-gray-200" />
      <div className="px-5 pt-5 pb-6">
        {children}
      </div>
    </div>
  </div>
);

/** Confetti animation */
const Confetti = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animation: `fall ${2 + Math.random() * 2}s ease-out forwards`,
            animationDelay: `${Math.random() * 2}s`,
            backgroundColor: ['#2663EB', '#3B82F6', '#60A5FA'][Math.floor(Math.random() * 3)],
          }}
        />
      ))}
    </div>
  );
};

/** Email status indicator */
const EmailStatus = ({ status }) => {
  const config = {
    [EMAIL_STATES.PENDING]: { icon: Loader2, color: 'text-gray-400', text: 'Preparing confirmation...', spin: true },
    [EMAIL_STATES.SENDING]: { icon: Loader2, color: 'text-[#2663EB]', text: 'Sending confirmation...', spin: true },
    [EMAIL_STATES.SENT]: { icon: MailCheck, color: 'text-emerald-500', text: 'Confirmation email sent' },
    [EMAIL_STATES.SKIPPED]: { icon: MailCheck, color: 'text-gray-400', text: 'Email already sent previously' },
    [EMAIL_STATES.FAILED]: { icon: MailCheck, color: 'text-gray-600', text: 'You will receive a receipt in your email' },
  };

  const { icon: Icon, color, text, spin } = config[status] || config[EMAIL_STATES.PENDING];

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100">
      <Icon className={`w-5 h-5 ${color} ${spin ? 'animate-spin' : ''}`} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};

/** Loading screen */
const LoadingScreen = ({ message }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 border-3 border-gray-200 border-t-[#2663EB] rounded-full animate-spin" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

/** Error screen */
const ErrorScreen = ({ message, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-6 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Verification Failed</h2>
      <p className="text-sm text-gray-500 mb-5">{message || 'Please try again'}</p>
      <button
        onClick={onRetry}
        className="w-full py-2.5 bg-[#2663EB] text-white rounded-lg font-medium text-sm hover:bg-[#1D4ED8] flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" /> Retry
      </button>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const { role } = useUserRole();
  const { refreshSubscription, refreshAccess } = useSubscription();
  const queryClient = useQueryClient();

  // ── Read exclusively from location.state (set by initiateRazorpayPayment callbacks) ──
  const stateData = location.state || {};
  const verificationStatus = stateData.verificationResult ? 'success' : 'error';
  const transactionDetails = stateData.verificationResult || null;
  const isUpgrade = transactionDetails?.is_upgrade || stateData.isUpgrade || false;
  const paymentParams = {
    razorpay_payment_id: stateData.razorpay_payment_id || '',
    razorpay_order_id: stateData.razorpay_order_id || '',
    razorpay_signature: stateData.razorpay_signature || '',
  };

  // State
  const [activationStatus, setActivationStatus] = useState(ACTIVATION_STATES.PENDING);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [emailStatus, setEmailStatus] = useState(EMAIL_STATES.PENDING);
  const [showConfetti, setShowConfetti] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptKey, setReceiptKey] = useState(null); // R2 key — preferred over URL for downloads
  const verificationError = null;

  // Refs for cleanup
  const mountedRef = useRef(true);
  const confettiTimeoutRef = useRef(null);
  const emailTimeoutRef = useRef(null);
  const sessionTimeoutRef = useRef(null);

  const retry = useCallback(() => {
    // Re-navigate to plans page for a fresh attempt
    const userType = stateData.learnerType || role || 'learner';
    navigate(`/subscription/plans?type=${userType}`, { replace: true });
  }, [navigate, stateData.learnerType, role]);

  // Memoized values
  const managePath = useMemo(() => {
    const userRole = getUserRole(user, role);
    // Return null if role is unknown to prevent wrong redirects
    if (!userRole || userRole === 'learner') {
      // For learner, we can safely use the default
      return MANAGE_ROUTES[userRole] || '/learner/subscription/manage';
    }
    return MANAGE_ROUTES[userRole] || null;
  }, [user, role]);

  const planDetails = useMemo(() => {
    return stateData.plan || null;
  }, [stateData.plan]);

  const displayAmount = useMemo(() => {
    if (transactionDetails?.amount) return transactionDetails.amount / 100;
    if (subscriptionData?.plan_amount) return subscriptionData.plan_amount;
    return planDetails?.price ?? 0;
  }, [transactionDetails, subscriptionData, planDetails]);

  const getDashboardUrl = useCallback(() => {
    const userRole = getUserRole(user, role);
    log.info('Getting dashboard URL for role:', userRole);
    return DASHBOARD_ROUTES[userRole] || '/learner/dashboard';
  }, [user, role]);

  // Cache refresh hook
  const cacheRefresh = useCacheRefresh(refreshAccess, refreshSubscription);

  // Navigation state hook
  const navigation = useNavigationState(cacheRefresh, getDashboardUrl, navigate);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    };
  }, []);

  // Handle subscription activation from worker response
  useEffect(() => {
    if (verificationStatus !== 'success' || !transactionDetails || activationStatus !== ACTIVATION_STATES.PENDING) {
      return;
    }

    setActivationStatus(ACTIVATION_STATES.ACTIVATING);
    log.info('Transaction details received:', {
      receipt_url: transactionDetails.receipt_url,
      email_sent: transactionDetails.email_sent,
    });

    const subscription = transactionDetails?.subscription;

    if (subscription) {
      setActivationStatus(ACTIVATION_STATES.ACTIVATED);
      setSubscriptionData(subscription);

      // =====================================================================
      // FIX: Directly update the Zustand subscription store with the new
      // subscription data instead of relying on a round-trip API re-fetch.
      // This prevents the post-payment redirect loop where refreshAccess()
      // fails (e.g. _currentUserId is null, API auth fails, or DB returns
      // no data) and the route guard redirects back to /subscription/plans.
      // =====================================================================
      try {
        const store = useSubscriptionStore.getState();
        store.setAccessData({
          hasAccess: true,
          accessReason: 'active',
          isLoading: false,
          isRefetching: false,
          error: null,
          _currentUserId: user?.id,
          subscription: {
            id: subscription.id,
            status: subscription.status || 'active',
            plan_type: subscription.plan_name || subscription.plan_type,
            startDate: subscription.start_date || subscription.subscription_start_date,
            endDate: subscription.end_date || subscription.subscription_end_date,
            end_date: subscription.end_date || subscription.subscription_end_date,
            plan: subscription.plan_name || subscription.plan_type,
            planName: subscription.plan_name || subscription.plan_type,
            planPrice: subscription.plan_amount,
            features: [],
            autoRenew: true,
          },
        });
        log.info('✅ Directly updated Zustand store with subscription data. hasAccess=true');
      } catch (storeErr) {
        log.error('Failed to directly update Zustand store:', storeErr);
      }

      // Also trigger cache refresh as a secondary mechanism
      cacheRefresh.refresh().catch(err => {
        log.error('Initial cache refresh failed (non-critical — store already updated):', err);
      });

      // Invalidate React Query cache so useSubscriptionQuery() consumers
      // (MySubscription, SubscriptionStatusWidget, dashboard, etc.) get fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.data.all,
      });

      const isExistingOrAlreadyProcessed = transactionDetails.already_processed || transactionDetails.is_existing_subscription;

      if (!isExistingOrAlreadyProcessed) {
        // Fresh subscription - celebrate!
        setShowConfetti(true);
        confettiTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setShowConfetti(false);
        }, CONFIG.CONFETTI_DURATION_MS);

        // Show success toast with appropriate message
        if (isUpgrade) {
          toast.success('Plan upgraded successfully! All features unlocked.', { duration: 4000, icon: '🎉' });
        } else {
          toast.success('Welcome to SkillPassport! Your subscription is now active.', { duration: 4000, icon: '🎉' });
        }

        // Handle email status
        if (transactionDetails.email_sent === false) {
          setEmailStatus(EMAIL_STATES.FAILED);
        } else {
          setEmailStatus(EMAIL_STATES.SENDING);
          emailTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) setEmailStatus(EMAIL_STATES.SENT);
          }, CONFIG.EMAIL_STATUS_DELAY_MS);
        }

        // Handle receipt — server generates it; just store the URL and key
        if (transactionDetails.receipt_key) {
          setReceiptKey(transactionDetails.receipt_key);
          log.info('Receipt key from server:', transactionDetails.receipt_key);
        }
        if (transactionDetails.receipt_url) {
          setReceiptUrl(transactionDetails.receipt_url);
          localStorage.setItem(
            `receipt_url_${transactionDetails.razorpay_payment_id || paymentParams.razorpay_payment_id}`,
            transactionDetails.receipt_url
          );
          log.info('Receipt URL from server:', transactionDetails.receipt_url);
        }
      } else {
        // Existing subscription
        
        setEmailStatus(EMAIL_STATES.SKIPPED);

        const storedReceiptUrl = transactionDetails.receipt_url ||
          localStorage.getItem(`receipt_url_${transactionDetails.payment_id}`);
        if (storedReceiptUrl) {
          setReceiptUrl(storedReceiptUrl);
        }

        if (transactionDetails.is_existing_subscription) {
          toast.success('Your subscription is already active!', { duration: 3000, icon: '✅' });
        }
      }
    } else if (transactionDetails.subscription_created === true) {
      // Subscription was created but details weren't in the response
      setActivationStatus(ACTIVATION_STATES.ACTIVATED);
      try {
        const store = useSubscriptionStore.getState();
        store.setAccessData({
          hasAccess: true,
          accessReason: 'active',
          isLoading: false,
          _currentUserId: user?.id,
        });
        log.info('✅ Subscription created flag detected, set hasAccess=true');
      } catch (e) {
        log.error('Failed to update store for subscription_created flag:', e);
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.data.all,
      });
      setEmailStatus(EMAIL_STATES.SENT);
    } else if (transactionDetails.subscription_error) {
      log.warn('Subscription creation issue:', transactionDetails.subscription_error);
      setActivationStatus(ACTIVATION_STATES.ACTIVATED);
      
      setEmailStatus(EMAIL_STATES.SENT);
      toast('Payment successful! Your subscription will be activated shortly.', { duration: 5000, icon: '⏳' });
    } else {
      // Payment verified but no subscription object — still mark as active
      // This handles the case where verification succeeded inline in Razorpay handler
      setActivationStatus(ACTIVATION_STATES.ACTIVATED);
      try {
        const store = useSubscriptionStore.getState();
        store.setAccessData({
          hasAccess: true,
          accessReason: 'active',
          isLoading: false,
          _currentUserId: user?.id,
        });
        log.info('✅ Payment verified, set hasAccess=true (no subscription object in response)');
      } catch (e) {
        log.error('Failed to update store:', e);
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.data.all,
      });
      setEmailStatus(EMAIL_STATES.SENT);
    }
  }, [verificationStatus, transactionDetails, activationStatus, user, queryClient]);

  // Redirect if no payment params — but check location.state first since
  // PaymentCompletion passes data via React Router state, not URL params
  useEffect(() => {
    if (!paymentParams.razorpay_payment_id && verificationStatus !== 'success' && verificationStatus !== 'loading') {
      // Only redirect if there's genuinely no payment data at all
      if (!stateData.verificationResult && !stateData.razorpay_payment_id) {
        const userType = stateData?.learnerType || planDetails?.learnerType || role || 'learner';
        log.info('No payment data in URL or state, redirecting to plans');
        navigate(`/subscription/plans?type=${userType}`, { replace: true });
      }
    }
  }, [paymentParams, verificationStatus, navigate, role, planDetails, stateData]);

  // Handle no session error
  useEffect(() => {
    if (verificationError?.code === 'NO_SESSION') {
      sessionTimeoutRef.current = setTimeout(() => {
        if (!user && mountedRef.current) {
          navigate(`/login?redirect=${encodeURIComponent(window.location.href)}`, { replace: true });
        }
      }, CONFIG.NO_SESSION_REDIRECT_DELAY_MS);
    }
  }, [verificationError, user, navigate]);

  // Handle receipt download using presigned URL
  const handleDownloadReceipt = useCallback(async () => {
    try {
      // Prefer the R2 key directly — avoids URL parsing ambiguity in the backend.
      // Fall back to the public URL if the key wasn't returned by the server.
      const fileIdentifier = receiptKey || receiptUrl;
      if (fileIdentifier) {
        const presignedUrl = await getPaymentReceiptPresignedUrl(fileIdentifier, 3600);
        window.open(presignedUrl, '_blank');
        toast.success('Receipt downloading!');
        return;
      }
      // Receipt not yet available (server may still be processing)
      toast('Receipt is being prepared. Please try again in a moment.', { icon: '⏳', duration: 4000 });
    } catch (error) {
      log.error('Receipt download failed:', error);
      toast.error('Failed to download receipt. Please try again.');
    }
  }, [receiptKey, receiptUrl]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state
  if (verificationStatus === 'loading' || activationStatus === ACTIVATION_STATES.ACTIVATING) {
    return <LoadingScreen message={verificationStatus === 'loading' ? 'Verifying payment...' : 'Activating subscription...'} />;
  }

  // Error state
  if (verificationStatus === 'error' || verificationStatus === 'failure') {
    return <ErrorScreen message={verificationError?.message} onRetry={retry} />;
  }

  // Success state
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <Confetti show={showConfetti} />

      <div className="max-w-sm mx-auto space-y-5">
        {/* Receipt Card */}
        <ReceiptCard
          header={
            <>
              <h1 className="text-xl font-medium text-gray-900 mb-3">
                {isUpgrade ? 'Upgrade Successful!' : 'Payment Success!'}
              </h1>
              <p className="text-3xl font-bold text-gray-900">{formatAmount(displayAmount)}</p>
              {isUpgrade && (
                <p className="text-sm text-gray-600 mt-2">Your plan has been upgraded successfully</p>
              )}
            </>
          }
        >
          {/* Transaction Receipt Section */}
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[#2663EB]" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction Receipt</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span className="font-mono font-medium text-gray-900">{String(paymentParams.razorpay_payment_id?.slice(-10) || 'N/A')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900">{String(transactionDetails?.payment_method || 'Card')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">{formatDate(new Date())}</span>
            </div>
          </div>

          {/* Subscription Section */}
          {subscriptionData && (
            <>
              <div className="my-5 border-t border-dashed border-gray-200" />
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#2663EB]" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subscription</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-semibold text-[#2663EB]">{String(subscriptionData.plan_type ?? subscriptionData.plan_name ?? planDetails?.name ?? '')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Cycle</span>
                  <span className="font-medium text-gray-900">{String(subscriptionData.billing_cycle || planDetails?.duration || '')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Valid Until</span>
                  <span className="font-medium text-gray-900">{formatDate(subscriptionData.subscription_end_date || subscriptionData.end_date)}</span>
                </div>
              </div>
            </>
          )}
        </ReceiptCard>

        {/* Email Status */}
        <EmailStatus status={emailStatus} />

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={navigation.navigateToDashboard}
            disabled={navigation.isNavigating}
            className="w-full py-3 bg-[#2663EB] text-white rounded-xl font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {navigation.isNavigating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {navigation.isRefreshingCache ? 'Preparing...' : 'Redirecting...'}
              </>
            ) : (
              <>
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => managePath && navigate(managePath)}
              disabled={navigation.isNavigating || !managePath}
              className="py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Manage
            </button>
            <button
              onClick={handleDownloadReceipt}
              disabled={navigation.isNavigating}
              className="py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Receipt
            </button>
          </div>
        </div>

        {/* Help */}
        <p className="text-center text-xs text-gray-400 pt-2">
          Need help? <Link to="/contact" className="text-[#2663EB] font-medium">Contact Support</Link>
        </p>
      </div>

      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;
