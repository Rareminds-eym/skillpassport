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
    const rawAdminId = body.adminId || body.userId;
    const adminId = typeof rawAdminId === 'string' ? rawAdminId.trim() : '';
    const { organizationType, email } = body;
    if (!adminId) return apiSuccess(null, context.request);

    const findOrg = async (typeFilter?: string) => {
      let q = supabase.from('organizations').select('id').or(`admin_id.eq.${adminId},created_by.eq.${adminId}`);
      if (typeFilter) q = q.eq('organization_type', typeFilter);
      return (await q.maybeSingle()).data;
    };

    // 1. Direct admin_id or created_by match on organizations
    let org = await findOrg(organizationType);
    if (org?.id) return apiSuccess(org, context.request);

    // 2. Check users table for user's organizationId
    const { data: userRow } = await supabase.from('users').select('email, organizationId').eq('id', adminId).maybeSingle();
    const userOrgId = (userRow as { organizationId?: string; email?: string } | null)?.organizationId;
    if (userOrgId) return apiSuccess({ id: userOrgId }, context.request);

    // 3. Check organization_members
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', adminId).limit(1).maybeSingle();
    if (member?.organization_id) return apiSuccess({ id: member.organization_id }, context.request);

    // 4. Check by email (from body or userRow)
    const userEmail = email || userRow?.email;
    if (userEmail) {
      let eq = supabase.from('organizations').select('id').ilike('email', userEmail);
      if (organizationType) eq = eq.eq('organization_type', organizationType);
      const { data: emailOrg } = await eq.maybeSingle();
      if (emailOrg?.id) return apiSuccess(emailOrg, context.request);
    }

    // 5. Check college_lecturers
    const { data: college } = await supabase.from('college_lecturers').select('collegeId').eq('user_id', adminId).maybeSingle();
    if (college?.collegeId) return apiSuccess({ id: college.collegeId }, context.request);

    // 6. Check school_educators
    const { data: school } = await supabase.from('school_educators').select('school_id').eq('user_id', adminId).maybeSingle();
    if (school?.school_id) return apiSuccess({ id: school.school_id }, context.request);

    // 7. Check organizations without organization_type filter (broad fallback)
    if (organizationType && (org = await findOrg())) return apiSuccess(org, context.request);

    return apiSuccess(null, context.request);
  }

  if (action === 'get-org-details') {
    const { organizationId } = body;
    if (!organizationId) {
      return apiSuccess(null, context.request);
    }
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'create-license-pool') {
    const { organizationId, organizationType, poolName, memberType, allocatedSeats, autoAssignNewMembers, createdBy } = body;
    let subId = body.organizationSubscriptionId || body.subscriptionId || body.organization_subscription_id;

    if (!subId) {
      const fetchSub = async (orgId?: string) => {
        let q = supabase.from('subscription_cache').select('id').in('status', ['active', 'pending']).order('created_at', { ascending: false }).limit(1);
        if (orgId) q = q.eq('organization_id', orgId);
        return (await q.maybeSingle()).data;
      };
      const primarySub = organizationId ? await fetchSub(organizationId) : null;
      subId = primarySub?.id || (await fetchSub())?.id;
    }

    const { data, error } = await supabase
      .from('license_pools')
      .insert({
        organization_id: organizationId,
        organization_type: organizationType,
        organization_subscription_id: subId,
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
    const { action: _act, poolId, ...updates } = body;
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
    const { data: assignments, error } = await supabase
      .from('license_assignments')
      .select('id, user_id, assigned_at')
      .eq('license_pool_id', poolId)
      .eq('status', 'active');

    if (error) return apiDbError(error, context.request);
    if (!assignments?.length) return apiSuccess([], context.request);

    const userIds = assignments.map((a: { user_id?: string }) => a.user_id).filter((id): id is string => Boolean(id));

    const [usersRes, learnersRes] = await Promise.all([
      supabase.from('users').select('id, email, firstName, lastName').in('id', userIds),
      supabase.from('learners').select('user_id, email, name').in('user_id', userIds),
    ]);

    if (usersRes.error) return apiDbError(usersRes.error, context.request);
    if (learnersRes.error) return apiDbError(learnersRes.error, context.request);

    const usersData = usersRes.data || [];
    const learnersData = learnersRes.data || [];

    const userMap = new Map<string, { id: string; email: string; full_name: string; name: string }>();
    usersData.forEach((u: { id: string; email?: string; firstName?: string; lastName?: string }) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
      if (name) userMap.set(u.id, { id: u.id, email: u.email || '', full_name: name, name });
    });

    learnersData.forEach((l: { user_id?: string; email?: string; name?: string }) => {
      if (l.user_id) {
        const existing = userMap.get(l.user_id);
        const name = l.name || existing?.full_name || l.email || 'Learner';
        const email = l.email || existing?.email || '';
        userMap.set(l.user_id, { id: l.user_id, email, full_name: name, name });
      }
    });

    const mapped = assignments.map((a: { id: string; user_id: string; [key: string]: unknown }) => {
      const userInfo = userMap.get(a.user_id) || { id: a.user_id, email: '', full_name: 'Learner', name: 'Learner' };
      return { ...a, user: userInfo, users: userInfo, full_name: userInfo.full_name, name: userInfo.name };
    });

    return apiSuccess(mapped, context.request);
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
