/**
 * College Admin - Marks & Mark Entries API
 * GET: Fetch marks (original table)
 * POST: Action-based dispatch for mark_entries CRUD + workflows
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const learnerId = url.searchParams.get('learner_id');
  const semester = url.searchParams.get('semester');

  let query = supabase.from('marks').select('*').order('created_at', { ascending: false });
  if (learnerId) query = query.eq('learner_id', learnerId);
  if (semester) query = query.eq('semester', semester);

  const { data, error } = await query;
  if (error) return apiDbError(error, context.request);
  return apiSuccess({ marks: data }, context.request);
});

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
  const startTime = Date.now();

  try {
    if (!action) {
      const { data, error } = await supabase.from('marks').upsert(params).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ mark: data }, context.request);
    }

    switch (action) {
      case 'validate-assessment': {
        const { assessment_id, marks_obtained } = params;
        const { data: assessment, error } = await supabase.from('assessments').select('total_marks').eq('id', assessment_id).single();
        if (error) return apiDbError(error, context.request, { startTime });
        if (marks_obtained !== undefined && (marks_obtained < 0 || marks_obtained > assessment.total_marks)) {
          return apiError(400, 'VALIDATION_ERROR', `Marks must be between 0 and ${assessment.total_marks}`, context.request, { startTime });
        }
        return apiSuccess({ valid: true, total_marks: assessment.total_marks }, context.request, { startTime });
      }

      case 'enter-marks': {
        const entries: any[] = params.entries || [];
        const validEntries: any[] = [];
        for (const entry of entries) {
          const { data: assessment, error: assessError } = await supabase.from('assessments').select('total_marks').eq('id', entry.assessment_id).single();
          if (assessError) continue;
          if (entry.marks_obtained !== undefined && (entry.marks_obtained < 0 || entry.marks_obtained > assessment.total_marks)) continue;
          validEntries.push(entry);
        }
        if (validEntries.length !== entries.length) {
          return apiError(400, 'VALIDATION_ERROR', 'Some mark entries are invalid', context.request, { startTime });
        }
        const { data, error } = await supabase.from('mark_entries').upsert(validEntries).select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'submit-marks': {
        const { assessment_id } = params;
        const { error } = await supabase.from('mark_entries').update({ is_locked: true }).eq('assessment_id', assessment_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'lock-marks': {
        const { assessment_id } = params;
        const { error } = await supabase.from('mark_entries').update({ is_locked: true }).eq('assessment_id', assessment_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'moderate-marks': {
        const { entry_id, marks_obtained, reason, moderated_by } = params;
        if (!reason?.trim()) {
          return apiError(400, 'VALIDATION_ERROR', 'Reason is required for mark moderation', context.request, { startTime });
        }
        const { error } = await supabase.from('mark_entries').update({
          marks_obtained, moderated_by, moderation_reason: reason, moderated_at: new Date().toISOString(),
        }).eq('id', entry_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'publish-results': {
        const { assessment_id } = params;
        const { error: assessUpdateError } = await supabase.from('assessments').update({ status: 'completed' }).eq('id', assessment_id);
        if (assessUpdateError) return apiDbError(assessUpdateError, context.request, { startTime });

        const { data: entries } = await supabase.from('mark_entries').select('id, marks_obtained, assessment_id').eq('assessment_id', assessment_id);
        const { data: assessment } = await supabase.from('assessments').select('total_marks').eq('id', assessment_id).single();
        if (!assessment) return apiError(404, 'NOT_FOUND', 'Assessment not found', context.request, { startTime });

        for (const entry of entries || []) {
          const percentage = (entry.marks_obtained / assessment.total_marks) * 100;
          const grade = percentage >= 90 ? 'O' : percentage >= 80 ? 'A+' : percentage >= 70 ? 'A' : percentage >= 60 ? 'B+' : percentage >= 50 ? 'B' : percentage >= 40 ? 'C' : 'F';
          await supabase.from('mark_entries').update({ grade }).eq('id', entry.id);
        }
        return apiSuccess(null, context.request, { startTime });
      }

      case 'get-mark-entries': {
        let query = supabase.from('mark_entries').select('*');
        if (params.assessment_id) query = query.eq('assessment_id', params.assessment_id);
        if (params.learner_id) query = query.eq('learner_id', params.learner_id);
        if (params.is_locked !== undefined) query = query.eq('is_locked', params.is_locked);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[marks POST] action=${action || 'upsert'}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
