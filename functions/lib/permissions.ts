/**
 * Recruitment Permission Utilities
 * Helper functions for checking recruitment permissions via FDW
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Organization context from database
 */
export interface OrgContext {
    org_id: string;
    org_name: string;
    org_slug: string;
    membership_status: 'active' | 'inactive' | 'suspended' | 'expired';
    sso_role_name: 'owner' | 'admin' | 'member';
    recruitment_role: 'company_admin' | 'recruiter' | 'viewer' | null;
    recruitment_enabled: boolean;
}

/**
 * Get user's organization contexts via FDW
 * Calls get_user_org_context() database function
 */
export async function getUserOrgContexts(
    supabase: SupabaseClient,
    userId: string
): Promise<OrgContext[]> {
    const { data, error } = await supabase.rpc('get_user_org_context', {
        p_user_id: userId,
    });

    if (error) {
        console.error('Failed to get user org contexts:', error);
        return [];
    }

    return (data || []) as OrgContext[];
}

/**
 * Get user's primary organization context
 * Returns first active organization with recruitment access
 */
export async function getPrimaryOrgContext(
    supabase: SupabaseClient,
    userId: string
): Promise<OrgContext | null> {
    const contexts = await getUserOrgContexts(supabase, userId);

    if (contexts.length === 0) {
        return null;
    }

    // Find first active org with recruitment enabled
    const activeContext = contexts.find(
        (ctx) => ctx.membership_status === 'active' && ctx.recruitment_enabled && ctx.recruitment_role
    );

    return activeContext || contexts[0];
}

/**
 * Check if user has specific recruitment permission in organization
 * Calls has_recruitment_permission() database function
 */
export async function hasRecruitmentPermission(
    supabase: SupabaseClient,
    userId: string,
    orgId: string,
    permission: string
): Promise<boolean> {
    const { data, error } = await supabase.rpc('has_recruitment_permission', {
        p_user_id: userId,
        p_org_id: orgId,
        p_permission: permission,
    });

    if (error) {
        console.error('Failed to check recruitment permission:', error);
        return false;
    }

    return data === true;
}

/**
 * Check if user is member of organization
 * Calls is_org_member() database function
 */
export async function isOrgMember(
    supabase: SupabaseClient,
    userId: string,
    orgId: string
): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_org_member', {
        p_user_id: userId,
        p_org_id: orgId,
    });

    if (error) {
        console.error('Failed to check org membership:', error);
        return false;
    }

    return data === true;
}

/**
 * Get user's recruitment roles in organization
 * Calls get_user_recruitment_roles() database function
 */
export async function getUserRecruitmentRoles(
    supabase: SupabaseClient,
    userId: string,
    orgId: string
): Promise<{
    sso_role_name: string;
    recruitment_role: string;
    can_manage_team: boolean;
    can_create_jobs: boolean;
    can_edit_jobs: boolean;
    can_delete_jobs: boolean;
    can_view_candidates: boolean;
    can_manage_candidates: boolean;
    can_view_analytics: boolean;
}[]> {
    const { data, error } = await supabase.rpc('get_user_recruitment_roles', {
        p_user_id: userId,
        p_org_id: orgId,
    });

    if (error) {
        console.error('Failed to get user recruitment roles:', error);
        return [];
    }

    return data || [];
}

/**
 * Verify user has access to organization and specific permission
 * Returns error response if access denied
 */
export async function verifyOrgAccess(
    supabase: SupabaseClient,
    userId: string,
    orgId: string,
    requiredPermission?: string
): Promise<{ allowed: boolean; error?: Response }> {
    // Check if user is member of organization
    const isMember = await isOrgMember(supabase, userId, orgId);

    if (!isMember) {
        return {
            allowed: false,
            error: Response.json(
                { error: 'Access denied: Not a member of this organization' },
                { status: 403 }
            ),
        };
    }

    // If specific permission required, check it
    if (requiredPermission) {
        const hasPermission = await hasRecruitmentPermission(
            supabase,
            userId,
            orgId,
            requiredPermission
        );

        if (!hasPermission) {
            return {
                allowed: false,
                error: Response.json(
                    { error: `Access denied: Missing required permission '${requiredPermission}'` },
                    { status: 403 }
                ),
            };
        }
    }

    return { allowed: true };
}

/**
 * Permission constants matching database
 */
export const PERMISSIONS = {
    MANAGE_TEAM: 'manage_team',
    CREATE_JOBS: 'create_jobs',
    EDIT_JOBS: 'edit_jobs',
    DELETE_JOBS: 'delete_jobs',
    VIEW_CANDIDATES: 'view_candidates',
    MANAGE_CANDIDATES: 'manage_candidates',
    VIEW_ANALYTICS: 'view_analytics',
} as const;
