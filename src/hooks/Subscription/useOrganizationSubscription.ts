/**
 * useOrganizationSubscription Hook
 *
 * Provides organization subscription management functionality.
 * Connects the organization subscription services to React components.
 */

import {
  licenseManagementService,
  type LicensePool,
} from '@/services/organization/licenseManagementService';
import {
  memberInvitationService,
  type OrganizationInvitation,
} from '@/services/organization/memberInvitationService';
import {
  organizationBillingService,
  type BillingDashboard,
} from '@/services/organization/organizationBillingService';
import {
  organizationMemberService,
  type OrganizationMember,
} from '@/services/organization/organizationMemberService';
import {
  calculateBulkPricing,
  organizationSubscriptionService,
  type OrganizationSubscription,
  type PricingBreakdown,
} from '@/services/organization/organizationSubscriptionService';
import { useCallback, useEffect, useState } from 'react';
// @ts-ignore - useAuth is a JS file
import useAuth from '@/hooks/useAuth';

interface UseOrganizationSubscriptionOptions {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  autoFetch?: boolean;
}

interface UseOrganizationSubscriptionReturn {
  subscriptions: OrganizationSubscription[];
  licensePools: LicensePool[];
  members: OrganizationMember[];
  memberCounts: { students: number; educators: number; total: number };
  billingData: BillingDashboard | null;
  pendingInvitations: OrganizationInvitation[];
  isLoading: boolean;
  isMembersLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  fetchMembers: (
    memberType?: 'educator' | 'student' | 'all',
    searchQuery?: string
  ) => Promise<void>;
  calculatePricing: (basePricePerSeat: number, seatCount: number) => PricingBreakdown;
  refresh: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

export function useOrganizationSubscription(
  options: UseOrganizationSubscriptionOptions
): UseOrganizationSubscriptionReturn {
  const { organizationId, organizationType, autoFetch = true } = options;
  // Note: useAuth available for future use when implementing purchase/assign actions
  useAuth();

  const [subscriptions, setSubscriptions] = useState<OrganizationSubscription[]>([]);
  const [licensePools, setLicensePools] = useState<LicensePool[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [memberCounts, setMemberCounts] = useState<{
    students: number;
    educators: number;
    total: number;
  }>({
    students: 0,
    educators: 0,
    total: 0,
  });
  const [billingData, setBillingData] = useState<BillingDashboard | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<OrganizationInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await organizationSubscriptionService.getOrganizationSubscriptions(
        organizationId,
        organizationType
      );
      setSubscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, organizationType]);

  const fetchLicensePools = useCallback(async () => {
    if (!organizationId) return;
    try {
      const data = await licenseManagementService.getLicensePools(organizationId);
      setLicensePools(data);
    } catch (err) {
      console.error('Failed to fetch license pools:', err);
    }
  }, [organizationId]);

  const fetchMembers = useCallback(
    async (memberType: 'educator' | 'student' | 'all' = 'all', searchQuery?: string) => {
      if (!organizationId) return;
      setIsMembersLoading(true);
      try {
        const result = await organizationMemberService.fetchOrganizationMembers({
          organizationId,
          organizationType,
          memberType,
          includeAssignmentStatus: true,
          searchQuery,
          limit: 500, // Fetch up to 500 members
        });
        setMembers(result.members);

        // Also fetch member counts
        const counts = await organizationMemberService.getMemberCounts(
          organizationId,
          organizationType
        );
        setMemberCounts(counts);
      } catch (err) {
        console.error('Failed to fetch members:', err);
      } finally {
        setIsMembersLoading(false);
      }
    },
    [organizationId, organizationType]
  );

  const fetchBillingData = useCallback(async () => {
    if (!organizationId) return;
    try {
      const data = await organizationBillingService.getBillingDashboard(
        organizationId,
        organizationType
      );
      setBillingData(data);
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
    }
  }, [organizationId, organizationType]);

  const fetchInvitations = useCallback(async () => {
    if (!organizationId) return;
    try {
      const data = await memberInvitationService.getPendingInvitations(organizationId);
      setPendingInvitations(data);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    }
  }, [organizationId]);

  const calculatePricingFn = useCallback(
    (basePricePerSeat: number, seatCount: number): PricingBreakdown => {
      return calculateBulkPricing(basePricePerSeat, seatCount);
    },
    []
  );

  const refreshMembers = useCallback(async () => {
    await fetchMembers();
  }, [fetchMembers]);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchSubscriptions(),
      fetchLicensePools(),
      fetchMembers(),
      fetchBillingData(),
      fetchInvitations(),
    ]);
  }, [fetchSubscriptions, fetchLicensePools, fetchMembers, fetchBillingData, fetchInvitations]);

  useEffect(() => {
    if (autoFetch && organizationId) {
      refresh();
    }
  }, [autoFetch, organizationId, refresh]);

  return {
    subscriptions,
    licensePools,
    members,
    memberCounts,
    billingData,
    pendingInvitations,
    isLoading,
    isMembersLoading,
    error,
    fetchSubscriptions,
    fetchMembers,
    calculatePricing: calculatePricingFn,
    refresh,
    refreshMembers,
  };
}

export default useOrganizationSubscription;

// Re-export types for convenience
export type { OrganizationMember } from '@/services/organization/organizationMemberService';
