import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

function getSupabase(context: AuthenticatedContext) {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  return getServiceClient(env);
}

function getUserId(context: AuthenticatedContext): string {
  return getContextUser(context).id;
}

type OrganizationType = 'school' | 'college' | 'university';
type MemberType = 'educator' | 'learner';

// ============================================================================
// Access Control Helper
// ============================================================================

/**
 * Verifies that the user is a member of the specified organization
 * @returns Member data with role if user is a member, null otherwise
 */
async function verifyOrgMembership(
  supabase: any,
  userId: string,
  orgId: string
): Promise<{ role: string; status: string } | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('[verifyOrgMembership] Database error:', error);
    return null;
  }

  return data;
}

/**
 * Verifies user has admin privileges (owner or admin role)
 */
function isAdmin(role: string): boolean {
  return role === 'owner' || role === 'admin';
}

// ============================================================================
// License Pools
// ============================================================================

async function createPool(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const userId = getUserId(context);
  const { organizationSubscriptionId, organizationId, organizationType, poolName, memberType, allocatedSeats, autoAssignNewMembers, assignmentCriteria } = body;

  // 🔒 SECURITY: Verify user is a member of the organization
  const membership = await verifyOrgMembership(supabase, userId, organizationId);
  if (!membership) {
    return apiError(403, 'FORBIDDEN', 'Not a member of this organization', context.request);
  }

  // 🔒 SECURITY: Only admins can create license pools
  if (!isAdmin(membership.role)) {
    return apiError(403, 'FORBIDDEN', 'Insufficient permissions. Admin role required.', context.request);
  }

  const { data: subscription } = await supabase
    .from('subscription_cache')
    .select('seat_count, assigned_seats')
    .eq('id', organizationSubscriptionId)
    .eq('is_org_subscription', true)
    .single();

  const availableSeats = subscription ? (subscription.seat_count - subscription.assigned_seats) : 0;
  if (!subscription || availableSeats < allocatedSeats) {
    return apiError(400, 'VALIDATION_ERROR', 'Insufficient available seats in subscription', context.request);
  }

  const { data, error } = await supabase
    .from('license_pools')
    .insert({
      organization_subscription_id: organizationSubscriptionId,
      organization_id: organizationId,
      organization_type: organizationType,
      pool_name: poolName,
      member_type: memberType,
      allocated_seats: allocatedSeats,
      assigned_seats: 0,
      auto_assign_new_members: autoAssignNewMembers || false,
      assignment_criteria: assignmentCriteria || {},
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function getLicensePools(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const userId = getUserId(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');
  const orgType = url.searchParams.get('orgType');
  if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'orgId is required', context.request);

  // 🔒 SECURITY: Verify user is a member of the organization
  const membership = await verifyOrgMembership(supabase, userId, orgId);
  if (!membership) {
    return apiError(403, 'FORBIDDEN', 'Not a member of this organization', context.request);
  }

  let query = supabase.from('license_pools').select('*').eq('organization_id', orgId);
  if (orgType) query = query.eq('organization_type', orgType);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function updatePoolAllocation(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { poolId, newAllocation } = body;

  const { data: pool } = await supabase.from('license_pools').select('*').eq('id', poolId).single();
  if (!pool) return apiError(404, 'NOT_FOUND', 'License pool not found', context.request);
  if (newAllocation < pool.assigned_seats) {
    return apiError(400, 'VALIDATION_ERROR', `Cannot reduce allocation below assigned seats (${pool.assigned_seats})`, context.request);
  }

  const { data, error } = await supabase.from('license_pools').update({ allocated_seats: newAllocation, updated_at: new Date().toISOString() }).eq('id', poolId).select().single();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function assignLicense(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { poolId, userId: targetUserId } = body;
  const assignedBy = getUserId(context);

  const { data: pool } = await supabase.from('license_pools').select('*').eq('id', poolId).single();
  if (!pool) return apiError(404, 'NOT_FOUND', 'License pool not found', context.request);
  if (pool.available_seats <= 0) return apiError(400, 'VALIDATION_ERROR', 'No available seats in pool', context.request);

  const { data: existing } = await supabase.from('license_assignments').select('id').eq('user_id', targetUserId).eq('organization_subscription_id', pool.organization_subscription_id).eq('status', 'active').single();
  if (existing) return apiError(409, 'DUPLICATE', 'User already has an active license assignment', context.request);

  const { data, error } = await supabase.from('license_assignments').insert({ license_pool_id: poolId, organization_subscription_id: pool.organization_subscription_id, user_id: targetUserId, member_type: pool.member_type, status: 'active', assigned_by: assignedBy }).select().single();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function unassignLicense(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { assignmentId, reason } = body;
  const revokedBy = getUserId(context);

  const { error } = await supabase.from('license_assignments').update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: revokedBy, revocation_reason: reason, updated_at: new Date().toISOString() }).eq('id', assignmentId);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function transferLicense(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { fromUserId, toUserId, organizationSubscriptionId } = body;
  const transferredBy = getUserId(context);

  const { data: currentAssignment } = await supabase.from('license_assignments').select('*').eq('user_id', fromUserId).eq('organization_subscription_id', organizationSubscriptionId).eq('status', 'active').single();
  if (!currentAssignment) return apiError(404, 'NOT_FOUND', 'No active assignment found for source user', context.request);

  await supabase.from('license_assignments').update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: transferredBy, revocation_reason: 'Transferred to another user', updated_at: new Date().toISOString() }).eq('id', currentAssignment.id);

  const { data: newAssignment, error } = await supabase.from('license_assignments').insert({ license_pool_id: currentAssignment.license_pool_id, organization_subscription_id: currentAssignment.organization_subscription_id, user_id: toUserId, member_type: currentAssignment.member_type, status: 'active', assigned_by: transferredBy, transferred_from: currentAssignment.id }).select().single();
  if (error) throw error;

  await supabase.from('license_assignments').update({ transferred_to: newAssignment.id }).eq('id', currentAssignment.id);
  return apiSuccess(newAssignment, context.request);
}

async function getUserAssignments(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'userId is required', context.request);

  const { data, error } = await supabase.from('license_assignments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function getPoolAssignments(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const poolId = url.searchParams.get('poolId');
  if (!poolId) return apiError(400, 'VALIDATION_ERROR', 'poolId is required', context.request);

  const { data, error } = await supabase.from('license_assignments').select('*').eq('license_pool_id', poolId).order('created_at', { ascending: false });
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function configureAutoAssignment(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { poolId, criteria, enabled } = body;

  const { data, error } = await supabase.from('license_pools').update({ auto_assign_new_members: enabled, assignment_criteria: criteria, updated_at: new Date().toISOString() }).eq('id', poolId).select().single();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

// ============================================================================
// Organization Invitations
// ============================================================================

async function inviteMember(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const user = getUserId(context);
  const { organizationId, organizationType, email, memberType, autoAssignSubscription, licensePoolId, invitationMessage, metadata } = body;

  // 🔒 SECURITY: Verify user is a member of the organization
  const membership = await verifyOrgMembership(supabase, user, organizationId);
  if (!membership) {
    return apiError(403, 'FORBIDDEN', 'Not a member of this organization', context.request);
  }

  // 🔒 SECURITY: Only admins can invite members
  if (!isAdmin(membership.role)) {
    return apiError(403, 'FORBIDDEN', 'Insufficient permissions. Admin role required to send invitations.', context.request);
  }

  const { data: existing } = await supabase.from('organization_invitations').select('*').eq('organization_id', organizationId).eq('invitee_email', email.toLowerCase()).eq('status', 'pending').maybeSingle();
  if (existing) return apiError(409, 'DUPLICATE', 'An invitation is already pending for this email', context.request);

  // TODO(12.1 review): NOT an authz allow/deny — `invited_by_role` is audit
  // metadata recording the inviter's role. It reads the current user's single
  // shadow `users.role`; converting to the JWT `roles[]` would require selecting a
  // primary role (a semantic change). Deferred; flagged for review.
  const { data: userData } = await supabase.from('users').select('role').eq('id', user).single();
  const invitedByRole = userData?.role || 'school_admin';
  const inviteeRole = memberType === 'educator'
    ? (organizationType === 'school' ? 'school_educator' : 'college_educator')
    : 'learner';
  const invitationToken = Array.from({ length: 64 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invitation, error } = await supabase.from('organization_invitations').insert({ organization_id: organizationId, organization_type: organizationType, invitee_email: email.toLowerCase(), invitee_role: inviteeRole, invited_by: user, invited_by_role: invitedByRole, license_pool_id: autoAssignSubscription ? licensePoolId : null, status: 'pending', invitation_token: invitationToken, expires_at: expiresAt, invitation_message: invitationMessage, metadata: metadata || {} }).select().single();
  if (error) throw error;
  return apiSuccess(invitation, context.request);
}

async function resendInvitation(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { invitationId } = body;

  const { data: invitation, error } = await supabase.from('organization_invitations').select('*').eq('id', invitationId).single();
  if (error || !invitation) return apiError(404, 'NOT_FOUND', 'Invitation not found', context.request);
  if (invitation.status !== 'pending') return apiError(400, 'VALIDATION_ERROR', 'Can only resend pending invitations', context.request);

  const newToken = Array.from({ length: 64 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await supabase.from('organization_invitations').update({ invitation_token: newToken, expires_at: newExpiresAt, updated_at: new Date().toISOString() }).eq('id', invitationId);
  if (updateError) throw updateError;
  return apiSuccess({ invitation_token: newToken }, context.request);
}

async function cancelInvitation(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const user = getUserId(context);
  const { invitationId } = body;

  const { error } = await supabase.from('organization_invitations').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: user, updated_at: new Date().toISOString() }).eq('id', invitationId).eq('status', 'pending');
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function acceptInvitation(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { token, userId: acceptingUserId } = body;

  const { data: invitation, error } = await supabase.from('organization_invitations').select('*').eq('invitation_token', token).eq('status', 'pending').single();
  if (error || !invitation) return apiError(404, 'NOT_FOUND', 'Invalid or expired invitation', context.request);

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('organization_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return apiError(410, 'EXPIRED', 'Invitation has expired', context.request);
  }

  const { error: updateError } = await supabase.from('organization_invitations').update({ status: 'accepted', accepted_at: new Date().toISOString(), accepted_by_user_id: acceptingUserId, updated_at: new Date().toISOString() }).eq('id', invitation.id);
  if (updateError) throw updateError;

  // Map invitee_role to SSO role for organization_members
  let memberRole = 'member';
  if (invitation.invitee_role === 'owner') memberRole = 'owner';
  else if (invitation.invitee_role.includes('admin')) memberRole = 'admin';

  const { error: omError } = await supabase
    .from('organization_members')
    .upsert({
      user_id: acceptingUserId,
      organization_id: invitation.organization_id,
      role: memberRole,
      status: 'active',
    }, { onConflict: 'user_id, organization_id' });
  if (omError) console.error('[accept-invitation] Failed to upsert organization_members:', omError);

  await linkUserToOrganization(supabase, acceptingUserId, invitation.organization_id, invitation.organization_type, invitation.invitee_role, invitation.invitee_email);

  return apiSuccess(invitation, context.request);
}

async function linkUserToOrganization(supabase: any, userId: string, organizationId: string, organizationType: string, inviteeRole: string, inviteeEmail?: string) {
  const isEducator = inviteeRole.includes('educator');
  const isLearner = inviteeRole.includes('learner');
  const memberUpdateData: Record<string, any> = {};
  if (organizationType === 'school') memberUpdateData.school_id = organizationId;
  else if (organizationType === 'college' || organizationType === 'university') memberUpdateData.college_id = organizationId;

  if (isLearner && Object.keys(memberUpdateData).length > 0) {
    const { data: updatedByUserId } = await supabase.from('learners').update(memberUpdateData).eq('user_id', userId).select('id');
    if ((!updatedByUserId || updatedByUserId.length === 0) && inviteeEmail) {
      await supabase.from('learners').update({ ...memberUpdateData, user_id: userId }).eq('email', inviteeEmail.toLowerCase()).select('id');
    }
  }

  if (isEducator && organizationType === 'school') {
    const { data: updatedByUserId } = await supabase.from('school_educators').update({ school_id: organizationId }).eq('user_id', userId).select('id');
    if ((!updatedByUserId || updatedByUserId.length === 0) && inviteeEmail) {
      await supabase.from('school_educators').update({ school_id: organizationId, user_id: userId }).eq('email', inviteeEmail.toLowerCase()).select('id');
    }
  }

  await supabase.from('users').update({ organizationId: organizationId, role: inviteeRole }).eq('id', userId);
}

async function getPendingInvitations(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const userId = getUserId(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');
  const orgType = url.searchParams.get('orgType');
  if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'orgId is required', context.request);

  // 🔒 SECURITY: Verify user is a member of the organization
  const membership = await verifyOrgMembership(supabase, userId, orgId);
  if (!membership) {
    return apiError(403, 'FORBIDDEN', 'Not a member of this organization', context.request);
  }

  let query = supabase.from('organization_invitations').select('*').eq('organization_id', orgId).eq('status', 'pending').order('created_at', { ascending: false });
  if (orgType) query = query.eq('organization_type', orgType);
  const { data, error } = await query;
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function getAllInvitations(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const userId = getUserId(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');
  const status = url.searchParams.get('status');
  const memberType = url.searchParams.get('memberType');
  const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
  if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'orgId is required', context.request);

  // 🔒 SECURITY: Verify user is a member of the organization
  const membership = await verifyOrgMembership(supabase, userId, orgId);
  if (!membership) {
    return apiError(403, 'FORBIDDEN', 'Not a member of this organization', context.request);
  }

  let query = supabase.from('organization_invitations').select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (memberType) query = query.eq('invitee_role', memberType);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function getInvitationByToken(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const token = url.searchParams.get('token');
  if (!token) return apiError(400, 'VALIDATION_ERROR', 'token is required', context.request);

  const { data, error } = await supabase.from('organization_invitations').select('*').eq('invitation_token', token).single();
  if (error) return apiSuccess(null, context.request);
  return apiSuccess(data, context.request);
}

async function getInvitationStats(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');
  if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'orgId is required', context.request);

  const { data, error } = await supabase.from('organization_invitations').select('status').eq('organization_id', orgId);
  if (error) throw error;

  const stats = { total: data?.length || 0, pending: 0, accepted: 0, expired: 0, cancelled: 0, acceptanceRate: 0 };
  (data || []).forEach((inv: any) => { if (stats[inv.status as keyof typeof stats] !== undefined) (stats[inv.status as keyof typeof stats] as number)++; });
  const completed = stats.accepted + stats.expired + stats.cancelled;
  stats.acceptanceRate = completed > 0 ? Math.round((stats.accepted / completed) * 100) : 0;
  return apiSuccess(stats, context.request);
}

async function getOrganizationNameHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');
  if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'orgId is required', context.request);

  const { data, error } = await supabase.from('organizations').select('name').eq('id', orgId).maybeSingle();
  if (error) throw error;
  return apiSuccess(data?.name || '', context.request);
}

async function searchOrganizationsHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const searchTerm = url.searchParams.get('searchTerm') || '';
  const orgType = url.searchParams.get('orgType');

  if (!orgType) return apiError(400, 'VALIDATION_ERROR', 'orgType is required', context.request);

  const { data, error } = await supabase.from('organizations').select('name, state, city').eq('organization_type', orgType).ilike('name', `%${searchTerm}%`).limit(10);
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function expireOldInvitations(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const { data, error } = await supabase.from('organization_invitations').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('status', 'pending').lt('expires_at', new Date().toISOString()).select();
  if (error) throw error;
  return apiSuccess({ count: data?.length || 0 }, context.request);
}

// ============================================================================
// Organization CRUD
// ============================================================================

async function createOrganizationHandler(context: AuthenticatedContext, body: any) {
  const env = context.env as Record<string, any>;
  
  // Extract organization data
  const { action: _action, ...orgFields } = body;
  
  try {
    // Validate SSO service availability
    if (!env.SSO_SERVICE) {
      console.error('[organization] SSO_SERVICE not configured in environment');
      throw new Error('SSO_SERVICE not configured');
    }
    
    const user = getContextUser(context);
    const userId = getUserId(context);
    
    // Validate required fields
    if (!orgFields.name || !orgFields.name.trim()) {
      return apiError(400, 'VALIDATION_ERROR', 'Organization name is required', context.request);
    }
    
    if (!orgFields.organization_type) {
      return apiError(400, 'VALIDATION_ERROR', 'Organization type is required', context.request);
    }
    
    if (!['school', 'college', 'university'].includes(orgFields.organization_type)) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid organization type. Must be school, college, or university', context.request);
    }
    
    if (!orgFields.organization_type) {
      return apiError(400, 'VALIDATION_ERROR', 'Organization type is required', context.request);
    }
    
    const validTypes = ['school', 'college', 'university'];
    if (!validTypes.includes(orgFields.organization_type)) {
      return apiError(400, 'VALIDATION_ERROR', 'Organization type must be school, college, or university', context.request);
    }
    
    if (!userId) {
      return apiError(401, 'UNAUTHORIZED', 'User authentication required', context.request);
    }
    
    // Check if user already has an org (from signup)
    const existingOrgId = user?.org_id;
    
    if (existingOrgId) {
      console.log(`[organization] Updating existing org ${existingOrgId}`);
      
      try {
        const updateResult = await env.SSO_SERVICE.updateOrganizationDetails({
          id: existingOrgId,
          metadata: {
            ...orgFields,
            organization_type: orgFields.organization_type
          }
        });
        
        if (!updateResult.success) {
          const errorMsg = updateResult.error || 'Failed to update organization in SSO';
          console.error(`[organization] SSO update failed: ${errorMsg}`);
          return apiError(500, 'SSO_UPDATE_FAILED', errorMsg, context.request);
        }
        
        return apiSuccess({
          id: existingOrgId,
          name: orgFields.name,
          admin_id: orgFields.admin_id || userId,
          organization_type: orgFields.organization_type,
          ...orgFields
        }, context.request);
      } catch (ssoError) {
        const errorMsg = ssoError instanceof Error ? ssoError.message : 'Unknown SSO error';
        console.error(`[organization] SSO update exception:`, ssoError);
        return apiError(500, 'SSO_ERROR', `Failed to update organization: ${errorMsg}`, context.request);
      }
    }
    
    // Create new organization
    console.log(`[organization] Creating new organization for user ${userId}`);
    
    try {
      const ssoResult = await env.SSO_SERVICE.createOrganization({
        name: orgFields.name,
        slug: orgFields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        created_by: orgFields.admin_id || userId,
        metadata: {
          ...orgFields,
          organization_type: orgFields.organization_type
        }
      });
      
      if (!ssoResult.success) {
        const errorMsg = ssoResult.error || 'Failed to create organization in SSO';
        console.error(`[organization] SSO creation failed: ${errorMsg}`);
        return apiError(500, 'SSO_CREATE_FAILED', errorMsg, context.request);
      }
      
      if (!ssoResult.org_id) {
        console.error('[organization] SSO did not return org_id');
        return apiError(500, 'SSO_INVALID_RESPONSE', 'SSO did not return organization ID', context.request);
      }
      
      console.log(`[organization] Successfully created org ${ssoResult.org_id} in SSO`);
      
      return apiSuccess({
        id: ssoResult.org_id,
        name: orgFields.name,
        admin_id: orgFields.admin_id || userId,
        organization_type: orgFields.organization_type,
        ...orgFields
      }, context.request);
    } catch (ssoError) {
      const errorMsg = ssoError instanceof Error ? ssoError.message : 'Unknown SSO error';
      console.error(`[organization] SSO creation exception:`, ssoError);
      return apiError(500, 'SSO_ERROR', `Failed to create organization: ${errorMsg}`, context.request);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[organization] Unexpected error in createOrganizationHandler:`, err);
    return apiError(500, 'INTERNAL_ERROR', `Organization creation failed: ${errorMsg}`, context.request);
  }
}

async function updateOrganizationHandler(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  // Exclude 'action' and 'id' from updates - these are routing/identifier fields, not data columns
  const { id, action, ...updates } = body;

  if (updates.metadata && typeof updates.metadata === 'object' && !Array.isArray(updates.metadata)) {
    const { data: existingOrg, error: existingError } = await supabase
      .from('organizations')
      .select('metadata')
      .eq('id', id)
      .maybeSingle();

    if (existingError) throw existingError;

    updates.metadata = {
      ...((existingOrg?.metadata as Record<string, unknown>) || {}),
      ...updates.metadata,
    };
  }

  const { data, error } = await supabase.from('organizations').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function deleteOrganizationHandler(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { id } = body;
  const { error } = await supabase.from('organizations').delete().eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function createLocalOrganizationHandler(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const userId = getUserId(context);
  const { p_organization_id, p_organization_name, p_recruitment_enabled, p_max_recruiters } = body;

  console.log('[createLocalOrganizationHandler] Calling create_local_organization with:', {
    p_organization_id,
    p_organization_name,
    p_recruitment_enabled: p_recruitment_enabled ?? true,
    p_max_recruiters: p_max_recruiters ?? 10,
    p_created_by_user_id: userId,
  });

  const { data, error } = await supabase.rpc('create_local_organization', {
    p_organization_id,
    p_organization_name,
    p_recruitment_enabled: p_recruitment_enabled ?? true,
    p_max_recruiters: p_max_recruiters ?? 10,
    p_created_by_user_id: userId,
  });

  if (error) {
    console.error('[createLocalOrganizationHandler] Database error:', error);
    throw error;
  }

  console.log('[createLocalOrganizationHandler] Success:', data);
  return apiSuccess(data, context.request);
}

async function createOrganizationRecruitmentSettingsHandler(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { p_organization_id, p_industry, p_company_size, p_admin_name, p_phone, p_email, p_address } = body;
  const { data, error } = await supabase.rpc('create_organization_recruitment_settings', {
    p_organization_id,
    p_industry,
    p_company_size,
    p_admin_name,
    p_phone: p_phone || null,
    p_email,
    p_address,
  });
  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function checkOrganizationNameExistsHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const name = url.searchParams.get('name');
  const orgType = url.searchParams.get('orgType');
  const excludeId = url.searchParams.get('excludeId');
  if (!name || !orgType) return apiError(400, 'VALIDATION_ERROR', 'name and orgType are required', context.request);

  let query = supabase.from('organizations').select('id').ilike('name', name).eq('organization_type', orgType);
  if (excludeId) query = query.neq('id', excludeId);
  const { data } = await query.maybeSingle();
  return apiSuccess(data !== null, context.request);
}

async function getOrganizationByIdHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { data, error } = await supabase.from('organizations').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function getOrganizationByAdminIdHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const adminId = url.searchParams.get('adminId');
  const orgType = url.searchParams.get('orgType');
  
  if (!adminId) {
    return apiError(400, 'VALIDATION_ERROR', 'adminId is required', context.request);
  }

  try {
    // Try direct admin_id lookup first (fastest path)
    let query = supabase.from('organizations').select('*').eq('admin_id', adminId);
    if (orgType) query = query.eq('organization_type', orgType);
    
    const { data, error } = await query.maybeSingle();
    
    if (error) {
      console.error(`[organization] Database error querying by admin_id:`, error);
      return apiError(500, 'DATABASE_ERROR', 'Failed to query organization', context.request);
    }
    
    // Found via direct lookup - success
    if (data) {
      return apiSuccess(data, context.request);
    }
    
    // Try metadata lookup: auth-sync-consumer populates metadata->admin_id but may not
    // have updated the admin_id column yet. Auto-fix it when found.
    console.log(`[organization] admin_id column null, querying metadata for ${adminId}`);
    
    try {
      let metadataQuery = supabase
        .from('organizations')
        .select('*')
        .contains('metadata', { admin_id: adminId });
      
      if (orgType) metadataQuery = metadataQuery.eq('organization_type', orgType);
      
      const { data: metadataOrg, error: metadataError } = await metadataQuery.maybeSingle();
      
      if (metadataError) {
        console.error(`[organization] Error querying metadata:`, metadataError);
        // Don't fail here - just return null
        return apiSuccess(null, context.request);
      }
      
      if (metadataOrg) {
        console.log(`[organization] Found org ${metadataOrg.id} via metadata, fixing admin_id column`);
        
        // Auto-fix: Update admin_id column for future queries
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ admin_id: adminId })
          .eq('id', metadataOrg.id);
        
        if (updateError) {
          console.error(`[organization] Failed to update admin_id column:`, updateError);
          // Don't fail the request - we still found the org
        }
        
        return apiSuccess(metadataOrg, context.request);
      }
    } catch (metadataErr) {
      console.error(`[organization] Metadata lookup exception:`, metadataErr);
      // Continue to return null instead of failing
    }
    
    // Not found in either location
    return apiSuccess(null, context.request);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[organization] Unexpected error in getOrganizationByAdminIdHandler:`, err);
    return apiError(500, 'INTERNAL_ERROR', `Failed to retrieve organization: ${errorMsg}`, context.request);
  }
}

async function getOrganizationsHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const orgType = url.searchParams.get('orgType');
  const adminId = url.searchParams.get('adminId');
  const isActive = url.searchParams.get('isActive');
  const approvalStatus = url.searchParams.get('approvalStatus');
  const city = url.searchParams.get('city');
  const state = url.searchParams.get('state');
  const searchTerm = url.searchParams.get('searchTerm');

  let query = supabase.from('organizations').select('*').order('name');
  if (orgType) query = query.eq('organization_type', orgType);
  if (adminId) query = query.eq('admin_id', adminId);
  if (isActive !== null) query = query.eq('is_active', isActive === 'true');
  if (approvalStatus) query = query.eq('approval_status', approvalStatus);
  if (city) query = query.ilike('city', `%${city}%`);
  if (state) query = query.ilike('state', `%${state}%`);
  if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
  const { data, error } = await query;
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function getOrganizationByEmailHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const email = url.searchParams.get('email');
  const orgType = url.searchParams.get('orgType');
  if (!email) return apiError(400, 'VALIDATION_ERROR', 'email is required', context.request);

  let query = supabase.from('organizations').select('*').eq('email', email);
  if (orgType) query = query.eq('organization_type', orgType);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

// ============================================================================
// Organization Members
// ============================================================================

async function getMemberCountsHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');
  const orgType = url.searchParams.get('orgType') as OrganizationType | null;
  if (!orgId || !orgType) return apiError(400, 'VALIDATION_ERROR', 'orgId and orgType are required', context.request);

  let learnerQuery = supabase.from('learners').select('id', { count: 'exact', head: true });
  if (orgType === 'school') learnerQuery = learnerQuery.eq('school_id', orgId);
  else if (orgType === 'college') learnerQuery = learnerQuery.eq('college_id', orgId);
  else learnerQuery = learnerQuery.eq('universityId', orgId);
  learnerQuery = learnerQuery.or('is_deleted.is.null,is_deleted.eq.false');
  const { count: learnerCount } = await learnerQuery;

  let educatorCount = 0;
  if (orgType === 'school') {
    const { count } = await supabase.from('school_educators').select('id', { count: 'exact', head: true }).eq('school_id', orgId);
    educatorCount = count || 0;
  } else if (orgType === 'college') {
    const { count } = await supabase.from('college_lecturers').select('id', { count: 'exact', head: true }).eq('collegeId', orgId);
    educatorCount = count || 0;
  }

  return apiSuccess({ learners: learnerCount || 0, educators: educatorCount, total: (learnerCount || 0) + educatorCount }, context.request);
}

async function getLearners(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');
  const orgType = url.searchParams.get('orgType');
  const searchQuery = url.searchParams.get('searchQuery');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  if (!orgId || !orgType) return apiError(400, 'VALIDATION_ERROR', 'orgId and orgType are required', context.request);

  let query = supabase.from('learners').select('*', { count: 'exact' });
  if (orgType === 'school') query = query.eq('school_id', orgId);
  else if (orgType === 'college') query = query.eq('college_id', orgId);
  else query = query.eq('universityId', orgId);
  if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  query = query.or('is_deleted.is.null,is_deleted.eq.false');
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return apiSuccess({ members: data || [], total: count || 0 }, context.request);
}

async function getEducators(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');
  const orgType = url.searchParams.get('orgType');
  const searchQuery = url.searchParams.get('searchQuery');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  if (!orgId || !orgType) return apiError(400, 'VALIDATION_ERROR', 'orgId and orgType are required', context.request);

  if (orgType === 'school') {
    let query = supabase.from('school_educators').select('*', { count: 'exact' }).eq('school_id', orgId);
    if (searchQuery) query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    query = query.range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return apiSuccess({ members: data || [], total: count || 0 }, context.request);
  } else if (orgType === 'college') {
    let query = supabase.from('college_lecturers').select('*', { count: 'exact' }).eq('collegeId', orgId);
    if (searchQuery) query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    query = query.range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return apiSuccess({ members: data || [], total: count || 0 }, context.request);
  }
  return apiSuccess({ members: [], total: 0 }, context.request);
}

async function getLicensedMembers(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');

  const { data: assignments } = await supabase.from('license_assignments').select('id, user_id, assigned_at, license_pool_id').in('user_id', []).eq('status', 'active');
  const poolIds = [...new Set((assignments || []).map((a: any) => a.license_pool_id))];
  let poolMap = new Map<string, string>();
  if (poolIds.length > 0) {
    const { data: pools } = await supabase.from('license_pools').select('id, pool_name').in('id', poolIds).eq('organization_id', orgId);
    (pools || []).forEach((p: any) => poolMap.set(p.id, p.pool_name));
  }
  return apiSuccess({ assignments: assignments || [], poolMap: Object.fromEntries(poolMap) }, context.request);
}

// ============================================================================
// Subscription Cache
// ============================================================================

async function getSubscriptions(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('orgId');
  const orgType = url.searchParams.get('orgType');
  const subId = url.searchParams.get('subId');
  const isOrgSub = url.searchParams.get('isOrgSub') !== 'false';

  if (subId) {
    const { data, error } = await supabase.from('subscription_cache').select('*').eq('id', subId).single();
    if (error) throw error;
    return apiSuccess(data, context.request);
  }

  if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'orgId is required', context.request);
  let query = supabase.from('subscription_cache').select('*').eq('organization_id', orgId);
  if (orgType) query = query.eq('organization_type', orgType);
  if (isOrgSub) query = query.eq('is_organization_subscription', true);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function getPlansCache(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const planId = url.searchParams.get('planId');

  let query = supabase.from('plans_cache').select('*');
  if (planId) query = query.eq('id', planId).single();
  const { data, error } = await query;
  if (error) throw error;
  return apiSuccess(data, context.request);
}

// ============================================================================
// User Entitlements
// ============================================================================

async function getUserEntitlementsHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'userId is required', context.request);

  const { data, error } = await supabase.from('user_entitlements').select('*').eq('user_id', userId).eq('is_active', true);
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function grantEntitlement(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { userId, featureKey, organizationSubscriptionId, grantedBy, expiresAt } = body;
  const { data, error } = await supabase.from('user_entitlements').insert({ user_id: userId, feature_key: featureKey, is_active: true, granted_by_organization: true, organization_subscription_id: organizationSubscriptionId, granted_by: grantedBy, expires_at: expiresAt }).select().single();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function revokeEntitlements(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { userId, organizationSubscriptionId } = body;
  const { error } = await supabase.from('user_entitlements').update({ is_active: false, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('organization_subscription_id', organizationSubscriptionId).eq('granted_by_organization', true);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function bulkGrantEntitlements(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { userIds, featureKeys, organizationSubscriptionId, grantedBy } = body;

  const results = [];
  for (const userId of userIds) {
    for (const featureKey of featureKeys) {
      const { data, error } = await supabase.from('user_entitlements').insert({ user_id: userId, feature_key: featureKey, is_active: true, granted_by_organization: true, organization_subscription_id: organizationSubscriptionId, granted_by: grantedBy }).select().single();
      if (data) results.push(data);
    }
  }
  return apiSuccess(results, context.request);
}

async function bulkRevokeEntitlements(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { userIds, organizationSubscriptionId } = body;
  const { error } = await supabase.from('user_entitlements').update({ is_active: false, updated_at: new Date().toISOString() }).in('user_id', userIds).eq('organization_subscription_id', organizationSubscriptionId).eq('granted_by_organization', true);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function getOrganizationEntitlementStatsHandler(context: AuthenticatedContext) {
  const supabase = getSupabase(context);
  const url = new URL(context.request.url);
  const subId = url.searchParams.get('subscriptionId');
  if (!subId) return apiError(400, 'VALIDATION_ERROR', 'subscriptionId is required', context.request);

  const { data: entitlements } = await supabase.from('user_entitlements').select('user_id, feature_key').eq('organization_subscription_id', subId).eq('granted_by_organization', true).eq('is_active', true);
  if (!entitlements) return apiSuccess({ totalMembers: 0, activeEntitlements: 0, featureBreakdown: {} }, context.request);

  const uniqueMembers = new Set(entitlements.map((e: any) => e.user_id));
  const featureBreakdown: Record<string, number> = {};
  entitlements.forEach((e: any) => { featureBreakdown[e.feature_key] = (featureBreakdown[e.feature_key] || 0) + 1; });
  return apiSuccess({ totalMembers: uniqueMembers.size, activeEntitlements: entitlements.length, featureBreakdown }, context.request);
}

// ============================================================================
// Subscription Operations
// ============================================================================

async function removeMemberHandler(context: AuthenticatedContext, body: any) {
  const supabase = getSupabase(context);
  const { memberId, memberType, organizationType, organizationId, revokedBy } = body;

  if (memberType === 'learner') {
    const updateData: Record<string, any> = {};
    if (organizationType === 'school') updateData.school_id = null;
    else if (organizationType === 'college' || organizationType === 'university') updateData.college_id = null;

    const { data: learner } = await supabase.from('learners').select('id, school_id, college_id, email, name, user_id').eq('id', memberId).single();
    if (!learner) return apiSuccess({ success: false, message: 'Learner not found' }, context.request);

    const belongsToOrg = (organizationType === 'school' && learner.school_id === organizationId) || ((organizationType === 'college' || organizationType === 'university') && learner.college_id === organizationId);
    if (!belongsToOrg) return apiSuccess({ success: false, message: 'Learner does not belong to this organization' }, context.request);

    await supabase.from('learners').update(updateData).eq('id', memberId);
    await revokeMemberLicenses(supabase, learner.user_id || learner.id, organizationId, revokedBy, 'Member removed from organization');
    return apiSuccess({ success: true, message: `${learner.name || 'Learner'} has been removed from the organization` }, context.request);
  }

  if (organizationType === 'school') {
    const { data: educator } = await supabase.from('school_educators').select('id, school_id, email, first_name, last_name, user_id').eq('id', memberId).single();
    if (!educator) return apiSuccess({ success: false, message: 'Educator not found' }, context.request);
    if (educator.school_id !== organizationId) return apiSuccess({ success: false, message: 'Educator does not belong to this organization' }, context.request);
    await supabase.from('school_educators').update({ school_id: null }).eq('id', memberId);
    if (educator.user_id) await revokeMemberLicenses(supabase, educator.user_id, organizationId, revokedBy, 'Educator removed from organization');
    return apiSuccess({ success: true, message: `${educator.first_name || ''} ${educator.last_name || ''}`.trim() || 'Educator' }, context.request);
  } else if (organizationType === 'college') {
    const { data: lecturer } = await supabase.from('college_lecturers').select('id, collegeId, email, first_name, last_name, user_id').eq('id', memberId).single();
    if (!lecturer) return apiSuccess({ success: false, message: 'Lecturer not found' }, context.request);
    if (lecturer.collegeId !== organizationId) return apiSuccess({ success: false, message: 'Lecturer does not belong to this organization' }, context.request);
    await supabase.from('college_lecturers').update({ collegeId: null }).eq('id', memberId);
    if (lecturer.user_id) await revokeMemberLicenses(supabase, lecturer.user_id, organizationId, revokedBy, 'Lecturer removed from organization');
    return apiSuccess({ success: true, message: `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim() || 'Lecturer' }, context.request);
  }
  return apiSuccess({ success: false, message: 'Unsupported operation' }, context.request);
}

async function revokeMemberLicenses(supabase: any, userId: string, organizationId: string, revokedBy?: string, reason = 'Member removed from organization') {
  const { data: pools } = await supabase.from('license_pools').select('id').eq('organization_id', organizationId);
  if (!pools || pools.length === 0) return;
  const poolIds = pools.map((p: any) => p.id);
  await supabase.from('license_assignments').update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: revokedBy || null, revocation_reason: reason }).eq('user_id', userId).in('license_pool_id', poolIds).eq('status', 'active');
}

// ============================================================================
// Dispatch
// ============================================================================

export async function handleOrganizationPost(context: AuthenticatedContext): Promise<Response> {
  try {
    const body: any = await context.request.json();
    const { action } = body;

    switch (action) {
      // License pools
      case 'createPool': return createPool(context, body);
      case 'updatePoolAllocation': return updatePoolAllocation(context, body);
      case 'assignLicense': return assignLicense(context, body);
      case 'unassignLicense': return unassignLicense(context, body);
      case 'transferLicense': return transferLicense(context, body);
      case 'configureAutoAssignment': return configureAutoAssignment(context, body);

      // Invitations
      case 'inviteMember': return inviteMember(context, body);
      case 'resendInvitation': return resendInvitation(context, body);
      case 'cancelInvitation': return cancelInvitation(context, body);
      case 'acceptInvitation': return acceptInvitation(context, body);
      case 'expireOldInvitations': return expireOldInvitations(context);

      // Organization CRUD
      case 'createOrganization': return createOrganizationHandler(context, body);
      case 'updateOrganization': return updateOrganizationHandler(context, body);
      case 'deleteOrganization': return deleteOrganizationHandler(context, body);
      case 'createLocalOrganization': return createLocalOrganizationHandler(context, body);
      case 'createOrganizationRecruitmentSettings': return createOrganizationRecruitmentSettingsHandler(context, body);

      // Member operations
      case 'removeMember': return removeMemberHandler(context, body);

      // Entitlements
      case 'grantEntitlement': return grantEntitlement(context, body);
      case 'revokeEntitlements': return revokeEntitlements(context, body);
      case 'bulkGrantEntitlements': return bulkGrantEntitlements(context, body);
      case 'bulkRevokeEntitlements': return bulkRevokeEntitlements(context, body);

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
    }
  } catch (error) {
    console.error('[Organization] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}

export async function handleOrganizationGet(context: AuthenticatedContext): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      // License pools
      case 'getLicensePools': return getLicensePools(context);
      case 'getUserAssignments': return getUserAssignments(context);
      case 'getPoolAssignments': return getPoolAssignments(context);

      // Invitations
      case 'getPendingInvitations': return getPendingInvitations(context);
      case 'getAllInvitations': return getAllInvitations(context);
      case 'getInvitationByToken': return getInvitationByToken(context);
      case 'getInvitationStats': return getInvitationStats(context);

      // Organization queries
      case 'getOrganizationById': return getOrganizationByIdHandler(context);
      case 'getOrganizationByAdminId': return getOrganizationByAdminIdHandler(context);
      case 'getOrganizations': return getOrganizationsHandler(context);
      case 'getOrganizationByEmail': return getOrganizationByEmailHandler(context);
      case 'checkOrganizationNameExists': return checkOrganizationNameExistsHandler(context);

      // Members
      case 'getMemberCounts': return getMemberCountsHandler(context);
      case 'getLearners': return getLearners(context);
      case 'getEducators': return getEducators(context);
      case 'getLicensedMembers': return getLicensedMembers(context);

      // Subscriptions
      case 'getSubscriptions': return getSubscriptions(context);
      case 'getPlansCache': return getPlansCache(context);

      // Organization name
      case 'getOrganizationName': return getOrganizationNameHandler(context);

      // Search
      case 'searchOrganizations': return searchOrganizationsHandler(context);

      // Entitlements
      case 'getUserEntitlements': return getUserEntitlementsHandler(context);
      case 'getOrganizationEntitlementStats': return getOrganizationEntitlementStatsHandler(context);

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
    }
  } catch (error) {
    console.error('[Organization] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
