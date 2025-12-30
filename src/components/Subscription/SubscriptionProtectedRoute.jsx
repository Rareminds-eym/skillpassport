/**
 * SubscriptionProtectedRoute
 * 
 * Production-ready route guard that protects routes requiring active subscription.
 * Combines authentication check + role check + subscription access check.
 * 
 * Usage:
 * <SubscriptionProtectedRoute 
 *   allowedRoles={['school_student', 'college_student']}
 *   requireSubscription={true}
 * >
 *   <StudentLayout />
 * </SubscriptionProtectedRoute>
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptionContext, ACCESS_REASONS } from '../../context/SubscriptionContext';
import Loader from '../Loader';
import SubscriptionBanner from './SubscriptionBanner';

const SubscriptionProtectedRoute = ({ 
  children, 
  allowedRoles = [],
  requireSubscription = true,
  subscriptionFallbackPath = '/subscription/plans',
  loginFallbackPath = '/login',
}) => {
  const { isAuthenticated, role, loading: authLoading } = useAuth();
  const location = useLocation();
  
  const {
    hasAccess,
    accessReason,
    isLoading: subscriptionLoading,
    showWarning,
    warningType,
    warningMessage,
    error: subscriptionError,
  } = useSubscriptionContext();

  // Step 1: Wait for auth to load
  if (authLoading) {
    return <Loader />;
  }

  // Step 2: Check authentication
  if (!isAuthenticated) {
    // Preserve the intended destination for redirect after login
    const redirectPath = location.pathname.includes('student') 
      ? loginFallbackPath 
      : '/';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Step 3: Check role (if allowedRoles specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // Step 4: If subscription not required, allow access
  if (!requireSubscription) {
    return children;
  }

  // Step 5: Wait for subscription check to complete
  if (subscriptionLoading) {
    return <Loader />;
  }

  // Step 6: Handle subscription error (allow access but log error)
  if (subscriptionError) {
    console.error('Subscription check error:', subscriptionError);
    // On error, we could either block or allow - allowing with warning is safer for UX
    return (
      <>
        <SubscriptionBanner 
          type="error"
          message="Unable to verify subscription status. Some features may be limited."
        />
        {children}
      </>
    );
  }

  // Step 7: Check subscription access
  if (!hasAccess) {
    // Determine redirect based on reason
    const redirectState = {
      from: location,
      reason: accessReason,
    };

    // For expired subscriptions, redirect to plans with renewal message
    if (accessReason === ACCESS_REASONS.EXPIRED) {
      return (
        <Navigate 
          to={subscriptionFallbackPath} 
          state={{ ...redirectState, message: 'Your subscription has expired. Please renew to continue.' }}
          replace 
        />
      );
    }

    // For cancelled subscriptions
    if (accessReason === ACCESS_REASONS.CANCELLED) {
      return (
        <Navigate 
          to={subscriptionFallbackPath} 
          state={{ ...redirectState, message: 'Your subscription was cancelled. Subscribe again to access.' }}
          replace 
        />
      );
    }

    // For no subscription
    return (
      <Navigate 
        to={subscriptionFallbackPath} 
        state={{ ...redirectState, message: 'A subscription is required to access this area.' }}
        replace 
      />
    );
  }

  // Step 8: Access granted - render with optional warning banner
  return (
    <>
      {showWarning && (
        <SubscriptionBanner 
          type={warningType}
          message={warningMessage}
        />
      )}
      {children}
    </>
  );
};

export default SubscriptionProtectedRoute;
