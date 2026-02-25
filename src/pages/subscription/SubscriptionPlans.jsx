import { AlertCircle, Building2, Calendar, Check, ChevronDown, ChevronUp, Clock, RefreshCw, Shield, Sparkles, TrendingUp, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AddOnMarketplace from '../../components/Subscription/AddOnMarketplace';
import { OrganizationPurchasePanel } from '../../components/Subscription/Organization';
import { useSubscriptionPlansData } from '../../hooks/Subscription/useSubscriptionPlansData';
import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';
import useAuth from '../../hooks/useAuth';

import { getEntityContent, getEntityTypeParam, getRoleTypeParam, parseStudentType } from '../../utils/getEntityContent';
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

// Convert snake_case to user-friendly Title Case
const formatFeatureName = (name) => {
  if (!name) return '';
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\b(\d+)\s?gb\b/gi, '$1 GB')
    .replace(/\b(\d+)\s?mb\b/gi, '$1 MB');
};

// Build feature comparison from actual plan data
const getFeatureComparison = (plans) => {
  if (!plans || plans.length === 0) return {};
  
  const categories = {
    'Essentials': {},
    'Learning': {},
    'Support': {},
    'Extras': {}
  };
  
  // Feature categorization mapping
  const featureCategories = {
    // Essentials
    'access_basic_assessments': 'Essentials',
    '5_assessments_month': 'Essentials',
    '10_assessments_month': 'Essentials',
    'unlimited_assessments': 'Essentials',
    '3_projects': 'Essentials',
    '10_projects': 'Essentials',
    'unlimited_projects': 'Essentials',
    '5gb_storage': 'Essentials',
    '10gb_storage': 'Essentials',
    '50gb_storage': 'Essentials',
    
    // Learning
    'skill_analytics': 'Learning',
    'advanced_analytics': 'Learning',
    'portfolio_builder': 'Learning',
    'advanced_portfolio': 'Learning',
    'career_paths': 'Learning',
    'all_career_paths': 'Learning',
    'interview_prep': 'Learning',
    'mock_interviews': 'Learning',
    'linkedin_opt': 'Learning',
    'resume_builder': 'Learning',
    'certificates': 'Learning',
    'verified_certs': 'Learning',
    
    // Support
    'basic_support': 'Support',
    'priority_support': 'Support',
    'mentorship': 'Support',
    'placement_assist': 'Support'
  };
  
  // Collect all unique features across all plans
  const allFeatures = new Map();
  
  plans.forEach((plan, planIndex) => {
    if (!plan.features || !Array.isArray(plan.features)) return;
    
    plan.features.forEach(feature => {
      // Handle both string features and object features
      let featureKey, displayName, value;
      
      if (typeof feature === 'string') {
        featureKey = feature;
        displayName = formatFeatureName(feature);
        value = true;
      } else if (typeof feature === 'object' && feature !== null) {
        featureKey = feature.feature_key || feature.key || feature.name;
        displayName = feature.name || feature.label || formatFeatureName(featureKey);
        value = feature.feature_value || feature.value || true;
        if (feature.is_included === false) value = '—';
        if (feature.is_partial === true) value = '~';
      } else {
        return; // Skip invalid features
      }
      
      if (!featureKey || !displayName) return;
      
      // Determine category
      const category = featureCategories[featureKey] || 'Extras';
      
      // Use displayName as key to prevent duplicates
      if (!allFeatures.has(displayName)) {
        allFeatures.set(displayName, {
          displayName,
          category,
          values: Array(plans.length).fill('—')
        });
      }
      
      // Set the value for this plan
      const featureData = allFeatures.get(displayName);
      featureData.values[planIndex] = value;
    });
  });
  
  // Organize by category
  allFeatures.forEach((data, featureName) => {
    const category = categories[data.category] ? data.category : 'Extras';
    categories[category][featureName] = data.values;
  });
  
  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (Object.keys(categories[key]).length === 0) {
      delete categories[key];
    }
  });
  
  return categories;
};

