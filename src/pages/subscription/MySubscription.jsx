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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SubscriptionDashboard } from '../../components/Subscription/SubscriptionDashboard';
import { useSubscriptionPlansData } from '../../hooks/Subscription/useSubscriptionPlansData';
import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { getUserSubscriptions } from '../../services/Subscriptions/subscriptionService';
import { deactivateSubscription, pauseSubscription, resumeSubscription } from '../../services/paymentsApiService';
import { calculateDaysRemaining, calculateProgressPercentage, formatDate as formatDateUtil, getSubscriptionStatusChecks } from '../../utils/subscriptionHelpers';

// Fallback plans only used if API fails - these match database structure
const FALLBACK_PLANS = [
  { 
    id: 'basic', 
    name: 'Basic Plan', 
    price: '250',
    priceLabel: 'Per Person',
    features: [
      'Up to 1,000 learners',
      'Basic skill assessments',
      'Standard analytics',
      'Email support'
    ],
    totalFeatures: 4,
    hasMoreFeatures: false
  },
  { 
    id: 'professional', 
    name: 'Professional Plan', 
    price: '250',
    priceLabel: 'Per Person',
    features: [
      'Up to 2,000 learners',
      'Advanced skill assessments',
      'Enhanced analytics & insights',
      'Priority support'
    ],
    totalFeatures: 5,
    hasMoreFeatures: true
  },
  { 
    id: 'enterprise', 
    name: 'Enterprise Plan', 
    price: '200',
    priceLabel: 'Per Person',
    features: [
      'Up to 5,000 learners',
      'All Professional features',
      'Unlimited assessments',
      'Dedicated account manager'
    ],
    totalFeatures: 6,
    hasMoreFeatures: true
  },
  { 
    id: 'ecosystem', 
    name: 'Enterprise Ecosystem', 
    price: null,
    priceLabel: 'Contact Sales',
    features: [
      'Unlimited learners',
      'All Enterprise features',
      'Multi-institution support',
      'Custom integrations'
    ],
    totalFeatures: 6,
    hasMoreFeatures: true
  }
];

function MySubscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, loading: authLoading } = useAuth();
  const { subscriptionData, loading: subscriptionLoading, refreshSubscription } = useSubscriptionQuery();
  
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

  // Use database plans if available, otherwise fallback
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
    return FALLBACK_PLANS;
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
    navigate('/subscription/plans?mode=upgrade');
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

  // Get role-specific dashboard URL
  const getDashboardUrl = useCallback(() => {
    const userRole = user?.user_metadata?.role || user?.raw_user_meta_data?.role || role;
    
    const dashboardRoutes = {
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
    
    return dashboardRoutes[userRole] || '/student/dashboard';
  }, [user, role]);

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
    
    // Map from useSubscriptionQuery format to database format
    const planMapping = {
      'basic': 'basic',
      'pro': 'professional',
      'professional': 'professional',
      'enterprise': 'enterprise',
      'ecosystem': 'ecosystem'
    };
    
    const planId = planMapping[subscriptionData.plan.toLowerCase()] || subscriptionData.plan.toLowerCase();
    
    // Find plan in database plans
    let plan = plans.find(p => p.id === planId);
    
    // If not found, try matching by name
    if (!plan && subscriptionData.planName) {
      plan = plans.find(p => 
        p.name.toLowerCase().includes(subscriptionData.planName.toLowerCase()) ||
        subscriptionData.planName.toLowerCase().includes(p.id)
      );
    }
    
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

  // Mock usage statistics
  const usageStats = {
    assessments: { used: 15, total: 50, label: 'Skill Assessments' },
    profileViews: { used: 234, total: 1000, label: 'Profile Views' },
    reports: { used: 8, total: 20, label: 'Reports Generated' },
  };

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-64 bg-neutral-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-4"></div>
              <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>
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

  // No subscription found
  if (!subscriptionData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Back to Home for no subscription state */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg border border-neutral-200 p-8 text-center">
            <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-neutral-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Active Subscription</h2>
            <p className="text-neutral-600 text-sm mb-6">
              You don't have an active subscription yet. Choose a plan to get started.
            </p>
            <button
              onClick={() => navigate('/subscription/plans')}
              className="w-full bg-neutral-900 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back to Home Button */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">My Subscription</h1>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {user?.email && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700">
                    <Mail className="w-3 h-3 mr-1.5" />
                    {user.email}
                  </span>
                )}
                {subscriptionData?.entityType && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                    <Circle className="w-2 h-2 mr-1.5 fill-purple-600" />
                    {subscriptionData.entityType.replace('-', ' ')}
                  </span>
                )}
                {role && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                    <Shield className="w-3 h-3 mr-1.5" />
                    {role}
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-600">Manage your subscription and billing</p>
            </div>
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-neutral-700" />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex gap-1 bg-neutral-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'subscription'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Subscription
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'addons'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
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
          <SubscriptionDashboard />
        ) : (
          <>
        {/* Alert Banner */}
        {(isExpiringSoon || isExpired || isPaused) && (
          <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
            isExpired 
              ? 'bg-neutral-50 border-neutral-300' 
              : isPaused
              ? 'bg-orange-50 border-orange-300'
              : 'bg-neutral-50 border-neutral-300'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isPaused ? 'text-orange-700' : 'text-neutral-700'
            }`} />
            <div className="flex-1">
              <h3 className={`font-medium text-sm ${
                isPaused ? 'text-orange-900' : 'text-neutral-900'
              }`}>
                {isExpired ? 'Subscription Expired' : isPaused ? 'Subscription Paused' : 'Subscription Expiring Soon'}
              </h3>
              <p className={`text-sm mt-1 ${
                isPaused ? 'text-orange-700' : 'text-neutral-600'
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
                className={`mt-3 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 ${
                  isPaused ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-neutral-900 text-white'
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
            {/* Usage Statistics */}
            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="px-6 py-5 border-b border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-neutral-600" />
                  Usage Statistics
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {Object.values(usageStats).map((stat, idx) => (
                    <div key={idx}>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xs font-medium text-neutral-500">{stat.label}</span>
                        <span className="text-xs text-neutral-600">{stat.used}/{stat.total}</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2">
                        <div 
                          className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(stat.used / stat.total) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1">
                        {stat.total - stat.used} remaining
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Plan Card */}
            <div className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors">
              {/* Plan Header */}
              <div className="px-6 py-5 border-b border-neutral-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        isActive 
                          ? 'bg-neutral-900 text-white' 
                          : isPaused
                          ? 'bg-orange-100 text-orange-800'
                          : isExpired
                          ? 'bg-neutral-200 text-neutral-700'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}>
                        <Circle className={`w-1.5 h-1.5 ${
                          isActive ? 'fill-white' : isPaused ? 'fill-orange-600' : 'fill-neutral-600'
                        }`} />
                        {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-900 mb-1">
                      {currentPlan?.name || 'Basic Plan'}
                    </h2>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-neutral-900">
                        {currentPlan?.price ? `₹${currentPlan.price}` : 'Contact Sales'}
                      </span>
                      <span className="text-sm text-neutral-600">
                        {currentPlan?.priceLabel || '/person'}
                      </span>
                    </div>
                  </div>
                  {isActive && daysRemaining !== null && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-neutral-500 mb-1">Remaining</span>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-md">
                        <Clock className="w-4 h-4 text-neutral-600" />
                        <span className="text-sm font-medium text-neutral-900">
                          {daysRemaining} days
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {isActive && progressPercentage > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-neutral-600">Subscription Period</span>
                      <span className="text-xs font-medium text-neutral-900">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-1.5">
                      <div 
                        className="bg-neutral-900 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Plan Features */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-neutral-900">Plan Features</h3>
                  {totalFeaturesCount > 0 && (
                    <span 
                      className={`text-xs transition-all duration-300 ${
                        showingAllFeatures ? 'text-neutral-700 font-medium' : 'text-neutral-500'
                      }`}
                    >
                      {showingAllFeatures 
                        ? `Showing all ${totalFeaturesCount} features`
                        : `${totalFeaturesCount} feature${totalFeaturesCount !== 1 ? 's' : ''} included`
                      }
                    </span>
                  )}
                </div>
                
                {/* Features List with smooth CSS transitions */}
                <ul className="space-y-2.5">
                  {displayFeatures.map((feature, index) => (
                    <li 
                      key={`feature-${feature.slice(0, 20)}-${index}`}
                      className="flex items-start gap-3 opacity-100 transform translate-y-0 transition-all duration-300 ease-out"
                      style={{ 
                        transitionDelay: `${index * 30}ms`
                      }}
                    >
                      <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-neutral-700" />
                      </div>
                      <span className="text-sm text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Show More/Less Toggle */}
                {(hasMoreFeatures || showingAllFeatures) && (
                  <button
                    onClick={handleToggleFeatures}
                    disabled={loadingMoreFeatures}
                    className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 group ${
                      loadingMoreFeatures
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 active:scale-[0.98]'
                    }`}
                  >
                    {loadingMoreFeatures ? (
                      <>
                        <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
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

            {/* Subscription Details */}
            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="px-6 py-5 border-b border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-600" />
                  Subscription Details
                </h3>
              </div>
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1.5">Start Date</dt>
                    <dd className="text-sm text-neutral-900">{formatDate(subscriptionData.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1.5">End Date</dt>
                    <dd className="text-sm text-neutral-900">{formatDate(subscriptionData.endDate)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-neutral-500 mb-2">Auto Renewal</dt>
                    <dd className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          autoRenewEnabled 
                            ? 'bg-neutral-900 text-white' 
                            : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          <Circle className={`w-1.5 h-1.5 ${
                            autoRenewEnabled ? 'fill-white' : 'fill-neutral-600'
                          }`} />
                          {autoRenewEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className="text-xs text-neutral-600">
                          {autoRenewEnabled ? 'Subscription renews automatically' : 'Manual renewal required'}
                        </span>
                      </div>
                      <button
                        onClick={handleToggleAutoRenew}
                        disabled={isTogglingAutoRenew}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          autoRenewEnabled ? 'bg-neutral-900' : 'bg-neutral-300'
                        }`}
                      >
                        {isTogglingAutoRenew ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-neutral-400 border-t-white rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              autoRenewEnabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        )}
                      </button>
                    </dd>
                  </div>
                  {subscriptionData.nextBillingDate && autoRenewEnabled && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-neutral-500 mb-1.5">Next Billing Date</dt>
                      <dd className="text-sm text-neutral-900">{formatDate(subscriptionData.nextBillingDate)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-lg border border-neutral-200">
              <button
                onClick={() => setShowBillingHistory(!showBillingHistory)}
                onMouseEnter={() => {
                  // Prefetch on hover for instant display
                  if (!billingHistoryFetched && !loadingBillingHistory) {
                    fetchBillingHistory();
                  }
                }}
                className="w-full px-6 py-5 border-b border-neutral-200 flex items-center justify-between hover:bg-neutral-50 transition-colors"
              >
                <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-neutral-600" />
                  Billing History
                </h3>
                {showBillingHistory ? (
                  <ChevronUp className="w-4 h-4 text-neutral-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-600" />
                )}
              </button>
              {showBillingHistory && (
                <div className="px-6 py-4">
                  {loadingBillingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin"></div>
                    </div>
                  ) : billingHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm text-neutral-600">No billing history found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {billingHistory.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900">{invoice.description}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">{formatDate(invoice.date)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-neutral-900">₹{invoice.amount}</span>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
                              invoice.status === 'success' || invoice.status === 'paid'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}>
                              <Circle className={`w-1.5 h-1.5 ${
                                invoice.status === 'success' || invoice.status === 'paid' ? 'fill-white' : 'fill-neutral-600'
                              }`} />
                              {invoice.status === 'success' || invoice.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                            <button
                              onClick={handleDownloadInvoice}
                              className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
                              title="Download Invoice"
                            >
                              <Download className="w-4 h-4 text-neutral-600" />
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
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="px-5 py-4 border-b border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-900">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                {/* Go to Dashboard - Primary CTA */}
                <button
                  onClick={() => navigate(getDashboardUrl())}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Dashboard
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={handleUpgradePlan}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Upgrade Plan
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={handleRenewSubscription}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-100 text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors group"
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
                    className="w-full flex items-center justify-center px-4 py-2.5 text-green-600 bg-green-50 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2">
                      {isPausing ? (
                        <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
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
                      className="w-full flex items-center justify-center px-4 py-2.5 text-orange-600 bg-orange-50 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pause Subscription
                      </span>
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="w-full flex items-center justify-center px-4 py-2.5 text-neutral-600 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
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

            {/* Payment Information */}
            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="px-5 py-4 border-b border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-neutral-600" />
                  Payment Information
                </h3>
              </div>
              <div className="p-5">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1.5">Payment Status</dt>
                    <dd>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        subscriptionData.paymentStatus === 'success' 
                          ? 'bg-neutral-900 text-white' 
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        <Circle className={`w-1.5 h-1.5 ${
                          subscriptionData.paymentStatus === 'success' ? 'fill-white' : 'fill-neutral-600'
                        }`} />
                        {subscriptionData.paymentStatus === 'success' ? 'Paid' : 'Pending'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 mb-1.5">Plan Price</dt>
                    <dd className="flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-neutral-900">
                        {subscriptionData.planPrice ? `₹${subscriptionData.planPrice}` : (currentPlan?.price ? `₹${currentPlan.price}` : 'Contact Sales')}
                      </span>
                      <span className="text-xs text-neutral-600">
                        {currentPlan?.priceLabel || '/person'}
                      </span>
                    </dd>
                  </div>
                  <div className="pt-3 border-t border-neutral-200">
                    <button
                      onClick={handleDownloadInvoice}
                      disabled={isDownloadingInvoice}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDownloadingInvoice ? (
                        <>
                          <div className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
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

            {/* Support Contact */}
            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="px-5 py-4 border-b border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-neutral-600" />
                  Need Help?
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-xs text-neutral-600">
                  Have questions about your subscription or billing?
                </p>
                <button
                  onClick={handleContactSupport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
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

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-neutral-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-neutral-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Cancel Subscription?</h3>
                <p className="text-sm text-neutral-600">
                  You'll keep access until {subscriptionData?.endDate ? formatDate(subscriptionData.endDate) : 'the end of your billing period'}.
                </p>
              </div>
            </div>
            
            {/* Cancellation Feedback */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-900 mb-2">
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
                  <label key={reason} className="flex items-center gap-2 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => handleCancelReasonChange(e.target.value)}
                      className="w-4 h-4 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span className="text-sm text-neutral-700">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Feedback */}
            {cancelReason && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Tell us more (optional)
                </label>
                <textarea
                  value={additionalFeedback}
                  onChange={(e) => setAdditionalFeedback(e.target.value)}
                  placeholder="Your feedback helps us improve..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>
            )}

            {/* Retention Offers */}
            {showRetentionOffer && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-neutral-900 mb-2">
                  {cancelReason === 'Too expensive' ? '💰 Special Offer: 30% Off' : '⏸️ Try Pausing Instead'}
                </h4>
                <p className="text-xs text-neutral-600 mb-3">
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
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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
                className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Subscription
              </button>
              <button
                onClick={confirmCancelSubscription}
                disabled={isCancelling || !cancelReason}
                className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Pause Subscription Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-neutral-200 max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Pause Subscription</h3>
                <p className="text-sm text-neutral-600">
                  Take a break without losing your data. Your subscription will automatically resume.
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-900 mb-3">
                How long would you like to pause?
              </label>
              <div className="space-y-2">
                {[1, 2, 3].map((months) => (
                  <label key={months} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="pauseMonths"
                      value={months}
                      checked={pauseMonths === months}
                      onChange={(e) => setPauseMonths(Number(e.target.value))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-sm text-neutral-700 flex-1">{months} Month{months > 1 ? 's' : ''}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                disabled={isPausing}
                className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePauseSubscription}
                disabled={isPausing}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

