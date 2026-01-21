import { Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { OrganizationType, useOrganizationCheck } from '../../hooks/useOrganizationCheck';
import OrganizationSetup from '../../pages/organization/OrganizationSetup';

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
 * 2. If no organization exists, show the OrganizationSetup form
 * 3. Once organization is created, show the dashboard (children)
 *
 * This provides an industrial-grade onboarding experience for new admins.
 */
const OrganizationGuard: React.FC<OrganizationGuardProps> = ({ organizationType, children }) => {
  const { loading, hasOrganization, refetch, error } = useOrganizationCheck(organizationType);
  const [setupComplete, setSetupComplete] = useState(false);

  // Debug logging for redirect loop investigation
  useEffect(() => {
    console.log('[OrganizationGuard] State:', {
      organizationType,
      loading,
      hasOrganization,
      setupComplete,
      error,
    });
  }, [organizationType, loading, hasOrganization, setupComplete, error]);

  const handleSetupComplete = useCallback(async () => {
    // Refetch organization data after setup
    await refetch();
    setSetupComplete(true);
  }, [refetch]);

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

  // If no organization exists and setup is not complete, show the setup form
  if (!hasOrganization && !setupComplete) {
    return (
      <OrganizationSetup organizationType={organizationType} onComplete={handleSetupComplete} />
    );
  }

  // Organization exists or setup just completed - render the dashboard
  return <>{children}</>;
};

export default OrganizationGuard;
