/**
 * Recruitment Invitations API Router
 * Handles all /api/recruitment/invitations/* routes
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import { ssoCreateMembership, ssoAssignMembershipRole, ssoUpdateMembershipStatus, ssoGetUserByEmail, ssoGetUserMemberships, ssoListRoles } from '../../../lib/sso-client';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

interface AcceptInvitationRequest {
    token: string;
    /** Reserved: invitee-set initial password if the user doesn't exist yet */
    password?: string;
}

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
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            data: data || [],
            total: data?.length || 0
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
 * POST /api/recruitment/invitations or /api/recruitment/invitations/accept
 * Create invitation or accept invitation based on path
 */
export async function onRequestPost(context: any): Promise<Response> {
    const url = new URL(context.request.url);
    const path = url.pathname;

    // Route to accept handler if path ends with /accept
    if (path.endsWith('/accept')) {
        return handleAcceptInvitation(context);
    }

    // Otherwise, handle create invitation (requires auth)
    // Apply auth middleware and call handler
    const authHandler = withAuth(async (authContext: AuthenticatedContext) => {
        return handleCreateInvitation(authContext);
    });
    return authHandler(context);
}

/**
 * PUT /api/recruitment/invitations/{id}/cancel
 * Cancel a pending invitation
 */
export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');

    // Extract invitation ID and action from path
    // Path format: /api/recruitment/invitations/{id}/cancel
    const invitationId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    if (action !== 'cancel') {
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!invitationId || invitationId === 'invitations') {
        return Response.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    try {
        // Get invitation to verify ownership
        const { data: invitation, error: fetchError } = await supabase
            .from('organization_invitations')
            .select('*')
            .eq('id', invitationId)
            .single();

        if (fetchError || !invitation) {
            return Response.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Verify user has access to this organization
        const access = await verifyOrgAccess(
            supabase,
            user.sub,
            invitation.organization_id,
            PERMISSIONS.MANAGE_TEAM
        );
        if (!access.allowed) {
            return access.error!;
        }

        // Check if invitation can be cancelled
        if (invitation.status !== 'pending') {
            return Response.json(
                { error: `Cannot cancel invitation with status: ${invitation.status}` },
                { status: 400 }
            );
        }

        // Cancel invitation
        const { error: updateError } = await supabase
            .from('organization_invitations')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancelled_by: user.sub,
                updated_at: new Date().toISOString(),
            })
            .eq('id', invitationId);

        if (updateError) {
            console.error('Error cancelling invitation:', updateError);
            return Response.json({ error: updateError.message }, { status: 500 });
        }

        return Response.json({
            data: {
                success: true,
                message: 'Invitation cancelled successfully',
            }
        });
    } catch (error: any) {
        console.error('Error cancelling invitation:', error);
        return Response.json(
            { error: 'Failed to cancel invitation', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * Accept Recruitment Invitation
 * POST /api/recruitment/invitations/accept
 */
async function handleAcceptInvitation(context: any): Promise<Response> {
    console.log('=== ACCEPT INVITATION API CALLED ===');
    console.log('[accept-invitation] Request received');
    console.log('[accept-invitation] Request URL:', context.request.url);
    console.log('[accept-invitation] Request method:', context.request.method);

    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    let body: AcceptInvitationRequest;
    try {
        body = await context.request.json();
        console.log('[accept-invitation] Request body parsed:', {
            token: body.token ? `${body.token.substring(0, 8)}...` : 'missing',
            hasPassword: !!body.password
        });
    } catch (parseError) {
        console.error('[accept-invitation] Failed to parse JSON body:', parseError);
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { token } = body;

    if (!token) {
        console.error('[accept-invitation] Missing required fields:', { hasToken: !!token });
        return Response.json({ error: 'token is required' }, { status: 400 });
    }

    try {
        // 1. Get invitation from SkillPassport DB
        console.log('[accept-invitation] Step 1: Fetching invitation from database');
        const { data: invitation, error: inviteError } = await supabase
            .from('organization_invitations')
            .select('*')
            .eq('invitation_token', token)
            .single();

        if (inviteError || !invitation) {
            console.error('[accept-invitation] Invitation not found:', inviteError);
            return Response.json({ error: 'Invalid invitation token' }, { status: 404 });
        }

        console.log('[accept-invitation] ✓ Invitation found:', {
            id: invitation.id,
            email: invitation.invitee_email,
            role: invitation.invitee_role,
            status: invitation.status,
            orgId: invitation.organization_id
        });

        // Check invitation status
        console.log('[accept-invitation] Step 2: Validating invitation status');
        if (invitation.status === 'accepted') {
            console.log('[accept-invitation] ✗ Invitation already accepted');
            return Response.json({ error: 'Invitation already accepted' }, { status: 409 });
        }

        if (invitation.status === 'cancelled') {
            console.log('[accept-invitation] ✗ Invitation cancelled');
            return Response.json({ error: 'Invitation has been cancelled' }, { status: 410 });
        }

        if (new Date(invitation.expires_at) < new Date()) {
            console.log('[accept-invitation] ✗ Invitation expired');
            return Response.json({ error: 'Invitation has expired' }, { status: 410 });
        }

        console.log('[accept-invitation] ✓ Invitation is valid and pending');

        // 2. Look up user by invitation email via SSO_SERVICE RPC (source of truth)
        // This prevents using wrong user when JWT contains stale user ID
        console.log('[accept-invitation] Step 3: Looking up user by invitation email via SSO_SERVICE');
        console.log('[accept-invitation] Invitation email:', invitation.invitee_email);

        const ssoUser = await ssoGetUserByEmail(env as any, invitation.invitee_email);

        if (!ssoUser) {
            console.error('[accept-invitation] ✗ SSO user not found by email:', invitation.invitee_email);
            return Response.json({
                error: 'User account not found. Please sign up with the invited email address first.'
            }, { status: 404 });
        }

        const actualUserId = ssoUser.id;
        console.log('[accept-invitation] ✓ SSO user found:', ssoUser.email);
        console.log('[accept-invitation] Found user ID:', actualUserId);
        console.log('[accept-invitation] ✓ Email matches invitation automatically (looked up by email)');

        // 3. Map recruitment role to SSO role
        console.log('[accept-invitation] Step 5: Mapping recruitment role to SSO role');
        const roleMapping: Record<string, string> = {
            'company_admin': 'admin',
            'recruiter': 'member',
            'viewer': 'member',
        };

        const ssoRoleName = roleMapping[invitation.invitee_role] || 'member';
        console.log('[accept-invitation] Mapped role:', invitation.invitee_role, '->', ssoRoleName);

        // 4. Check for existing membership via SSO_SERVICE (source of truth)
        console.log('[accept-invitation] Step 6: Checking for existing membership via SSO_SERVICE');
        const { memberships: userMemberships } = await ssoGetUserMemberships(env as any, actualUserId);
        const existingMembership = userMemberships.find(m => m.org_id === invitation.organization_id) ?? null;

        let membershipId: string;

        if (existingMembership) {
            console.log('[accept-invitation] ✓ Existing membership found:', existingMembership);
            membershipId = existingMembership.id;
            if (existingMembership.status !== 'active') {
                console.log('[accept-invitation] Reactivating membership via SSO service');
                try {
                    await ssoUpdateMembershipStatus(env as any, {
                        membership_id: membershipId,
                        status: 'active'
                    });
                    console.log('[accept-invitation] ✓ Membership reactivated');
                } catch (updateError: any) {
                    console.error('[accept-invitation] ✗ Failed to reactivate membership:', updateError);
                    return Response.json({
                        error: 'Failed to reactivate membership',
                        details: updateError.message || 'Update failed'
                    }, { status: 500 });
                }
            } else {
                console.log('[accept-invitation] Membership already active');
            }
        } else {
            console.log('[accept-invitation] No existing membership, creating new one via SSO service');
            try {
                const membershipData = await ssoCreateMembership(env as any, {
                    user_id: actualUserId,
                    org_id: invitation.organization_id,
                    status: 'active'
                });

                membershipId = membershipData.id;
                console.log('[accept-invitation] ✓ New membership created:', membershipId);
            } catch (createError: any) {
                console.error('[accept-invitation] ✗ Failed to create membership:', createError);
                return Response.json({
                    error: 'Failed to create membership',
                    details: createError.message || 'Creation failed'
                }, { status: 500 });
            }
        }

        // 5. Get role ID from SSO-Worker via ssoListRoles RPC
        console.log('[accept-invitation] Step 7: Getting role ID from SSO');
        const { roles: allRoles } = await ssoListRoles(env as any);
        const roleResult = allRoles.find(r => r.name === ssoRoleName);

        if (!roleResult) {
            console.error('[accept-invitation] ✗ Role not found:', ssoRoleName);
            return Response.json({
                error: 'Failed to get role information',
                details: `Role "${ssoRoleName}" not found`
            }, { status: 500 });
        }

        const roleId = roleResult.id;
        console.log('[accept-invitation] ✓ Role ID found:', roleId);

        // 6. Assign role to membership using SSO service
        console.log('[accept-invitation] Step 8: Assigning role to membership');
        try {
            await ssoAssignMembershipRole(env as any, {
                membership_id: membershipId,
                role_id: roleId
            });
            console.log('[accept-invitation] ✓ Role assigned successfully');
        } catch (roleAssignError: any) {
            console.error('[accept-invitation] ⚠️ Failed to assign role:', roleAssignError);
            // Continue anyway - membership was created, role assignment can be done later
        }

        // 7. Update invitation status
        console.log('[accept-invitation] Step 9: Updating invitation status');
        const { error: updateError } = await supabase
            .from('organization_invitations')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
                accepted_by_user_id: actualUserId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', invitation.id);

        if (updateError) {
            console.error('[accept-invitation] ✗ Failed to update invitation:', updateError);
        } else {
            console.log('[accept-invitation] ✓ Invitation status updated');
        }

        // 8. Insert into local organization_members table
        const memberRole = ssoRoleName === 'admin' ? 'admin' : 'member';
        const { error: omError } = await supabase
            .from('organization_members')
            .upsert({
                user_id: actualUserId,
                organization_id: invitation.organization_id,
                role: memberRole,
                status: 'active',
            }, { onConflict: 'user_id, organization_id' });
        if (omError) console.error('[accept-invitation] Failed to upsert organization_members:', omError);

        // 9. Get organization name
        console.log('[accept-invitation] Step 10: Fetching organization name');
        const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', invitation.organization_id)
            .single();

        console.log('[accept-invitation] ✓ Organization name:', orgData?.name);
        console.log('=== ACCEPT INVITATION API SUCCESS ===');

        return Response.json({
            success: true,
            message: 'Invitation accepted successfully',
            organizationName: orgData?.name || 'Organization',
            organizationId: invitation.organization_id,
            role: invitation.invitee_role,
            memberType: invitation.invitee_role,
        });

    } catch (error: any) {
        console.error('=== ACCEPT INVITATION API ERROR ===');
        console.error('[accept-invitation] ✗ Unexpected error:', error);
        console.error('[accept-invitation] Error type:', error?.constructor?.name);
        console.error('[accept-invitation] Error message:', error?.message);
        console.error('[accept-invitation] Error stack:', error?.stack);
        return Response.json(
            { error: 'Failed to accept invitation', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Create Recruitment Invitation
 * POST /api/recruitment/invitations
 */
async function handleCreateInvitation(context: AuthenticatedContext): Promise<Response> {
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
                organization_type: 'company',
                invited_by: user.sub,
                invited_by_role: 'company_admin',
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
            const inviterName = user.name || user.email || 'A team member';

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
            console.error('[invitations] Failed to send invitation email:', emailError);
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
}
