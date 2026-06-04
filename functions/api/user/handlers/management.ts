import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../../lib/response';

export async function handleGetProfileExtended(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'userId required', request);

  const { data, error } = await supabase.from('user_profile_extended').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') return apiDbError(error, request);
  return apiSuccess({ profile: data }, request);
}

export async function handleUpsertProfileExtended(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const body: any = await request.json().catch(() => ({}));
  const { user_id, ...profileData } = body;
  if (!user_id) return apiError(400, 'VALIDATION_ERROR', 'user_id required', request);

  const { data, error } = await supabase
    .from('user_profile_extended')
    .upsert({ user_id, ...profileData })
    .select()
    .single();
  if (error) return apiDbError(error, request);
  return apiSuccess({ profile: data }, request);
}

export async function handleChangeRole(request: Request, env: Record<string, unknown>, currentUserId: string): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const body: any = await request.json().catch(() => ({}));
  const { user_id, new_role, reason } = body;
  if (!user_id || !new_role) return apiError(400, 'VALIDATION_ERROR', 'user_id and new_role required', request);

  const { error } = await supabase.rpc('change_user_role', {
    p_user_id: user_id,
    p_new_role: new_role,
    p_reason: reason,
    p_changed_by: currentUserId,
  });
  if (error) return apiDbError(error, request);
  return apiSuccess({ changed: true }, request);
}

export async function handleLogActivity(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const body: any = await request.json().catch(() => ({}));
  const { user_id, activity_type, description, metadata } = body;
  if (!user_id || !activity_type) return apiError(400, 'VALIDATION_ERROR', 'user_id and activity_type required', request);

  const { error } = await supabase.rpc('log_user_activity', {
    p_user_id: user_id,
    p_activity_type: activity_type,
    p_description: description || '',
    p_metadata: metadata || {},
  });
  if (error) return apiDbError(error, request);
  return apiSuccess({ logged: true }, request);
}

export async function handleGetUser(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const url = new URL(request.url);
  const userId = url.searchParams.get('id');
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'id required', request);

  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error && error.code !== 'PGRST116') return apiDbError(error, request);
  return apiSuccess({ user: data }, request);
}

export async function handleListUsers(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const url = new URL(request.url);
  const role = url.searchParams.get('role');
  const search = url.searchParams.get('search');
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  if (isNaN(limit) || limit < 1) return apiError(400, 'VALIDATION_ERROR', 'limit must be a positive integer', request);
  if (isNaN(offset) || offset < 0) return apiError(400, 'VALIDATION_ERROR', 'offset must be a non-negative integer', request);

  let query = supabase.from('users').select('*', { count: 'exact' }).order('createdAt', { ascending: false });
  if (role) {
    const roles = role.split(',');
    if (roles.length === 1) query = query.eq('role', roles[0]);
    else query = query.in('role', roles);
  }
  if (search) query = query.or(`email.ilike.%${search}%,firstName.ilike.%${search}%,lastName.ilike.%${search}%`);
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return apiDbError(error, request);
  return apiSuccess({ users: data || [], total: count }, request);
}

export async function handleGetUserStats(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const { data: users, error } = await supabase.from('users').select('role, isActive');
  if (error) return apiDbError(error, request);

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u: any) => u.isActive).length || 0,
    inactive: users?.filter((u: any) => !u.isActive).length || 0,
    by_role: {} as Record<string, number>,
  };
  users?.forEach((u: any) => {
    stats.by_role[u.role] = (stats.by_role[u.role] || 0) + 1;
  });
  return apiSuccess(stats, request);
}

export async function handleGetUserActivity(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  if (isNaN(limit) || limit < 1) return apiError(400, 'VALIDATION_ERROR', 'limit must be a positive integer', request);
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'userId required', request);

  const { data, error } = await supabase
    .from('user_activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return apiDbError(error, request);
  return apiSuccess({ activities: data || [] }, request);
}

export async function handleGetUserDocuments(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'userId required', request);

  const { data, error } = await supabase
    .from('user_documents')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });
  if (error) return apiDbError(error, request);
  return apiSuccess({ documents: data || [] }, request);
}

export async function handleUpdateUser(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const body: any = await request.json().catch(() => ({}));
  const { id, ...userData } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', request);

  const { data, error } = await supabase.from('users').update(userData).eq('id', id).select().single();
  if (error) return apiDbError(error, request);
  return apiSuccess({ user: data }, request);
}

export async function handleDeleteUser(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', request);

  const { error } = await supabase.from('users').update({ isActive: false }).eq('id', id);
  if (error) return apiDbError(error, request);
  return apiSuccess({ deleted: true }, request);
}

export async function handleGetRoleHistory(request: Request, env: Record<string, unknown>): Promise<Response> {
  const supabase = getServiceClient(env as any);
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'userId required', request);

  const { data, error } = await supabase
    .from('user_role_history')
    .select('*')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });
  if (error) return apiDbError(error, request);
  return apiSuccess({ history: data || [] }, request);
}
