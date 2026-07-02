import { getRouteForRole } from '@/features/auth/lib/roleBasedRouter';
import { useAuthLoading, useIsAuthenticated, useUserRole } from '@/shared/model/authStore';
import Loader from '@/shared/ui/Loader';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface GuestOnlyRouteProps {
  children: React.ReactNode;
}

const GuestOnlyRoute: React.FC<GuestOnlyRouteProps> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const { role } = useUserRole();
  const location = useLocation();

  // Show a loader while authentication state is being initialized
  if (authLoading) {
    return <Loader />;
  }

  // If the user is authenticated, redirect them away from the guest-only route (like Login/Signup)
  if (isAuthenticated && !authLoading) {
    // If they have a returnUrl in the query params, honor it (but prevent redirect loops)
    const params = new URLSearchParams(location.search);
    const returnUrl = params.get('returnUrl') || params.get('redirect');

    if (returnUrl && !returnUrl.includes('/login') && !returnUrl.includes('/signup')) {
      return <Navigate to={returnUrl} replace />;
    }

    // Use the canonical role-based routing from roleBasedRouter.ts
    const dashboardRoute = getRouteForRole(role || '');
    return <Navigate to={dashboardRoute} replace />;
  }

  // User is not authenticated, render the children (e.g. Login form)
  return <>{children}</>;
};

export default GuestOnlyRoute;
