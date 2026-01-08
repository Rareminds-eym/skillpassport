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
import { ACCESS_REASONS, useSubscriptionContext } from '../../context/SubscriptionContext';
import Loader from '../Loader';
import SubscriptionBanner from './SubscriptionBanner';

/**
 * Get the user type for subscription plans based on current URL path
 * This is more reliable than using the role from auth context
 */
function getUserTypeFromPath(pathname) {
  if (pathname.startsWith('/student')) return 'student';
  if (pathname.startsWith('/recruitment')) return 'recruiter';
  if (pathname.startsWith('/educator')) return 'educator';
  if (pathname.startsWith('/college-admin')) return 'college_admin';
  if (pathname.startsWith('/school-admin')) return 'school_admin';
  if (pathname.startsWith('/university-admin')) return 'university_admin';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'student'; // fallback
}

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
    isRefetching,
  } = useSubscriptionContext();

  // Helper to build the subscription fallback URL with user's type from URL path
  const getSubscriptionFallbackUrl = () => {
    // If the fallback path already has a type parameter, use it as-is
    if (subscriptionFallbackPath.includes('type=')) {
      return subscriptionFallbackPath;
    }
    // Get user type from current URL path (more reliable than role from auth)
    const userType = getUserTypeFromPath(location.pathname);
    // Otherwise, append the user's type as the type parameter
    const separator = subscriptionFallbackPath.includes('?') ? '&' : '?';
    return `${subscriptionFallbackPath}${separator}type=${userType}`;
  };

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
    console.log('[SubscriptionProtectedRoute] Role check failed - role:', role, 'allowedRoles:', allowedRoles);
    // Instead of redirecting to home, redirect to subscription plans with the expected role
    // This provides a better UX - user can see plans and potentially fix their subscription
    const expectedRole = allowedRoles[0] || 'student';
    return <Navigate to={`/subscription/plans?type=${expectedRole}`} replace />;
  }

  // Step 4: If subscription not required, allow access
  if (!requireSubscription) {
    return children;
  }

  // Step 5: Wait for subscription check to complete
  // If loading (first load) or if we don't have access but are refetching (checking if we gained access)
  if (subscriptionLoading || (!hasAccess && isRefetching)) {
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
    const fallbackUrl = getSubscriptionFallbackUrl();
    
    // Determine redirect based on reason
    const redirectState = {
      from: location,
      reason: accessReason,
      userRole: role, // Pass the user's role for better UX on plans page
    };

    // For expired subscriptions, redirect to plans with renewal message
    if (accessReason === ACCESS_REASONS.EXPIRED) {
      return (
        <Navigate 
          to={fallbackUrl} 
          state={{ ...redirectState, message: 'Your subscription has expired. Please renew to continue.' }}
          replace 
        />
      );
    }

    // For cancelled subscriptions
    if (accessReason === ACCESS_REASONS.CANCELLED) {
      return (
        <Navigate 
          to={fallbackUrl} 
          state={{ ...redirectState, message: 'Your subscription was cancelled. Subscribe again to access.' }}
          replace 
        />
      );
    }

    // For no subscription
    return (
      <Navigate 
        to={fallbackUrl} 
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
