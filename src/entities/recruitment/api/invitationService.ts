/**
 * Recruitment Invitation Service
 * Handles member invitation creation, verification, and acceptance
 */

import { apiGet, apiPost, apiPut } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import type {
    RecruitmentInvitation,
    CreateInvitationRequest,
    CreateInvitationResponse,
    VerifyInvitationResponse,
    AcceptInvitationRequest,
} from '../model/types';

const logger = getLogger('invitationService');

/**
 * Create a new member invitation
 * Sends invitation email automatically
 */
export const createInvitation = async (
    request: CreateInvitationRequest
): Promise<CreateInvitationResponse> => {
    try {
        logger.info('Creating invitation', { email: request.email, role: request.role });

        const response = await apiPost<{ data: CreateInvitationResponse }>(
            '/recruitment/invitations',
            request
        );

        logger.info('Invitation created successfully', {
            invitationId: response.data.invitation.id,
            email: request.email,
        });

        return response.data;
    } catch (error: any) {
        logger.error('Failed to create invitation', {
            error: error.message,
            email: request.email,
        });
        throw error;
    }
};

/**
 * Get all invitations for current organization
 */
export const getInvitations = async (): Promise<RecruitmentInvitation[]> => {
    try {
        const response = await apiGet<{ data: RecruitmentInvitation[] }>(
            '/recruitment/invitations'
        );

        logger.info('Fetched invitations', { count: response.data.length });

        return response.data;
    } catch (error: any) {
        logger.error('Failed to fetch invitations', { error: error.message });
        throw error;
    }
};

/**
 * Get invitation by ID
 */
export const getInvitationById = async (
    invitationId: string
): Promise<RecruitmentInvitation> => {
    try {
        const response = await apiGet<{ data: RecruitmentInvitation }>(
            `/recruitment/invitations/${invitationId}`
        );

        return response.data;
    } catch (error: any) {
        logger.error('Failed to fetch invitation', {
            error: error.message,
            invitationId,
        });
        throw error;
    }
};

/**
 * Verify invitation token
 * Checks if token is valid and not expired
 */
export const verifyInvitation = async (
    token: string
): Promise<VerifyInvitationResponse> => {
    try {
        logger.info('Verifying invitation token');

        const response = await apiGet<{ data: VerifyInvitationResponse }>(
            `/recruitment/invitations/verify/${token}`
        );

        logger.info('Invitation verified', { valid: response.data.valid });

        return response.data;
    } catch (error: any) {
        logger.error('Failed to verify invitation', { error: error.message });
        throw error;
    }
};

/**
 * Accept invitation
 * Creates SSO-Worker membership and links user to organization
 */
export const acceptInvitation = async (
    request: AcceptInvitationRequest
): Promise<{ success: boolean; message: string; organizationName?: string; organizationId?: string; role?: string }> => {
    try {
        logger.info('Accepting invitation', { userId: request.userId });

        const response = await apiPost<{
            success: boolean;
            message: string;
            organizationName?: string;
            organizationId?: string;
            role?: string;
        }>(
            '/recruitment/invitations/accept',
            request
        );

        logger.info('Invitation accepted successfully', {
            userId: request.userId,
            organizationId: response.organizationId,
        });

        return response;
    } catch (error: any) {
        logger.error('Failed to accept invitation', {
            error: error.message,
            userId: request.userId,
        });
        throw error;
    }
};

/**
 * Cancel invitation
 * Marks invitation as cancelled
 */
export const cancelInvitation = async (
    invitationId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        logger.info('Cancelling invitation', { invitationId });

        const response = await apiPut<{ data: { success: boolean; message: string } }>(
            `/recruitment/invitations/${invitationId}/cancel`,
            {}
        );

        logger.info('Invitation cancelled successfully', { invitationId });

        return response.data;
    } catch (error: any) {
        logger.error('Failed to cancel invitation', {
            error: error.message,
            invitationId,
        });
        throw error;
    }
};

/**
 * Resend invitation email
 */
export const resendInvitation = async (
    invitationId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        logger.info('Resending invitation', { invitationId });

        const response = await apiPost<{ data: { success: boolean; message: string } }>(
            `/recruitment/invitations/${invitationId}/resend`,
            {}
        );

        logger.info('Invitation resent successfully', { invitationId });

        return response.data;
    } catch (error: any) {
        logger.error('Failed to resend invitation', {
            error: error.message,
            invitationId,
        });
        throw error;
    }
};
