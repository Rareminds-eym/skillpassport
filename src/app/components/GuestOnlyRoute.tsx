import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useAuthLoading, useUserRole } from '@/shared/model/authStore';
import Loader from '@/shared/ui/Loader';

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

    // Default routing based on role
    switch (role) {
      case 'learner':
        return <Navigate to="/learner/dashboard" replace />;
      case 'educator':
      case 'school_educator':
      case 'college_educator':
        return <Navigate to="/educator/dashboard" replace />;
      case 'admin':
      case 'company_admin':
      case 'school_admin':
      case 'college_admin':
      case 'university_admin':
      case 'owner':
        // University admin goes to university dashboard, school to school, etc.
        if (role === 'university_admin') return <Navigate to="/university/dashboard" replace />;
        if (role === 'school_admin') return <Navigate to="/school/dashboard" replace />;
        if (role === 'college_admin') return <Navigate to="/college/dashboard" replace />;
        return <Navigate to="/admin/dashboard" replace />;
      case 'recruiter':
      case 'hr':
        return <Navigate to="/recruiter/dashboard" replace />;
      default:
        // Fallback for unknown or missing roles
        return <Navigate to="/" replace />;
    }
  }

  // User is not authenticated, render the children (e.g. Login form)
  return <>{children}</>;
};

export default GuestOnlyRoute;
