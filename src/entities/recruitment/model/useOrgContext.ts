/**
 * Organization Context Hook
 * React Query hook for fetching and managing organization context
 * Uses Supabase RPC to query SSO-Worker database via FDW
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/model/authStore';
import { recruitmentQueryKeys } from '@/shared/lib/queryKeys/recruitment';
import { getOrgContext, getUserOrgContexts } from '../api/orgContextService';
import { ROLE_PERMISSIONS } from './types';
import type { RecruitmentPermission } from './types';

/**
 * Hook to get current user's organization context
 * Returns the first active organization with recruitment access
 * For multi-org support, use useUserOrgContexts() instead
 */
export const useOrgContext = () => {
    const { user, isAuthenticated } = useAuthStore();

    const query = useQuery({
        queryKey: recruitmentQueryKeys.orgContext(user?.id || 'current'),
        queryFn: getOrgContext,
        enabled: isAuthenticated && !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
    });

    const orgContext = query.data || null;

    return {
        orgContext,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,

        // Convenience computed values
        isAdmin: orgContext?.isAdmin || false,
        isRecruiter: orgContext?.isRecruiter || false,
        hasOrgAccess: orgContext?.hasRecruitmentAccess || false,
        organizationId: orgContext?.orgId,
        organizationName: orgContext?.orgName,
        organizationSlug: orgContext?.orgSlug,
        recruitmentRole: orgContext?.recruitmentRole,
        membershipStatus: orgContext?.membershipStatus,
    };
};

/**
 * Hook to get all organization contexts for current user
 * Use this when user can belong to multiple organizations
 */
export const useUserOrgContexts = () => {
    const { user, isAuthenticated } = useAuthStore();

    const query = useQuery({
        queryKey: recruitmentQueryKeys.orgContext(user?.id || 'all'),
        queryFn: getUserOrgContexts,
        enabled: isAuthenticated && !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
    });

    const data = query.data || { contexts: [] };

    return {
        contexts: data.contexts,
        selectedOrgId: data.selectedOrgId,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,

        // Convenience computed values
        hasMultipleOrgs: data.contexts.length > 1,
        hasAnyOrg: data.contexts.length > 0,
        activeContexts: data.contexts.filter((ctx) => ctx.isActive),
        recruitmentEnabledContexts: data.contexts.filter((ctx) => ctx.hasRecruitmentAccess),
    };
};

/**
 * Hook to get organization context by organization ID
 */
export const useOrgContextById = (orgId: string) => {
    const { contexts, isLoading, isError, error } = useUserOrgContexts();

    const orgContext = contexts.find((ctx) => ctx.orgId === orgId) || null;

    return {
        orgContext,
        isLoading,
        isError,
        error,

        // Convenience computed values
        isAdmin: orgContext?.isAdmin || false,
        isRecruiter: orgContext?.isRecruiter || false,
        hasOrgAccess: orgContext?.hasRecruitmentAccess || false,
        organizationName: orgContext?.orgName,
        organizationSlug: orgContext?.orgSlug,
        recruitmentRole: orgContext?.recruitmentRole,
        membershipStatus: orgContext?.membershipStatus,
    };
};

/**
 * Hook to check if user has specific permission in current organization
 * Uses client-side permission checking based on role
 */
export const useHasPermission = (permission: RecruitmentPermission) => {
    const { orgContext } = useOrgContext();

    if (!orgContext || !orgContext.recruitmentRole) {
        return false;
    }

    const permissions = ROLE_PERMISSIONS[orgContext.recruitmentRole] || [];

    return permissions.includes(permission);
};
