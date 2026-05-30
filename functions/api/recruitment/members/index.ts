/**
 * Recruitment Members API
 * Manage organization members (admins and recruiters)
 * Queries SSO-Worker database via FDW
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/members
 * List all members in user's organization
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id') || user.org_id;
    const role = url.searchParams.get('role');
    const isActive = url.searchParams.get('isActive');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user has access to this organization
    const access = await verifyOrgAccess(supabase, user.sub, orgId);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Query members via FDW
        // This queries SSO-Worker memberships and joins with recruitment_role_mapping
        let query = supabase
            .from('sso_foreign.memberships')
            .select(
                `
        id,
        user_id,
        org_id,
        status,
        created_at,
        sso_foreign.users!inner(id, email),
        sso_foreign.membership_roles!inner(
          role_id,
          sso_foreign.roles!inner(id, name)
        )
      `,
                { count: 'exact' }
            )
            .eq('org_id', orgId);

        // Apply filters
        if (isActive === 'true') {
            query = query.eq('status', 'active');
        } else if (isActive === 'false') {
            query = query.neq('status', 'active');
        }

        // Note: Role and search filtering would need to be done post-query
        // since we're querying foreign tables

        query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching members:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        // Transform data to match frontend expectations
        const members = (data || []).map((member: any) => ({
            id: member.id,
            userId: member.user_id,
            organizationId: member.org_id,
            email: member.sso_foreign?.users?.email || '',
            ssoRoleName: member.sso_foreign?.membership_roles?.sso_foreign?.roles?.name || '',
            membershipStatus: member.status,
            isActive: member.status === 'active',
            createdAt: member.created_at,
        }));

        return Response.json({
            members,
            total: count || 0,
            hasMore: (count || 0) > offset + limit,
        });
    } catch (error: any) {
        console.error('Error fetching members:', error);
        return Response.json(
            { error: 'Failed to fetch members', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * GET /api/recruitment/members/stats
 * Get member statistics for organization
 */
export const onRequestGet_stats = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id') || user.org_id;

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user has access
    const access = await verifyOrgAccess(supabase, user.sub, orgId);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Get all members
        const { data: members, error } = await supabase
            .from('sso_foreign.memberships')
            .select(
                `
        status,
        sso_foreign.membership_roles!inner(
          sso_foreign.roles!inner(name)
        )
      `
            )
            .eq('org_id', orgId);

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        // Calculate statistics
        const total = members?.length || 0;
        const active = members?.filter((m: any) => m.status === 'active').length || 0;
        const inactive = total - active;

        // Count by role (simplified - would need proper role mapping)
        const admins =
            members?.filter((m: any) =>
                ['owner', 'admin'].includes(m.sso_foreign?.membership_roles?.sso_foreign?.roles?.name)
            ).length || 0;
        const recruiters = total - admins;

        return Response.json({
            total,
            active,
            inactive,
            admins,
            recruiters,
        });
    } catch (error: any) {
        console.error('Error fetching member stats:', error);
        return Response.json(
            { error: 'Failed to fetch member statistics', details: error.message },
            { status: 500 }
        );
    }
});
