import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';

/**
 * Get the base path for subscription routes based on current location
 */
function getSubscriptionBasePath(pathname) {
  if (pathname.startsWith('/student')) return '/student';
  if (pathname.startsWith('/recruitment')) return '/recruitment';
  if (pathname.startsWith('/educator')) return '/educator';
  if (pathname.startsWith('/college-admin')) return '/college-admin';
  if (pathname.startsWith('/school-admin')) return '/school-admin';
  if (pathname.startsWith('/university-admin')) return '/university-admin';
  return ''; // fallback to root
}

/**
 * Get the user type for subscription plans based on current path
 */
function getUserTypeFromPath(pathname) {
  if (pathname.startsWith('/student')) return 'student';
  if (pathname.startsWith('/recruitment')) return 'recruiter';
  if (pathname.startsWith('/educator')) return 'educator';
  if (pathname.startsWith('/college-admin')) return 'college_admin';
  if (pathname.startsWith('/school-admin')) return 'school_admin';
  if (pathname.startsWith('/university-admin')) return 'university_admin';
  return 'student'; // fallback
}

/**
 * Subscription Status Widget
 * Shows quick subscription status on dashboard with appropriate CTAs
 */
const SubscriptionStatusWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subscriptionData, loading } = useSubscriptionQuery();
  const basePath = getSubscriptionBasePath(location.pathname);
  const userType = getUserTypeFromPath(location.pathname);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 animate-pulse">
        <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
      </div>
    );
  }

  // No subscription
  if (!subscriptionData) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Unlock Premium Features</h3>
            <p className="text-xs text-neutral-600 mb-3">
              Get access to Career AI, Video Portfolio, and more premium features
            </p>
            <button
              onClick={() => navigate(`/subscription/plans?type=${userType}&mode=purchase`)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Plans
              <TrendingUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate days remaining
  const endDate = new Date(subscriptionData.endDate);
  const today = new Date();
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 7;
  const isExpired = subscriptionData.status === 'expired';

  // Expired subscription
  if (isExpired) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Subscription Expired</h3>
            <p className="text-xs text-neutral-600 mb-3">
              Renew now to restore access to premium features
            </p>
            <button
              onClick={() => navigate(`${basePath}/subscription/manage`)}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Renew Now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription - expiring soon
  if (isExpiringSoon) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              Subscription Expiring Soon
            </h3>
            <p className="text-xs text-neutral-600 mb-3">
              Only {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left on your{' '}
              {subscriptionData.planName || 'Basic'} plan
            </p>
            <button
              onClick={() => navigate(`${basePath}/subscription/manage`)}
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              Manage Subscription →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription - healthy
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">
            {subscriptionData.planName || 'Basic'} Plan Active
          </h3>
          <p className="text-xs text-neutral-600 mb-2">{daysRemaining} days remaining</p>
          <button
            onClick={() => navigate(`${basePath}/subscription/manage`)}
            className="text-xs font-medium text-green-600 hover:text-green-700"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusWidget;
