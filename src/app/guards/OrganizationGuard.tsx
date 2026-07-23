import { Loader2 } from 'lucide-react';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { OrganizationType, useOrganizationCheck } from '@/entities/organization/model/useOrganizationCheck';
import { useUser } from '@/shared/model/authStore';


interface OrganizationGuardProps {
  organizationType: OrganizationType;
  children: React.ReactNode;
}

/**
 * OrganizationGuard - A wrapper component that ensures an admin has created their organization
 * before allowing access to the dashboard.
 * 
 * Flow:
 * 1. Check if user has an organization linked to their account
 * 2. If no organization exists, redirect to the organization setup page
 * 3. Once organization is created, allow access to the dashboard (children)
 * 
 * This provides an industrial-grade onboarding experience for new admins.
 */
const OrganizationGuard: React.FC<OrganizationGuardProps> = ({
  organizationType,
  children
}) => {
  const user = useUser();
  const location = useLocation();
  const { loading, hasOrganization, error } = useOrganizationCheck(organizationType, user);

  // Show loading state while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if organization check failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Unable to Load Dashboard</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to setup if no organization exists
  if (!hasOrganization) {
    return (
      <Navigate
        to={`/organization-setup?type=${organizationType}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // Success - render the dashboard
  return <>{children}</>;
};

export default OrganizationGuard;
