import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { OrganizationType, useOrganizationCheck } from '@/entities/organization/model/useOrganizationCheck';
import { useUser } from '@/stores';

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

  // Debug logging for redirect loop investigation
  useEffect(() => {
    console.log('[OrganizationGuard] State:', {
      organizationType,
      loading,
      hasOrganization,
      error,
    });
  }, [organizationType, loading, hasOrganization, error]);

  // Show loading state while checking organization status
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

  // If no organization exists, redirect to setup page
  if (!hasOrganization) {
    return (
      <Navigate
        to={`/organization-setup?type=${organizationType}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // Organization exists - render the dashboard
  return <>{children}</>;
};

export default OrganizationGuard;
