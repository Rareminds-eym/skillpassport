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
 * 
 * Enhanced with retry logic to handle queue sync delays for new signups:
 * - Retries up to 10 times for new users (within 5 minutes of account creation)
 * - Uses exponential backoff: 1s, 2s, 3s, 4s, 5s, 6s, 7s, 8s, 9s, 10s
 * - Total wait time: up to 55 seconds for queue sync
 */
export const useOrgContext = () => {
    const { user, isAuthenticated } = useAuthStore();

    // Check if user is "new" (account created within last 5 minutes)
    // New users may experience queue sync delay, so we retry more aggressively
    const isNewUser = user?.id && (() => {
        try {
            // Check if we have a signup timestamp in sessionStorage
            const signupTime = sessionStorage.getItem('signup_timestamp');
            if (signupTime) {
                const elapsed = Date.now() - parseInt(signupTime, 10);
                return elapsed < 5 * 60 * 1000; // 5 minutes
            }
            return false;
        } catch {
            return false;
        }
    })();

    const query = useQuery({
        queryKey: recruitmentQueryKeys.orgContext(user?.id || 'current'),
        queryFn: getOrgContext,
        enabled: isAuthenticated && !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        // Enhanced retry logic for new users waiting for queue sync
        retry: isNewUser ? 10 : 1,
        retryDelay: (attemptIndex) => {
            // For new users: exponential backoff 1s, 2s, 3s, ..., 10s
            if (isNewUser) {
                return (attemptIndex + 1) * 1000;
            }
            // For existing users: default 1s delay
            return 1000;
        },
    });

    const orgContext = query.data || null;

    return {
        orgContext,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        // Add flag to indicate if we're waiting for queue sync
        isWaitingForSync: isNewUser && query.isLoading && !orgContext,

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
