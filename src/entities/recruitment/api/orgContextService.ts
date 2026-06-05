/**
 * Organization Context Service
 * Fetches and manages organization context for recruitment features
 * Uses API endpoints to query SSO-Worker database
 */

import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import type { OrgContext, UserOrgContexts } from '../model/types';

const logger = getLogger('orgContext');

/**
 * Database row type from get_user_org_context RPC function
 */
interface OrgContextRow {
    org_id: string;
    org_name: string;
    org_slug: string;
    membership_status: 'active' | 'inactive' | 'suspended' | 'expired';
    sso_role_name: 'owner' | 'admin' | 'member';
    recruitment_role: 'company_admin' | 'recruiter' | 'viewer' | null;
    recruitment_enabled: boolean;
}

/**
 * Transform database row to OrgContext
 */
const transformToOrgContext = (
    row: OrgContextRow,
    userId: string,
    userEmail: string,
    userName?: string
): OrgContext => {
    console.log('[orgContextService] Transforming row to OrgContext', {
        row,
        userId,
        userEmail,
        userName
    });

    const isActive = row.membership_status === 'active';
    const isAdmin = row.recruitment_role === 'company_admin';
    const isRecruiter = row.recruitment_role === 'recruiter';
    const hasRecruitmentAccess = row.recruitment_enabled && row.recruitment_role !== null;

    const context = {
        orgId: row.org_id,
        orgName: row.org_name,
        orgSlug: row.org_slug,
        membershipStatus: row.membership_status,
        ssoRoleName: row.sso_role_name,
        recruitmentRole: row.recruitment_role,
        recruitmentEnabled: row.recruitment_enabled,
        userId,
        userEmail,
        userName,
        isActive,
        isAdmin,
        isRecruiter,
        hasRecruitmentAccess,
    };

    console.log('[orgContextService] Transformed context', context);

    return context;
};

/**
 * Get all organization contexts for current user
 * User may belong to multiple organizations
 */
export const getUserOrgContexts = async (): Promise<UserOrgContexts> => {
    try {
        console.log('[orgContextService] Getting user org contexts...');

        // Get current user from auth store (SSO-based auth)
        // NOTE: We don't use supabase.auth.getUser() because auth is handled by SSO
        const authStore = await import('@/shared/model/authStore');
        const user = authStore.useAuthStore.getState().user;

        if (!user) {
            console.warn('[orgContextService] No authenticated user found in auth store');
            logger.warn('No authenticated user found');
            return { contexts: [] };
        }

        console.log('[orgContextService] User authenticated from auth store', {
            userId: user.id,
            email: user.email
        });

        console.log('[orgContextService] Calling get-user-org-context API...');
        const response: any = await apiPost('/recruiter/actions', {
            action: 'get-user-org-context',
            p_user_id: user.id,
        });
        
        const data = response.data;

        console.log('[orgContextService] API response', {
            dataLength: data?.length || 0,
            data: data
        });

        if (!data || data.length === 0) {
            console.warn('[orgContextService] No organization contexts found for user', {
                userId: user.id,
            });
            logger.info('User is not part of any recruitment organization', {
                userId: user.id,
            });
            return { contexts: [] };
        }

        // Transform database rows to OrgContext objects
        const contexts = (data as OrgContextRow[]).map((row) =>
            transformToOrgContext(row, user.id, user.email || '', user.userName)
        );

        console.log('[orgContextService] Contexts transformed', {
            userId: user.id,
            orgCount: contexts.length,
            orgs: contexts.map((c) => ({
                id: c.orgId,
                name: c.orgName,
                role: c.recruitmentRole,
                hasAccess: c.hasRecruitmentAccess,
                isActive: c.isActive
            })),
        });

        logger.info('Organization contexts loaded', {
            userId: user.id,
            orgCount: contexts.length,
            orgs: contexts.map((c) => ({ id: c.orgId, name: c.orgName, role: c.recruitmentRole })),
        });

        return { contexts };
    } catch (error: any) {
        logger.error('Failed to fetch organization contexts', {
            error: error.message,
            errorName: error.name,
            errorCode: error.code
        });
        throw error;
    }
};

/**
 * Get current user's organization context for recruitment
 * If user belongs to multiple orgs, returns the first active one
 * For multi-org selection, use getUserOrgContexts() instead
 */
export const getOrgContext = async (): Promise<OrgContext | null> => {
    try {
        const { contexts } = await getUserOrgContexts();

        if (contexts.length === 0) {
            return null;
        }

        // Return first active organization with recruitment access
        const activeContext = contexts.find(
            (ctx) => ctx.isActive && ctx.hasRecruitmentAccess
        );

        if (activeContext) {
            logger.info('Using active organization context', {
                orgId: activeContext.orgId,
                orgName: activeContext.orgName,
                role: activeContext.recruitmentRole,
            });
            return activeContext;
        }

        // If no active context with recruitment access, return first context
        logger.warn('No active recruitment context found, returning first organization', {
            orgId: contexts[0].orgId,
            hasAccess: contexts[0].hasRecruitmentAccess,
        });
        return contexts[0];
    } catch (error: any) {
        logger.error('Failed to fetch organization context', { error: error.message });
        throw error;
    }
};

/**
 * Get organization context by organization ID
 */
export const getOrgContextById = async (orgId: string): Promise<OrgContext | null> => {
    try {
        const { contexts } = await getUserOrgContexts();
        const context = contexts.find((ctx) => ctx.orgId === orgId);

        if (!context) {
            logger.warn('Organization context not found', { orgId });
            return null;
        }

        return context;
    } catch (error: any) {
        logger.error('Failed to fetch organization context by ID', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Get current organization ID from context
 * Convenience function for services that only need the org ID
 */
export const getCurrentOrgId = async (): Promise<string | null> => {
    try {
        const context = await getOrgContext();
        return context?.orgId || null;
    } catch (error) {
        logger.error('Failed to get current organization ID', { error });
        return null;
    }
};

/**
 * Check if current user is admin in their organization
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
    try {
        const context = await getOrgContext();
        return context?.isAdmin || false;
    } catch (error) {
        logger.error('Failed to check admin status', { error });
        return false;
    }
};

/**
 * Check if current user has specific permission
 * Uses client-side permission checking based on role
 * For server-side permission checking, use has_recruitment_permission() database function
 */
export const checkPermission = async (permission: string): Promise<boolean> => {
    try {
        const context = await getOrgContext();

        if (!context || !context.recruitmentRole) return false;

        // Import permissions to check
        const { ROLE_PERMISSIONS } = await import('../model/types');
        const permissions = ROLE_PERMISSIONS[context.recruitmentRole] || [];

        return permissions.includes(permission as any);
    } catch (error) {
        logger.error('Failed to check permission', { error, permission });
        return false;
    }
};

/**
 * Check if user has specific permission in organization using backend API
 * This is the authoritative permission check that queries the database via the API
 */
export const hasRecruitmentPermission = async (
    userId: string,
    orgId: string,
    permission: string
): Promise<boolean> => {
    try {
        const response: any = await apiPost('/recruiter/actions', {
            action: 'has-recruitment-permission',
            p_user_id: userId,
            p_org_id: orgId,
            p_required_permission: permission,
        });

        return response?.data?.hasPermission === true;
    } catch (error: any) {
        logger.error('Failed to check recruitment permission', {
            error: error.message,
            userId,
            orgId,
            permission,
        });
        return false;
    }
};