// Feature Comparison Table Component
const FeatureComparisonTable = memo(({ plans }) => {
  const [showComparison, setShowComparison] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({
    'Essentials': true,
    'Learning': true,
    'Support': true,
    'Extras': true,
  });

  const toggleCategory = useCallback((category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  const renderValue = useCallback((value) => {
    if (value === true) return (
      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
        <Check className="h-4 w-4 text-green-600" />
      </div>
    );
    if (value === false || value === '—') return (
      <span className="text-gray-300 text-lg">—</span>
    );
    if (value === '~') return (
      <span className="text-amber-500 font-medium">~</span>
    );
    return <span className="text-sm text-gray-900 font-medium">{value}</span>;
  }, []);

  const featureComparison = useMemo(() => getFeatureComparison(plans), [plans]);

  if (!showComparison) {
    return (
      <div className="mt-16 text-center">
        <button
          onClick={() => setShowComparison(true)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm mx-auto font-medium transition-colors"
        >
          <ChevronDown className="h-4 w-4" /> Show Feature Comparison
        </button>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Compare Plans</h2>
          <p className="text-gray-600 mt-1">See what's included in each plan</p>
        </div>
        <button
          onClick={() => setShowComparison(false)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <ChevronUp className="h-4 w-4" /> Hide
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
        {/* Header */}
        <div className={`grid bg-gradient-to-br from-blue-600 to-indigo-700 text-white`} style={{ gridTemplateColumns: `minmax(250px, 1fr) repeat(${plans.length}, minmax(150px, 1fr))` }}>
          <div className="p-6 font-bold text-lg">Features</div>
          {plans.map((plan) => (
            <div key={plan.id} className="p-6 text-center border-l border-white/10">
              <div className="font-bold text-lg mb-1">{plan.name}</div>
              {plan.price && !plan.contactSales && (
                <div className="text-sm text-blue-100">₹{parseInt(plan.price).toLocaleString()}/{plan.duration}</div>
              )}
              {plan.contactSales && (
                <div className="text-sm text-blue-100">Custom</div>
              )}
            </div>
          ))}
        </div>

        {/* Categories */}
        {Object.entries(featureComparison).map(([category, features], categoryIndex) => (
          <div key={category} className={categoryIndex > 0 ? 'border-t-2 border-gray-100' : ''}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-5 flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-all text-left group"
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                expandedCategories[category] 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
              }`}>
                {expandedCategories[category] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <span className="font-bold text-gray-900 text-lg">{category}</span>
                <span className="ml-3 text-sm text-gray-500">{Object.keys(features).length} features</span>
              </div>
            </button>

            {expandedCategories[category] && (
              <div className="divide-y divide-gray-100">
                {Object.entries(features).map(([feature, values], featureIndex) => (
                  <div 
                    key={feature} 
                    className={`grid hover:bg-blue-50/50 transition-colors ${featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`} 
                    style={{ gridTemplateColumns: `minmax(250px, 1fr) repeat(${plans.length}, minmax(150px, 1fr))` }}
                  >
                    <div className="p-5 text-sm text-gray-700 font-medium flex items-center">
                      <span>{feature}</span>
                    </div>
                    {values.slice(0, plans.length).map((value, index) => (
                      <div key={index} className="p-5 text-center flex items-center justify-center border-l border-gray-100">
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

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <span>Included</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-lg">—</span>
          <span>Not available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-medium">~</span>
          <span>Partially available</span>
        </div>
      </div>
    </div>
  );
});

FeatureComparisonTable.displayName = 'FeatureComparisonTable';


// Plan Card Component - Clean solid design with user-friendly feature display
const PlanCard = memo(({ plan, isCurrentPlan, onSelect, onManage, subscriptionData, daysRemaining, allPlans, index, isOrganizationMode, onOrganizationPurchase }) => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const isUpgrade = subscriptionData && !isCurrentPlan && parseInt(plan.price) > parseInt(allPlans.find(p => p.id === subscriptionData.plan)?.price || 0);
  const isDowngrade = subscriptionData && !isCurrentPlan && parseInt(plan.price) < parseInt(allPlans.find(p => p.id === subscriptionData.plan)?.price || 0);
  const isContactSales = plan.contactSales;

  // Group features by category for better display
  const featuresByCategory = useMemo(() => {
    if (!plan.features || !Array.isArray(plan.features)) return {};
    
    const categories = {
      'Essentials': [],
      'Learning': [],
      'Support': [],
      'Extras': []
    };
    
    plan.features.forEach(feature => {
      const category = feature.category || 'Extras';
      if (categories[category]) {
        categories[category].push(feature);
      } else {
        categories['Extras'].push(feature);
      }
    });
    
    return categories;
  }, [plan.features]);

  const hasMoreFeatures = plan.features?.length > 6;

  // Category icons and colors
  const categoryConfig = {
    'Essentials': { icon: 'Zap', color: 'amber', label: 'Essentials' },
    'Learning': { icon: 'GraduationCap', color: 'blue', label: 'Learning & Growth' },
    'Support': { icon: 'HeadphonesIcon', color: 'emerald', label: 'Support' },
    'Extras': { icon: 'Gift', color: 'purple', label: 'Extras' }
  };

  // Handle organization purchase click
  const handleClick = useCallback(() => {
    if (isOrganizationMode && onOrganizationPurchase) {
      onOrganizationPurchase(plan);
    } else {
      onSelect(plan);
    }
  }, [isOrganizationMode, onOrganizationPurchase, onSelect, plan]);

  // Render feature item with icon and value
  const renderFeature = (feature, idx) => (
    <li key={idx} className="flex items-start gap-3 py-2">
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
        <Check className="h-3 w-3 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900">{formatFeatureName(feature.name || feature)}</span>
        {(feature.value || feature.feature_value) && (
          <span className="block text-xs text-gray-500 mt-0.5">{feature.value || feature.feature_value}</span>
        )}
      </div>
    </li>
  );

  // Render category section
  const renderCategory = (categoryKey, features) => {
    if (!features || features.length === 0) return null;
    const config = categoryConfig[categoryKey] || categoryConfig['Extras'];
    
    return (
      <div key={categoryKey} className="mb-4">
        <h5 className={`text-xs font-bold uppercase tracking-wider mb-2 text-${config.color}-600 flex items-center gap-1.5`}>
          {config.label}
        </h5>
        <ul className="space-y-0.5">
          {features.slice(0, showAllFeatures ? undefined : 3).map((feature, idx) => renderFeature(feature, idx))}
        </ul>
      </div>
    );
  };

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all duration-300 h-full flex flex-col ${isCurrentPlan
        ? 'border-emerald-500 shadow-xl shadow-emerald-500/10'
        : plan.recommended
          ? 'border-blue-500 shadow-lg'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm">
            <Shield className="h-3.5 w-3.5 justify-center" /> Active Plan
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
            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${daysRemaining <= 7 ? 'bg-red-100 text-red-700' : daysRemaining <= 15 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
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

        {/* Features - User-friendly grouped display */}
        <div className="flex-1 mb-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">What's Included</h4>
          
          {Object.entries(featuresByCategory).map(([category, features]) => 
            renderCategory(category, features)
          )}
          
          {hasMoreFeatures && (
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="mt-2 w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {showAllFeatures ? (
                <>Show less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show all {plan.features.length} features <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2">
          {isCurrentPlan ? (
            <>
              <div className="w-full py-3 px-4 rounded-lg font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 text-center flex items-center justify-center gap-2">
                <Check className="h-5 w-5" /> Your Current Plan
              </div>

              {/* Only show Renew button if the subscription is cancelled but still active */}
              {subscriptionData?.status === 'cancelled' && (
                <button
                  onClick={() => onSelect(plan)}
                  className="w-full py-3 px-4 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingUp className="h-5 w-5" />
                  Renew Plan
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onManage) onManage();
                }}
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
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isOrganizationMode
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

  // Map parsed entity/role to API query params
  const entityTypeParam = useMemo(() => getEntityTypeParam(entity), [entity]);
  const roleTypeParam = useMemo(() => getRoleTypeParam(pageRole), [pageRole]);

  // Determine business type based on user role
  // B2C for individual students, B2B for organization admins
  const businessType = useMemo(() => {
    return pageRole === 'admin' ? 'b2b' : 'b2c';
  }, [pageRole]);

  // Fetch plans EXCLUSIVELY from the Cloudflare Worker API.
  // plans = null while loading, [] or [...] after.
  const {
    plans: dbPlans,
    loading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useSubscriptionPlansData({
    businessType,
    entityType: entityTypeParam,
    roleType: roleTypeParam,
  });

  // Plans exclusively from DB — zero hardcoded fallback
  const plans = dbPlans ?? [];

  // UI-only content (titles, subtitles, CTA text). No pricing here.
  const { title, subtitle, heroMessage, ctaText } = useMemo(
    () => getEntityContent(type || 'student'),
    [type]
  );

  const studentType = type || 'student';

  const { subscriptionData, loading: subscriptionLoading, error: subscriptionError, refreshSubscription } = useSubscriptionQuery();
  const daysRemaining = useMemo(() => calculateDaysRemaining(subscriptionData?.endDate), [subscriptionData?.endDate]);

  // Combined loading state — wait for auth, subscription, AND plans from API.
  // plansLoading stays true until the first API response arrives (plans === null → loading).
  const isFullyLoaded = useMemo(
    () => !authLoading && !subscriptionLoading && !plansLoading,
    [authLoading, subscriptionLoading, plansLoading]
  );

  // Memoize subscription status checks for better performance
  const hasActiveOrPausedSubscription = useMemo(
    () => subscriptionData && isActiveOrPaused(subscriptionData.status),
    [subscriptionData]
  );

  // Broader check: does user have a current subscription (including cancelled but not expired)?
  // Used for PlanCard highlighting so users can see their current plan during upgrade flow
  const hasCurrentSubscription = useMemo(() => {
    if (!subscriptionData) return false;
    const { status, endDate } = subscriptionData;
    if (isActiveOrPaused(status)) return true;
    if (status === 'cancelled' && endDate) return new Date(endDate) > new Date();
    return false;
  }, [subscriptionData]);

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
    // If user is currently on their ACTIVE plan (not cancelled), go to manage page
    // Cancelled subscriptions should allow re-purchase of the same plan
    if (subscriptionData && subscriptionData.plan === plan.id && subscriptionData.status !== 'cancelled') {
      const targetPath = managePath || getManagePathFromType(type) || getManagePath(userRole) || `/subscription/plans?type=${studentType}`;
      navigate(targetPath);
      return;
    }

    // Check if auth is still loading
    if (authLoading) {
      console.log('🔄 Auth still loading, please wait...');
      return;
    }

    // If user has active/paused subscription and not already in upgrade mode, show upgrade mode
    if (hasActiveOrPausedSubscription && !isUpgradeMode) {
      navigate(`/subscription/plans?type=${studentType}&mode=upgrade`);
      return;
    }

    // If not authenticated, redirect to signup with plan context
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

    // CRITICAL: Navigate to payment page SYNCHRONOUSLY
    // The old async DB validation was causing a race condition with auth state changes.
    // PaymentCompletion.jsx already validates the user in the database, so this is not needed here.
    console.log('✅ Navigating to payment page', { planId: plan.id, isUpgrade: !!subscriptionData });
    navigate('/subscription/payment', {
      state: {
        plan,
        studentType,
        isUpgrade: !!subscriptionData
      }
    });

  }, [isAuthenticated, authLoading, user, navigate, studentType, subscriptionData, hasActiveOrPausedSubscription, isUpgradeMode, managePath, type, userRole]);

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
          <p className="mt-4 text-gray-600 font-medium">Loading subscription plans…</p>
          <p className="mt-1 text-sm text-gray-400">Fetching latest pricing from our servers</p>
        </div>
      </div>
    );
  }

  // API loaded but returned an error and no plans
  if (plansError && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Plans</h2>
          <p className="text-gray-500 mb-6 text-sm">
            {plansError.message || 'An error occurred while fetching subscription plans.'}
          </p>
          <button
            onClick={refetchPlans}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Subscription status error banner */}
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

        {/* Partial API failure banner — plans loaded but with a warning */}
        {plansError && plans.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <p className="text-amber-800 text-sm font-medium">
                Pricing information may be incomplete. Please refresh to see the latest plans.
              </p>
            </div>
            <button onClick={refetchPlans} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
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
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${daysRemaining <= 7 ? 'bg-red-500 text-white' : daysRemaining <= 15 ? 'bg-amber-400 text-amber-900' : 'bg-white/20 text-white'
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
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'plans'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Shield className="w-4 h-4" />
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'addons'
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

            {/* Plans Grid - responsive columns based on plan count */}
            <div className={`grid md:grid-cols-2 gap-6 ${plans.length === 3 ? 'lg:grid-cols-3' : plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
              {plans.map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  index={index}
                  allPlans={plans}
                  isCurrentPlan={isAuthenticated && hasCurrentSubscription && subscriptionData?.plan === plan.id}
                  onSelect={handlePlanSelection}
                  onManage={() => navigate(managePath || getManagePathFromType(type) || getManagePath(userRole) || `/subscription/plans?type=${studentType}`)}
                  subscriptionData={isAuthenticated && hasCurrentSubscription ? subscriptionData : null}
                  daysRemaining={isAuthenticated && hasCurrentSubscription ? daysRemaining : null}
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