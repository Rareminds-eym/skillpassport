/**
 * Recruitment Invitations API Router
 * Handles all /api/recruitment/invitations/* routes
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import { ssoCreateMember, ssoAssignMembershipRole, ssoUpdateMembershipStatus, ssoGetUserByEmail, ssoGetUserMemberships, ssoListRoles, ssoCreateMembership } from '../../../lib/sso-client';
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
 * POST /api/recruitment/invitations or /api/recruitment/invitations/accept or /api/recruitment/invitations/validate
 * Create invitation, accept invitation, or validate invitation token based on path
 */
export async function onRequestPost(context: any): Promise<Response> {
    const url = new URL(context.request.url);
    const path = url.pathname;

    // Route to validate handler if path ends with /validate (no auth required)
    if (path.endsWith('/validate')) {
        return handleValidateInvitation(context);
    }

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
 * Validate Recruitment Invitation Token
 * POST /api/recruitment/invitations/validate
 * 
 * This endpoint validates an invitation token WITHOUT requiring authentication.
 * Used during signup flow to pre-select recruiter type and org info.
 */
async function handleValidateInvitation(context: any): Promise<Response> {
    console.log('=== VALIDATE INVITATION TOKEN API CALLED ===');
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    let body: { token: string };
    try {
        body = await context.request.json();
        console.log('[validate-invitation] Token validation request:', {
            token: body.token ? `${body.token.substring(0, 8)}...` : 'missing',
        });
    } catch (parseError) {
        console.error('[validate-invitation] Failed to parse JSON body:', parseError);
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { token } = body;

    if (!token) {
        return Response.json({ error: 'token is required' }, { status: 400 });
    }

    try {
        // Fetch invitation from database (WITHOUT relationship join)
        const { data: invitation, error: inviteError } = await supabase
            .from('organization_invitations')
            .select('id, organization_id, organization_type, invited_by, invited_by_role, invitee_email, invitee_name, invitee_role, invitation_token, status, expires_at, created_at, accepted_at, accepted_by_user_id, cancelled_at, cancelled_by, updated_at')
            .eq('invitation_token', token)
            .single();

        if (inviteError || !invitation) {
            console.error('[validate-invitation] Invitation not found:', inviteError);
            return Response.json({ error: 'Invalid invitation token' }, { status: 404 });
        }

        console.log('[validate-invitation] ✓ Invitation found:', {
            id: invitation.id,
            email: invitation.invitee_email,
            role: invitation.invitee_role,
            status: invitation.status,
            orgId: invitation.organization_id,
        });

        // Check invitation status
        if (invitation.status === 'accepted') {
            return Response.json({ error: 'Invitation already accepted' }, { status: 409 });
        }

        if (invitation.status === 'cancelled') {
            return Response.json({ error: 'Invitation has been cancelled' }, { status: 410 });
        }

        if (new Date(invitation.expires_at) < new Date()) {
            return Response.json({ error: 'Invitation has expired' }, { status: 410 });
        }

        // Get organization name in separate query
        const { data: orgData } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', invitation.organization_id)
            .single();

        return Response.json({
            valid: true,
            inviteeEmail: invitation.invitee_email,
            organizationId: invitation.organization_id,
            organizationName: orgData?.name || 'Unknown Organization',
            organizationType: invitation.organization_type,
            role: invitation.invitee_role,
            expiresAt: invitation.expires_at,
        });
    } catch (error: any) {
        console.error('[validate-invitation] Validation error:', error);
        return Response.json(
            { error: 'Failed to validate invitation', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Accept Recruitment Invitation
 * POST /api/recruitment/invitations/accept
 * 
 * Creates new user account via SSO, waits for sync, updates profile, and notifies admin
 */
async function handleAcceptInvitation(context: any): Promise<Response> {
    console.log('=== ACCEPT RECRUITMENT INVITATION API CALLED ===');
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    let body: { token: string; password?: string; auto_accept?: boolean };
    try {
        body = await context.request.json();
        console.log('[accept-invitation] Request body parsed:', {
            token: body.token ? `${body.token.substring(0, 8)}...` : 'missing',
            hasPassword: !!body.password,
            autoAccept: !!body.auto_accept
        });
    } catch (parseError) {
        console.error('[accept-invitation] Failed to parse JSON body:', parseError);
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { token, password, auto_accept } = body;

    // Validate required fields (unless auto-accept)
    if (!auto_accept && (!token || !password)) {
        console.error('[accept-invitation] Missing required fields');
        return Response.json({
            error: 'token and password are required'
        }, { status: 400 });
    }

    if (!token) {
        return Response.json({ error: 'token is required' }, { status: 400 });
    }

    try {
        // STEP 1: Re-validate token server-side
        console.log('[accept-invitation] Step 1: Re-validating invitation token');
        const { data: invitation, error: inviteError } = await supabase
            .from('organization_invitations')
            .select('*')
            .eq('invitation_token', token)
            .single();

        if (inviteError || !invitation) {
            console.error('[accept-invitation] Invitation not found:', inviteError);
            return Response.json({ error: 'Invalid invitation token' }, { status: 404 });
        }

        // Fetch organization and inviter data separately
        const { data: orgData } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', invitation.organization_id)
            .single();

        const { data: inviterData } = await supabase
            .from('users')
            .select('id, email, firstName, lastName')
            .eq('id', invitation.invited_by)
            .single();

        // Check invitation status
        if (invitation.status === 'accepted') {
            return Response.json({ error: 'Invitation already accepted' }, { status: 409 });
        }
        if (invitation.status === 'cancelled') {
            return Response.json({ error: 'Invitation has been cancelled' }, { status: 410 });
        }
        if (new Date(invitation.expires_at) < new Date()) {
            return Response.json({ error: 'Invitation has expired' }, { status: 410 });
        }

        console.log('[accept-invitation] ✓ Token validated successfully');

        // Extract first and last name from invitee_name
        const fullName = invitation.invitee_name || '';
        const nameParts = fullName.trim().split(/\s+/);
        const first_name = nameParts[0] || 'User';
        const last_name = nameParts.slice(1).join(' ') || '';

        console.log('[accept-invitation] Extracted names:', { first_name, last_name });

        // STEP 2: Check if user already exists
        console.log('[accept-invitation] Step 2: Checking for existing user');
        const existingUser = await ssoGetUserByEmail(env as any, invitation.invitee_email);

        let userId: string;
        let membershipId: string;

        // Map recruitment role to SSO role
        const roleMapping: Record<string, string> = {
            'company_admin': 'admin',
            'recruiter': 'member',
            'viewer': 'member',
        };
        const ssoRoleName = roleMapping[invitation.invitee_role] || 'member';

        if (existingUser) {
            // User already exists - create membership only
            console.log('[accept-invitation] User already exists:', existingUser.id);
            userId = existingUser.id;

            // Check if already member of this org
            const { memberships: userMemberships } = await ssoGetUserMemberships(env as any, userId);
            const existingMembership = userMemberships.find(m => m.org_id === invitation.organization_id);

            if (existingMembership) {
                membershipId = existingMembership.id;
                console.log('[accept-invitation] User already has membership:', membershipId);

                // Reactivate if inactive
                if (existingMembership.status !== 'active') {
                    await ssoUpdateMembershipStatus(env as any, {
                        membership_id: membershipId,
                        status: 'active'
                    });
                    console.log('[accept-invitation] ✓ Membership reactivated');
                }
            } else {
                // Create new membership
                console.log('[accept-invitation] Creating membership for existing user');
                const membershipData = await ssoCreateMembership(env as any, {
                    user_id: userId,
                    org_id: invitation.organization_id,
                    status: 'active'
                });
                membershipId = membershipData.id;
                console.log('[accept-invitation] ✓ Membership created:', membershipId);

                // Assign role
                const { roles: allRoles } = await ssoListRoles(env as any);
                const roleResult = allRoles.find(r => r.name === ssoRoleName);
                if (roleResult) {
                    await ssoAssignMembershipRole(env as any, {
                        membership_id: membershipId,
                        role_id: roleResult.id
                    });
                    console.log('[accept-invitation] ✓ Role assigned');
                }
            }

            // Update names if provided from invitation
            if (first_name && last_name) {
                await supabase
                    .from('users')
                    .update({
                        firstName: first_name.trim(),
                        lastName: last_name.trim(),
                        updatedAt: new Date().toISOString(),
                    })
                    .eq('id', userId);
                console.log('[accept-invitation] ✓ User profile updated with names from invitation');
            }

        } else {
            // STEP 3: Create new user via SSO
            if (!password) {
                return Response.json({
                    error: 'Password is required for new users'
                }, { status: 400 });
            }

            console.log('[accept-invitation] Step 3: Creating new user via SSO');
            console.log('[accept-invitation] Creating user with role:', ssoRoleName);

            try {
                const createResult = await ssoCreateMember(env as any, {
                    email: invitation.invitee_email,
                    password: password,
                    role: ssoRoleName,
                    org_id: invitation.organization_id,
                });

                userId = createResult.user_id;
                membershipId = createResult.membership_id;
                console.log('[accept-invitation] ✓ User created via SSO:', userId);
                console.log('[accept-invitation] Membership ID:', membershipId);

                // STEP 4: Directly sync to SkillPassport DB (bypassing queue for dev)
                console.log('[accept-invitation] Step 4: Directly syncing user to SkillPassport DB');

                // Get user details from SSO
                const ssoUser = await ssoGetUserByEmail(env as any, invitation.invitee_email);

                if (ssoUser) {
                    // Sync user to SkillPassport users table
                    const { error: userSyncError } = await supabase
                        .from('users')
                        .upsert({
                            id: userId,
                            email: invitation.invitee_email.toLowerCase(),
                            firstName: first_name!.trim(),
                            lastName: last_name!.trim(),
                            role: 'recruiter', // Default role for recruitment users
                            organizationId: invitation.organization_id,
                            isActive: true,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        }, { onConflict: 'id' });

                    if (userSyncError) {
                        console.error('[accept-invitation] User sync error:', userSyncError);
                    } else {
                        console.log('[accept-invitation] ✓ User synced to SkillPassport DB');
                    }

                    // Map recruitment role to organization_members role
                    const roleMappingToOrgMembers: Record<string, string> = {
                        'company_admin': 'admin',
                        'recruiter': 'member',
                        'viewer': 'member',
                    };
                    const orgMemberRole = roleMappingToOrgMembers[invitation.invitee_role] || 'member';

                    // Sync membership to SkillPassport organization_members table
                    const { error: membershipSyncError } = await supabase
                        .from('organization_members')
                        .upsert({
                            user_id: userId,
                            organization_id: invitation.organization_id,
                            role: orgMemberRole,
                            status: 'active',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'user_id,organization_id' });

                    if (membershipSyncError) {
                        console.error('[accept-invitation] Membership sync error:', membershipSyncError);
                    } else {
                        console.log('[accept-invitation] ✓ Membership synced to SkillPassport DB');
                    }
                } else {
                    console.error('[accept-invitation] Could not fetch user from SSO after creation');
                }

            } catch (createError: any) {
                console.error('[accept-invitation] Failed to create user:', createError);
                return Response.json({
                    error: 'Failed to create user account',
                    details: createError.message || 'User creation failed'
                }, { status: 500 });
            }
        }

        // STEP 6: Update invitation status
        console.log('[accept-invitation] Step 6: Updating invitation status');

        const { error: updateError } = await supabase
            .from('organization_invitations')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
                accepted_by_user_id: userId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', invitation.id);

        if (updateError) {
            console.error('[accept-invitation] Failed to update invitation:', updateError);
        } else {
            console.log('[accept-invitation] ✓ Invitation marked as accepted');
        }

        // STEP 5: Sync recruiter to recruiters table (from organization_invitations data)
        console.log('[accept-invitation] Step 5: Syncing recruiter to recruiters table from invitation');
        try {
            const { error: recruiterSyncError } = await supabase
                .from('recruiters')
                .upsert({
                    // Primary & Foreign Keys
                    id: userId,                                        // From accepted_by_user_id
                    user_id: userId,                                   // REQUIRED - From accepted_by_user_id

                    // Core Information (from invitation)
                    name: invitation.invitee_name || `${first_name} ${last_name}`.trim(),
                    email: invitation.invitee_email.toLowerCase(),

                    // Optional Fields
                    phone: null,
                    state: null,
                    website: null,

                    // Status Fields
                    verificationstatus: 'approved',
                    approval_status: 'approved',
                    isactive: true,
                    account_status: 'active',

                    // Approval Tracking (from invitation)
                    approved_by: invitation.invited_by,                // Who sent the invitation
                    approved_at: new Date().toISOString(),             // When accepted
                    company_id: null,                                   // Optional - not all recruiters belong to a company

                    // Timestamps (from invitation)
                    createdat: invitation.created_at,                  // When invitation was created
                    updatedat: new Date().toISOString(),              // When synced
                }, { onConflict: 'email' });

            if (recruiterSyncError) {
                console.error('[accept-invitation] Recruiter sync error:', recruiterSyncError);
                console.error('[accept-invitation] Sync failed for:', {
                    userId,
                    email: invitation.invitee_email,
                    name: invitation.invitee_name,
                });
            } else {
                console.log('[accept-invitation] ✓ Recruiter synced to recruiters table:', {
                    id: userId,
                    email: invitation.invitee_email,
                    name: invitation.invitee_name,
                    approved_by: invitation.invited_by,
                    company_id: invitation.organization_id,
                });
            }
        } catch (syncException: any) {
            console.error('[accept-invitation] Recruiter sync exception:', syncException);
        }

        // STEP 7: Send admin notification email
        console.log('[accept-invitation] Step 7: Sending admin notification email');
        try {
            const { sendInvitationAcceptedEmail } = await import('../../../lib/emailService');

            // Build admin name and email safely
            const adminEmail = inviterData?.email || invitation.invited_by;

            // Validate admin email is actually an email (not a UUID)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(adminEmail)) {
                console.error('[accept-invitation] Invalid admin email format:', adminEmail);
                console.log('[accept-invitation] Skipping admin notification email');
            } else {
                const adminName = inviterData?.firstName && inviterData?.lastName
                    ? `${inviterData.firstName} ${inviterData.lastName}`
                    : inviterData?.email || 'Admin';

                await sendInvitationAcceptedEmail(
                    {
                        adminEmail,
                        adminName,
                        recruiterName: `${first_name} ${last_name}`,
                        organizationName: orgData?.name || 'the organization',
                        role: invitation.invitee_role,
                    },
                    env as any
                );

                console.log('[accept-invitation] ✓ Admin notification email sent');
            }
        } catch (emailError: any) {
            console.error('[accept-invitation] Failed to send admin notification:', emailError);
            // Don't fail the request if email fails
        }

        // STEP 8: Return success with redirect URL
        console.log('=== ACCEPT RECRUITMENT INVITATION API SUCCESS ===');

        return Response.json({
            success: true,
            redirect: '/recruitment/overview',
            message: 'Invitation accepted successfully',
            organizationName: orgData?.name || 'Organization',
            organizationId: invitation.organization_id,
            role: invitation.invitee_role,
        });

    } catch (error: any) {
        console.error('=== ACCEPT RECRUITMENT INVITATION API ERROR ===');
        console.error('[accept-invitation] Unexpected error:', error);
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

        // 4. Create invitation in database
        const { data: invitation, error } = await supabase
            .from('organization_invitations')
            .insert({
                organization_id: orgId,
                organization_type: 'company',
                invited_by: user.sub,
                invited_by_role: 'company_admin',
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
            const inviterName = user.name || user.email || 'A team member';

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
}
