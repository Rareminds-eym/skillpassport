/**
 * Recruitment Members Hook
 * React Query hooks for member management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruitmentQueryKeys } from '@/shared/lib/queryKeys/recruitment';
import {
    getMembers,
    getMemberById,
    updateMemberRole,
    updateMemberStatus,
    removeMember,
    getMemberStats,
} from '../api/memberService';
import type {
    FetchMembersOptions,
    UpdateMemberRoleRequest,
    UpdateMemberStatusRequest,
} from './types';
import { useOrgContext } from './useOrgContext';

/**
 * Hook to fetch organization members
 */
export const useRecruitmentMembers = (options?: Partial<FetchMembersOptions>) => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: recruitmentQueryKeys.members.list(organizationId || '', options),
        queryFn: () => getMembers(options),
        enabled: !!organizationId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to fetch a single member by ID
 */
export const useRecruitmentMember = (userId: string) => {
    return useQuery({
        queryKey: recruitmentQueryKeys.members.detail(userId),
        queryFn: () => getMemberById(userId),
        enabled: !!userId,
        staleTime: 2 * 60 * 1000,
    });
};

/**
 * Hook to fetch member statistics
 */
export const useMemberStats = () => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: ['recruitment', 'members', 'stats', organizationId],
        queryFn: getMemberStats,
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Mutation hook to update member role
 */
export const useUpdateMemberRole = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (request: UpdateMemberRoleRequest) => updateMemberRole(request),
        onSuccess: () => {
            // Invalidate members list
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.members.list(organizationId || ''),
            });
            // Invalidate stats
            queryClient.invalidateQueries({
                queryKey: ['recruitment', 'members', 'stats', organizationId],
            });
        },
    });
};

/**
 * Mutation hook to update member status
 */
export const useUpdateMemberStatus = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (request: UpdateMemberStatusRequest) => updateMemberStatus(request),
        onSuccess: () => {
            // Invalidate members list
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.members.list(organizationId || ''),
            });
            // Invalidate stats
            queryClient.invalidateQueries({
                queryKey: ['recruitment', 'members', 'stats', organizationId],
            });
        },
    });
};

/**
 * Mutation hook to remove member
 */
export const useRemoveMember = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (userId: string) => removeMember(userId),
        onSuccess: () => {
            // Invalidate members list
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.members.list(organizationId || ''),
            });
            // Invalidate stats
            queryClient.invalidateQueries({
                queryKey: ['recruitment', 'members', 'stats', organizationId],
            });
        },
    });
};
