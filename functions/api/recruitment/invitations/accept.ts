/**
 * Accept Recruitment Invitation
 * POST /api/recruitment/invitations/accept
 * 
 * Accepts a recruitment invitation by:
 * 1. Validating invitation token
 * 2. Creating membership in SSO-Worker via FDW
 * 3. Updating invitation status in SkillPassport DB
 */

import { getServiceClient } from '../../../lib/supabase';

interface AcceptInvitationRequest {
    token: string;
    userId: string;
    password?: string; // Optional - only needed if user doesn't exist
}

export async function onRequestPost(context: any): Promise<Response> {
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    let body: AcceptInvitationRequest;
    try {
        body = await context.request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { token, userId, password } = body;

    if (!token || !userId) {
        return Response.json({ error: 'token and userId are required' }, { status: 400 });
    }

    try {
        // 1. Get invitation from SkillPassport DB
        const { data: invitation, error: inviteError } = await supabase
            .from('organization_invitations')
            .select('*')
            .eq('invitation_token', token)
            .single();

        if (inviteError || !invitation) {
            console.error('[accept-invitation] Invitation not found:', inviteError);
            return Response.json({ error: 'Invalid invitation token' }, { status: 404 });
        }

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

        // 2. Verify user exists in SSO (they should be authenticated)
        // We don't need to check the SkillPassport users table since SSO is the source of truth
        // The userId passed is the SSO user ID

        // For email verification, we can query SSO directly via FDW
        // Add retry logic in case of timing issues with newly created users
        let ssoUser: any = null;
        let ssoUserError: any = null;
        let retries = 3;

        while (retries > 0 && !ssoUser) {
            const result = await supabase
                .from('sso_foreign.users')
                .select('email')
                .eq('id', userId)
                .single();

            ssoUser = result.data;
            ssoUserError = result.error;

            if (!ssoUser && retries > 1) {
                // Wait 500ms before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
                retries--;
            } else {
                break;
            }
        }

        if (ssoUserError || !ssoUser) {
            console.error('[accept-invitation] SSO user not found after retries:', ssoUserError);
            return Response.json({ error: 'User not found in authentication system' }, { status: 404 });
        }

        // Verify email matches invitation
        if (ssoUser.email.toLowerCase() !== invitation.invitee_email.toLowerCase()) {
            return Response.json({
                error: 'Email mismatch. Please log in with the invited email address.'
            }, { status: 403 });
        }

        // 3. Map recruitment role to SSO role
        const roleMapping: Record<string, string> = {
            'company_admin': 'admin',
            'recruiter': 'member',
            'viewer': 'member',
        };

        const ssoRoleName = roleMapping[invitation.invitee_role] || 'member';

        // 4. Create membership directly in SSO-Worker database via FDW
        // Note: We use the service_role client to write to foreign tables
        // Check if user already has a membership
        const { data: existingMembership, error: membershipCheckError } = await supabase
            .from('sso_foreign.memberships')
            .select('id, status')
            .eq('user_id', userId)
            .eq('org_id', invitation.organization_id)
            .maybeSingle();

        if (membershipCheckError) {
            console.error('[accept-invitation] Error checking membership:', membershipCheckError);
            return Response.json({
                error: 'Failed to check existing membership',
                details: membershipCheckError.message
            }, { status: 500 });
        }

        let membershipId: string;

        if (existingMembership) {
            // User already has a membership - reactivate if needed
            membershipId = existingMembership.id;
            if (existingMembership.status !== 'active') {
                const { error: updateError } = await supabase
                    .from('sso_foreign.memberships')
                    .update({ status: 'active' })
                    .eq('id', membershipId);

                if (updateError) {
                    console.error('[accept-invitation] Failed to reactivate membership:', updateError);
                    return Response.json({
                        error: 'Failed to reactivate membership',
                        details: updateError.message
                    }, { status: 500 });
                }
            }
        } else {
            // Create new membership
            const { data: newMembership, error: createError } = await supabase
                .from('sso_foreign.memberships')
                .insert({
                    user_id: userId,
                    org_id: invitation.organization_id,
                    status: 'active',
                })
                .select('id')
                .single();

            if (createError) {
                console.error('[accept-invitation] Failed to create membership:', createError);
                return Response.json({
                    error: 'Failed to create membership',
                    details: createError.message
                }, { status: 500 });
            }

            membershipId = newMembership.id;
        }

        // 5. Get role ID from SSO-Worker
        const { data: roleData, error: roleError } = await supabase
            .from('sso_foreign.roles')
            .select('id')
            .eq('name', ssoRoleName)
            .single();

        if (roleError || !roleData) {
            console.error('[accept-invitation] Failed to get role:', roleError);
            return Response.json({
                error: 'Failed to get role information',
                details: roleError?.message
            }, { status: 500 });
        }

        // 6. Assign role to membership (check if already exists)
        const { data: existingRole } = await supabase
            .from('sso_foreign.membership_roles')
            .select('id')
            .eq('membership_id', membershipId)
            .eq('role_id', roleData.id)
            .maybeSingle();

        if (!existingRole) {
            const { error: roleAssignError } = await supabase
                .from('sso_foreign.membership_roles')
                .insert({
                    membership_id: membershipId,
                    role_id: roleData.id,
                });

            if (roleAssignError) {
                console.error('[accept-invitation] Failed to assign role:', roleAssignError);
                // Don't fail - membership was created successfully
            }
        }

        // 7. Update invitation status in SkillPassport DB
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
            // Don't fail - membership was created successfully
        }

        // 8. Get organization name
        const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', invitation.organization_id)
            .single();

        return Response.json({
            success: true,
            message: 'Invitation accepted successfully',
            organizationName: orgData?.name || 'Organization',
            organizationId: invitation.organization_id,
            role: invitation.invitee_role,
            memberType: invitation.invitee_role, // Add memberType for frontend compatibility
        });

    } catch (error: any) {
        console.error('[accept-invitation] Error:', error);
        return Response.json(
            { error: 'Failed to accept invitation', details: error.message },
            { status: 500 }
        );
    }
}
