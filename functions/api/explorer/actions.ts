import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      case 'table-samples': {
        const queries: Record<string, { select: string; table: string; limit: number }> = {
          learners: { table: 'learners', select: 'id, name, email, college_school_name, grade', limit: 5 },
          courses: { table: 'courses', select: 'course_id, title, code, status, duration', limit: 5 },
          opportunities: { table: 'opportunities', select: 'id, title, company_name, employment_type, location', limit: 5 },
        };

        const results: Record<string, { count: number; sample: any[]; columns: string[] }> = {};

        for (const [name, cfg] of Object.entries(queries)) {
          const q = supabase.from(cfg.table).select(cfg.select).limit(cfg.limit);
          const { data, error } = await q;
          if (!error && data) {
            results[name] = {
              count: data.length,
              sample: data,
              columns: data.length > 0 ? Object.keys(data[0]) : [],
            };
          } else {
            results[name] = { count: 0, sample: [], columns: [] };
          }
        }

        return apiSuccess(results, context.request, { startTime });
      }

      case 'role-debug': {
        const { email, userId } = params;
        const result: Record<string, any> = {};

        if (email) {
          const { data: teacher, error: teacherError } = await supabase
            .from('teachers').select('*').eq('email', email).maybeSingle();
          result.teacher = teacherError ? { error: teacherError.message } : teacher;
        }

        if (userId) {
          const { data: educator, error: educatorError } = await supabase
            .from('school_educators').select('*').eq('user_id', userId).maybeSingle();
          result.educator = educatorError ? { error: educatorError.message } : educator;
        }

        return apiSuccess(result, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[explorer/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
