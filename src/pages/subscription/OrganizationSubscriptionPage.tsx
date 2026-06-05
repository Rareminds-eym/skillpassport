/**
 * OrganizationSubscriptionPage
 * 
 * Wrapper page component that provides data and handlers to OrganizationSubscriptionDashboard.
 * Fetches organization subscription data and connects to services.
 */

import type { PoolFormData, PoolUpdateData } from '@/features/subscription';
import {
  AssignToPoolModal,
  CreatePoolModal,
  DeletePoolModal,
  EditPoolModal,
  OrganizationSubscriptionDashboard,
  PoolAssignmentsModal
} from '@/features/subscription';
import { useOrganizationSubscription } from '@/features/subscription/model';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { useUser } from '@/shared/model/authStore';

const logger = getLogger('organization-subscription');
interface OrganizationDetails {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  website?: string;
  logoUrl?: string;
  organizationType?: string;
  establishedYear?: number;
  code?: string;
  verificationStatus?: string;
  accountStatus?: string;
}

function OrganizationSubscriptionPage() {
  const navigate = useNavigate();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  // Determine organization type and ID from user context
  const organizationType = useMemo(() => {
    const role = user?.role || '';
    if (role.includes('school')) return 'school' as const;
    if (role.includes('college')) return 'college' as const;
    if (role.includes('university')) return 'university' as const;
    return 'school' as const;
  }, [user?.role]);

  // Get base path for navigation
  const basePath = useMemo(() => {
    if (organizationType === 'school') return '/school-admin';
    if (organizationType === 'college') return '/college-admin';
    if (organizationType === 'university') return '/university-admin';
    return '/college-admin';
  }, [organizationType]);

  // Get organization ID - check user object first, then localStorage, then fetch from database
  const [organizationId, setOrganizationId] = useState<string>('');

  useEffect(() => {
    const fetchOrganizationId = async () => {

      // First check user object for organization IDs
      if (user?.school_id) { setOrganizationId(String(user.school_id)); return; }
      if (user?.college_id) { setOrganizationId(String(user.college_id)); return; }
      if (user?.university_id) { setOrganizationId(String(user.university_id)); return; }
      if (user?.schoolId) { setOrganizationId(String(user.schoolId)); return; }
      if (user?.collegeId) { setOrganizationId(String(user.collegeId)); return; }
      if (user?.universityId) { setOrganizationId(String(user.universityId)); return; }

      // Fallback to localStorage for school admins
      const storedUser = (useAuthStore.getState().user ? JSON.stringify(useAuthStore.getState().user) : localStorage.getItem("user"));
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.schoolId) { setOrganizationId(userData.schoolId); return; }
          if (userData.collegeId) { setOrganizationId(userData.collegeId); return; }
          if (userData.universityId) { setOrganizationId(userData.universityId); return; }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // If still not found, try to fetch from database based on user email/id
      const userId = user?.id;
      let userEmail = user?.email;

      // Fallback to localStorage for email
      if (!userEmail) {
        userEmail = (useAuthStore.getState().user?.email || localStorage.getItem("userEmail")) || undefined;
      }

      if (!userId && !userEmail) {
        return;
      }

      try {
        if (organizationType === 'school' && userId) {
          const result = await apiPost<any>('/subscription/actions', { action: 'get-school-by-user-id', userId });
          if (result.data?.school_id) {
            setOrganizationId(result.data.school_id);
            return;
          }
        }

        if (organizationType === 'school' && userEmail) {
          const result = await apiPost<any>('/subscription/actions', { action: 'get-org-by-email-and-type', email: userEmail, organizationType: 'school' });
          if (result.data?.id) {
            setOrganizationId(result.data.id);
            return;
          }
        }

        if (organizationType === 'college' && userId) {
          const result = await apiPost<any>('/subscription/actions', { action: 'get-college-by-user-id', userId });
          if (result.data?.collegeId) {
            setOrganizationId(result.data.collegeId);
            return;
          }
        }

        if (userId) {
          const result = await apiPost<any>('/subscription/actions', { action: 'get-org-by-admin-id', userId, organizationType });
          if (result.data?.id) {
            setOrganizationId(result.data.id);
            return;
          }
        }

        if (userEmail) {
          const result = await apiPost<any>('/subscription/actions', { action: 'get-org-by-email-and-type', email: userEmail, organizationType });
          if (result.data?.id) {
            setOrganizationId(result.data.id);
            return;
          }
        }
      } catch (err) {
        logger.error('Error fetching organization ID', err as Error);
      }
    };

    fetchOrganizationId();
  }, [user, organizationType]);

  const organizationName = user?.school_name || user?.college_name || user?.university_name || 'Your Organization';

  // State for organization details
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails | null>(null);

  // State for Create Pool Modal
  const [isCreatePoolModalOpen, setIsCreatePoolModalOpen] = useState(false);
  const [isCreatingPool, setIsCreatingPool] = useState(false);

  // State for Edit Pool Modal
  const [isEditPoolModalOpen, setIsEditPoolModalOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<typeof dashboardPools[0] | null>(null);
  const [isEditingPool, setIsEditingPool] = useState(false);

  // State for Delete Pool Modal
  const [isDeletePoolModalOpen, setIsDeletePoolModalOpen] = useState(false);
  const [deletingPool, setDeletingPool] = useState<typeof dashboardPools[0] | null>(null);
  const [isDeletingPool, setIsDeletingPool] = useState(false);

  // State for Pool Assignments Modal
  const [isPoolAssignmentsModalOpen, setIsPoolAssignmentsModalOpen] = useState(false);
  const [viewingPool, setViewingPool] = useState<typeof dashboardPools[0] | null>(null);
  const [poolAssignedMembers, setPoolAssignedMembers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    assignedAt: string;
    licenseAssignmentId?: string;
  }>>([]);
  const [isLoadingPoolAssignments, setIsLoadingPoolAssignments] = useState(false);

  // State for Assign to Pool Modal
  const [isAssignToPoolModalOpen, setIsAssignToPoolModalOpen] = useState(false);
  const [membersToAssign, setMembersToAssign] = useState<Array<{
    id: string;
    name: string;
    email: string;
    memberType: 'educator' | 'learner';
  }>>([]);
  const [isAssigningToPool, setIsAssigningToPool] = useState(false);

  // Fetch organization details from database
  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      if (!organizationId) {
        return;
      }

      try {
        const result = await apiPost<any>('/subscription/actions', { action: 'get-org-details', organizationId });

        if (result.data) {
          const org = result.data;
          setOrganizationDetails({
            id: org.id,
            name: org.name,
            email: org.email,
            phone: org.phone,
            address: org.address,
            city: org.city,
            state: org.state,
            country: org.country,
            pincode: org.pincode,
            website: org.website,
            logoUrl: org.logo_url,
            organizationType: org.organization_type,
            establishedYear: org.established_year,
            code: org.code,
            verificationStatus: org.verification_status,
            accountStatus: org.account_status,
          });
        }
      } catch (err) {
        logger.error('Error fetching organization details', err as Error);
      }
    };

    fetchOrganizationDetails();
  }, [organizationId]);

  // Fetch subscription data
  const {
    subscriptions,
    licensePools,
    members: organizationMembers,
    memberCounts,
    isLoading,
    isMembersLoading,
    error,
    refresh,
    refreshMembers,
  } = useOrganizationSubscription({
    organizationId,
    organizationType,
    autoFetch: true,
  });

  // Transform data for dashboard component
  const dashboardSubscriptions = useMemo(() => {
    return subscriptions.map(sub => ({
      id: sub.id,
      planName: sub.planName ?? 'Standard Plan',
      totalSeats: sub.totalSeats || 0,
      assignedSeats: sub.assignedSeats || 0,
      status: sub.status as 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period',
      startDate: sub.startDate || new Date().toISOString(),
      endDate: sub.endDate || new Date().toISOString(),
      autoRenew: sub.autoRenew ?? true,
      targetMemberType: (sub.targetMemberType || 'both') as 'educator' | 'learner' | 'both',
    }));
  }, [subscriptions]);

  const dashboardPools = useMemo(() => {
    return licensePools.map(pool => ({
      id: pool.id,
      poolName: pool.poolName ?? 'Default Pool',
      memberType: pool.memberType as 'educator' | 'learner',
      allocatedSeats: pool.allocatedSeats || 0,
      assignedSeats: pool.assignedSeats || 0,
      availableSeats: pool.availableSeats || 0,
      autoAssignNewMembers: pool.autoAssignNewMembers ?? false,
      isActive: pool.isActive ?? true,
      createdAt: pool.createdAt || new Date().toISOString(),
    }));
  }, [licensePools]);

  // Transform members data for dashboard component
  const dashboardMembers = useMemo(() => {
    return organizationMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      memberType: member.memberType as 'educator' | 'learner',
      department: member.department || member.designation,
      hasLicense: member.hasLicense,
      assignedAt: member.assignedAt,
      poolName: member.poolName,
    }));
  }, [organizationMembers]);

  // Log member counts for debugging
  useEffect(() => {
    if (memberCounts.total > 0) {
      logger.info('Member counts', memberCounts);
    }
  }, [memberCounts]);

  // Handlers
  const handleAddSeats = useCallback((subscriptionId: string) => {
    navigate(`${basePath}/subscription/bulk-purchase?subscriptionId=${subscriptionId}&mode=add-seats`);
  }, [navigate, basePath]);

  const handleBrowsePlans = useCallback(() => {
    navigate(`${basePath}/subscription/bulk-purchase`);
  }, [navigate, basePath]);

  const handleManageSubscription = useCallback((_subscriptionId: string) => {
    toast.success('Opening subscription management...');
    // Navigate to subscription details or open modal
  }, []);

  const handleRenewSubscription = useCallback((_subscriptionId: string) => {
    toast.success('Initiating renewal process...');
    // Navigate to renewal flow
  }, []);

  const handleViewSubscriptionDetails = useCallback((_subscriptionId: string) => {
    toast.success('Loading subscription details...');
  }, []);

  const handleCreatePool = useCallback(() => {
    // Check if there's an active subscription
    const activeSubscription = subscriptions.find(s => s.status === 'active');
    if (!activeSubscription) {
      toast.error('No active subscription found. Please purchase a subscription first.');
      return;
    }

    // Check if there are available seats
    const totalSeats = subscriptions.reduce((sum, s) => sum + (s.totalSeats || 0), 0);
    const assignedSeats = subscriptions.reduce((sum, s) => sum + (s.assignedSeats || 0), 0);
    const poolAllocatedSeats = licensePools.reduce((sum, p) => sum + (p.allocatedSeats || 0), 0);
    const availableSeats = totalSeats - assignedSeats - poolAllocatedSeats;

    if (availableSeats <= 0) {
      toast.error('No available seats to allocate. Please purchase more seats.');
      return;
    }

    setIsCreatePoolModalOpen(true);
  }, [subscriptions, licensePools]);

  const handleCreatePoolSubmit = useCallback(async (poolData: PoolFormData) => {
    if (!organizationId) {
      throw new Error('Organization ID not found');
    }

    const activeSubscription = subscriptions.find(s => s.status === 'active');
    if (!activeSubscription) {
      throw new Error('No active subscription found');
    }

    setIsCreatingPool(true);

    try {
      await apiPost('/subscription/actions', {
        action: 'create-license-pool',
        organizationId,
        organizationType,
        organizationSubscriptionId: activeSubscription.id,
        poolName: poolData.poolName,
        memberType: poolData.memberType,
        allocatedSeats: poolData.allocatedSeats,
        autoAssignNewMembers: poolData.autoAssignNewMembers,
        createdBy: user?.id,
      });

      toast.success(`Pool "${poolData.poolName}" created successfully!`);
      setIsCreatePoolModalOpen(false);

      // Refresh data
      await refresh();
    } catch (err) {
      logger.error('CreatePool error', err as Error);
      throw err;
    } finally {
      setIsCreatingPool(false);
    }
  }, [organizationId, organizationType, subscriptions, user?.id, refresh]);

  const handleEditPool = useCallback((poolId: string) => {
    const pool = dashboardPools.find(p => p.id === poolId);
    if (pool) {
      setEditingPool(pool);
      setIsEditPoolModalOpen(true);
    }
  }, [dashboardPools]);

  const handleEditPoolSubmit = useCallback(async (poolId: string, updates: PoolUpdateData) => {
    setIsEditingPool(true);

    try {
      await apiPost('/subscription/actions', {
        action: 'update-license-pool',
        poolId,
        poolName: updates.poolName,
        allocatedSeats: updates.allocatedSeats,
        autoAssignNewMembers: updates.autoAssignNewMembers,
        isActive: updates.isActive,
      });

      toast.success('Pool updated successfully!');
      setIsEditPoolModalOpen(false);
      setEditingPool(null);

      await refresh();
    } catch (err) {
      logger.error('EditPool error', err as Error);
      throw err;
    } finally {
      setIsEditingPool(false);
    }
  }, [refresh]);

  const handleDeletePool = useCallback((poolId: string) => {
    const pool = dashboardPools.find(p => p.id === poolId);
    if (pool) {
      setDeletingPool(pool);
      setIsDeletePoolModalOpen(true);
    }
  }, [dashboardPools]);

  const handleDeletePoolConfirm = useCallback(async (poolId: string) => {
    setIsDeletingPool(true);

    try {
      await apiPost('/subscription/actions', { action: 'delete-license-pool', poolId });

      toast.success('Pool deleted successfully!');
      setIsDeletePoolModalOpen(false);
      setDeletingPool(null);

      await refresh();
    } catch (err) {
      logger.error('DeletePool error', err as Error);
      throw err;
    } finally {
      setIsDeletingPool(false);
    }
  }, [refresh]);

  const handleConfigureAutoAssign = useCallback((poolId: string) => {
    // Open edit modal with focus on auto-assign settings
    const pool = dashboardPools.find(p => p.id === poolId);
    if (pool) {
      setEditingPool(pool);
      setIsEditPoolModalOpen(true);
    }
  }, [dashboardPools]);

  const handleViewPoolAssignments = useCallback(async (poolId: string) => {
    const pool = dashboardPools.find(p => p.id === poolId);
    if (!pool) return;

    setViewingPool(pool);
    setIsPoolAssignmentsModalOpen(true);
    setIsLoadingPoolAssignments(true);

    try {
      const result = await apiPost<any>('/subscription/actions', { action: 'list-pool-assignments', poolId });

      const members = (result.data || []).map((a: any) => ({
        id: a.user_id,
        name: a.user ? `${a.user.first_name || ''} ${a.user.last_name || ''}`.trim() || a.user.email : 'Unknown',
        email: a.user?.email || '',
        assignedAt: a.assigned_at,
        licenseAssignmentId: a.id,
      }));

      setPoolAssignedMembers(members);
    } catch (err) {
      logger.error('ViewPoolAssignments error', err as Error);
      toast.error('Failed to load assignments');
    } finally {
      setIsLoadingPoolAssignments(false);
    }
  }, [dashboardPools]);

  const handleUnassignFromPool = useCallback(async (memberId: string, licenseAssignmentId: string) => {
    try {
      await apiPost('/subscription/actions', {
        action: 'revoke-license-assignment',
        licenseAssignmentId,
        revokedBy: user?.id,
        revocationReason: 'Unassigned by admin',
      });

      toast.success('License unassigned successfully');

      // Remove from local state
      setPoolAssignedMembers(prev => prev.filter(m => m.id !== memberId));

      // Refresh data
      await refresh();
      await refreshMembers();
    } catch (err) {
      logger.error('UnassignFromPool error', err as Error);
      toast.error(err instanceof Error ? err.message : 'Failed to unassign license');
    }
  }, [user?.id, refresh, refreshMembers]);

  const handleAssignLicenses = useCallback(async (memberIds: string[]) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Check if there are any pools with available seats
    const availablePools = dashboardPools.filter(p => p.isActive && p.availableSeats > 0);

    if (availablePools.length === 0) {
      toast.error('No license pool with available seats. Please purchase more seats or create a license pool.');
      return;
    }

    // Get the members to assign
    const members = organizationMembers
      .filter(m => memberIds.includes(m.id) && !m.hasLicense)
      .map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        memberType: m.memberType as 'educator' | 'learner',
      }));

    if (members.length === 0) {
      toast.error('No valid members to assign licenses to');
      return;
    }

    // Open the pool selection modal
    setMembersToAssign(members);
    setIsAssignToPoolModalOpen(true);
  }, [user?.id, dashboardPools, organizationMembers]);

  const handleAssignToPoolConfirm = useCallback(async (poolId: string, memberIds: string[]) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsAssigningToPool(true);

    try {
      // Import the service dynamically to avoid circular dependencies
      const { licenseManagementService } = await import('@/entities/organization');

      // Map member IDs to user IDs (the license system uses auth user IDs)
      const membersToAssignData = organizationMembers.filter(m => memberIds.includes(m.id) && !m.hasLicense);
      const userIds = membersToAssignData.map(m => m.userId).filter(Boolean);

      if (userIds.length === 0) {
        throw new Error('No valid members to assign licenses to');
      }

      const result = await licenseManagementService.bulkAssignLicenses(
        poolId,
        userIds,
        user.id
      );

      if (result.successful.length > 0) {
        toast.success(`Successfully assigned licenses to ${result.successful.length} member(s)`);
      }

      if (result.failed.length > 0) {
        toast.error(`Failed to assign ${result.failed.length} license(s): ${result.failed[0].error}`);
      }

      // Close modal and refresh data
      setIsAssignToPoolModalOpen(false);
      setMembersToAssign([]);
      await refreshMembers();
      await refresh();
    } catch (err) {
      logger.error('AssignToPool error', err as Error);
      throw err;
    } finally {
      setIsAssigningToPool(false);
    }
  }, [user?.id, organizationMembers, refreshMembers, refresh]);

  const handleUnassignLicenses = useCallback(async (memberIds: string[]) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      toast.loading(`Unassigning licenses from ${memberIds.length} member(s)...`);

      const { licenseManagementService } = await import('@/entities/organization');

      // Find the license assignments for these members
      const membersToUnassign = organizationMembers.filter(
        m => memberIds.includes(m.id) && m.hasLicense && m.licenseAssignmentId
      );

      let successCount = 0;
      let failCount = 0;

      for (const member of membersToUnassign) {
        try {
          if (member.licenseAssignmentId) {
            await licenseManagementService.unassignLicense(
              member.licenseAssignmentId,
              'Unassigned by admin',
              user.id
            );
            successCount++;
          }
        } catch {
          failCount++;
        }
      }

      toast.dismiss();

      if (successCount > 0) {
        toast.success(`Successfully unassigned ${successCount} license(s)`);
      }

      if (failCount > 0) {
        toast.error(`Failed to unassign ${failCount} license(s)`);
      }

      // Refresh data
      await refreshMembers();
      await refresh();
    } catch (err) {
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : 'Failed to unassign licenses');
    }
  }, [user?.id, organizationMembers, refreshMembers, refresh]);

  const handleTransferLicense = useCallback(async (fromMemberId: string, toMemberId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      toast.loading('Transferring license...');

      const { licenseManagementService } = await import('@/entities/organization');

      // Find the source member to get their user_id and subscription
      const fromMember = organizationMembers.find(m => m.id === fromMemberId);
      const toMember = organizationMembers.find(m => m.id === toMemberId);

      if (!fromMember || !toMember) {
        toast.dismiss();
        toast.error('Member not found');
        return;
      }

      // Get the organization subscription ID from the first active subscription
      const activeSubscription = subscriptions.find(s => s.status === 'active');

      if (!activeSubscription) {
        toast.dismiss();
        toast.error('No active subscription found');
        return;
      }

      await licenseManagementService.transferLicense(
        fromMember.userId,
        toMember.userId,
        user.id,
        activeSubscription.id
      );

      toast.dismiss();
      toast.success('License transferred successfully');

      // Refresh data
      await refreshMembers();
      await refresh();
    } catch (err) {
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : 'Failed to transfer license');
    }
  }, [user?.id, organizationMembers, subscriptions, refreshMembers, refresh]);

  const handleViewMemberHistory = useCallback(async (memberId: string) => {
    const member = organizationMembers.find(m => m.id === memberId);
    if (member) {
      toast.success(`Viewing history for ${member.name}`);
      // TODO: Open a modal or navigate to member history page
    }
  }, [organizationMembers]);

  const handleRemoveMember = useCallback(async (memberId: string, memberType: 'educator' | 'learner') => {
    if (!organizationId) {
      toast.error('Organization ID not found');
      return;
    }

    try {
      const { organizationMemberService } = await import('@/entities/organization');

      const result = await organizationMemberService.removeMember(
        memberId,
        memberType,
        organizationType,
        organizationId
      );

      if (result.success) {
        toast.success(result.message);
        // Refresh members list
        await refreshMembers();
        await refresh();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      logger.error('Error removing member', err as Error);
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }, [organizationId, organizationType, refreshMembers, refresh]);

  // Check if user is authenticated and is an admin
  if (!isAuthenticated || !user) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Authentication Required</h3>
          <p className="text-amber-600 mb-4">Please log in to access organization subscription management.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Show warning if organization ID not found
  if (!organizationId && !isLoading) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Organization Not Found</h3>
          <p className="text-amber-600 mb-4">
            Could not find your organization. Please ensure you are logged in as an organization admin.
          </p>
          <p className="text-sm text-amber-500 mb-4">
            Debug info: User role: {user?.role}, User ID: {user?.id}
          </p>
          <button
            onClick={() => navigate(`${basePath}/settings`)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

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

  // Calculate available seats for pool creation
  const totalSeats = subscriptions.reduce((sum, s) => sum + (s.totalSeats || 0), 0);
  const assignedSeats = subscriptions.reduce((sum, s) => sum + (s.assignedSeats || 0), 0);
  const poolAllocatedSeats = licensePools.reduce((sum, p) => sum + (p.allocatedSeats || 0), 0);
  const availableSeatsForPool = Math.max(0, totalSeats - assignedSeats - poolAllocatedSeats);

  // Get active subscription for pool creation
  const activeSubscription = subscriptions.find(s => s.status === 'active');

  return (
    <div className="p-6">
      <OrganizationSubscriptionDashboard
        organizationId={organizationId}
        organizationName={organizationName}
        organizationType={organizationType}
        organizationDetails={organizationDetails || undefined}
        subscriptions={dashboardSubscriptions}
        licensePools={dashboardPools}
        members={dashboardMembers}
        isLoading={isLoading || isMembersLoading}
        onAddSeats={handleAddSeats}
        onBrowsePlans={handleBrowsePlans}
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
        onRemoveMember={handleRemoveMember}
        onMemberAdded={refreshMembers}
      />

      {/* Create Pool Modal */}
      <CreatePoolModal
        isOpen={isCreatePoolModalOpen}
        onClose={() => setIsCreatePoolModalOpen(false)}
        onSubmit={handleCreatePoolSubmit}
        totalAvailableSeats={availableSeatsForPool}
        organizationId={organizationId}
        subscriptionId={activeSubscription?.id || ''}
        isLoading={isCreatingPool}
      />

      {/* Edit Pool Modal */}
      <EditPoolModal
        isOpen={isEditPoolModalOpen}
        onClose={() => {
          setIsEditPoolModalOpen(false);
          setEditingPool(null);
        }}
        onSubmit={handleEditPoolSubmit}
        pool={editingPool}
        maxAdditionalSeats={availableSeatsForPool}
        isLoading={isEditingPool}
      />

      {/* Delete Pool Modal */}
      <DeletePoolModal
        isOpen={isDeletePoolModalOpen}
        onClose={() => {
          setIsDeletePoolModalOpen(false);
          setDeletingPool(null);
        }}
        onConfirm={handleDeletePoolConfirm}
        pool={deletingPool}
        isLoading={isDeletingPool}
      />

      {/* Pool Assignments Modal */}
      <PoolAssignmentsModal
        isOpen={isPoolAssignmentsModalOpen}
        onClose={() => {
          setIsPoolAssignmentsModalOpen(false);
          setViewingPool(null);
          setPoolAssignedMembers([]);
        }}
        onUnassign={handleUnassignFromPool}
        pool={viewingPool}
        assignedMembers={poolAssignedMembers}
        isLoading={isLoadingPoolAssignments}
      />

      {/* Assign to Pool Modal */}
      <AssignToPoolModal
        isOpen={isAssignToPoolModalOpen}
        onClose={() => {
          setIsAssignToPoolModalOpen(false);
          setMembersToAssign([]);
        }}
        onConfirm={handleAssignToPoolConfirm}
        pools={dashboardPools}
        membersToAssign={membersToAssign}
        isLoading={isAssigningToPool}
      />
    </div>
  );
}

export default OrganizationSubscriptionPage;
