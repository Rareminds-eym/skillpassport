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
    // CRITICAL FIX: Don't rely on user.org_id from JWT - it may be empty for invited users
    // Get org_id from query params (passed by frontend via orgContext)
    const orgId = url.searchParams.get('org_id');
    const role = url.searchParams.get('role');
    const isActive = url.searchParams.get('isActive');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    console.log('[members API] GET request:', {
        userId: user.sub,
        userOrgId: user.org_id,
        requestedOrgId: orgId,
        hasOrgIdParam: !!orgId,
    });

    if (!orgId) {
        console.error('[members API] ❌ Organization ID is required but not provided');
        return Response.json({
            error: 'Organization ID is required. Please ensure you have organization context loaded.'
        }, { status: 400 });
    }

    // Verify user has access to this organization
    const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
    if (!access.allowed) {
        console.error('[members API] ❌ Access denied:', access);
        return access.error!;
    }

    console.log('[members API] ✓ Access verified for org:', orgId);

    try {
        // ── Fetch organization_invitations that have been accepted ──
        const { data: acceptedInvitations, error: invError } = await supabase
            .from('organization_invitations')
            .select('*')
            .eq('organization_id', orgId)
            .eq('status', 'accepted')
            .order('accepted_at', { ascending: false });

        if (invError) {
            console.error('Error fetching accepted invitations:', invError);
            return Response.json({ error: invError.message }, { status: 500 });
        }

        // Get user details for each accepted invitation
        const invitedUserIds = (acceptedInvitations || [])
            .map((inv: any) => inv.accepted_by_user_id)
            .filter(Boolean);

        let users: any[] = [];
        if (invitedUserIds.length > 0) {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, firstName, lastName, role')
                .in('id', invitedUserIds);

            if (userError) {
                console.error('Error fetching user details:', userError);
            } else {
                users = userData || [];
            }
        }

        const userMap = new Map(users.map((u: any) => [u.id, u]));

        // Transform accepted invitations into member records
        const membersFromInvitations = (acceptedInvitations || [])
            .filter((inv: any) => inv.accepted_by_user_id && userMap.has(inv.accepted_by_user_id))
            .map((inv: any) => {
                const user = userMap.get(inv.accepted_by_user_id);
                const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
                return {
                    id: inv.id,
                    userId: inv.accepted_by_user_id,
                    organizationId: inv.organization_id,
                    name: fullName || inv.invitee_name || '',
                    email: user?.email || inv.invitee_email,
                    ssoRoleName: 'member',
                    recruitmentRole: inv.invitee_role,
                    membershipStatus: 'active',
                    isActive: true,
                    invitedBy: inv.invited_by,
                    invitedAt: inv.created_at,
                    joinedAt: inv.accepted_at,
                    createdAt: inv.accepted_at || inv.created_at,
                    updatedAt: inv.updated_at || inv.accepted_at || inv.created_at,
                };
            });

        // ── Also fetch direct organization_members (not from invitations) ──
        const { data: directMembers, error: directError } = await supabase
            .from('organization_members')
            .select(`
                id,
                user_id,
                organization_id,
                role,
                status,
                created_at,
                updated_at
            `)
            .eq('organization_id', orgId)
            .eq('status', 'active');

        if (directError) {
            console.error('Error fetching direct members:', directError);
        }

        // Get user details for direct members (skip those already covered by invitations)
        const directUserIds = (directMembers || [])
            .map((m: any) => m.user_id)
            .filter((uid: string) => !invitedUserIds.includes(uid));

        let directUsers: any[] = [];
        if (directUserIds.length > 0) {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, firstName, lastName, role')
                .in('id', directUserIds);

            if (userError) {
                console.error('Error fetching direct user details:', userError);
            } else {
                directUsers = userData || [];
            }
        }

        const directUserMap = new Map(directUsers.map((u: any) => [u.id, u]));

        // Fetch recruitment role mapping for SSO role → recruitment role
        const { data: roleMapping } = await supabase
            .from('recruitment_role_mapping')
            .select('sso_role_name, recruitment_role');

        const roleMap = new Map<string, string>((roleMapping || []).map((r: any) => [r.sso_role_name, r.recruitment_role]));

        const membersFromDirect = (directMembers || [])
            .filter((m: any) => directUserMap.has(m.user_id))
            .map((m: any) => {
                const user = directUserMap.get(m.user_id);
                const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
                return {
                    id: m.id,
                    userId: m.user_id,
                    organizationId: m.organization_id,
                    name: fullName || '',
                    email: user?.email || '',
                    ssoRoleName: m.role,
                    recruitmentRole: roleMap.get(m.role) || null,
                    membershipStatus: m.status,
                    isActive: m.status === 'active',
                    invitedBy: null,
                    invitedAt: null,
                    joinedAt: m.created_at,
                    createdAt: m.created_at,
                    updatedAt: m.updated_at,
                };
            });

        // Merge: invitations first (higher priority), then direct members
        const members = [...membersFromInvitations, ...membersFromDirect];

        // Apply filters
        let filteredMembers = members;
        if (role && role !== 'all') {
            filteredMembers = filteredMembers.filter((m: any) => m.ssoRoleName === role);
        }
        if (isActive === 'true') {
            filteredMembers = filteredMembers.filter((m: any) => m.isActive);
        } else if (isActive === 'false') {
            filteredMembers = filteredMembers.filter((m: any) => !m.isActive);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            filteredMembers = filteredMembers.filter((m: any) =>
                m.email.toLowerCase().includes(searchLower) ||
                (m.name && m.name.toLowerCase().includes(searchLower))
            );
        }

        // Apply pagination
        const total = filteredMembers.length;
        const paginatedMembers = filteredMembers.slice(offset, offset + limit);

        return Response.json({
            members: paginatedMembers,
            total,
            hasMore: total > offset + limit,
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
    const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Query accepted invitations for stats (same approach as main GET)
        const { data: acceptedInvitations, error } = await supabase
            .from('organization_invitations')
            .select('invitee_role, status')
            .eq('organization_id', orgId)
            .eq('status', 'accepted');

        if (error) {
            console.error('Error fetching member stats:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        const members = acceptedInvitations || [];

        // Calculate statistics
        const total = members.length;
        const active = total; // All accepted invitations are considered active
        const inactive = 0; // We don't track inactive members in this model

        // Count by role
        const admins = members.filter((m: any) =>
            ['owner', 'company_admin'].includes(m.invitee_role)
        ).length;
        const recruiters = members.filter((m: any) =>
            ['recruiter', 'viewer'].includes(m.invitee_role)
        ).length;

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
