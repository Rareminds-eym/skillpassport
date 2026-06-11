/**
 * Recruitment Invitations API
 * Manage member invitations using existing organization_invitations table
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/invitations
 * List all invitations for user's organization
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id') || user.org_id;

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user has access and permission to view invitations
    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_TEAM);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        const { data, error } = await supabase
            .from('organization_invitations')
            .select(`
                *,
                invited_by_user:users!organization_invitations_invited_by_fkey(
                    id,
                    email,
                    full_name
                ),
                organization:organizations(
                    id,
                    name
                )
            `)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        // Transform data to match frontend expectations
        const invitations = (data || []).map((inv: any) => ({
            id: inv.id,
            organizationId: inv.organization_id,
            organizationName: inv.organization?.name || '',
            invitedBy: inv.invited_by,
            invitedByEmail: inv.invited_by_user?.email || '',
            invitedByName: inv.invited_by_user?.full_name || '',
            inviteeEmail: inv.invitee_email,
            inviteeName: inv.invitee_name,
            inviteeRole: inv.invitee_role,
            token: inv.invitation_token,
            status: inv.status,
            expiresAt: inv.expires_at,
            acceptedAt: inv.accepted_at,
            acceptedByUserId: inv.accepted_by_user_id,
            invitationMessage: inv.invitation_message,
            createdAt: inv.created_at,
            updatedAt: inv.updated_at,
        }));

        return Response.json({
            data: invitations,
            total: invitations.length
        });
    } catch (error: any) {
        console.error('Error fetching invitations:', error);
        return Response.json(
            { error: 'Failed to fetch invitations', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * POST /api/recruitment/invitations
 * Create a new member invitation
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    let body: any;
    try {
        body = await context.request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, role, name, org_id } = body;
    const orgId = org_id || user.org_id;

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    if (!email || !role) {
        return Response.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Validate role
    if (!['company_admin', 'recruiter', 'viewer'].includes(role)) {
        return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Verify user has permission to invite members
    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_TEAM);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Generate invitation token
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        // Create invitation
        const { data: invitation, error } = await supabase
            .from('organization_invitations')
            .insert({
                organization_id: orgId,
                organization_type: 'company', // Assuming company for recruitment
                invited_by: user.sub,
                invited_by_role: 'company_admin', // Would need to get actual role
                invitee_email: email,
                invitee_name: name || null,
                invitee_role: role,
                invitation_token: token,
                status: 'pending',
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating invitation:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        // Send invitation email
        const baseUrl = new URL(context.request.url).origin;
        const invitationUrl = `${baseUrl}/accept-invitation?token=${token}`;

        try {
            const { sendRecruitmentInvitationEmail } = await import('../../../lib/emailService');

            // Get inviter's name from user context
            const inviterName = user.name || user.email || 'A team member';

            // Get organization name
            const { data: orgData } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', orgId)
                .single();

            const organizationName = orgData?.name || 'the organization';

            await sendRecruitmentInvitationEmail(
                {
                    email,
                    inviterName,
                    organizationName,
                    role,
                    invitationUrl,
                },
                env as any
            );

            console.log('[invitations] Invitation email sent successfully', { email, invitationId: invitation.id });
        } catch (emailError: any) {
            // Log email error but don't fail the invitation creation
            console.error('[invitations] Failed to send invitation email:', emailError);
            // Invitation is still created, just email failed
        }

        return Response.json({
            data: {
                invitation,
                invitationUrl,
                message: 'Invitation created successfully',
            }
        });
    } catch (error: any) {
        console.error('Error creating invitation:', error);
        return Response.json(
            { error: 'Failed to create invitation', details: error.message },
            { status: 500 }
        );
    }
});
