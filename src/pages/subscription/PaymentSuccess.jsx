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
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { usePaymentVerificationFromURL } from '../../hooks/Subscription/usePaymentVerification';
import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';
import { downloadReceipt, generateReceiptBase64 } from '../../services/Subscriptions/pdfReceiptGenerator';
import { getPaymentReceiptUrl, uploadPaymentReceipt } from '../../services/storageApiService';
import { clearPendingUserData } from '../../utils/authCleanup';

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
  CACHE_REFRESH_MAX_RETRIES: 3,
  CACHE_REFRESH_RETRY_DELAY_MS: 500,
  CACHE_REFRESH_TIMEOUT_MS: 10000,
  NAVIGATION_DELAY_MS: 100,
  CONFETTI_DURATION_MS: 4000,
  EMAIL_STATUS_DELAY_MS: 2000,
  NO_SESSION_REDIRECT_DELAY_MS: 2000,
};

/** Dashboard routes by role */
const DASHBOARD_ROUTES = {
  // Admin roles
  super_admin: '/admin/dashboard',
  rm_admin: '/admin/dashboard',
  rm_manager: '/admin/dashboard',
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
  // Student roles
  student: '/student/dashboard',
  school_student: '/student/dashboard',
  college_student: '/student/dashboard',
};

/** Subscription manage routes by role */
const MANAGE_ROUTES = {
  super_admin: '/admin/subscription/manage',
  rm_admin: '/admin/subscription/manage',
  admin: '/admin/subscription/manage',
  school_admin: '/school-admin/subscription/manage',
  college_admin: '/college-admin/subscription/manage',
  university_admin: '/university-admin/subscription/manage',
  educator: '/educator/subscription/manage',
  school_educator: '/educator/subscription/manage',
  college_educator: '/educator/subscription/manage',
  recruiter: '/recruitment/subscription/manage',
  student: '/student/subscription/manage',
  school_student: '/student/subscription/manage',
  college_student: '/student/subscription/manage',
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

/** Sleep utility */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Retry with exponential backoff */
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
    }).format(a || 0);
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
    || 'student';
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to manage cache refresh with retry logic
 */
function useCacheRefresh(refreshAccess, refreshSubscription) {
  const [state, setState] = useState({
    status: 'idle', // 'idle' | 'refreshing' | 'success' | 'error'
    attempts: 0,
    error: null,
  });
  
  const mountedRef = useRef(true);
  const refreshPromiseRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    // Return existing promise if already refreshing
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    setState({ status: 'refreshing', attempts: 0, error: null });
    log.info('Starting cache refresh');

    refreshPromiseRef.current = retryWithBackoff(
      async () => {
        await Promise.all([
          refreshAccess(),
          refreshSubscription(),
        ]);
        // Small delay to ensure React Query cache is updated
        await sleep(CONFIG.NAVIGATION_DELAY_MS);
      },
      CONFIG.CACHE_REFRESH_MAX_RETRIES,
      CONFIG.CACHE_REFRESH_RETRY_DELAY_MS,
      (attempt, delay, error) => {
        log.warn(`Cache refresh retry ${attempt}/${CONFIG.CACHE_REFRESH_MAX_RETRIES}`, error);
        if (mountedRef.current) {
          setState(prev => ({ ...prev, attempts: attempt }));
        }
      }
    )
      .then(() => {
        if (mountedRef.current) {
          log.info('Cache refresh successful');
          setState({ status: 'success', attempts: 0, error: null });
        }
      })
      .catch((error) => {
        if (mountedRef.current) {
          log.error('Cache refresh failed', error);
          setState({ status: 'error', attempts: CONFIG.CACHE_REFRESH_MAX_RETRIES, error });
        }
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    return refreshPromiseRef.current;
  }, [refreshAccess, refreshSubscription]);

  return {
    ...state,
    refresh,
    isRefreshed: state.status === 'success',
    isRefreshing: state.status === 'refreshing',
  };
}

