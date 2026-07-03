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
        // 1. CHECK: Is there already a pending invitation for this email?
        console.log('[invitations] Checking for duplicate pending invitation');
        const { data: existingInvite, error: checkInviteError } = await supabase
            .from('organization_invitations')
            .select('id, status, expires_at')
            .eq('invitee_email', email.toLowerCase())
            .eq('organization_id', orgId)
            .eq('status', 'pending')
            .single();

        if (checkInviteError && checkInviteError.code !== 'PGRST116') {
            // PGRST116 = not found, which is fine
            console.error('[invitations] Error checking for existing invite:', checkInviteError);
        }

        if (existingInvite) {
            console.log('[invitations] Duplicate pending invitation found:', existingInvite.id);
            return Response.json({
                error: 'An invitation is already pending for this email. Resend or revoke it first.',
                existingInvitationId: existingInvite.id
            }, { status: 409 });
        }

        // 2. CHECK: Is this user already a member of the organization?
        console.log('[invitations] Checking if user is already a member');

        // First, try to find user by email via SSO
        let existingUserId: string | null = null;
        try {
            const { ssoGetUserByEmail } = await import('../../../lib/sso-client');
            const ssoUser = await ssoGetUserByEmail(env as any, email.toLowerCase());
            if (ssoUser) {
                existingUserId = ssoUser.id;
                console.log('[invitations] Found existing user:', existingUserId);
            }
        } catch (ssoError) {
            console.log('[invitations] No existing user found in SSO (this is fine)');
        }

        // If user exists, check if they're already a member of this org
        if (existingUserId) {
            const { data: existingMember, error: checkMemberError } = await supabase
                .from('organization_members')
                .select('id, status')
                .eq('user_id', existingUserId)
                .eq('organization_id', orgId)
                .single();

            if (checkMemberError && checkMemberError.code !== 'PGRST116') {
                console.error('[invitations] Error checking for existing member:', checkMemberError);
            }

            if (existingMember) {
                console.log('[invitations] User is already a member:', existingMember.id);
                return Response.json({
                    error: 'This user is already a member of your organisation.',
                    memberStatus: existingMember.status
                }, { status: 409 });
            }
        }

        console.log('[invitations] No duplicates found, proceeding with invitation creation');

        // 3. Generate invitation token
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        // 4. Create invitation
        const { data: invitation, error } = await supabase
            .from('organization_invitations')
            .insert({
                organization_id: orgId,
                organization_type: 'company', // Assuming company for recruitment
                invited_by: user.sub,
                invited_by_role: 'company_admin', // Would need to get actual role
                invitee_email: email.toLowerCase(), // Normalize email
                invitee_name: name || null,
                invitee_role: role,
                invitation_token: token,
                status: 'pending',
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('[invitations] Error creating invitation:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        console.log('[invitations] Invitation created successfully:', invitation.id);

        // 5. Send invitation email (with transaction rollback on failure)
        const baseUrl = new URL(context.request.url).origin;
        const invitationUrl = `${baseUrl}/invite/accept?token=${token}`;

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

            console.log('[invitations] Sending invitation email to:', email);

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

            console.log('[invitations] ✓ Invitation email sent successfully');

            return Response.json({
                data: {
                    invitation,
                    invitationUrl,
                    message: 'Invitation created successfully',
                }
            });

        } catch (emailError: any) {
            console.error('[invitations] ✗ Failed to send invitation email:', emailError);
            console.log('[invitations] Rolling back invitation creation');

            // ROLLBACK: Delete the invitation we just created
            const { error: deleteError } = await supabase
                .from('organization_invitations')
                .delete()
                .eq('id', invitation.id);

            if (deleteError) {
                console.error('[invitations] ✗ Failed to rollback invitation:', deleteError);
                // Return error about both failures
                return Response.json({
                    error: 'Failed to send invitation email and failed to rollback database changes',
                    emailError: emailError.message,
                    rollbackError: deleteError.message
                }, { status: 500 });
            }

            console.log('[invitations] ✓ Invitation rolled back successfully');

            // Return error indicating email failure
            return Response.json({
                error: 'Failed to send invitation email. The invitation was not created.',
                details: emailError.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[invitations] Unexpected error creating invitation:', error);
        return Response.json(
            { error: 'Failed to create invitation', details: error.message },
            { status: 500 }
        );
    }
});
