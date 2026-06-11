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
      case 'get-circulars': {
        const { college_id, status, priority, search } = params;
        let query = supabase
          .from('college_circulars')
          .select('*');
        if (college_id) query = query.eq('college_id', college_id);
        if (status && status !== 'all') query = query.eq('status', status);
        if (priority && priority !== 'all') query = query.eq('priority', priority);
        if (search) {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,audience.ilike.%${search}%`);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const result = (data || []).map((c: any) => ({ ...c, creator_name: c.created_by || 'College Admin' }));
        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-circular-by-id': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_circulars')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ ...data, creator_name: 'College Admin' }, context.request, { startTime });
      }

      case 'create-circular': {
        const { data, error } = await supabase
          .from('college_circulars')
          .insert([{ ...params, created_by: user.id }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-circular': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_circulars')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-circular': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('college_circulars')
          .delete()
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'toggle-circular-status': {
        const { id, current_status } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const newStatus = current_status === 'published' ? 'draft' : 'published';
        const { data, error } = await supabase
          .from('college_circulars')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-circulars-stats': {
        const { college_id } = params;
        let query = supabase.from('college_circulars').select('status, priority');
        if (college_id) query = query.eq('college_id', college_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        const stats = {
          total: data?.length || 0,
          published: (data || []).filter((c: any) => c.status === 'published').length,
          draft: (data || []).filter((c: any) => c.status === 'draft').length,
          urgent_priority: (data || []).filter((c: any) => c.priority === 'urgent').length,
        };
        return apiSuccess(stats, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[college-circulars POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
