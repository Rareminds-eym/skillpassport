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
      <div className="inline-flex items-center justify-center w-7 h-7 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg">
        <Check className="h-4 w-4 text-white" strokeWidth={3} />
      </div>
    );
    if (value === false || value === '—') return (
      <span className="text-slate-300 text-xl">—</span>
    );
    if (value === '~') return (
      <span className="text-amber-500 font-bold text-lg">~</span>
    );
    return <span className="text-sm text-slate-900 font-semibold">{value}</span>;
  }, []);

  const featureComparison = useMemo(() => getFeatureComparison(plans), [plans]);

  if (!showComparison) {
    return (
      <div className="mt-16 text-center">
        <button
          onClick={() => setShowComparison(true)}
          className="text-slate-600 hover:text-slate-900 flex items-center gap-2 text-sm mx-auto font-semibold transition-colors"
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
          <h2 className="text-5xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
            Compare Plans
          </h2>
          <p className="text-slate-600 mt-2 text-lg font-light">See what's included in each plan</p>
        </div>
        <button
          onClick={() => setShowComparison(false)}
          className="text-slate-500 hover:text-slate-700 flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <ChevronUp className="h-4 w-4" /> Hide
        </button>
      </div>

      <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`grid bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative`} style={{ gridTemplateColumns: `minmax(250px, 1fr) repeat(${plans.length}, minmax(150px, 1fr))` }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 36px)`
          }}></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400"></div>
          
          <div className="relative p-8 font-light text-xl" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Features</div>
          {plans.map((plan) => (
            <div key={plan.id} className="relative p-8 text-center border-l border-white/10">
              <div className="font-light text-xl mb-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>{plan.name}</div>
              {plan.price && !plan.contactSales && (
                <div className="text-sm text-white/70 font-medium">₹{parseInt(plan.price).toLocaleString()}/{plan.duration}</div>
              )}
              {plan.contactSales && (
                <div className="text-sm text-white/70 font-medium">Custom</div>
              )}
            </div>
          ))}
        </div>

        {/* Categories */}
        {Object.entries(featureComparison).map(([category, features], categoryIndex) => (
          <div key={category} className={categoryIndex > 0 ? 'border-t-2 border-slate-100' : ''}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-6 flex items-center gap-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all text-left group"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all shadow-lg ${
                expandedCategories[category] 
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white scale-110' 
                  : 'bg-white text-slate-600 group-hover:bg-slate-50 border-2 border-slate-200'
              }`}>
                {expandedCategories[category] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <span className="font-light text-2xl text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>{category}</span>
                <span className="ml-4 text-sm text-slate-500 font-medium">{Object.keys(features).length} features</span>
              </div>
            </button>

            {expandedCategories[category] && (
              <div className="divide-y divide-slate-100">
                {Object.entries(features).map(([feature, values], featureIndex) => (
                  <div 
                    key={feature} 
                    className={`grid hover:bg-slate-50 transition-colors ${featureIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`} 
                    style={{ gridTemplateColumns: `minmax(250px, 1fr) repeat(${plans.length}, minmax(150px, 1fr))` }}
                  >
                    <div className="p-6 text-sm text-slate-700 font-medium flex items-center">
                      <span>{feature}</span>
                    </div>
                    {values.slice(0, plans.length).map((value, index) => (
                      <div key={index} className="p-6 text-center flex items-center justify-center border-l border-slate-100">
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
      <div className="mt-8 flex items-center justify-center gap-8 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </div>
          <span className="font-medium">Included</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-300 text-xl">—</span>
          <span className="font-medium">Not available</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-500 font-bold text-lg">~</span>
          <span className="font-medium">Partially available</span>
        </div>
      </div>
    </div>
  );
});

FeatureComparisonTable.displayName = 'FeatureComparisonTable';


// Plan Card Component - Editorial luxury design
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

  // Handle organization purchase click
  const handleClick = useCallback(() => {
    if (isOrganizationMode && onOrganizationPurchase) {
      onOrganizationPurchase(plan);
    } else {
      onSelect(plan);
    }
  }, [isOrganizationMode, onOrganizationPurchase, onSelect, plan]);

  // Render feature item
  const renderFeature = (feature, idx) => {
    const featureName = typeof feature === 'string' ? feature : (feature.name || feature.feature_key || '');
    const featureValue = typeof feature === 'object' ? (feature.value || feature.feature_value) : null;
    
    return (
      <li key={idx} className="flex items-start gap-3 py-2 group">
        <div className="flex-shrink-0 w-5 h-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mt-0.5 shadow-sm group-hover:scale-110 transition-transform">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-700">{formatFeatureName(featureName)}</span>
          {featureValue && (
            <span className="block text-xs text-slate-500 mt-0.5">{featureValue}</span>
          )}
        </div>
      </li>
    );
  };

  return (
    <div
      className={`relative bg-white rounded-3xl border-2 transition-all duration-300 h-full flex flex-col shadow-lg hover:shadow-2xl ${
        isCurrentPlan
          ? 'border-emerald-500 shadow-emerald-500/20'
          : plan.recommended
          ? 'border-slate-900 shadow-slate-900/10 scale-105'
          : 'border-slate-200 hover:border-slate-300'
        }`}
    >
      {/* Badges */}
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-xl">
            <Shield className="h-4 w-4" /> Active Plan
          </span>
        </div>
      )}
      {!isCurrentPlan && plan.recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-5 py-2 rounded-full text-sm font-bold shadow-xl">
            Most Popular
          </span>
        </div>
      )}
      {isOrganizationMode && !isCurrentPlan && (
        <div className="absolute -top-4 right-6 z-10">
          <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xl">
            <Building2 className="h-3.5 w-3.5" /> Bulk
          </span>
        </div>
      )}

      <div className="p-8 flex flex-col h-full">
        {/* Header */}
        <div className="mb-6 pt-2">
          <h3 className="text-3xl font-light text-slate-900 mb-2" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
            {plan.name}
          </h3>
          {plan.tagline && (
            <p className="text-sm text-amber-600 font-semibold">{plan.tagline}</p>
          )}

          <div className="mt-6">
            {isContactSales ? (
              <span className="text-3xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                Contact Sales
              </span>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                  ₹{parseInt(plan.price).toLocaleString()}
                </span>
                <span className="text-slate-500 font-light">/{plan.duration}</span>
                {isOrganizationMode && (
                  <span className="text-sm text-slate-400 ml-1">/seat</span>
                )}
              </div>
            )}
          </div>

          {/* Volume Discount Indicator */}
          {isOrganizationMode && !isContactSales && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                50+ seats: 10% off
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                100+: 20% off
              </span>
            </div>
          )}

          {plan.positioning && (
            <p className="mt-4 text-sm text-slate-600 font-light leading-relaxed">{plan.positioning}</p>
          )}

          {isCurrentPlan && daysRemaining !== null && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${
              daysRemaining <= 7 
                ? 'bg-red-100 text-red-700' 
                : daysRemaining <= 15 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-emerald-100 text-emerald-700'
              }`}>
              <Clock className="h-4 w-4" />
              {daysRemaining} days remaining
            </div>
          )}
        </div>

        {/* Capacity */}
        {plan.limits && (
          <div className="mb-6 p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Capacity</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-600 font-medium">Learners</span>
                <span className="font-semibold text-slate-900 text-right">
                  {typeof plan.limits.learners === 'number' ? `Up to ${plan.limits.learners.toLocaleString()}` : plan.limits.learners}
                </span>
              </div>
              <div className="h-px bg-slate-200"></div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-600 font-medium">Admins</span>
                <span className="font-semibold text-slate-900 text-right">{plan.limits.admins}</span>
              </div>
              <div className="h-px bg-slate-200"></div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-600 font-medium">Storage</span>
                <span className="font-semibold text-slate-900 text-right">{plan.limits.storage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="flex-1 mb-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">What's Included</h4>
          
          <div className="space-y-1">
            {plan.features?.slice(0, showAllFeatures ? undefined : 6).map((feature, idx) => renderFeature(feature, idx))}
          </div>
          
          {hasMoreFeatures && (
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="mt-4 w-full py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-2"
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
        <div className="mt-auto space-y-3">
          {isCurrentPlan ? (
            <>
              <div className="w-full py-4 px-4 rounded-2xl font-semibold bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-center flex items-center justify-center gap-2">
                <Check className="h-5 w-5" /> Your Current Plan
              </div>

              {subscriptionData?.status === 'cancelled' && (
                <button
                  onClick={() => onSelect(plan)}
                  className="w-full py-4 px-4 rounded-2xl font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
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
                className="w-full py-4 px-4 rounded-2xl font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
              >
                Manage Subscription
              </button>
            </>
          ) : isContactSales ? (
            <a
              href="mailto:sales@skillpassport.in?subject=Enterprise%20Plan%20Inquiry"
              className="w-full py-4 px-4 rounded-2xl font-semibold bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              Contact Sales
            </a>
          ) : (
            <button
              onClick={handleClick}
              className={`w-full py-4 px-4 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 ${
                isOrganizationMode
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                  : isUpgrade || plan.recommended
                  ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-300'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-slate-900 font-light text-xl" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Loading subscription plans…</p>
          <p className="mt-2 text-sm text-slate-500 font-medium">Fetching latest pricing from our servers</p>
        </div>
      </div>
    );
  }

  // API loaded but returned an error and no plans
  if (plansError && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-light text-slate-900 mb-3" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Unable to Load Plans</h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-light">
            {plansError.message || 'An error occurred while fetching subscription plans.'}
          </p>
          <button
            onClick={refetchPlans}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl font-semibold hover:from-slate-900 hover:to-black transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Subscription status error banner */}
        {subscriptionError && isAuthenticated && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-3xl p-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-red-900 font-semibold text-lg">Unable to load subscription status</p>
                <p className="text-red-700 text-sm">{subscriptionError?.message || 'Please try again.'}</p>
              </div>
            </div>
            <button onClick={refreshSubscription} className="px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 text-sm font-semibold shadow-lg transition-all hover:scale-105">
              Retry
            </button>
          </div>
        )}

        {/* Partial API failure banner */}
        {plansError && plans.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-3xl p-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <p className="text-amber-900 font-medium">
                Pricing information may be incomplete. Please refresh to see the latest plans.
              </p>
            </div>
            <button onClick={refetchPlans} className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 font-semibold shadow-lg transition-all hover:scale-105">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        )}
        {/* Enhanced subscription status banner - Show only for authenticated users with active or paused subscription */}
        {isAuthenticated && hasActiveOrPausedSubscription && (
          <div className="mb-16">
            {/* Main Status Card - Editorial Luxury Aesthetic */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
              {/* Sophisticated background pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 36px)`
              }}></div>
              
              {/* Accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400"></div>
              
              <div className="relative z-10 p-10">
                <div className="flex items-start justify-between gap-8 flex-wrap">
                  <div className="flex-1 min-w-[300px]">
                    {/* Status badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-6">
                      <div className={`w-2 h-2 rounded-full ${subscriptionData.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
                      <span className="text-xs font-medium tracking-wider uppercase text-white/70">
                        {subscriptionData.status === 'active' ? 'Currently Active' : 'Paused'}
                      </span>
                    </div>
                    
                    {/* Main heading - Editorial style */}
                    <h2 className="text-5xl font-light text-white mb-3 tracking-tight leading-none" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      {currentPlanData?.name || 'Premium'}
                    </h2>
                    <p className="text-xl text-white/60 font-light tracking-wide mb-6" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      {currentPlanData?.tagline || 'Your subscription is active'}
                    </p>
                    
                    {/* Subscription period */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber-400" />
                        <span className="text-white/50 font-light">Started</span>
                        <span className="text-white font-medium">{formatDate(subscriptionData.startDate)}</span>
                      </div>
                      <div className="w-px h-4 bg-white/10"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 font-light">Expires</span>
                        <span className="text-white font-medium">{formatDate(subscriptionData.endDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Days remaining - Asymmetric placement */}
                  {daysRemaining !== null && (
                    <div className={`relative ${
                      daysRemaining <= 7 
                        ? 'bg-gradient-to-br from-red-500 to-red-600' 
                        : daysRemaining <= 15 
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                        : 'bg-gradient-to-br from-slate-700 to-slate-800'
                    } rounded-3xl p-8 shadow-2xl border border-white/10 min-w-[180px]`}>
                      <div className="absolute top-3 right-3">
                        <Clock className="h-5 w-5 text-white/30" />
                      </div>
                      <div className="text-center">
                        <div className="text-6xl font-light text-white mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                          {daysRemaining}
                        </div>
                        <div className="text-sm text-white/70 uppercase tracking-widest font-medium">
                          Days Left
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expiring Soon Alert - Integrated design */}
                {daysRemaining !== null && daysRemaining <= 7 && (
                  <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/10 backdrop-blur-xl border border-red-500/20 p-5">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent"></div>
                    <div className="relative flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">Action Required</p>
                        <p className="text-white/70 text-sm leading-relaxed">
                          Your subscription expires soon. Renew now to maintain uninterrupted access to all premium features.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid - Asymmetric layout */}
            <div className="mt-8 grid lg:grid-cols-[1.2fr_1fr] gap-6">
              {/* Features Card - Dominant */}
              <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-50 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
                
                <div className="relative p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      Active Features
                    </h3>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(currentPlanData?.features || []).slice(0, 8).map((feature, index) => {
                      const featureName = typeof feature === 'string' ? feature : (feature.name || feature.feature_key || '');
                      const featureValue = typeof feature === 'object' ? (feature.value || feature.feature_value) : null;
                      
                      return (
                        <div 
                          key={index} 
                          className="flex items-start gap-3 group"
                          style={{ 
                            animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both` 
                          }}
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm text-slate-700 leading-relaxed font-medium">{formatFeatureName(featureName)}</span>
                            {featureValue && (
                              <span className="block text-xs text-slate-500 mt-0.5">{featureValue}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {(currentPlanData?.features?.length || 0) > 8 && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <span className="text-sm text-amber-600 font-semibold">
                        Plus {currentPlanData.features.length - 8} additional features
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Card - Secondary */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-lg">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      Details
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="group">
                      <div className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">Billing Cycle</div>
                      <div className="text-lg text-slate-900 font-medium">
                        {currentPlanData?.duration || 'Monthly'}
                      </div>
                    </div>
                    
                    <div className="h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>
                    
                    <div className="group">
                      <div className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">Auto Renewal</div>
                      <div className="flex items-center gap-3">
                        <div className={`relative w-12 h-6 rounded-full transition-colors ${
                          subscriptionData.autoRenew ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            subscriptionData.autoRenew ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </div>
                        <span className={`text-sm font-semibold ${
                          subscriptionData.autoRenew ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                          {subscriptionData.autoRenew ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>
                    
                    <div className="group">
                      <div className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">Plan Value</div>
                      <div className="text-2xl text-slate-900 font-light" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                        {currentPlanData?.price ? `₹${parseInt(currentPlanData.price).toLocaleString()}` : 'Custom'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Hero Message */}
        {heroMessage && (
          <div className="mb-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-8 shadow-xl">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 36px)`
            }}></div>
            <p className="relative text-white text-lg font-light text-center" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              {heroMessage}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-light text-slate-900 mb-4 tracking-tight" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
            {isAuthenticated && hasActiveOrPausedSubscription ? 'Manage Your Plan' : title}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            {isAuthenticated && hasActiveOrPausedSubscription ? 'Upgrade to unlock more features' : subtitle}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-8 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'plans'
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Shield className="w-4 h-4" />
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('addons')}
              className={`px-8 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'addons'
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              Add-Ons
              <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full font-bold">New</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'plans' ? (
          <>
            {/* Organization Mode Banner */}
            {isOrganizationMode && (
              <div className="mb-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 to-purple-800 p-8 shadow-xl">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 36px)`
                }}></div>
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-light text-white mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                      Organization Purchase Mode
                    </h3>
                    <p className="text-purple-100 font-light">
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
            <div className="mt-16 flex flex-wrap items-center justify-center gap-12 text-slate-600">
              {['Secure Payments', '24/7 Support', 'Cancel Anytime'].map((item) => (
                <div key={item} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </div>
                  <span className="font-medium">{item}</span>
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
        <div className="mt-20 text-center relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 shadow-2xl">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 36px)`
          }}></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400"></div>
          
          <div className="relative">
            <h3 className="text-4xl font-light text-white mb-3" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              Need Help Choosing?
            </h3>
            <p className="text-white/70 mb-8 text-lg font-light max-w-xl mx-auto">
              Our team can help you find the right plan for your organization.
            </p>
            <a 
              href="mailto:support@skillpassport.in" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-semibold hover:bg-slate-100 transition-all shadow-xl hover:scale-105"
            >
              Contact Support
            </a>
          </div>
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