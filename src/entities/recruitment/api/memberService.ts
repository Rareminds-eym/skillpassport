/**
 * Recruitment Member Service
 * Manages organization members (admins and recruiters)
 */

import { apiGet, apiPut, apiDelete } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import type {
    RecruitmentMember,
    FetchMembersOptions,
    FetchMembersResult,
    UpdateMemberRoleRequest,
    UpdateMemberStatusRequest,
} from '../model/types';

const logger = getLogger('memberService');

/**
 * Fetch all members for current organization
 * @param orgId - Organization ID (required, from orgContext)
 * @param options - Filter and pagination options
 */
export const getMembers = async (
    orgId: string,
    options?: Partial<FetchMembersOptions>
): Promise<FetchMembersResult> => {
    try {
        // Build query params
        const params = new URLSearchParams();

        // CRITICAL: Always include org_id
        if (!orgId) {
            throw new Error('Organization ID is required to fetch members');
        }
        params.append('org_id', orgId);

        if (options?.role && options.role !== 'all') {
            params.append('role', options.role);
        }

        if (options?.isActive !== undefined) {
            params.append('isActive', String(options.isActive));
        }

        if (options?.searchQuery) {
            params.append('search', options.searchQuery);
        }

        if (options?.limit) {
            params.append('limit', String(options.limit));
        }

        if (options?.offset) {
            params.append('offset', String(options.offset));
        }

        const queryString = params.toString();
        const url = `/recruitment/members${queryString ? `?${queryString}` : ''}`;

        logger.info('Fetching members', { orgId, url });

        const response = await apiGet<{ data: FetchMembersResult }>(url);

        logger.info('Fetched members', {
            orgId,
            count: response.data.members.length,
            total: response.data.total,
        });

        return response.data;
    } catch (error: any) {
        logger.error('Failed to fetch members', { error: error.message, orgId });
        throw error;
    }
};

/**
 * Get member by user ID
 */
export const getMemberById = async (userId: string): Promise<RecruitmentMember> => {
    try {
        const response = await apiGet<{ data: RecruitmentMember }>(
            `/recruitment/members/${userId}`
        );

        return response.data;
    } catch (error: any) {
        logger.error('Failed to fetch member', { error: error.message, userId });
        throw error;
    }
};

/**
 * Update member role
 * Requires admin permission
 */
export const updateMemberRole = async (
    request: UpdateMemberRoleRequest
): Promise<{ success: boolean; message: string }> => {
    try {
        logger.info('Updating member role', {
            userId: request.userId,
            newRole: request.newRole,
        });

        const response = await apiPut<{ data: { success: boolean; message: string } }>(
            `/recruitment/members/${request.userId}/role`,
            { role: request.newRole }
        );

        logger.info('Member role updated successfully', {
            userId: request.userId,
            newRole: request.newRole,
        });

        return response.data;
    } catch (error: any) {
        logger.error('Failed to update member role', {
            error: error.message,
            userId: request.userId,
        });
        throw error;
    }
};

/**
 * Update member status (activate/deactivate)
 * Requires admin permission
 */
export const updateMemberStatus = async (
    request: UpdateMemberStatusRequest
): Promise<{ success: boolean; message: string }> => {
    try {
        logger.info('Updating member status', {
            userId: request.userId,
            isActive: request.isActive,
        });

        const response = await apiPut<{ data: { success: boolean; message: string } }>(
            `/recruitment/members/${request.userId}/status`,
            { isActive: request.isActive }
        );

        logger.info('Member status updated successfully', {
            userId: request.userId,
            isActive: request.isActive,
        });

        return response.data;
    } catch (error: any) {
        logger.error('Failed to update member status', {
            error: error.message,
            userId: request.userId,
        });
        throw error;
    }
};

/**
 * Remove member from organization
 * Requires admin permission
 */
export const removeMember = async (
    userId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        logger.info('Removing member', { userId });

        const response = await apiDelete<{ data: { success: boolean; message: string } }>(
            `/recruitment/members/${userId}`
        );

        logger.info('Member removed successfully', { userId });

        return response.data;
    } catch (error: any) {
        logger.error('Failed to remove member', { error: error.message, userId });
        throw error;
    }
};

/**
 * Get member statistics for organization
 */
export const getMemberStats = async (): Promise<{
    total: number;
    admins: number;
    recruiters: number;
    active: number;
    inactive: number;
}> => {
    try {
        const response = await apiGet<{
            data: {
                total: number;
                admins: number;
                recruiters: number;
                active: number;
                inactive: number;
            };
        }>('/recruitment/members/stats');

        return response.data;
    } catch (error: any) {
        logger.error('Failed to fetch member stats', { error: error.message });
        throw error;
    }
};
