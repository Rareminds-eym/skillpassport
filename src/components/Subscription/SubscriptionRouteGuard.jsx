import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';

/**
 * Centralized Subscription Route Guard
 * Handles all subscription-related routing logic in one place for smooth transitions
 */
const SubscriptionRouteGuard = ({ children, mode, showSkeleton = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { subscriptionData, loading: subscriptionLoading } = useSubscriptionQuery();
  const [redirecting, setRedirecting] = useState(false);

  // Memoize active subscription check
  const hasActiveSubscription = useMemo(
    () => user && subscriptionData && subscriptionData.status === 'active',
    [user, subscriptionData]
  );

  // Check if user has any manageable subscription (active or paused)
  const hasManageableSubscription = useMemo(
    () => user && subscriptionData && ['active', 'paused', 'cancelled'].includes(subscriptionData.status),
    [user, subscriptionData]
  );

  // Determine if loading
  const isLoading = authLoading || subscriptionLoading;

  useEffect(() => {
    // Wait for both auth and subscription to load
    if (isLoading) {
      return;
    }

    // Preserve query params during redirects
    const searchParams = new URLSearchParams(location.search);
    const queryString = searchParams.toString();
    const addQueryParams = (path) => queryString ? `${path}?${queryString}` : path;

    // Route logic based on mode
    switch (mode) {
      case 'plans':
        // Plans page - accessible to all
        break;

      case 'payment':
        // Payment page - redirect if user has active subscription
        if (hasActiveSubscription) {
          setRedirecting(true);
          navigate('/subscription/manage', { replace: true });
        }
        break;

      case 'manage':
        // Manage page - requires authentication and manageable subscription
        // Allow active, paused, or recently cancelled subscriptions
        if (!user) {
          setRedirecting(true);
          navigate(addQueryParams('/subscription/plans'), { 
            replace: true,
            state: { from: location.pathname }
          });
        } else if (!hasManageableSubscription) {
          // No subscription or expired subscription - redirect to plans
          setRedirecting(true);
          navigate(addQueryParams('/subscription/plans'), { 
            replace: true,
            state: { from: location.pathname, message: 'no-subscription' }
          });
        }
        break;

      default:
        break;
    }
  }, [user, subscriptionData, hasActiveSubscription, hasManageableSubscription, isLoading, navigate, mode, location]);

  // Show loading state while checking or redirecting
  if (isLoading || redirecting) {
    // Use skeleton if requested, otherwise spinner
    if (showSkeleton && !redirecting) {
      return <SkeletonLoader />;
    }

    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-neutral-600 mt-4">
            {redirecting ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Render children when all checks pass
  return children;
};

/**
 * Skeleton Loader Component
 */
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
            <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-2">
              <div className="h-10 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SubscriptionRouteGuard;

