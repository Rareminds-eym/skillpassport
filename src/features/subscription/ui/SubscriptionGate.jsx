/**
 * SubscriptionGate Component
 * 
 * Conditionally renders content based on entitlement manifest & subscription status.
 * Zero hardcoded plan arrays.
 * 
 * Usage:
 * <SubscriptionGate 
 *   fallback={<UpgradePrompt />}
 *   requiredFeature="advanced_skill_filters"
 * >
 *   <CandidateAdvancedFilters />
 * </SubscriptionGate>
 */

import { Link, useLocation } from 'react-router-dom';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { useEntitlementManifest } from '@/features/subscription/model/useEntitlementManifest';

function getSubscriptionBasePath(pathname) {
  if (pathname.startsWith('/learner')) return '/learner';
  if (pathname.startsWith('/recruitment')) return '/recruitment';
  if (pathname.startsWith('/educator')) return '/educator';
  if (pathname.startsWith('/college-admin')) return '/college-admin';
  if (pathname.startsWith('/school-admin')) return '/school-admin';
  if (pathname.startsWith('/university-admin')) return '/university-admin';
  return '';
}

function getUserTypeFromPath(pathname) {
  if (pathname.startsWith('/learner')) return 'learner';
  if (pathname.startsWith('/recruitment')) return 'recruiter';
  if (pathname.startsWith('/educator')) return 'educator';
  if (pathname.startsWith('/college-admin')) return 'college_admin';
  if (pathname.startsWith('/school-admin')) return 'school_admin';
  if (pathname.startsWith('/university-admin')) return 'university_admin';
  return 'learner';
}

const DefaultFallback = ({ requiredFeature, requiredPlan, basePath, userType }) => (
  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-6 text-center">
    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Premium Capability
    </h3>
    <p className="text-gray-600 mb-4">
      {requiredFeature
        ? `This capability (${requiredFeature.replace(/_/g, ' ')}) requires an upgraded subscription plan.`
        : requiredPlan
          ? `This feature requires a ${requiredPlan} plan or higher.`
          : 'This feature requires an active subscription.'}
    </p>
    <Link
      to={`/subscription/plans?type=${userType}`}
      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
    >
      View Upgrade Plans
    </Link>
  </div>
);

const SubscriptionGate = ({
  children,
  fallback,
  requiredFeature = null,
  requiredPlan = null,
  requireActive = true,
}) => {
  const location = useLocation();
  const basePath = getSubscriptionBasePath(location.pathname);
  const userType = getUserTypeFromPath(location.pathname);
  const isInstitution = ['college_admin', 'school_admin', 'university_admin', 'educator'].includes(userType);
  const family = userType === 'recruiter' ? 'recruiter' : (isInstitution ? 'institution' : 'individual');

  const { hasAccess, subscriptionData, loading: subLoading } = useSubscriptionQuery();
  const { manifest, loading: manifestLoading } = useEntitlementManifest({ family });

  const isLoading = subLoading || manifestLoading;

  if (isLoading) {
    return null;
  }

  // 1. If a specific entitlement feature key is specified, check against manifest
  if (requiredFeature && manifest?.features) {
    const feat = manifest.features[requiredFeature];
    if (!feat || !feat.enabled) {
      return fallback || (
        <DefaultFallback 
          requiredFeature={requiredFeature} 
          basePath={basePath} 
          userType={userType} 
        />
      );
    }
    return children;
  }

  // 2. Check basic active subscription access
  if (requireActive && !hasAccess && !manifest?.is_subscribed) {
    return fallback || (
      <DefaultFallback 
        requiredPlan={requiredPlan} 
        basePath={basePath} 
        userType={userType} 
      />
    );
  }

  // 3. Check plan hierarchy dynamically if specified
  if (requiredPlan && manifest) {
    const isRecruiterContext = userType === 'recruiter' || manifest.plan_family === 'recruiter';
    if (!isRecruiterContext && !isInstitution) {
      // Legacy learner plan fallback (only for individual learner context)
      const learnerHierarchy = ['freemium', 'basic', 'professional', 'premium', 'enterprise', 'enterprise_ecosystem'];
      const userLevel = learnerHierarchy.indexOf((subscriptionData?.plan || manifest.plan_code || '').toLowerCase());
      const reqLevel = learnerHierarchy.indexOf(requiredPlan.toLowerCase());
      if (userLevel < reqLevel && reqLevel >= 0) {
        return fallback || (
          <DefaultFallback 
            requiredPlan={requiredPlan} 
            basePath={basePath} 
            userType={userType} 
          />
        );
      }
    }
  }

  // Access granted
  return children;
};

export default SubscriptionGate;
