import { Building2, Calendar, Check, ChevronDown, ChevronUp, Clock, Shield, Sparkles, TrendingUp, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AddOnMarketplace from '../../components/Subscription/AddOnMarketplace';
import { OrganizationPurchasePanel } from '../../components/Subscription/Organization';
import { useSubscriptionPlansData } from '../../hooks/Subscription/useSubscriptionPlansData';
import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { getEntityContent, parseStudentType, setDatabasePlans } from '../../utils/getEntityContent';
import { calculateDaysRemaining, isActiveOrPaused } from '../../utils/subscriptionHelpers';

/**
 * Get the subscription manage path based on user role
 */
function getManagePath(userRole) {
  if (!userRole) return null; // Return null instead of default to prevent wrong redirects
  
  const manageRoutes = {
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
  return manageRoutes[userRole] || null; // Return null instead of default to prevent wrong redirects
}

/**
 * Get the subscription manage path based on URL type parameter (more reliable)
 */
function getManagePathFromType(type) {
  if (!type) return null; // Return null instead of default to prevent wrong redirects
  
  const typeToPath = {
    // Student types
    'student': '/student/subscription/manage',
    'school_student': '/student/subscription/manage',
    'school-student': '/student/subscription/manage',
    'college_student': '/student/subscription/manage',
    'college-student': '/student/subscription/manage',
    // Educator types
    'educator': '/educator/subscription/manage',
    'school_educator': '/educator/subscription/manage',
    'school-educator': '/educator/subscription/manage',
    'college_educator': '/educator/subscription/manage',
    'college-educator': '/educator/subscription/manage',
    // Admin types
    'school_admin': '/school-admin/subscription/manage',
    'school-admin': '/school-admin/subscription/manage',
    'college_admin': '/college-admin/subscription/manage',
    'college-admin': '/college-admin/subscription/manage',
    'university_admin': '/university-admin/subscription/manage',
    'university-admin': '/university-admin/subscription/manage',
    // Recruiter
    'recruiter': '/recruitment/subscription/manage',
    // Generic admin (super_admin, rm_admin)
    'admin': '/admin/subscription/manage',
    'super_admin': '/admin/subscription/manage',
    'rm_admin': '/admin/subscription/manage',
  };
  
  return typeToPath[type] || null; // Return null instead of default to prevent wrong redirects
}

// Feature comparison data
const FEATURE_COMPARISON = {
  'Core Features': {
    'Student Management': [true, true, true, true],
    'Progress Tracking': [true, true, true, true],
    'Basic Reports': [true, true, true, true],
    'Advanced Analytics': [false, true, true, true],
  },
  'Support': {
    'Email Support': [true, true, true, true],
    'Priority Support': [false, true, true, true],
    'Dedicated Manager': [false, false, true, true],
    '24/7 Support': [false, false, false, true],
  },
  'Integrations': {
    'API Access': [false, true, true, true],
    'Custom Integrations': [false, false, true, true],
    'SSO': [false, false, true, true],
  },
};

// Feature Comparison Table Component
const FeatureComparisonTable = memo(({ plans }) => {
  const [showComparison, setShowComparison] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({
    'Core Features': true,
    'Support': false,
    'Integrations': false,
  });

  const toggleCategory = useCallback((category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  const renderValue = useCallback((value) => {
    if (value === true) return <Check className="h-5 w-5 text-green-600" />;
    if (value === false) return <X className="h-5 w-5 text-gray-300" />;
    return <span className="text-sm text-gray-700">{value}</span>;
  }, []);

  if (!showComparison) {
    return (
      <div className="mt-16 text-center">
        <button
          onClick={() => setShowComparison(true)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm mx-auto"
        >
          <ChevronDown className="h-4 w-4" /> Show Feature Comparison
        </button>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Feature Comparison</h2>
        <button
          onClick={() => setShowComparison(false)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
        >
          <ChevronUp className="h-4 w-4" /> Hide
        </button>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className={`grid bg-gray-50 border-b border-gray-200`} style={{ gridTemplateColumns: `1fr repeat(${plans.length}, 1fr)` }}>
          <div className="p-4 font-semibold text-gray-700">Feature</div>
          {plans.map((plan) => (
            <div key={plan.id} className="p-4 text-center">
              <div className="font-bold text-gray-900">{plan.name}</div>
            </div>
          ))}
        </div>

        {Object.entries(FEATURE_COMPARISON).map(([category, features]) => (
          <div key={category} className="border-b border-gray-100 last:border-b-0">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              {expandedCategories[category] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="font-semibold text-gray-800">{category}</span>
            </button>

            {expandedCategories[category] && (
              <div>
                {Object.entries(features).map(([feature, values]) => (
                  <div key={feature} className={`grid border-t border-gray-100 hover:bg-gray-50`} style={{ gridTemplateColumns: `1fr repeat(${plans.length}, 1fr)` }}>
                    <div className="p-4 text-sm text-gray-600">{feature}</div>
                    {values.slice(0, plans.length).map((value, index) => (
                      <div key={index} className="p-4 text-center flex items-center justify-center">
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
    </div>
  );
});

FeatureComparisonTable.displayName = 'FeatureComparisonTable';


// Plan Card Component - Clean solid design
const PlanCard = memo(({ plan, isCurrentPlan, onSelect, subscriptionData, daysRemaining, allPlans, index, isOrganizationMode, onOrganizationPurchase }) => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const isUpgrade = subscriptionData && !isCurrentPlan && parseInt(plan.price) > parseInt(allPlans.find(p => p.id === subscriptionData.plan)?.price || 0);
  const isDowngrade = subscriptionData && !isCurrentPlan && parseInt(plan.price) < parseInt(allPlans.find(p => p.id === subscriptionData.plan)?.price || 0);
  const isContactSales = plan.contactSales;
  
  const displayedFeatures = showAllFeatures ? plan.features : plan.features.slice(0, 6);
  const hasMoreFeatures = plan.features.length > 6;

  // Handle organization purchase click
  const handleClick = useCallback(() => {
    if (isOrganizationMode && onOrganizationPurchase) {
      onOrganizationPurchase(plan);
    } else {
      onSelect(plan);
    }
  }, [isOrganizationMode, onOrganizationPurchase, onSelect, plan]);

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all duration-300 h-full flex flex-col ${
        isCurrentPlan 
          ? 'border-blue-500 shadow-lg' 
          : plan.recommended 
          ? 'border-blue-500 shadow-lg' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Active Plan
          </span>
        </div>
      )}
      {!isCurrentPlan && plan.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      {/* Organization Mode Badge */}
      {isOrganizationMode && !isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Bulk
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="mb-5 pt-2">
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          {plan.tagline && <p className="text-sm text-blue-600 font-medium mt-1">{plan.tagline}</p>}
          
          <div className="mt-4">
            {isContactSales ? (
              <span className="text-2xl font-bold text-gray-900">Contact Sales</span>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">₹{parseInt(plan.price).toLocaleString()}</span>
                <span className="text-gray-500">/{plan.duration}</span>
                {isOrganizationMode && (
                  <span className="text-sm text-gray-400 ml-1">/seat</span>
                )}
              </div>
            )}
          </div>
          
          {/* Volume Discount Indicator for Organization Mode */}
          {isOrganizationMode && !isContactSales && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                50+ seats: 10% off
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                100+: 20% off
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                500+: 30% off
              </span>
            </div>
          )}

          {plan.positioning && (
            <p className="mt-3 text-sm text-gray-500">{plan.positioning}</p>
          )}

          {isCurrentPlan && daysRemaining !== null && (
            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              daysRemaining <= 7 ? 'bg-red-100 text-red-700' : daysRemaining <= 15 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="h-4 w-4" />
              {daysRemaining} days remaining
            </div>
          )}
        </div>

        {/* Capacity */}
        {plan.limits && (
          <div className="mb-5 p-4 bg-gray-50 rounded-xl">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Capacity</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-600 flex-shrink-0">Learners</span>
                <span className="font-medium text-gray-900 text-right">
                  {typeof plan.limits.learners === 'number' ? `Up to ${plan.limits.learners.toLocaleString()}` : plan.limits.learners}
                </span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-600 flex-shrink-0">Admins</span>
                <span className="font-medium text-gray-900 text-right">{plan.limits.admins}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-600 flex-shrink-0">Storage</span>
                <span className="font-medium text-gray-900 text-right">{plan.limits.storage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="flex-1 mb-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Features</h4>
          <ul className="space-y-2.5">
            {displayedFeatures.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
          {hasMoreFeatures && (
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {showAllFeatures ? 'Show less' : `+${plan.features.length - 6} more`}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2">
          {isCurrentPlan ? (
            <>
              <div className="w-full py-3 px-4 rounded-lg font-medium bg-blue-50 border border-blue-200 text-blue-700 text-center flex items-center justify-center gap-2">
                <Check className="h-5 w-5" /> Your Current Plan
              </div>
              <button
                onClick={() => onSelect(plan)}
                className="w-full py-3 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Manage Subscription
              </button>
            </>
          ) : isContactSales ? (
            <a
              href="mailto:sales@skillpassport.in?subject=Enterprise%20Plan%20Inquiry"
              className="w-full py-3 px-4 rounded-lg font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Contact Sales
            </a>
          ) : (
            <button
              onClick={handleClick}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isOrganizationMode
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : isUpgrade || plan.recommended
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {isOrganizationMode ? (
                <>
                  <Building2 className="h-5 w-5" />
                  Buy for Organization
                </>
              ) : (
                <>
                  {isUpgrade && <TrendingUp className="h-5 w-5" />}
                  {subscriptionData ? (isUpgrade ? 'Upgrade' : isDowngrade ? 'Switch Plan' : 'Select') : 'Get Started'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

PlanCard.displayName = 'PlanCard';


function SubscriptionPlans() {
  const navigate = useNavigate();
  const location = useLocation();
  const { type: pathType } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get type from path params OR query params (for redirects from protected routes)
  const type = pathType || searchParams.get('type');
  
  // Tab state - 'plans' or 'addons'
  const activeTab = searchParams.get('tab') || 'plans';
  const setActiveTab = useCallback((tab) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    });
  }, [setSearchParams]);
  
  // Use new authentication hook
  const { isAuthenticated, user, loading: authLoading, role: userRole } = useAuth();
  
  // Debug logging for redirect loop investigation
  const DEBUG = import.meta.env.DEV || localStorage.getItem('DEBUG_SUBSCRIPTION') === 'true';
  useEffect(() => {
    if (DEBUG) {
      console.log('[SubscriptionPlans] State:', {
        type,
        pathType,
        searchParamType: searchParams.get('type'),
        userRole,
        isAuthenticated,
        authLoading,
        pathname: location.pathname,
        search: location.search,
      });
    }
  }, [type, pathType, searchParams, userRole, isAuthenticated, authLoading, location.pathname, location.search, DEBUG]);
  
  // Get the manage path based on URL type parameter (more reliable than userRole)
  // Falls back to userRole if type is not available
  // CRITICAL FIX: Ensure we never redirect to wrong path
  const managePath = useMemo(() => {
    // First try to get path from URL type parameter (most reliable)
    if (type) {
      const pathFromType = getManagePathFromType(type);
      if (DEBUG) console.log('[SubscriptionPlans] managePath from type:', type, '->', pathFromType);
      return pathFromType;
    }
    
    // Fall back to userRole from auth
    if (userRole) {
      const pathFromRole = getManagePath(userRole);
      if (DEBUG) console.log('[SubscriptionPlans] managePath from userRole:', userRole, '->', pathFromRole);
      return pathFromRole;
    }
    
    // SAFETY: If neither type nor userRole is available, don't redirect
    // This prevents the redirect loop when auth is still loading or role is not set
    if (DEBUG) console.log('[SubscriptionPlans] managePath: no type or userRole, returning null to prevent redirect');
    return null;
  }, [type, userRole, DEBUG]);
  
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
  
  const { subscriptionData, loading: subscriptionLoading, error: subscriptionError, refreshSubscription } = useSubscriptionQuery();
  const daysRemaining = useMemo(() => calculateDaysRemaining(subscriptionData?.endDate), [subscriptionData?.endDate]);

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
    [subscriptionData, plans]
  );

  // Check if user is in upgrade mode (should not redirect to manage page)
  const isUpgradeMode = useMemo(
    () => searchParams.get('mode') === 'upgrade',
    [searchParams]
  );

  // Check if user is in organization purchase mode
  const isOrganizationMode = useMemo(
    () => searchParams.get('mode') === 'organization',
    [searchParams]
  );

  // Determine organization type from entity
  const organizationType = useMemo(() => {
    if (entity === 'school') return 'school';
    if (entity === 'college') return 'college';
    if (entity === 'university') return 'university';
    return 'school'; // default
  }, [entity]);

  // State for organization purchase panel
  const [showOrgPurchasePanel, setShowOrgPurchasePanel] = useState(false);
  const [selectedPlanForOrg, setSelectedPlanForOrg] = useState(null);
  const [isOrgPurchaseLoading, setIsOrgPurchaseLoading] = useState(false);

  // Compute whether redirect should occur
  // CRITICAL: Never redirect from plans page to manage page
  // Users with expired/revoked subscriptions NEED to stay on plans page to purchase
  // Only redirect if user navigated directly to plans page while having active subscription
  const shouldRedirect = useMemo(() => {
    // Never redirect - let users stay on plans page
    // If they have active subscription and want to manage it, they can use the navigation
    return false;
  }, []);

  // Show welcome message from signup flow (only once)
  useEffect(() => {
    const message = location.state?.message;
    if (message) {
      navigate(location.pathname + location.search, { replace: true, state: {} });
      toast.success(message, { duration: 5000, id: 'signup-success' });
    }
  }, []);

  useEffect(() => {
    if (subscriptionError && isAuthenticated) {
      console.error('[Subscription] Fetch error:', subscriptionError);
    }
  }, [subscriptionError, isAuthenticated]);

  useEffect(() => {
    if (isFullyLoaded && shouldRedirect && managePath) {
      const DEBUG = import.meta.env.DEV || localStorage.getItem('DEBUG_SUBSCRIPTION') === 'true';
      if (DEBUG) {
        console.log('[SubscriptionPlans] Redirecting to manage page:', managePath + location.search);
      }
      navigate(`${managePath}${location.search}`, { replace: true });
    }
  }, [isFullyLoaded, shouldRedirect, navigate, location.search, managePath]);

  const handlePlanSelection = useCallback((plan) => {
    // If user is currently on their active plan, go to manage page
    if (subscriptionData && subscriptionData.plan === plan.id) {
      // Use managePath if available, otherwise construct from type or userRole
      const targetPath = managePath || getManagePathFromType(type) || getManagePath(userRole) || `/subscription/plans?type=${studentType}`;
      navigate(targetPath);
      return;
    }
    
    // CRITICAL FIX: Check if auth is still loading
    if (authLoading) {
      console.log('🔄 Auth still loading, please wait...');
      return; // Don't redirect while auth is loading
    }
    
    // If not authenticated, redirect to signup
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated, redirecting to signup');
      navigate('/signup', { 
        state: { 
          plan, 
          studentType, 
          returnTo: '/subscription/payment' 
        } 
      });
      return;
    }
    
    // If user has active/paused subscription, show upgrade mode
    if (hasActiveOrPausedSubscription) {
      navigate(`/subscription/plans?type=${studentType}&mode=upgrade`);
      return;
    }
    
    // ENHANCED: Validate user exists in database before allowing payment
    // This prevents the payment page from redirecting back to signup
    const validateUserAndProceed = async () => {
      try {
        // Check if user exists in database
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, firstName, lastName, email')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('❌ Error checking user in database:', error);
          toast.error('Unable to verify account. Please try again.');
          return;
        }
        
        if (!userData) {
          console.warn('⚠️ User not found in database, redirecting to complete signup');
          navigate('/signup', { 
            state: { 
              plan, 
              studentType, 
              returnTo: '/subscription/payment',
              message: 'Please complete your account setup to continue with payment.'
            } 
          });
          return;
        }
        
        // User exists in database, proceed to payment
        console.log('✅ User validated, proceeding to payment');
        navigate('/subscription/payment', { 
          state: { 
            plan, 
            studentType, 
            isUpgrade: !!subscriptionData 
          } 
        });
        
      } catch (err) {
        console.error('❌ Error validating user:', err);
        toast.error('Unable to proceed with payment. Please try again.');
      }
    };
    
    // Execute validation
    validateUserAndProceed();
    
  }, [isAuthenticated, authLoading, user, navigate, studentType, subscriptionData, hasActiveOrPausedSubscription, managePath, type, userRole]);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  // Handler for organization purchase button click
  const handleOrganizationPurchase = useCallback((plan) => {
    if (!isAuthenticated) {
      toast.error('Please log in to purchase organization subscriptions');
      navigate('/login');
      return;
    }
    setSelectedPlanForOrg(plan);
    setShowOrgPurchasePanel(true);
  }, [isAuthenticated, navigate]);

  // Handler for organization purchase confirmation
  const handleOrgPurchaseConfirm = useCallback(async (config) => {
    setIsOrgPurchaseLoading(true);
    try {
      // Navigate to payment page with organization purchase config
      navigate('/subscription/payment', {
        state: {
          plan: selectedPlanForOrg,
          studentType,
          isOrganizationPurchase: true,
          organizationConfig: {
            organizationType,
            seatCount: config.seatCount,
            memberType: config.memberType,
            billingCycle: config.billingCycle,
            pricing: config.pricing,
          },
        },
      });
    } catch (error) {
      console.error('Organization purchase error:', error);
      toast.error('Failed to process organization purchase');
    } finally {
      setIsOrgPurchaseLoading(false);
      setShowOrgPurchasePanel(false);
    }
  }, [navigate, selectedPlanForOrg, studentType, organizationType]);

  // Handler for canceling organization purchase
  const handleOrgPurchaseCancel = useCallback(() => {
    setShowOrgPurchasePanel(false);
    setSelectedPlanForOrg(null);
  }, []);

  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {subscriptionError && isAuthenticated && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-red-800 font-medium">Unable to load subscription status</p>
              <p className="text-red-600 text-sm">{subscriptionError?.message || 'Please try again.'}</p>
            </div>
            <button onClick={refreshSubscription} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
              Retry
            </button>
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
          <div className="mb-10">
            <div className={`rounded-2xl p-6 ${subscriptionData.status === 'active' ? 'bg-blue-600' : 'bg-amber-500'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">
                    {subscriptionData.status === 'active' ? 'Active Subscription' : 'Paused Subscription'}
                  </h2>
                  <p className="text-white/80">{currentPlanData?.name || 'Unknown'} Plan</p>
                </div>
                {daysRemaining !== null && (
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    daysRemaining <= 7 ? 'bg-red-500 text-white' : daysRemaining <= 15 ? 'bg-amber-400 text-amber-900' : 'bg-white/20 text-white'
                  }`}>
                    <Clock className="h-4 w-4 inline mr-1.5" />
                    {daysRemaining} days left
                  </div>
                )}
              </div>
              {daysRemaining !== null && daysRemaining <= 7 && (
                <div className="mt-4 bg-white/10 rounded-lg p-3 text-white/90 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Your subscription is expiring soon. Renew or upgrade to continue.
                </div>
              )}
            </div>

            {/* Subscription Details */}
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Subscription Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Start Date</span>
                    <span className="font-medium text-gray-900">{formatDate(subscriptionData.startDate)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">End Date</span>
                    <span className="font-medium text-gray-900">{formatDate(subscriptionData.endDate)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Auto Renewal</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${subscriptionData.autoRenew ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {subscriptionData.autoRenew ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Active Features</h4>
                  <ul className="space-y-2">
                    {subscriptionData.features?.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Message */}
        {heroMessage && (
          <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
            <p className="text-blue-800 font-medium">{heroMessage}</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {isAuthenticated && hasActiveOrPausedSubscription ? 'Manage Your Plan' : title}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isAuthenticated && hasActiveOrPausedSubscription ? 'Upgrade to unlock more features' : subtitle}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'plans'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'addons'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Add-Ons
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">New</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'plans' ? (
          <>
            {/* Organization Mode Banner */}
            {isOrganizationMode && (
              <div className="mb-8 bg-purple-50 border border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">Organization Purchase Mode</h3>
                    <p className="text-sm text-purple-700">
                      Purchase subscriptions for your entire {organizationType}. Volume discounts available for 50+ seats.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  index={index}
                  allPlans={plans}
                  isCurrentPlan={isAuthenticated && hasActiveOrPausedSubscription && subscriptionData?.plan === plan.id}
                  onSelect={handlePlanSelection}
                  subscriptionData={isAuthenticated && hasActiveOrPausedSubscription ? subscriptionData : null}
                  daysRemaining={isAuthenticated && hasActiveOrPausedSubscription ? daysRemaining : null}
                  isOrganizationMode={isOrganizationMode}
                  onOrganizationPurchase={handleOrganizationPurchase}
                />
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-500 text-sm">
              {['Secure Payments', '24/7 Support', 'Cancel Anytime'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Feature Comparison */}
            <FeatureComparisonTable plans={plans} />
          </>
        ) : (
          /* Add-Ons Marketplace - compact mode without duplicate header */
          <AddOnMarketplace 
            role={pageRole} 
            showBundles={true}
            showHeader={false}
            compact={true}
          />
        )}

        {/* Contact Section */}
        <div className="mt-16 text-center bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help Choosing?</h3>
          <p className="text-gray-600 mb-4">Our team can help you find the right plan for your organization.</p>
          <a href="mailto:support@skillpassport.in" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
      
      {/* Organization Purchase Panel */}
      {showOrgPurchasePanel && selectedPlanForOrg && (
        <OrganizationPurchasePanel
          plan={selectedPlanForOrg}
          organizationType={organizationType}
          onPurchase={handleOrgPurchaseConfirm}
          onCancel={handleOrgPurchaseCancel}
          isLoading={isOrgPurchaseLoading}
        />
      )}
    </div>
  );
}

export default memo(SubscriptionPlans);