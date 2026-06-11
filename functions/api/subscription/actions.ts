import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequest = async (context: any) => {
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;

  if (action === 'get-organization-by-name') {
    const { name } = body;
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', name)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-organization-domain') {
    const { domain } = body;
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .ilike('domain', domain)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'list-educator-emails') {
    const { organizationName } = body;
    const { data, error } = await supabase
      .from('school_educators')
      .select('email')
      .eq('organization_name', organizationName);
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data?.map((r: any) => r.email) ?? []);
  }

  if (action === 'list-lecturer-emails') {
    const { organizationName } = body;
    const { data, error } = await supabase
      .from('college_lecturers')
      .select('email')
      .eq('organization_name', organizationName);
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data?.map((r: any) => r.email) ?? []);
  }

  if (action === 'list-license-pools') {
    const { organizationId } = body;
    const { data, error } = await supabase
      .from('license_pools')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? []);
  }

  if (action === 'list-license-assignments') {
    const { organizationId } = body;
    const { data, error } = await supabase
      .from('license_assignments')
      .select('*')
      .order('assigned_at', { ascending: false });
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? []);
  }

  if (action === 'list-license-assignments-by-pool') {
    const { poolId } = body;
    const { data, error } = await supabase
      .from('license_assignments')
      .select('*')
      .eq('pool_id', poolId)
      .order('assigned_at', { ascending: false });
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? []);
  }

  if (action === 'get-license-assignment-stats') {
    const { organizationId } = body;
    const { data: pools, error: poolsError } = await supabase
      .from('license_pools')
      .select('id, total_licenses')
      .eq('organization_id', organizationId);
    if (poolsError) return apiDbError(poolsError, context.request);

    const poolIds = (pools || []).map((p: any) => p.id);
    const totalSeats = (pools || []).reduce((sum: number, p: any) => sum + (p.total_licenses || 0), 0);

    const { data: assignments, error: assignError } = await supabase
      .from('license_assignments')
      .select('pool_id, id')
      .in('pool_id', poolIds);
    if (assignError) return apiDbError(assignError, context.request);

    const assignedSeats = (assignments || []).length;
    const availableSeats = totalSeats - assignedSeats;

    const poolsWithUtilization = (pools || []).map((pool: any) => {
      const assigned = (assignments || []).filter((a: any) => a.pool_id === pool.id).length;
      return {
        ...pool,
        assigned,
        available: (pool.total_licenses || 0) - assigned,
      };
    });

    return apiSuccess({
      totalSeats,
      assignedSeats,
      availableSeats,
      pools: poolsWithUtilization,
    }, context.request);
  }

  if (action === 'get-user-by-id') {
    const { userId } = body;
    const { data, error } = await supabase
      .from('users')
      .select('id, firstName, lastName, phone, email')
      .eq('id', userId)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-organization-by-domain') {
    const { domain } = body;
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .ilike('domain', domain)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-school-by-user-id') {
    const { userId } = body;
    const { data, error } = await supabase
      .from('school_educators')
      .select('school_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-college-by-user-id') {
    const { userId } = body;
    const { data, error } = await supabase
      .from('college_lecturers')
      .select('collegeId')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-org-by-email-and-type') {
    const { email, organizationType } = body;
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('organization_type', organizationType)
      .ilike('email', email)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-org-by-admin-id') {
    const { adminId, organizationType } = body;
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('organization_type', organizationType)
      .eq('admin_id', adminId)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-org-details') {
    const { organizationId } = body;
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'create-license-pool') {
    const { organizationId, organizationType, subscriptionId, poolName, memberType, allocatedSeats, autoAssignNewMembers, createdBy } = body;
    const { data, error } = await supabase
      .from('license_pools')
      .insert({
        organization_id: organizationId,
        organization_type: organizationType,
        organization_subscription_id: subscriptionId,
        pool_name: poolName,
        member_type: memberType,
        allocated_seats: allocatedSeats,
        assigned_seats: 0,
        auto_assign_new_members: autoAssignNewMembers,
        is_active: true,
        created_by: createdBy,
      })
      .select()
      .single();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'update-license-pool') {
    const { poolId, ...updates } = body;
    const { error } = await supabase
      .from('license_pools')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', poolId);
    if (error) return apiDbError(error, context.request);
    return apiSuccess({ updated: true }, context.request);
  }

  if (action === 'delete-license-pool') {
    const { poolId } = body;
    const { error } = await supabase
      .from('license_pools')
      .delete()
      .eq('id', poolId);
    if (error) return apiDbError(error, context.request);
    return apiSuccess({ deleted: true }, context.request);
  }

  if (action === 'list-pool-assignments') {
    const { poolId } = body;
    const { data, error } = await supabase
      .from('license_assignments')
      .select(`
        id,
        user_id,
        assigned_at,
        users:user_id (id, email, first_name, last_name)
      `)
      .eq('license_pool_id', poolId)
      .eq('status', 'active');
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'revoke-license-assignment') {
    const { assignmentId, revokedBy, reason } = body;
    const { error } = await supabase
      .from('license_assignments')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
        revocation_reason: reason || 'Unassigned by admin',
      })
      .eq('id', assignmentId);
    if (error) return apiDbError(error, context.request);
    return apiSuccess({ revoked: true }, context.request);
  }

  return apiError(400, 'BAD_REQUEST', `Unknown action: ${action}`, context.request);
});
