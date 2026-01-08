/**
 * SubscriptionBanner
 * 
 * Displays warning/info banners for subscription status.
 * Used by SubscriptionProtectedRoute to show expiry warnings, grace period alerts, etc.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  PauseCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { WARNING_TYPES } from '../../context/SubscriptionContext';

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

const bannerStyles = {
  expiring_soon: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: ClockIcon,
    iconColor: 'text-amber-500',
  },
  grace_period: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-red-500',
  },
  paused: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: PauseCircleIcon,
    iconColor: 'text-blue-500',
  },
  error: {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-800',
    icon: ExclamationCircleIcon,
    iconColor: 'text-gray-500',
  },
};

const SubscriptionBanner = ({ 
  type = 'expiring_soon', 
  message,
  showRenewLink = true,
  dismissible = true,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();
  const basePath = getSubscriptionBasePath(location.pathname);
  const userType = getUserTypeFromPath(location.pathname);

  if (isDismissed) return null;

  const style = bannerStyles[type] || bannerStyles.expiring_soon;
  const Icon = style.icon;

  const showRenew = showRenewLink && (type === WARNING_TYPES.EXPIRING_SOON || type === WARNING_TYPES.GRACE_PERIOD);

  return (
    <div className={`${style.bg} border-b px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${style.iconColor} flex-shrink-0`} />
          <p className={`text-sm font-medium ${style.text}`}>
            {message}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {showRenew && (
            <Link
              to={`/subscription/plans?type=${userType}`}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 whitespace-nowrap"
            >
              Renew Now →
            </Link>
          )}
          
          {type === WARNING_TYPES.PAUSED && (
            <Link
              to={`${basePath}/subscription/manage`}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 whitespace-nowrap"
            >
              Resume Subscription →
            </Link>
          )}
          
          {dismissible && (
            <button
              onClick={() => setIsDismissed(true)}
              className={`${style.text} hover:opacity-70 p-1 rounded`}
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBanner;
