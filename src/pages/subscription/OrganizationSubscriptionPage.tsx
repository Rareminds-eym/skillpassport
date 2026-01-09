/**
 * OrganizationSubscriptionPage
 * 
 * Wrapper page component that provides data and handlers to OrganizationSubscriptionDashboard.
 * Fetches organization subscription data and connects to services.
 */

import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import OrganizationSubscriptionDashboard from '../../components/Subscription/Organization/OrganizationSubscriptionDashboard';
import { useOrganizationSubscription } from '../../hooks/Subscription/useOrganizationSubscription';
import useAuth from '../../hooks/useAuth';

function OrganizationSubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Determine organization type and ID from user context
  const organizationType = useMemo(() => {
    const role = user?.role || '';
    if (role.includes('school')) return 'school' as const;
    if (role.includes('college')) return 'college' as const;
    if (role.includes('university')) return 'university' as const;
    return 'school' as const;
  }, [user?.role]);
  
  const organizationId = user?.school_id || user?.college_id || user?.university_id || '';
  const organizationName = user?.school_name || user?.college_name || user?.university_name || 'Your Organization';
  
  // Fetch subscription data
  const {
    subscriptions,
    licensePools,
    isLoading,
    error,
    refresh,
  } = useOrganizationSubscription({
    organizationId,
    organizationType,
    autoFetch: true,
  });
  
  // Transform data for dashboard component
  const dashboardSubscriptions = useMemo(() => {
    return subscriptions.map(sub => ({
      id: sub.id,
      planName: sub.planName || 'Standard Plan',
      totalSeats: sub.totalSeats || 0,
      assignedSeats: sub.assignedSeats || 0,
      status: sub.status as 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period',
      startDate: sub.startDate || new Date().toISOString(),
      endDate: sub.endDate || new Date().toISOString(),
      autoRenew: sub.autoRenew ?? true,
      targetMemberType: (sub.targetMemberType || 'both') as 'educator' | 'student' | 'both',
    }));
  }, [subscriptions]);
  
  const dashboardPools = useMemo(() => {
    return licensePools.map(pool => ({
      id: pool.id,
      poolName: pool.poolName || 'Default Pool',
      memberType: pool.memberType as 'educator' | 'student',
      allocatedSeats: pool.allocatedSeats || 0,
      assignedSeats: pool.assignedSeats || 0,
      availableSeats: pool.availableSeats || 0,
      autoAssignNewMembers: pool.autoAssignNewMembers ?? false,
      isActive: pool.isActive ?? true,
      createdAt: pool.createdAt || new Date().toISOString(),
    }));
  }, [licensePools]);
  
  // Mock members data - in production, fetch from member service
  const members = useMemo(() => [], []);
  
  // Handlers
  const handleAddSeats = useCallback((subscriptionId: string) => {
    navigate(`subscription/bulk-purchase?subscriptionId=${subscriptionId}&mode=add-seats`);
  }, [navigate]);
  
  const handleManageSubscription = useCallback((subscriptionId: string) => {
    toast.success('Opening subscription management...');
    // Navigate to subscription details or open modal
  }, []);
  
  const handleRenewSubscription = useCallback((subscriptionId: string) => {
    toast.success('Initiating renewal process...');
    // Navigate to renewal flow
  }, []);
  
  const handleViewSubscriptionDetails = useCallback((subscriptionId: string) => {
    toast.success('Loading subscription details...');
  }, []);
  
  const handleCreatePool = useCallback(() => {
    toast.success('Opening pool creation wizard...');
  }, []);
  
  const handleEditPool = useCallback((poolId: string) => {
    toast.success('Opening pool editor...');
  }, []);
  
  const handleDeletePool = useCallback((poolId: string) => {
    toast.success('Pool deletion requested...');
  }, []);
  
  const handleConfigureAutoAssign = useCallback((poolId: string) => {
    toast.success('Opening auto-assign configuration...');
  }, []);
  
  const handleViewPoolAssignments = useCallback((poolId: string) => {
    toast.success('Loading pool assignments...');
  }, []);
  
  const handleAssignLicenses = useCallback((memberIds: string[]) => {
    toast.success(`Assigning licenses to ${memberIds.length} members...`);
  }, []);
  
  const handleUnassignLicenses = useCallback((memberIds: string[]) => {
    toast.success(`Unassigning licenses from ${memberIds.length} members...`);
  }, []);
  
  const handleTransferLicense = useCallback((fromMemberId: string, toMemberId: string) => {
    toast.success('Transferring license...');
  }, []);
  
  const handleViewMemberHistory = useCallback((memberId: string) => {
    toast.success('Loading member history...');
  }, []);
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Subscriptions</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <OrganizationSubscriptionDashboard
        organizationName={organizationName}
        organizationType={organizationType}
        subscriptions={dashboardSubscriptions}
        licensePools={dashboardPools}
        members={members}
        isLoading={isLoading}
        onAddSeats={handleAddSeats}
        onManageSubscription={handleManageSubscription}
        onRenewSubscription={handleRenewSubscription}
        onViewSubscriptionDetails={handleViewSubscriptionDetails}
        onCreatePool={handleCreatePool}
        onEditPool={handleEditPool}
        onDeletePool={handleDeletePool}
        onConfigureAutoAssign={handleConfigureAutoAssign}
        onViewPoolAssignments={handleViewPoolAssignments}
        onAssignLicenses={handleAssignLicenses}
        onUnassignLicenses={handleUnassignLicenses}
        onTransferLicense={handleTransferLicense}
        onViewMemberHistory={handleViewMemberHistory}
      />
    </div>
  );
}

export default OrganizationSubscriptionPage;
