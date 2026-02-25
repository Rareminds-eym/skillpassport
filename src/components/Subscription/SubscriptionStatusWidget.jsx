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
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 animate-pulse shadow-lg">
        <div className="h-4 bg-slate-200 rounded-2xl w-1/3 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded-2xl w-2/3"></div>
      </div>
    );
  }

  // No subscription
  if (!subscriptionData) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl border-2 border-amber-200 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-light text-slate-900 mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              Unlock Premium Features
            </h3>
            <p className="text-xs text-slate-600 mb-3 font-light leading-relaxed">
              Get access to Career AI, Video Portfolio, and more premium features
            </p>
            <button
              onClick={() => navigate(`/subscription/plans?type=${userType}&mode=purchase`)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
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
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-3xl border-2 border-red-200 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-light text-slate-900 mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              Subscription Expired
            </h3>
            <p className="text-xs text-slate-600 mb-3 font-light leading-relaxed">
              Renew now to restore access to premium features
            </p>
            <button
              onClick={() => navigate(`${basePath}/subscription/manage`)}
              className="text-xs font-semibold text-red-700 hover:text-red-900 transition-colors"
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
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl border-2 border-amber-200 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-light text-slate-900 mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              Subscription Expiring Soon
            </h3>
            <p className="text-xs text-slate-600 mb-3 font-light leading-relaxed">
              Only {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left on your {subscriptionData.planName || 'Basic'} plan
            </p>
            <button
              onClick={() => navigate(`${basePath}/subscription/manage`)}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
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
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl border-2 border-emerald-200 p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-light text-slate-900 mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
            {subscriptionData.planName || 'Basic'} Plan Active
          </h3>
          <p className="text-xs text-slate-600 mb-2 font-light leading-relaxed">
            {daysRemaining} days remaining
          </p>
          <button
            onClick={() => navigate(`${basePath}/subscription/manage`)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusWidget;

