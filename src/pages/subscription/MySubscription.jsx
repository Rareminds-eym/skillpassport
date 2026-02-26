import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  CreditCard,
  Download,
  HelpCircle,
  LayoutDashboard,
  Mail,
  Receipt,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  X as XIcon
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SubscriptionDashboard } from '../../components/Subscription/SubscriptionDashboard';
import { useSubscriptionPlansData } from '../../hooks/Subscription/useSubscriptionPlansData';
import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { getUserSubscriptions } from '../../services/Subscriptions/subscriptionService';
import { deactivateSubscription, pauseSubscription, resumeSubscription } from '../../services/paymentsApiService';
import { calculateDaysRemaining, calculateProgressPercentage, formatDate as formatDateUtil, getSubscriptionStatusChecks } from '../../utils/subscriptionHelpers';
import { useUsageStatistics } from '../../hooks/useUsageStatistics';

/**
 * Get the settings path based on current URL path (more reliable than role)
 */
function getSettingsPathFromUrl(pathname) {
  if (pathname.startsWith('/student')) return '/student/settings';
  if (pathname.startsWith('/recruitment')) return '/recruitment/settings';
  if (pathname.startsWith('/educator')) return '/educator/settings';
  if (pathname.startsWith('/college-admin')) return '/college-admin/settings';
  if (pathname.startsWith('/school-admin')) return '/school-admin/settings';
  if (pathname.startsWith('/university-admin')) return '/university-admin/settings';
  if (pathname.startsWith('/admin')) return '/admin/settings';
  return '/student/settings'; // fallback
}

/**
 * Get the dashboard path based on current URL path
 */
function getDashboardPathFromUrl(pathname) {
  if (pathname.startsWith('/student')) return '/student/dashboard';
  if (pathname.startsWith('/recruitment')) return '/recruitment/overview';
  if (pathname.startsWith('/educator')) return '/educator/dashboard';
  if (pathname.startsWith('/college-admin')) return '/college-admin/dashboard';
  if (pathname.startsWith('/school-admin')) return '/school-admin/dashboard';
  if (pathname.startsWith('/university-admin')) return '/university-admin/dashboard';
  if (pathname.startsWith('/admin')) return '/admin/dashboard';
  return '/student/dashboard'; // fallback
}

/**
 * Get the user type for subscription plans based on current URL path (more reliable than role)
 */
function getUserTypeFromUrl(pathname) {
  if (pathname.startsWith('/student')) return 'student';
  if (pathname.startsWith('/recruitment')) return 'recruiter';
  if (pathname.startsWith('/educator')) return 'educator';
  if (pathname.startsWith('/college-admin')) return 'college_admin';
  if (pathname.startsWith('/school-admin')) return 'school_admin';
  if (pathname.startsWith('/university-admin')) return 'university_admin';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'student'; // fallback
}

// Removed FALLBACK_PLANS as per requirement to use DB data only

function MySubscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, role, loading: authLoading } = useAuth();
  const { subscriptionData, loading: subscriptionLoading, refreshSubscription } = useSubscriptionQuery();

  // Get settings, dashboard paths, and user type from current URL (more reliable than role)
  const settingsPath = useMemo(() => getSettingsPathFromUrl(location.pathname), [location.pathname]);
  const dashboardPath = useMemo(() => getDashboardPathFromUrl(location.pathname), [location.pathname]);
  const userType = useMemo(() => getUserTypeFromUrl(location.pathname), [location.pathname]);

  // Tab state - 'subscription' or 'addons'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'subscription');

  // Fetch plans from Cloudflare Worker API (limited to 4 features initially)
  const {
    plans: dbPlans,
    loading: plansLoading,
    loadingMore: loadingMoreFeatures,
    showingAllFeatures,
    fetchAllFeatures,
    showLimitedFeatures
  } = useSubscriptionPlansData({
    businessType: 'b2b',
    featuresLimit: 4
  });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showBillingHistory, setShowBillingHistory] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [pauseMonths, setPauseMonths] = useState(1);
  const [showRetentionOffer, setShowRetentionOffer] = useState(false);
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(subscriptionData?.autoRenew || false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingBillingHistory, setLoadingBillingHistory] = useState(false);
  const [billingHistoryFetched, setBillingHistoryFetched] = useState(false);
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);

  // Use database plans directly
  const plans = useMemo(() => {
    if (dbPlans && dbPlans.length > 0) {
      return dbPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        priceLabel: plan.contactSales ? 'Contact Sales' : 'Per Person',
        features: plan.features || [],
        totalFeatures: plan.totalFeatures || plan.features?.length || 0,
        hasMoreFeatures: plan.hasMoreFeatures || false,
        detailedFeatures: plan.detailedFeatures || [],
        limits: plan.limits
      }));
    }
    return [];
  }, [dbPlans]);

  // Calculate days remaining and progress - optimized
  const daysRemaining = useMemo(() =>
    calculateDaysRemaining(subscriptionData?.endDate),
    [subscriptionData?.endDate]
  );

  const progressPercentage = useMemo(() =>
    calculateProgressPercentage(subscriptionData?.startDate, subscriptionData?.endDate),
    [subscriptionData?.startDate, subscriptionData?.endDate]
  );

  const formatDate = useCallback((dateString) => formatDateUtil(dateString), []);

  const handleUpgradePlan = () => {
    // Use userType from URL path (more reliable than role from auth)
    navigate(`/subscription/plans?type=${userType}&mode=upgrade`);
  };

  const handleRenewSubscription = () => {
    // Use the memoized currentPlan instead of finding again
    navigate('/subscription/payment', {
      state: {
        plan: currentPlan,
        isRenewal: true
      }
    });
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = async () => {
    if (!subscriptionData || !cancelReason) {
      alert('Please select a cancellation reason');
      return;
    }

    setIsCancelling(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Call Worker via paymentsApiService
      const result = await deactivateSubscription(
        subscriptionData.id,
        cancelReason,
        token
      );

      if (result.success) {
        // Success - show confirmation
        alert(`Subscription cancelled successfully. You'll have access until ${formatDate(subscriptionData.endDate)}`);

        // Refresh subscription data
        await refreshSubscription();

        setShowCancelModal(false);
        setCancelReason('');
        setAdditionalFeedback('');
        setShowRetentionOffer(false);
      } else {
        alert(`Failed to cancel subscription: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePauseSubscription = async () => {
    if (!subscriptionData) return;

    setIsPausing(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const result = await pauseSubscription(
        subscriptionData.id,
        pauseMonths,
        token
      );

      if (result.success) {
        alert(`Subscription paused for ${pauseMonths} month(s). It will automatically resume after this period.`);
        await refreshSubscription();
        setShowPauseModal(false);
        setShowCancelModal(false);
      } else {
        alert(`Failed to pause subscription: ${result.error}`);
      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsPausing(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!subscriptionData) return;

    const confirmed = window.confirm('Resume your subscription now?');
    if (!confirmed) return;

    setIsPausing(true); // Reuse isPausing state for loading

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const result = await resumeSubscription(subscriptionData.id, token);

      if (result.success) {
        alert('Subscription resumed successfully!');
        await refreshSubscription();
      } else {
        alert(`Failed to resume subscription: ${result.error}`);
      }
    } catch (error) {
      console.error('Error resuming subscription:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsPausing(false);
    }
  };

  const handleCancelReasonChange = (reason) => {
    setCancelReason(reason);
    // Show retention offer based on reason
    if (reason === 'Too expensive' || reason === 'Not using enough') {
      setShowRetentionOffer(true);
    } else {
      setShowRetentionOffer(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setIsDownloadingInvoice(true);
    try {
      // Simulate download - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Actual implementation would call API to generate/download invoice
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (isTogglingAutoRenew) return; // Prevent double clicks

    const newValue = !autoRenewEnabled;
    const previousValue = autoRenewEnabled;

    // Optimistic update - instant UI feedback
    setAutoRenewEnabled(newValue);
    setIsTogglingAutoRenew(true);

    try {
      // TODO: Call actual API to update auto-renewal setting
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      // Success - keep the new value
    } catch (error) {
      // Rollback on error
      setAutoRenewEnabled(previousValue);
      console.error('Failed to toggle auto-renewal:', error);
    } finally {
      setIsTogglingAutoRenew(false);
    }
  };

  const handleContactSupport = () => {
    // Navigate to support page or open support modal
    navigate('/support?topic=billing');
  };

  // Use URL-based paths (already computed from location.pathname)
  const getDashboardUrl = useCallback(() => dashboardPath, [dashboardPath]);
  const getSettingsUrl = useCallback(() => settingsPath, [settingsPath]);

  // Fetch billing history from database (with caching)
  const fetchBillingHistory = useCallback(async (force = false) => {
    if (!user) return;
    if (billingHistoryFetched && !force) return; // Skip if already fetched

    setLoadingBillingHistory(true);
    try {
      const result = await getUserSubscriptions(false); // false = optimized query

      if (result.success && result.data) {
        // Transform database subscriptions to billing history format
        // More lenient filter - show all subscriptions that have been processed
        const history = result.data
          .filter(sub => {
            // Show if it has any of these statuses
            const validStatuses = ['active', 'expired', 'cancelled'];
            const hasValidStatus = validStatuses.includes(sub.status?.toLowerCase());
            const hasPayment = sub.razorpay_subscription_id;
            return hasValidStatus || hasPayment;
          })
          .map(sub => ({
            id: sub.id,
            date: sub.created_at || sub.subscription_start_date,
            amount: sub.plan_amount || '0',
            status: sub.status === 'active' ? 'paid' : 'completed',
            description: `${sub.plan_type || 'Basic Plan'} - ${sub.billing_cycle || 'Monthly'}`,
            planType: sub.plan_type,
            billingCycle: sub.billing_cycle,
            subscriptionStatus: sub.status
          }));

        setBillingHistory(history);
        setBillingHistoryFetched(true);
      }
    } catch (error) {
      console.error('❌ Error fetching billing history:', error);
    } finally {
      setLoadingBillingHistory(false);
    }
  }, [user, billingHistoryFetched]);

  // Prefetch billing history in background after page loads
  useEffect(() => {
    if (user && !billingHistoryFetched && !loadingBillingHistory) {
      // Wait 1 second after page load to prefetch billing history
      const timer = setTimeout(() => {
        fetchBillingHistory();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, billingHistoryFetched, loadingBillingHistory, fetchBillingHistory]);

  // Get current plan early for use in billing history
  // Map subscription plan to database plan (handle 'pro' -> 'professional' mapping)
  const currentPlan = useMemo(() => {
    if (!subscriptionData?.plan) return null;

    // The subscriptionData.plan comes directly from the backend (plan_code or fallback plan_type)
    const planId = subscriptionData.plan.toLowerCase();

    // Find plan in database plans by exact ID match only
    let plan = plans.find(p => p.id === planId);

    // If still not found, use subscription data to build plan info
    if (!plan) {
      const features = subscriptionData.features || [];
      return {
        id: subscriptionData.plan,
        name: subscriptionData.planName || `${subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1)} Plan`,
        price: subscriptionData.planPrice ? String(subscriptionData.planPrice) : null,
        priceLabel: 'Per Person',
        features: features,
        totalFeatures: features.length,
        hasMoreFeatures: false
      };
    }

    return plan;
  }, [plans, subscriptionData?.plan, subscriptionData?.planName, subscriptionData?.planPrice, subscriptionData?.features]);

  // Calculate display features and whether there are more to show
  // Uses showingAllFeatures from hook instead of local state
  const { displayFeatures, totalFeaturesCount, hasMoreFeatures, hiddenCount } = useMemo(() => {
    const features = currentPlan?.features || subscriptionData?.features || [];
    // totalFeatures from API, or fallback to a reasonable estimate
    // If we have exactly 4 features and no totalFeatures, assume there might be more
    const total = currentPlan?.totalFeatures || (features.length === 4 ? 10 : features.length);

    // hasMoreFeatures is true if:
    // 1. API explicitly says there are more (currentPlan.hasMoreFeatures) OR
    // 2. Total features > currently displayed features OR
    // 3. We have exactly 4 features (the limit) and haven't expanded yet
    const hasMore = (currentPlan?.hasMoreFeatures === true) ||
      (total > features.length) ||
      (features.length === 4 && !showingAllFeatures);

    const hidden = Math.max(0, total - features.length);

    return {
      displayFeatures: features,
      totalFeaturesCount: total,
      hiddenCount: hidden,
      // Only show "Show more" if there are more features AND we haven't already loaded all
      hasMoreFeatures: hasMore && !showingAllFeatures
    };
  }, [currentPlan?.features, currentPlan?.totalFeatures, currentPlan?.hasMoreFeatures, subscriptionData?.features, showingAllFeatures]);

  // Simple handler to toggle features - no complex animation state needed
  const handleToggleFeatures = async () => {
    if (showingAllFeatures) {
      await showLimitedFeatures();
    } else {
      await fetchAllFeatures();
    }
  };

  // Memoize status checks for better performance using optimized helper
  // Must be called before any conditional returns (Rules of Hooks)
  const statusChecks = useMemo(() =>
    getSubscriptionStatusChecks(subscriptionData, daysRemaining),
    [subscriptionData, daysRemaining]
  );

  const { isExpiringSoon, isExpired, isActive, isPaused } = statusChecks;

  // Fetch dynamic usage statistics
  const { usageStats, loading: usageLoading } = useUsageStatistics(currentPlan);

  // Skeleton loader component - Editorial luxury style
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="bg-white border-b-2 border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-64 bg-slate-200 rounded-2xl animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-lg">
              <div className="h-6 w-32 bg-slate-200 rounded-2xl animate-pulse mb-4"></div>
              <div className="h-8 w-48 bg-slate-200 rounded-2xl animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-lg">
              <div className="h-6 w-32 bg-slate-200 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (authLoading || subscriptionLoading || plansLoading) {
    return <SkeletonLoader />;
  }

  // No subscription found - Editorial luxury style
  if (!subscriptionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
        {/* Back to Home for no subscription state */}
        <div className="bg-white border-b-2 border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate(getSettingsUrl())}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors group font-medium"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Settings
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-slate-200 p-8 text-center shadow-2xl">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-7 h-7 text-slate-700" />
            </div>
            <h2 className="text-3xl font-light text-slate-900 mb-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>No Active Subscription</h2>
            <p className="text-slate-600 text-sm mb-6 font-light leading-relaxed">
              You don't have an active subscription yet. Choose a plan to get started.
            </p>
            <button
              onClick={() => {
                // Use userType from URL path (already computed at top of component)
                navigate(`/subscription/plans?type=${userType}`);
              }}
              className="w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white py-3 px-6 rounded-2xl text-sm font-semibold hover:from-slate-900 hover:to-black transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header - Editorial Luxury Style */}
      <div className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back to Settings Button */}
          <button
            onClick={() => navigate(getSettingsUrl())}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors group font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Settings
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-5xl font-light text-slate-900 mb-3 tracking-tight" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>My Subscription</h1>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {user?.email && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <Mail className="w-3 h-3 mr-1.5" />
                    {user.email}
                  </span>
                )}
                {subscriptionData?.entityType && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold bg-purple-100 text-purple-700 capitalize border border-purple-200">
                    <Circle className="w-2 h-2 mr-1.5 fill-purple-600" />
                    {subscriptionData.entityType.replace('-', ' ')}
                  </span>
                )}
                {role && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold bg-amber-100 text-amber-700 capitalize border border-amber-200">
                    <Shield className="w-3 h-3 mr-1.5" />
                    {role}
                  </span>
                )}
              </div>
              <p className="text-lg text-slate-600 font-light">Manage your subscription and billing</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Tab Navigation - Editorial Style */}
          <div className="mt-8 inline-flex bg-white rounded-2xl p-1.5 shadow-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'subscription'
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Shield className="w-4 h-4" />
              Subscription
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'addons'
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              Add-Ons
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add-Ons Tab Content */}
        {activeTab === 'addons' ? (
          <SubscriptionDashboard subscriptionData={subscriptionData} />
        ) : (
          <>
            {/* Alert Banner - Editorial Luxury Style */}
            {(isExpiringSoon || isExpired || isPaused) && (
              <div className={`mb-8 p-6 rounded-3xl border-2 flex items-start gap-4 shadow-lg ${isExpired
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                : isPaused
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200'
                  : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
                }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${isExpired ? 'bg-red-500' : isPaused ? 'bg-amber-500' : 'bg-slate-700'
                  }`}>
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className={`font-light text-2xl mb-2 ${isPaused ? 'text-amber-900' : isExpired ? 'text-red-900' : 'text-slate-900'
                    }`} style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                    {isExpired ? 'Subscription Expired' : isPaused ? 'Subscription Paused' : 'Subscription Expiring Soon'}
                  </h3>
                  <p className={`text-sm font-light leading-relaxed ${isPaused ? 'text-amber-700' : isExpired ? 'text-red-700' : 'text-slate-600'
                    }`}>
                    {isExpired
                      ? 'Your subscription has expired. Renew now to continue accessing premium features.'
                      : isPaused
                        ? 'Your subscription is currently paused. Resume it to continue accessing premium features.'
                        : `Your subscription will expire in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew to avoid interruption.`
                    }
                  </p>
                  <button
                    onClick={handleRenewSubscription}
                    className={`mt-4 px-6 py-3 rounded-2xl text-sm font-semibold transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 ${isPaused
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800'
                      : isExpired
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                        : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black'
                      }`}
                  >
                    {isPaused ? 'Resume Subscription' : 'Renew Now'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Plan Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Usage Statistics - Editorial Luxury */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="px-6 py-5 border-b border-slate-100">
                    <h3 className="text-lg font-light text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      Usage Statistics
                    </h3>
                  </div>
                  <div className="p-6">
                    {usageLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[1, 2, 3].map((idx) => (
                          <div key={idx} className="animate-pulse">
                            <div className="h-4 bg-slate-200 rounded-2xl mb-2"></div>
                            <div className="h-2.5 bg-slate-100 rounded-full mb-2"></div>
                            <div className="h-3 bg-slate-100 rounded-2xl"></div>
                          </div>
                        ))}
                      </div>
                    ) : usageStats ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {Object.values(usageStats).map((stat, idx) => (
                          <div key={idx}>
                            <div className="flex items-baseline justify-between mb-2">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                              <span className="text-xs text-slate-600 font-medium">{stat.used}/{stat.total}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 shadow-inner">
                              <div
                                className="bg-gradient-to-r from-slate-800 to-slate-900 h-2.5 rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${(stat.used / stat.total) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-600 mt-2 font-medium">
                              {stat.total - stat.used} remaining
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm font-medium">Unable to load usage statistics</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Plan Card - Editorial Luxury */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-slate-300 transition-all shadow-lg hover:shadow-xl">
                  {/* Plan Header */}
                  <div className="px-6 py-5 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${isActive
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                            : isPaused
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                              : isExpired
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                            <Circle className={`w-1.5 h-1.5 ${isActive ? 'fill-white animate-pulse' : isPaused ? 'fill-white' : 'fill-slate-600'
                              }`} />
                            {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                          </span>
                        </div>
                        <h2 className="text-3xl font-light text-slate-900 mb-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                          {subscriptionData?.planName || subscriptionData?.plan_type || currentPlan?.name || 'Basic Plan'}
                        </h2>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                            {subscriptionData?.planPrice ? `₹${subscriptionData.planPrice}` : (currentPlan?.price ? `₹${currentPlan.price}` : 'Contact Sales')}
                          </span>
                          <span className="text-sm text-slate-600 font-light">
                            {currentPlan?.priceLabel || '/person'}
                          </span>
                        </div>
                      </div>
                      {isActive && daysRemaining !== null && (
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Remaining</span>
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow-lg ${daysRemaining <= 7
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : daysRemaining <= 15
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                              : 'bg-gradient-to-br from-slate-700 to-slate-800'
                            }`}>
                            <Clock className="w-4 h-4 text-white" />
                            <span className="text-sm font-semibold text-white">
                              {daysRemaining} days
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isActive && progressPercentage > 0 && (
                      <div className="mt-5 pt-5 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Subscription Period</span>
                          <span className="text-xs font-bold text-slate-900">{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner">
                          <div
                            className="bg-gradient-to-r from-slate-800 to-slate-900 h-2 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plan Features */}
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Plan Features</h3>
                      {totalFeaturesCount > 0 && (
                        <span
                          className={`text-xs transition-all duration-300 font-semibold uppercase tracking-wider ${showingAllFeatures ? 'text-slate-700' : 'text-slate-500'
                            }`}
                        >
                          {showingAllFeatures
                            ? `All ${totalFeaturesCount} features`
                            : `${totalFeaturesCount} included`
                          }
                        </span>
                      )}
                    </div>

                    {/* Features List with smooth CSS transitions */}
                    <ul className="space-y-3">
                      {displayFeatures.map((feature, index) => (
                        <li
                          key={`feature-${feature.slice(0, 20)}-${index}`}
                          className="flex items-start gap-3 opacity-100 transform translate-y-0 transition-all duration-300 ease-out group"
                          style={{
                            transitionDelay: `${index * 30}ms`
                          }}
                        >
                          <div className="w-5 h-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg group-hover:scale-110 transition-transform">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-slate-700 font-medium leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Show More/Less Toggle */}
                    {(hasMoreFeatures || showingAllFeatures) && (
                      <button
                        onClick={handleToggleFeatures}
                        disabled={loadingMoreFeatures}
                        className={`mt-5 w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-2xl transition-all duration-200 group ${loadingMoreFeatures
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-[0.98] border border-slate-200'
                          }`}
                      >
                        {loadingMoreFeatures ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : showingAllFeatures ? (
                          <>
                            <ChevronUp className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                            {hiddenCount > 0
                              ? `Show ${hiddenCount} more feature${hiddenCount !== 1 ? 's' : ''}`
                              : 'Show all features'
                            }
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Subscription Details - Editorial Luxury */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="px-6 py-5 border-b border-slate-100">
                    <h3 className="text-lg font-light text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      Subscription Details
                    </h3>
                  </div>
                  <div className="px-6 py-5">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Start Date</dt>
                        <dd className="text-sm text-slate-900 font-medium">{formatDate(subscriptionData.startDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">End Date</dt>
                        <dd className="text-sm text-slate-900 font-medium">{formatDate(subscriptionData.endDate)}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Auto Renewal</dt>
                        <dd className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${autoRenewEnabled
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                              }`}>
                              <Circle className={`w-1.5 h-1.5 ${autoRenewEnabled ? 'fill-white animate-pulse' : 'fill-slate-600'
                                }`} />
                              {autoRenewEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <span className="text-xs text-slate-600 font-medium">
                              {autoRenewEnabled ? 'Subscription renews automatically' : 'Manual renewal required'}
                            </span>
                          </div>
                          <button
                            onClick={handleToggleAutoRenew}
                            disabled={isTogglingAutoRenew}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-inner ${autoRenewEnabled ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-slate-300'
                              }`}
                          >
                            {isTogglingAutoRenew ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${autoRenewEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                  }`}
                              />
                            )}
                          </button>
                        </dd>
                      </div>
                      {subscriptionData.nextBillingDate && autoRenewEnabled && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Next Billing Date</dt>
                          <dd className="text-sm text-slate-900 font-medium">{formatDate(subscriptionData.nextBillingDate)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Billing History - Editorial Luxury */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                  <button
                    onClick={() => setShowBillingHistory(!showBillingHistory)}
                    onMouseEnter={() => {
                      // Prefetch on hover for instant display
                      if (!billingHistoryFetched && !loadingBillingHistory) {
                        fetchBillingHistory();
                      }
                    }}
                    className="w-full px-6 py-5 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-3xl"
                  >
                    <h3 className="text-lg font-light text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                        <Receipt className="w-4 h-4 text-white" />
                      </div>
                      Billing History
                    </h3>
                    {showBillingHistory ? (
                      <ChevronUp className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                  {showBillingHistory && (
                    <div className="px-6 py-4">
                      {loadingBillingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                        </div>
                      ) : billingHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Receipt className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-600 font-medium">No billing history found</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {billingHistory.map((invoice) => (
                            <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{invoice.description}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{formatDate(invoice.date)}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-slate-900">₹{invoice.amount}</span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${invoice.status === 'success' || invoice.status === 'paid'
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                                  }`}>
                                  <Circle className={`w-1.5 h-1.5 ${invoice.status === 'success' || invoice.status === 'paid' ? 'fill-white' : 'fill-slate-600'
                                    }`} />
                                  {invoice.status === 'success' || invoice.status === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                                <button
                                  onClick={handleDownloadInvoice}
                                  className="p-2 hover:bg-slate-100 rounded-2xl transition-colors"
                                  title="Download Invoice"
                                >
                                  <Download className="w-4 h-4 text-slate-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Actions & Payment */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Actions - Editorial Luxury */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Quick Actions</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Go to Dashboard - Primary CTA */}
                    <button
                      onClick={() => navigate(getDashboardUrl())}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl text-sm font-semibold hover:from-slate-900 hover:to-black transition-all group shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Go to Dashboard
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      onClick={handleUpgradePlan}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl text-sm font-semibold hover:from-amber-600 hover:to-amber-700 transition-all group shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Upgrade Plan
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      onClick={handleRenewSubscription}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 text-slate-900 rounded-2xl text-sm font-semibold hover:bg-slate-200 transition-all group border border-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Renew Now
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {isPaused && (
                      <button
                        onClick={handleResumeSubscription}
                        disabled={isPausing}
                        className="w-full flex items-center justify-center px-4 py-3 text-emerald-700 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl text-sm font-semibold hover:from-emerald-100 hover:to-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-200 shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          {isPausing ? (
                            <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          {isPausing ? 'Resuming...' : 'Resume Subscription'}
                        </span>
                      </button>
                    )}

                    {isActive && (
                      <>
                        <button
                          onClick={() => setShowPauseModal(true)}
                          className="w-full flex items-center justify-center px-4 py-3 text-amber-700 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl text-sm font-semibold hover:from-amber-100 hover:to-amber-200 transition-all border border-amber-200 shadow-sm"
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Pause Subscription
                          </span>
                        </button>
                        <button
                          onClick={handleCancelSubscription}
                          className="w-full flex items-center justify-center px-4 py-3 text-slate-600 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-all border border-slate-200"
                        >
                          <span className="flex items-center gap-2">
                            <XIcon className="w-4 h-4" />
                            Cancel Subscription
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Information - Editorial Luxury */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-light text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      Payment Information
                    </h3>
                  </div>
                  <div className="p-5">
                    <dl className="space-y-5">
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Payment Status</dt>
                        <dd>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${subscriptionData.paymentStatus === 'success'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                            }`}>
                            <Circle className={`w-1.5 h-1.5 ${subscriptionData.paymentStatus === 'success' ? 'fill-white animate-pulse' : 'fill-slate-600'
                              }`} />
                            {subscriptionData.paymentStatus === 'success' ? 'Paid' : 'Pending'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Plan Price</dt>
                        <dd className="flex items-baseline gap-1">
                          <span className="text-3xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                            {subscriptionData.planPrice ? `₹${subscriptionData.planPrice}` : (currentPlan?.price ? `₹${currentPlan.price}` : 'Contact Sales')}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            {currentPlan?.priceLabel || '/person'}
                          </span>
                        </dd>
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <button
                          onClick={handleDownloadInvoice}
                          disabled={isDownloadingInvoice}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-900 rounded-2xl text-sm font-semibold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200"
                        >
                          {isDownloadingInvoice ? (
                            <>
                              <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download Invoice
                            </>
                          )}
                        </button>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Support Contact - Editorial Luxury */}
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-light text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                        <HelpCircle className="w-4 h-4 text-white" />
                      </div>
                      Need Help?
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-600 font-light leading-relaxed">
                      Have questions about your subscription or billing?
                    </p>
                    <button
                      onClick={handleContactSupport}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-300 text-slate-900 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-all hover:scale-105"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cancel Confirmation Modal - Editorial Luxury */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-slate-900 mb-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Cancel Subscription?</h3>
                <p className="text-sm text-slate-600 font-light leading-relaxed">
                  You'll keep access until {subscriptionData?.endDate ? formatDate(subscriptionData.endDate) : 'the end of your billing period'}.
                </p>
              </div>
            </div>

            {/* Cancellation Feedback */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                Why are you canceling? *
              </label>
              <div className="space-y-2">
                {[
                  'Too expensive',
                  'Not using enough',
                  'Missing features',
                  'Found alternative',
                  'Other'
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all hover:border-slate-300">
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => handleCancelReasonChange(e.target.value)}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-sm text-slate-700 font-medium">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Feedback */}
            {cancelReason && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                  Tell us more (optional)
                </label>
                <textarea
                  value={additionalFeedback}
                  onChange={(e) => setAdditionalFeedback(e.target.value)}
                  placeholder="Your feedback helps us improve..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-light"
                />
              </div>
            )}

            {/* Retention Offers */}
            {showRetentionOffer && (
              <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-3xl shadow-lg">
                <h4 className="text-lg font-light text-slate-900 mb-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                  {cancelReason === 'Too expensive' ? '💰 Special Offer: 30% Off' : '⏸️ Try Pausing Instead'}
                </h4>
                <p className="text-sm text-slate-600 mb-4 font-light leading-relaxed">
                  {cancelReason === 'Too expensive'
                    ? 'We\'d hate to see you go! How about 30% off for the next 3 months?'
                    : 'Not using it right now? Pause your subscription for 1-3 months instead of canceling.'}
                </p>
                <button
                  onClick={() => {
                    if (cancelReason === 'Too expensive') {
                      alert('Discount offer applied! Redirecting to payment...');
                      setShowCancelModal(false);
                    } else {
                      setShowPauseModal(true);
                    }
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg hover:scale-105"
                >
                  {cancelReason === 'Too expensive' ? 'Claim 30% Discount' : 'Pause Subscription'}
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setAdditionalFeedback('');
                  setShowRetentionOffer(false);
                }}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-900 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Subscription
              </button>
              <button
                onClick={confirmCancelSubscription}
                disabled={isCancelling || !cancelReason}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl text-sm font-semibold hover:from-slate-900 hover:to-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105"
              >
                {isCancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  'Confirm Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Subscription Modal - Editorial Luxury */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 max-w-md w-full p-8 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-slate-900 mb-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Pause Subscription</h3>
                <p className="text-sm text-slate-600 font-light leading-relaxed">
                  Take a break without losing your data. Your subscription will automatically resume.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                How long would you like to pause?
              </label>
              <div className="space-y-2">
                {[1, 2, 3].map((months) => (
                  <label key={months} className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all hover:border-slate-300">
                    <input
                      type="radio"
                      name="pauseMonths"
                      value={months}
                      checked={pauseMonths === months}
                      onChange={(e) => setPauseMonths(Number(e.target.value))}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                    />
                    <span className="text-sm text-slate-700 flex-1 font-medium">{months} Month{months > 1 ? 's' : ''}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                disabled={isPausing}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-900 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePauseSubscription}
                disabled={isPausing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl text-sm font-semibold hover:from-amber-700 hover:to-amber-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105"
              >
                {isPausing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Pausing...
                  </span>
                ) : (
                  'Pause Subscription'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MySubscription;

