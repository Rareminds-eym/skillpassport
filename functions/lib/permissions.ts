import type { SupabaseClient } from '@supabase/supabase-js';

export interface OrgContext {
    org_id: string;
    org_name: string;
    org_slug: string;
    membership_status: 'active' | 'inactive' | 'suspended' | 'expired';
    sso_role_name: 'owner' | 'admin' | 'member';
    recruitment_role: 'company_admin' | 'recruiter' | 'viewer' | null;
    recruitment_enabled: boolean;
}

export async function getUserOrgContexts(
    supabase: SupabaseClient,
    userId: string,
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

export async function getPrimaryOrgContext(
    supabase: SupabaseClient,
    userId: string,
): Promise<OrgContext | null> {
    const contexts = await getUserOrgContexts(supabase, userId);

    if (contexts.length === 0) {
        return null;
    }

    const activeContext = contexts.find(
        (ctx) => ctx.membership_status === 'active' && ctx.recruitment_enabled && ctx.recruitment_role
    );

    return activeContext || contexts[0];
}

export async function hasRecruitmentPermission(
    supabase: SupabaseClient,
    userId: string,
    orgId: string,
    permission: string,
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

export async function isOrgMember(
    supabase: SupabaseClient,
    userId: string,
    orgId: string,
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

export async function getUserRecruitmentRoles(
    supabase: SupabaseClient,
    userId: string,
    orgId: string,
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

export async function verifyOrgAccess(
    supabase: SupabaseClient,
    userId: string,
    orgId: string,
    requiredPermission?: string,
): Promise<{ allowed: boolean; error?: Response }> {
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

    if (requiredPermission) {
        const hasPermission = await hasRecruitmentPermission(
            supabase,
            userId,
            orgId,
            requiredPermission,
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

export const PERMISSIONS = {
    MANAGE_TEAM: 'manage_team',
    CREATE_JOBS: 'create_jobs',
    EDIT_JOBS: 'edit_jobs',
    DELETE_JOBS: 'delete_jobs',
    VIEW_CANDIDATES: 'view_candidates',
    MANAGE_CANDIDATES: 'manage_candidates',
    VIEW_ANALYTICS: 'view_analytics',
} as const;
