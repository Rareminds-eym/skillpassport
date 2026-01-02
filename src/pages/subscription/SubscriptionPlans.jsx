import { Calendar, Check, ChevronDown, ChevronUp, Clock, Shield, TrendingUp, X } from 'lucide-react';
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
import { getEntityContent } from '../../utils/getEntityContent';
import { calculateDaysRemaining, getStatusColor, isActiveOrPaused } from '../../utils/subscriptionHelpers';

import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';

// Feature comparison data based on the commercial spec
const FEATURE_COMPARISON = {
  'Capacity': {
    'Learners': ['Up to 1,000', 'Up to 2,000', 'Up to 5,000', 'Unlimited / Contracted'],
    'Admins / Managers': ['2 admins', 'Up to 5', 'Up to 10', 'Unlimited roles'],
  },
  'Branding & Experience': {
    'Branding': ['Logo + primary color', 'Advanced branding', 'Advanced + sub-portals', 'Multi-brand, multi-portal'],
    'Skill Catalog': ['Standard catalog', 'Standard + curated', 'Role-based, custom taxonomy', 'Custom enterprise framework'],
    'Learning Pathways': ['Pre-built pathways', 'Custom pathway builder', 'Rules & prerequisites', 'Advanced pathways & automation'],
  },
  'Program Management': {
    'Cohort Management': [false, true, 'Multi-department', 'Multi-LOB'],
    'Content Uploads': ['Shared storage', 'Expanded storage', 'Up to 5 TB', 'Unlimited / negotiated'],
    'Assessments': ['Quizzes', 'Question banks, graded', 'Rubrics + project eval', 'Advanced assessments'],
    'Certificates': ['Standard completion', 'Custom + expiry', 'Custom + verification', 'Verified credentials & badges'],
  },
  'Analytics & Insights': {
    'Learner Analytics': ['Basic dashboards', 'Cohort & skill-gap', 'Heatmaps + benchmarks', 'Advanced benchmarking'],
    'Data Export': [false, 'CSV exports', 'BI-ready exports', 'BI connectors'],
  },
  'Engagement & Automation': {
    'Notifications & Nudges': ['Basic reminders', 'Campaigns & nudges', 'Automation + smart', 'Intelligent automation'],
  },
  'Integrations & Extensibility': {
    'SSO (SAML / OIDC)': [false, 'Add-on', true, true],
    'User Provisioning (SCIM)': [false, false, 'Included / Add-on', true],
    'API & Webhooks': [false, 'Limited / Add-on', 'Full API + webhooks', 'Full access'],
    'LMS / HR Integrations': [false, 'Lightweight', 'Standard HRIS / LMS', 'Full integrations'],
  },
  'Security & Compliance': {
    'Audit Logs & Retention': [false, false, true, true],
    'Data Residency / DPA': [false, false, 'DPA support', 'Contractual / regional'],
  },
  'Support & Success': {
    'Support': ['Email (business hrs)', 'Priority + onboarding', 'Dedicated, SLA 24×5', '24/7 + SLA'],
    'Customer Success Manager': [false, false, 'Named CSM', 'Named CSM'],
    'Implementation Services': [false, false, 'Included', 'Included / Optional'],
  },
};

