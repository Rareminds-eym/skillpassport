import { Calendar, Check, Clock, Shield, TrendingUp } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CollegeLoginModal from '../../components/Subscription/CollegeLoginModal';
import CollegeSignupModal from '../../components/Subscription/CollegeSignupModal';
import EducatorLoginModal from '../../components/Subscription/EducatorLoginModal';
import EducatorSignupModal from '../../components/Subscription/EducatorSignupModal';
import LoginModal from '../../components/Subscription/LoginModal';
import RecruiterLoginModal from '../../components/Subscription/RecruiterLoginModal';
import RecruiterSignupModal from '../../components/Subscription/RecruiterSignupModal';
import RecruitmentAdminSignupModal from '../../components/Subscription/RecruitmentAdminSignupModal';
import SchoolLoginModal from '../../components/Subscription/SchoolLoginModal';
import SchoolSignupModal from '../../components/Subscription/SchoolSignupModal';
import SignupModal from '../../components/Subscription/SignupModal';
import UniversityAdminLoginModal from '../../components/Subscription/UniversityAdminLoginModal';
import UniversityAdminSignupModal from '../../components/Subscription/UniversityAdminSignupModal';
import UniversityStudentLoginModal from '../../components/Subscription/UniversityStudentLoginModal';
import UniversityStudentSignupModal from '../../components/Subscription/UniversityStudentSignupModal';
import { PAYMENT_CONFIG, isTestPricing } from '../../config/payment';
import useAuth from '../../hooks/useAuth';
import { useSubscriptionPlansData } from '../../hooks/Subscription/useSubscriptionPlansData';
import { getEntityContent, setDatabasePlans, parseStudentType } from '../../utils/getEntityContent';
import { calculateDaysRemaining, getStatusColor, isActiveOrPaused } from '../../utils/subscriptionHelpers';

import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';