/**
 * Hook to manage navigation state machine
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
      // Ensure cache is refreshed
      if (!cacheRefresh.isRefreshed) {
        await cacheRefresh.refresh();
      }

      if (!mountedRef.current) return;

      setState({ status: NAV_STATES.NAVIGATING, error: null });
      
      // Navigate with post-payment flag
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
        // Still try to navigate even on error - subscription is already created
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
    [EMAIL_STATES.FAILED]: { icon: AlertCircle, color: 'text-amber-500', text: 'Could not send email' },
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
  const [searchParams] = useSearchParams();
  const { user, role } = useAuth();
  const { refreshAccess } = useSubscriptionContext();
  const { refreshSubscription } = useSubscriptionQuery();

  // State
  const [activationStatus, setActivationStatus] = useState(ACTIVATION_STATES.PENDING);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [emailStatus, setEmailStatus] = useState(EMAIL_STATES.PENDING);
  const [showConfetti, setShowConfetti] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptUploading, setReceiptUploading] = useState(false);

  // Refs for cleanup
  const mountedRef = useRef(true);
  const confettiTimeoutRef = useRef(null);
  const emailTimeoutRef = useRef(null);
  const sessionTimeoutRef = useRef(null);

  // Payment verification
  const {
    status: verificationStatus,
    transactionDetails,
    error: verificationError,
    paymentParams,
    retry,
  } = usePaymentVerificationFromURL(searchParams, true);

  // Memoized values
  const managePath = useMemo(() => 
    MANAGE_ROUTES[getUserRole(user, role)] || '/student/subscription/manage',
    [user, role]
  );

  const planDetails = useMemo(() => {
    try {
      const stored = localStorage.getItem('payment_plan_details');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const displayAmount = useMemo(() => {
    if (transactionDetails?.amount) return transactionDetails.amount / 100;
    if (subscriptionData?.plan_amount) return subscriptionData.plan_amount;
    return planDetails?.price || 0;
  }, [transactionDetails, subscriptionData, planDetails]);

  const getDashboardUrl = useCallback(() => {
    const userRole = getUserRole(user, role);
    log.info('Getting dashboard URL for role:', userRole);
    return DASHBOARD_ROUTES[userRole] || '/student/dashboard';
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

  // Upload receipt to R2
  const uploadReceiptToR2 = useCallback(async (receiptData, paymentId, userId) => {
    if (!mountedRef.current) return;
    
    try {
      setReceiptUploading(true);
      const pdfBase64 = await generateReceiptBase64(receiptData);
      const filename = `Receipt-${paymentId?.slice(-8) || 'payment'}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      const result = await uploadPaymentReceipt(pdfBase64, paymentId, userId, filename);
      
      if (result.success && result.fileKey && mountedRef.current) {
        const downloadUrl = getPaymentReceiptUrl(result.fileKey, 'download');
        setReceiptUrl(downloadUrl);
        localStorage.setItem(`receipt_url_${paymentId}`, downloadUrl);
        log.info('Receipt uploaded to R2:', downloadUrl);
      }
    } catch (error) {
      log.error('Failed to upload receipt to R2:', error);
    } finally {
      if (mountedRef.current) {
        setReceiptUploading(false);
      }
    }
  }, []);

  // Handle subscription activation from worker response
  useEffect(() => {
    if (verificationStatus !== 'success' || !transactionDetails || activationStatus !== ACTIVATION_STATES.PENDING) {
      return;
    }

    setActivationStatus(ACTIVATION_STATES.ACTIVATING);
    log.info('Transaction details received:', {
      payment_id: transactionDetails.payment_id,
      receipt_url: transactionDetails.receipt_url,
      email_sent: transactionDetails.email_sent,
    });

    const subscription = transactionDetails?.subscription;

    if (subscription) {
      setActivationStatus(ACTIVATION_STATES.ACTIVATED);
      setSubscriptionData(subscription);

      // Trigger cache refresh
      cacheRefresh.refresh().catch(err => {
        log.error('Initial cache refresh failed:', err);
      });

      const isExistingOrAlreadyProcessed = transactionDetails.already_processed || transactionDetails.is_existing_subscription;

      if (!isExistingOrAlreadyProcessed) {
        // Fresh subscription - celebrate!
        setShowConfetti(true);
        confettiTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setShowConfetti(false);
        }, CONFIG.CONFETTI_DURATION_MS);

        clearPendingUserData();

        // Handle email status
        if (transactionDetails.email_sent === false) {
          setEmailStatus(EMAIL_STATES.FAILED);
        } else {
          setEmailStatus(EMAIL_STATES.SENDING);
          emailTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) setEmailStatus(EMAIL_STATES.SENT);
          }, CONFIG.EMAIL_STATUS_DELAY_MS);
        }

        // Handle receipt
        if (transactionDetails.receipt_url) {
          setReceiptUrl(transactionDetails.receipt_url);
          localStorage.setItem(`receipt_url_${transactionDetails.payment_id}`, transactionDetails.receipt_url);
        } else {
          // Upload from frontend as fallback
          const receiptData = {
            transaction: {
              payment_id: transactionDetails.payment_id || 'N/A',
              order_id: transactionDetails.order_id || 'N/A',
              amount: transactionDetails.amount ? transactionDetails.amount / 100 : subscription.plan_amount || 0,
              currency: 'INR',
              payment_method: transactionDetails.payment_method || 'Card',
              payment_timestamp: formatDate(new Date()),
              status: 'Success',
            },
            subscription: {
              plan_type: subscription.plan_type,
              billing_cycle: subscription.billing_cycle,
              subscription_start_date: formatDate(subscription.subscription_start_date),
              subscription_end_date: formatDate(subscription.subscription_end_date),
            },
            user: {
              name: transactionDetails.user_name || user?.user_metadata?.full_name || 'User',
              email: transactionDetails.user_email || user?.email || '',
              phone: user?.user_metadata?.phone || null,
            },
            company: { name: 'RareMinds', address: 'Your Company Address', taxId: 'TAX123456789' },
            generatedAt: new Date().toLocaleString(),
          };
          uploadReceiptToR2(receiptData, transactionDetails.payment_id, subscription.user_id);
        }
      } else {
        // Existing subscription
        clearPendingUserData();
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
    } else if (transactionDetails.subscription_error) {
      log.warn('Subscription creation issue:', transactionDetails.subscription_error);
      setActivationStatus(ACTIVATION_STATES.ACTIVATED);
      clearPendingUserData();
      setEmailStatus(EMAIL_STATES.SENT);
      toast('Payment successful! Your subscription will be activated shortly.', { duration: 5000, icon: '⏳' });
    } else {
      setActivationStatus(ACTIVATION_STATES.ACTIVATED);
      clearPendingUserData();
      setEmailStatus(EMAIL_STATES.SENT);
    }
  }, [verificationStatus, transactionDetails, activationStatus, user, cacheRefresh, uploadReceiptToR2]);

  // Redirect if no payment params
  useEffect(() => {
    if (!paymentParams.razorpay_payment_id && verificationStatus !== 'loading') {
      const userType = planDetails?.studentType || role || 'student';
      navigate(`/subscription/plans?type=${userType}`, { replace: true });
    }
  }, [paymentParams, verificationStatus, navigate, role, planDetails]);

  // Handle no session error
  useEffect(() => {
    if (verificationError?.code === 'NO_SESSION') {
      sessionTimeoutRef.current = setTimeout(() => {
        if (!user && mountedRef.current) {
          navigate(`/auth/login?redirect=${encodeURIComponent(window.location.href)}`, { replace: true });
        }
      }, CONFIG.NO_SESSION_REDIRECT_DELAY_MS);
    }
  }, [verificationError, user, navigate]);

  // Handle receipt download
  const handleDownloadReceipt = useCallback(async () => {
    try {
      if (receiptUrl) {
        window.open(receiptUrl, '_blank');
        toast.success('Receipt downloading!');
        return;
      }

      const receiptData = {
        transaction: {
          payment_id: paymentParams.razorpay_payment_id || 'N/A',
          order_id: paymentParams.razorpay_order_id || 'N/A',
          amount: displayAmount,
          currency: 'INR',
          payment_method: transactionDetails?.payment_method || 'Card',
          payment_timestamp: formatDate(new Date()),
          status: 'Success',
        },
        subscription: subscriptionData ? {
          plan_type: subscriptionData.plan_type,
          billing_cycle: subscriptionData.billing_cycle,
          subscription_start_date: formatDate(subscriptionData.subscription_start_date),
          subscription_end_date: formatDate(subscriptionData.subscription_end_date),
        } : null,
        user: {
          name: transactionDetails?.user_name || user?.user_metadata?.full_name || 'User',
          email: transactionDetails?.user_email || user?.email || '',
          phone: user?.user_metadata?.phone || null,
        },
        company: { 
          name: 'RareMinds', 
          address: '231, 2nd stage, 13th Cross Road\nHoysala Nagar, Indiranagar\nBengaluru, Karnataka 560001', 
          taxId: 'GSTIN: 29ABCDE1234F1Z5',
          phone: '+91 9902326951',
          email: 'marketing@rareminds.in'
        },
        generatedAt: new Date().toLocaleString(),
      };

      const filename = `Receipt-${paymentParams.razorpay_payment_id?.slice(-8) || 'payment'}-${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadReceipt(receiptData, filename);
      toast.success('Receipt downloaded!');
    } catch (error) {
      log.error('Receipt download failed:', error);
      toast.error('Failed to download receipt');
    }
  }, [receiptUrl, paymentParams, displayAmount, transactionDetails, subscriptionData, user]);

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
              <h1 className="text-xl font-medium text-gray-900 mb-3">Payment Success!</h1>
              <p className="text-3xl font-bold text-gray-900">{formatAmount(displayAmount)}</p>
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
              <span className="font-mono font-medium text-gray-900">{paymentParams.razorpay_payment_id?.slice(-10) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900">{transactionDetails?.payment_method || 'Card'}</span>
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
                  <span className="font-semibold text-[#2663EB]">{subscriptionData.plan_type || planDetails?.name || 'Premium'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Cycle</span>
                  <span className="font-medium text-gray-900">{subscriptionData.billing_cycle || planDetails?.duration || 'Monthly'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Valid Until</span>
                  <span className="font-medium text-gray-900">{formatDate(subscriptionData.subscription_end_date)}</span>
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
              onClick={() => navigate(managePath)}
              disabled={navigation.isNavigating}
              className="py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Manage
            </button>
            <button
              onClick={handleDownloadReceipt}
              disabled={receiptUploading || navigation.isNavigating}
              className="py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {receiptUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
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