// Feature Comparison Table Component
const FeatureComparisonTable = memo(({ plans }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showComparison, setShowComparison] = useState(false);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const renderValue = (value) => {
    if (value === true) {
      return <Check className="h-5 w-5 text-green-500 mx-auto" />;
    }
    if (value === false) {
      return <X className="h-5 w-5 text-gray-300 mx-auto" />;
    }
    return <span className="text-xs text-gray-700">{value}</span>;
  };

  if (!showComparison) {
    return (
      <div className="mt-12 text-center">
        <button
          onClick={() => setShowComparison(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-blue-300 hover:bg-blue-50 transition-all"
        >
          <ChevronDown className="h-5 w-5" />
          View Detailed Feature Comparison
        </button>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Detailed Feature Comparison</h2>
        <button
          onClick={() => setShowComparison(false)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
        >
          <ChevronUp className="h-4 w-4" />
          Hide
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 bg-gray-50 border-b">
          <div className="p-4 font-semibold text-gray-700">Feature</div>
          {plans.map((plan) => (
            <div key={plan.id} className="p-4 text-center">
              <div className="font-bold text-gray-900">{plan.name}</div>
              <div className="text-xs text-gray-500">{plan.tagline}</div>
            </div>
          ))}
        </div>

        {/* Categories */}
        {Object.entries(FEATURE_COMPARISON).map(([category, features]) => (
          <div key={category} className="border-b last:border-b-0">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full grid grid-cols-5 bg-gray-100 hover:bg-gray-150 transition-colors"
            >
              <div className="col-span-5 p-3 flex items-center gap-2 text-left">
                {expandedCategories[category] ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-semibold text-gray-800 text-sm">{category}</span>
              </div>
            </button>

            {/* Features */}
            {expandedCategories[category] && (
              <div>
                {Object.entries(features).map(([feature, values]) => (
                  <div key={feature} className="grid grid-cols-5 border-t border-gray-100 hover:bg-gray-50">
                    <div className="p-3 text-sm text-gray-600">{feature}</div>
                    {values.map((value, index) => (
                      <div key={index} className="p-3 text-center flex items-center justify-center">
                        {renderValue(value)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Positioning Summary */}
      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h4 className="font-bold text-blue-900 mb-1">Basic</h4>
          <p className="text-sm text-blue-700">Validate learning outcomes with minimal setup.</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <h4 className="font-bold text-green-900 mb-1">Professional</h4>
          <p className="text-sm text-green-700">Actively manage cohorts, skills, and engagement.</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <h4 className="font-bold text-purple-900 mb-1">Enterprise</h4>
          <p className="text-sm text-purple-700">Govern learning at scale with automation and compliance.</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
          <h4 className="font-bold text-indigo-900 mb-1">Enterprise Ecosystem</h4>
          <p className="text-sm text-indigo-700">Power extended learning across organizations and partners.</p>
        </div>
      </div>
    </div>
  );
});

FeatureComparisonTable.displayName = 'FeatureComparisonTable';

// Memoized PlanCard component
const PlanCard = memo(({ plan, isCurrentPlan, onSelect, subscriptionData, daysRemaining, allPlans }) => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const isUpgrade = subscriptionData && !isCurrentPlan && parseInt(plan.price) > parseInt(allPlans.find(p => p.id === subscriptionData.plan)?.price || 0);
  const isDowngrade = subscriptionData && !isCurrentPlan && parseInt(plan.price) < parseInt(allPlans.find(p => p.id === subscriptionData.plan)?.price || 0);
  const isContactSales = plan.contactSales;
  
  const displayedFeatures = showAllFeatures ? plan.features : plan.features.slice(0, 8);
  const hasMoreFeatures = plan.features.length > 8;

  return (
    <div
      className={`relative rounded-2xl bg-white p-6 shadow-lg flex flex-col transition-all h-full ${
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

      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        {plan.tagline && (
          <p className="text-sm text-blue-600 font-medium mt-1">{plan.tagline}</p>
        )}
        <div className="mt-3 flex items-baseline">
          {isContactSales ? (
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Contact Sales
            </span>
          ) : (
            <>
              <span className="text-3xl font-bold tracking-tight text-gray-900">
                ₹{plan.price}
              </span>
              <span className="ml-1 text-lg font-semibold text-gray-500">
                /{plan.duration}
              </span>
            </>
          )}
        </div>

        {/* Positioning summary */}
        {plan.positioning && (
          <p className="mt-2 text-xs text-gray-500 italic leading-relaxed">
            {plan.positioning}
          </p>
        )}

        {/* Days Remaining for Current Plan */}
        {isCurrentPlan && daysRemaining !== null && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-green-600" />
            <span className={`font-medium ${
              daysRemaining <= 7 ? 'text-red-600' : daysRemaining <= 15 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {daysRemaining} days remaining
            </span>
          </div>
        )}
      </div>

      {/* Capacity Limits */}
      {plan.limits && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Capacity</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Learners:</span>
              <span className="font-medium text-gray-900">
                {typeof plan.limits.learners === 'number' 
                  ? `Up to ${plan.limits.learners.toLocaleString()}` 
                  : plan.limits.learners}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Admins:</span>
              <span className="font-medium text-gray-900">
                {typeof plan.limits.admins === 'number' 
                  ? `${plan.limits.admins}` 
                  : plan.limits.admins}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Storage:</span>
              <span className="font-medium text-gray-900 text-right max-w-[120px] truncate" title={plan.limits.storage}>
                {plan.limits.storage}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Features List */}
      <div className="flex-1 mb-4">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Features</h4>
        <ul className="space-y-2">
          {displayedFeatures.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="ml-2 text-gray-600 text-xs leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
        {hasMoreFeatures && (
          <button
            onClick={() => setShowAllFeatures(!showAllFeatures)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {showAllFeatures ? (
              <>Show less</>
            ) : (
              <>+{plan.features.length - 8} more features</>
            )}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto">
        {isCurrentPlan ? (
          <div className="space-y-2">
            <div className="w-full py-2.5 px-4 rounded-lg font-medium bg-green-50 border-2 border-green-200 text-green-800 text-center flex items-center justify-center gap-2 text-sm">
              <Check className="h-4 w-4" />
              Your Current Plan
            </div>
            <button
              onClick={() => onSelect(plan)}
              className="w-full py-2.5 px-4 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all text-sm"
            >
              Manage Subscription
            </button>
          </div>
        ) : isContactSales ? (
          <a
            href="mailto:sales@skillpassport.in?subject=Enterprise%20Ecosystem%20Plan%20Inquiry"
            className="w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md text-sm"
          >
            Contact Sales
          </a>
        ) : (
          <button
            onClick={() => onSelect(plan)}
            className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
              isUpgrade
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
                : plan.recommended
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            {isUpgrade && <TrendingUp className="h-4 w-4" />}
            {subscriptionData ? (isUpgrade ? 'Upgrade Plan' : isDowngrade ? 'Switch to This Plan' : 'Select Plan') : 'Select Plan'}
          </button>
        )}
      </div>
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
  const { type, mode } = useParams();
  
  // Use new authentication hook
  const { isAuthenticated, user, role, loading: authLoading } = useAuth();
  
  // Get dynamic content based on entity type
  const { title, subtitle, heroMessage, plans, ctaText, entity, role: pageRole } = useMemo(() => {
    return getEntityContent(type || 'student');
  }, [type]);

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

  // Combined loading state - wait for both auth and subscription data
  const isFullyLoaded = useMemo(
    () => !authLoading && !subscriptionLoading,
    [authLoading, subscriptionLoading]
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

            {/* Feature Comparison Table */}
            <FeatureComparisonTable plans={plans} />
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
