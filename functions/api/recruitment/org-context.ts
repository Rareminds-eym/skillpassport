/**
 * Recruitment Organization Context API
 * Get user's organization context for recruitment features
 */

import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { getUserOrgContexts } from '../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/org-context
 * Returns all organizations user belongs to with recruitment roles
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    try {
        // Get all organization contexts for user
        const contexts = await getUserOrgContexts(supabase, user.sub);

        if (contexts.length === 0) {
            return Response.json({
                contexts: [],
                message: 'User is not part of any recruitment organization',
            });
        }

        // Transform to camelCase for frontend
        const transformedContexts = contexts.map((ctx) => ({
            orgId: ctx.org_id,
            orgName: ctx.org_name,
            orgSlug: ctx.org_slug,
            membershipStatus: ctx.membership_status,
            ssoRoleName: ctx.sso_role_name,
            recruitmentRole: ctx.recruitment_role,
            recruitmentEnabled: ctx.recruitment_enabled,
            userId: user.sub,
            userEmail: user.email || '',
            isActive: ctx.membership_status === 'active',
            isAdmin: ctx.recruitment_role === 'company_admin',
            isRecruiter: ctx.recruitment_role === 'recruiter',
            hasRecruitmentAccess: ctx.recruitment_enabled && ctx.recruitment_role !== null,
        }));

        return Response.json({
            contexts: transformedContexts,
            total: transformedContexts.length,
        });
    } catch (error: any) {
        console.error('Error fetching org context:', error);
        return Response.json(
            { error: 'Failed to fetch organization context', details: error.message },
            { status: 500 }
        );
    }
});
