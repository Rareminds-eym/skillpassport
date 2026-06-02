import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json(); } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action field', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'get-college-lecturer-by-email': {
        const { email, select: selectField } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const q = selectField ? supabase.from('college_lecturers').select(selectField) : supabase.from('college_lecturers').select('*');
        const { data, error } = await q.eq('email', email).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-org-by-admin-or-email': {
        const { adminId, email, select: selectField } = params;
        if (!adminId && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing adminId or email', context.request, { startTime });
        let q = selectField ? supabase.from('organizations').select(selectField) : supabase.from('organizations').select('id');
        q = q.eq('organization_type', 'college');
        if (adminId && email) {
          q = q.or(`admin_id.eq.${adminId},email.ilike.${email}`);
        } else if (adminId) {
          q = q.eq('admin_id', adminId);
        } else if (email) {
          q = q.eq('email', email);
        }
        const { data, error } = await q.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-college-lecturer-by-user-id': {
        const { userId, select: selectField } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const q = selectField ? supabase.from('college_lecturers').select(selectField) : supabase.from('college_lecturers').select('*');
        const { data, error } = await q.eq('user_id', userId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-org-by-filters': {
        const { select: selectField, filters, limit: queryLimit } = params;
        let q = selectField ? supabase.from('organizations').select(selectField) : supabase.from('organizations').select('id');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (typeof value === 'object' && value !== null) {
              const v = value as Record<string, any>;
              if (v.eq) q = q.eq(key, v.eq);
              if (v.ilike) q = q.ilike(key, v.ilike);
              if (v.or) q = q.or(v.or);
            } else {
              q = q.eq(key, value);
            }
          }
        }
        if (queryLimit) q = q.limit(queryLimit);
        const { data, error } = await q.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[college-admin/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
