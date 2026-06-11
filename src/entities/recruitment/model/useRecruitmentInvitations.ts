/**
 * Recruitment Invitations Hook
 * React Query hooks for invitation management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruitmentQueryKeys } from '@/shared/lib/queryKeys/recruitment';
import {
    createInvitation,
    getInvitations,
    getInvitationById,
    verifyInvitation,
    acceptInvitation,
    cancelInvitation,
    resendInvitation,
} from '../api/invitationService';
import type {
    CreateInvitationRequest,
    AcceptInvitationRequest,
} from './types';
import { useOrgContext } from './useOrgContext';

/**
 * Hook to fetch all invitations for current organization
 */
export const useRecruitmentInvitations = () => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: recruitmentQueryKeys.invitations.list(organizationId || ''),
        queryFn: getInvitations,
        enabled: !!organizationId,
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

/**
 * Hook to fetch a single invitation by ID
 */
export const useRecruitmentInvitation = (invitationId: string) => {
    return useQuery({
        queryKey: recruitmentQueryKeys.invitations.detail(invitationId),
        queryFn: () => getInvitationById(invitationId),
        enabled: !!invitationId,
        staleTime: 1 * 60 * 1000,
    });
};

/**
 * Hook to verify invitation token
 */
export const useVerifyInvitation = (token: string) => {
    return useQuery({
        queryKey: recruitmentQueryKeys.invitations.verify(token),
        queryFn: () => verifyInvitation(token),
        enabled: !!token,
        staleTime: 0, // Always fresh
        retry: false, // Don't retry on error
    });
};

/**
 * Mutation hook to create invitation
 */
export const useCreateInvitation = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (request: CreateInvitationRequest) => createInvitation(request),
        onSuccess: () => {
            // Invalidate invitations list
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.invitations.list(organizationId || ''),
            });
        },
    });
};

/**
 * Mutation hook to accept invitation
 */
export const useAcceptInvitation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: AcceptInvitationRequest) => acceptInvitation(request),
        onSuccess: () => {
            // Invalidate org context to refresh user's organization
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.orgContext(''),
            });
        },
    });
};

/**
 * Mutation hook to cancel invitation
 */
export const useCancelInvitation = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (invitationId: string) => cancelInvitation(invitationId),
        onSuccess: () => {
            // Invalidate invitations list
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.invitations.list(organizationId || ''),
            });
        },
    });
};

/**
 * Mutation hook to resend invitation
 */
export const useResendInvitation = () => {
    return useMutation({
        mutationFn: (invitationId: string) => resendInvitation(invitationId),
    });
};