// Memoized PlanCard component
const PlanCard = memo(({ plan, isCurrentPlan, onSelect, subscriptionData, daysRemaining, allPlans }) => {
  const isUpgrade = subscriptionData && !isCurrentPlan && parseInt(plan.price) > parseInt(allPlans.find(p => p.id === subscriptionData.plan)?.price || 0);
  const isDowngrade = subscriptionData && !isCurrentPlan && parseInt(plan.price) < parseInt(allPlans.find(p => p.id === subscriptionData.plan)?.price || 0);
  const isContactSales = plan.contactSales;

  return (
    <div
      className={`relative rounded-2xl bg-white p-8 shadow-lg flex flex-col transition-all ${
        isCurrentPlan ? 'ring-2 ring-green-500 shadow-xl' : plan.recommended ? 'ring-2 ring-blue-600' : ''
      }`}
    >
      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Active Plan
          </span>
        </div>
      )}

      {/* Recommended Badge */}
      {!isCurrentPlan && plan.recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Recommended
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
        {plan.tagline && (
          <p className="text-sm text-gray-500 mt-1">{plan.tagline}</p>
        )}
        <div className="mt-4 flex items-baseline">
          {isContactSales ? (
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Contact Sales
            </span>
          ) : (
            <>
              <span className="text-4xl font-bold tracking-tight text-gray-900">
                ₹{plan.price}
              </span>
              <span className="ml-1 text-xl font-semibold text-gray-600">
                /{plan.duration}
              </span>
            </>
          )}
        </div>

        {/* Positioning summary */}
        {plan.positioning && (
          <p className="mt-3 text-sm text-gray-600 italic">
            {plan.positioning}
          </p>
        )}

        {/* Days Remaining for Current Plan */}
        {isCurrentPlan && daysRemaining !== null && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-green-600" />
            <span className={`font-medium ${
              daysRemaining <= 7 ? 'text-red-600' : daysRemaining <= 15 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {daysRemaining} days remaining
            </span>
          </div>
        )}
      </div>

      <ul className="mb-8 space-y-4 flex-1 max-h-80 overflow-y-auto">
        {plan.features.slice(0, 10).map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
            <span className="ml-3 text-gray-600 text-sm">{feature}</span>
          </li>
        ))}
        {plan.features.length > 10 && (
          <li className="text-sm text-blue-600 font-medium ml-9">
            +{plan.features.length - 10} more features
          </li>
        )}
      </ul>

      {/* Action Buttons */}
      {isCurrentPlan ? (
        <div className="space-y-3">
          <div className="w-full py-3 px-6 rounded-lg font-medium bg-green-50 border-2 border-green-200 text-green-800 text-center flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
            Your Current Plan
          </div>
          <button
            onClick={() => onSelect(plan)}
            className="w-full py-3 px-6 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Manage Subscription
          </button>
        </div>
      ) : isContactSales ? (
        <a
          href="mailto:sales@skillpassport.in?subject=Enterprise%20Ecosystem%20Plan%20Inquiry"
          className="w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md"
        >
          Contact Sales
        </a>
      ) : (
        <button
          onClick={() => onSelect(plan)}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isUpgrade
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
              : plan.recommended
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          {isUpgrade && <TrendingUp className="h-5 w-5" />}
          {subscriptionData ? (isUpgrade ? 'Upgrade Plan' : isDowngrade ? 'Switch to This Plan' : 'Select Plan') : 'Select Plan'}
        </button>
      )}
    </div>
  );
});

PlanCard.displayName = 'PlanCard';

function SubscriptionPlans() {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [planToSelect, setPlanToSelect] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams();
  
  // Use new authentication hook
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // Parse entity and role from type
  const { entity, role: pageRole } = useMemo(() => parseStudentType(type || 'student'), [type]);
  
  // Fetch plans from database
  const { 
    plans: dbPlans, 
    loading: plansLoading, 
    error: plansError 
  } = useSubscriptionPlansData({
    businessType: 'b2b',
    entityType: entity,
    roleType: pageRole
  });
  
  // Cache database plans for getEntityContent fallback
  useEffect(() => {
    if (dbPlans && dbPlans.length > 0) {
      setDatabasePlans(dbPlans);
    }
  }, [dbPlans]);
  
  // Get dynamic content based on entity type (uses cached db plans if available)
  const { title, subtitle, heroMessage, plans: configPlans, ctaText } = useMemo(() => {
    return getEntityContent(type || 'student');
  }, [type, dbPlans]); // Re-compute when dbPlans change
  
  // Use database plans if available, otherwise fall back to config plans
  const plans = useMemo(() => {
    if (dbPlans && dbPlans.length > 0) {
      // Apply role-specific features from getEntityContent
      const { plans: plansWithFeatures } = getEntityContent(type || 'student');
      return plansWithFeatures;
    }
    return configPlans;
  }, [dbPlans, configPlans, type]);

  const studentType = type || 'student';

  // Determine which modals to use
  const { SignupComponent, LoginComponent } = useMemo(() => {
    if (pageRole === 'admin') {
      if (entity === 'school') return { SignupComponent: SchoolSignupModal, LoginComponent: SchoolLoginModal };
      if (entity === 'college') return { SignupComponent: CollegeSignupModal, LoginComponent: CollegeLoginModal };
      if (entity === 'recruitment') return { SignupComponent: RecruitmentAdminSignupModal, LoginComponent: RecruiterLoginModal };
      if (entity === 'university') return { SignupComponent: UniversityAdminSignupModal, LoginComponent: UniversityAdminLoginModal };
    }
    if (pageRole === 'educator') {
      return { SignupComponent: EducatorSignupModal, LoginComponent: EducatorLoginModal };
    }
    if (pageRole === 'recruiter' && entity === 'recruitment') {
      return { SignupComponent: RecruiterSignupModal, LoginComponent: RecruiterLoginModal };
    }
    if (pageRole === 'student' && entity === 'university') {
      return { SignupComponent: UniversityStudentSignupModal, LoginComponent: UniversityStudentLoginModal };
    }
    // Default (Students - school/college)
    return { SignupComponent: SignupModal, LoginComponent: LoginModal };
  }, [entity, pageRole]);
  
  const { subscriptionData, loading: subscriptionLoading, error: subscriptionError, refreshSubscription } = useSubscriptionQuery();

  // Combined loading state - wait for auth, subscription, and plans data
  const isFullyLoaded = useMemo(
    () => !authLoading && !subscriptionLoading && !plansLoading,
    [authLoading, subscriptionLoading, plansLoading]
  );

  // Memoize subscription status checks for better performance
  const hasActiveOrPausedSubscription = useMemo(
    () => subscriptionData && isActiveOrPaused(subscriptionData.status),
    [subscriptionData]
  );

  const currentPlanData = useMemo(
    () => subscriptionData ? plans.find(p => p.id === subscriptionData.plan) : null,
    [subscriptionData]
  );

  // Compute whether redirect should occur
  const shouldRedirect = useMemo(
    () => isAuthenticated && hasActiveOrPausedSubscription,
    [isAuthenticated, hasActiveOrPausedSubscription]
  );

  // Show welcome message from signup flow (only once)
  useEffect(() => {
    const message = location.state?.message;
    if (message) {
      // Clear the state immediately to prevent duplicate toasts
      navigate(location.pathname + location.search, { replace: true, state: {} });
      // Show toast after clearing state
      toast.success(message, { duration: 5000, id: 'signup-success' });
    }
  }, []); // Empty dependency - run only on mount

  // Error logging for subscription fetch failures
  useEffect(() => {
    if (subscriptionError && isAuthenticated) {
      console.error('[Subscription Routing] Subscription fetch error:', {
        error: subscriptionError,
        message: subscriptionError?.message,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [subscriptionError, isAuthenticated, user?.id]);

  // Automatic redirect logic for users with active or paused subscriptions
  useEffect(() => {
    if (isFullyLoaded && shouldRedirect) {
      // Extract and preserve query parameters
      const queryParams = location.search;
      const redirectUrl = `/subscription/manage${queryParams}`;
      
      // Development mode logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Subscription Routing] Redirecting to manage page', {
          status: subscriptionData?.status,
          hasSubscription: hasActiveOrPausedSubscription,
          isAuthenticated,
          targetUrl: redirectUrl,
          preservedParams: queryParams
        });
      }
      
      // Perform redirect with replace to prevent back button issues
      navigate(redirectUrl, { replace: true });
    }
  }, [isFullyLoaded, shouldRedirect, navigate, location.search, subscriptionData, hasActiveOrPausedSubscription, isAuthenticated]);

  const handlePlanSelection = useCallback((plan) => {
    // If user has subscription and clicks manage on current plan
    if (subscriptionData && subscriptionData.plan === plan.id) {
      // Navigate to manage subscription page
      navigate('/subscription/manage');
      return;
    }

    // For upgrade/downgrade or new purchase
    if (!isAuthenticated) {
      // User not authenticated, redirect to unified signup page
      navigate('/signup');
    } else {
      // User authenticated, check if they have active or paused subscription
      if (hasActiveOrPausedSubscription) {
        // User has active or paused subscription, redirect to plans page with upgrade mode
        navigate(`/subscription/plans?type=${studentType || 'student'}&mode=upgrade`);
      } else {
        // User authenticated but no active subscription, proceed to payment
        navigate('/subscription/payment', { state: { plan, studentType, isUpgrade: !!subscriptionData } });
      }
    }
  }, [isAuthenticated, navigate, studentType, subscriptionData, hasActiveOrPausedSubscription]);

  const handleSignupSuccess = useCallback(() => {
    // After successful signup, proceed to payment with selected plan
    setShowSignupModal(false);
    if (planToSelect) {
      // New users won't have subscription, proceed to payment
      navigate('/subscription/payment', { state: { plan: planToSelect, studentType } });
      setPlanToSelect(null);
    }
  }, [planToSelect, navigate, studentType]);

  const handleCloseSignupModal = useCallback(() => {
    setShowSignupModal(false);
    setPlanToSelect(null);
  }, []);

  const handleSwitchToLogin = useCallback(() => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  }, []);

  const handleSwitchToSignup = useCallback(() => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  }, []);

  const handleCloseLoginModal = useCallback(() => {
    setShowLoginModal(false);
    setPlanToSelect(null);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    // After successful login, close modal
    setShowLoginModal(false);
    
    if (planToSelect) {
      // Proceed to payment - subscription check will happen on next page
      navigate('/subscription/payment', { state: { plan: planToSelect, studentType } });
      setPlanToSelect(null);
    }
  }, [planToSelect, navigate, studentType]);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Calculate days remaining in subscription
  const daysRemaining = useMemo(() => 
    calculateDaysRemaining(subscriptionData?.endDate),
    [subscriptionData?.endDate]
  );

  // Show loading state while checking authentication or subscription data
  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Error banner for subscription fetch failures */}
        {subscriptionError && isAuthenticated && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-red-800 font-medium mb-2">
                  Unable to load subscription status. Please refresh the page.
                </p>
                <p className="text-red-600 text-sm">
                  {subscriptionError?.message || 'An error occurred while fetching your subscription data.'}
                </p>
              </div>
              <button
                onClick={refreshSubscription}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {/* Error banner for plans fetch failures */}
        {plansError && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">
              Using cached plan data. Some information may be outdated.
            </p>
          </div>
        )}
        {/* Enhanced subscription status banner - Show only for authenticated users with active or paused subscription */}
        {isAuthenticated && hasActiveOrPausedSubscription && (
          <div className="mb-8">
            {/* Subscription Status Card */}
            <div className={`bg-gradient-to-r rounded-xl p-6 mb-6 border-2 ${
              subscriptionData.status === 'active' 
                ? 'from-green-50 to-blue-50 border-green-200' 
                : 'from-orange-50 to-yellow-50 border-orange-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className={`h-6 w-6 ${
                      subscriptionData.status === 'active' ? 'text-green-600' : 'text-orange-600'
                    }`} />
                    <h2 className="text-2xl font-bold text-gray-900">
                      {subscriptionData.status === 'active' ? 'Active Subscription' : 'Paused Subscription'}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(subscriptionData.status)}`}>
                      {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                    </span>
                    <span className="text-lg font-semibold text-gray-800">
                      {currentPlanData?.name || 'Unknown'} Plan
                    </span>
                    {daysRemaining !== null && (
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                        daysRemaining <= 7 
                          ? 'bg-red-100 text-red-800' 
                          : daysRemaining <= 15 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        <Clock className="h-4 w-4" />
                        {daysRemaining} days left
                      </span>
                    )}
                  </div>
                  {daysRemaining !== null && daysRemaining <= 7 && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                      <Calendar className="h-4 w-4" />
                      <span>Your subscription is expiring soon. Renew or upgrade to continue enjoying premium features.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Subscription Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Start Date</dt>
                      <dd className="text-sm font-medium text-gray-900">{formatDate(subscriptionData.startDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">End Date</dt>
                      <dd className="text-sm font-medium text-gray-900">{formatDate(subscriptionData.endDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Auto Renewal</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          subscriptionData.autoRenew ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscriptionData.autoRenew ? 'Enabled' : 'Disabled'}
                        </span>
                      </dd>
                    </div>
                    {subscriptionData.nextBillingDate && (
                      <div>
                        <dt className="text-sm text-gray-500">Next Billing</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatDate(subscriptionData.nextBillingDate)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Active Features</h4>
                  <ul className="space-y-2">
                    {subscriptionData.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Mode Indicator */}
        {isTestPricing() && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
            <p className="text-yellow-800 font-semibold">
              🧪 Test Mode: All plans are ₹1 for testing on {PAYMENT_CONFIG.HOSTNAME}
            </p>
          </div>
        )}

        {/* Hero Section with Entity-Specific Messaging */}
        {heroMessage && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <p className="text-center text-lg font-medium text-gray-800">
              {heroMessage}
            </p>
          </div>
        )}

        <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {isAuthenticated && hasActiveOrPausedSubscription
                  ? 'Manage or Upgrade Your Plan' 
                  : title}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {isAuthenticated && hasActiveOrPausedSubscription
                  ? 'Upgrade to unlock more features or manage your current subscription'
                  : subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  allPlans={plans}
                  isCurrentPlan={isAuthenticated && hasActiveOrPausedSubscription && subscriptionData?.plan === plan.id}
                  onSelect={handlePlanSelection}
                  subscriptionData={isAuthenticated && hasActiveOrPausedSubscription ? subscriptionData : null}
                  daysRemaining={isAuthenticated && hasActiveOrPausedSubscription ? daysRemaining : null}
                />
              ))}
            </div>
      </div>

      {/* Signup Modal */}
      <SignupComponent
        isOpen={showSignupModal}
        onClose={handleCloseSignupModal}
        selectedPlan={planToSelect}
        studentType={studentType}
        onSignupSuccess={handleSignupSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />

      {/* Login Modal */}
      <LoginComponent
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        selectedPlan={planToSelect}
        studentType={studentType}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </div>
  );
}

export default memo(SubscriptionPlans);
