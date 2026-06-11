/**
 * College Admin - Circulars API
 * POST: Action-based dispatch for circular CRUD + recipients + RPCs
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      case 'create': {
        const { data, error } = await supabase.from('circulars').insert([{ ...params, created_by: user.id, status: 'draft' }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase.from('circulars').update(updates).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'publish': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase.from('circulars').update({ status: 'published', published_at: new Date().toISOString(), publish_date: new Date().toISOString() }).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        const { error: rpcError } = await supabase.rpc('create_circular_recipients', { p_circular_id: id });
        if (rpcError) console.error(`[circulars] RPC create_circular_recipients failed:`, rpcError);
        return apiSuccess(data, context.request, { startTime });
      }

      case 'archive': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase.from('circulars').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('circulars').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'get': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase.from('circulars').select('*').eq('id', id).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-all': {
        let query = supabase.from('circulars').select('*').order('created_at', { ascending: false });
        if (params.status) query = query.eq('status', params.status);
        if (params.college_id) query = query.eq('college_id', params.college_id);
        if (params.search) query = query.or(`title.ilike.%${params.search}%,message.ilike.%${params.search}%`);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-my': {
        const { data, error } = await supabase.from('circulars').select('*, circular_recipients!inner(is_read, read_at)').eq('circular_recipients.user_id', user.id).eq('status', 'published').order('publish_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-unread-count': {
        const { count, error } = await supabase.from('circular_recipients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'mark-read': {
        const { circular_id } = params;
        const { error } = await supabase.rpc('mark_circular_read', { p_circular_id: circular_id, p_user_id: user.id });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'get-stats': {
        const { circular_id } = params;
        const { data: recipients, error: rError } = await supabase.from('circular_recipients').select('is_read').eq('circular_id', circular_id);
        if (rError) return apiDbError(rError, context.request, { startTime });
        const total = recipients?.length || 0;
        const read = recipients?.filter((r: any) => r.is_read).length || 0;
        return apiSuccess({ total_recipients: total, read_count: read, unread_count: total - read, read_percentage: total > 0 ? Math.round((read / total) * 1000) / 10 : 0 }, context.request, { startTime });
      }

      case 'auto-expire': {
        const { error } = await supabase.rpc('auto_expire_circulars');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[circulars POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
