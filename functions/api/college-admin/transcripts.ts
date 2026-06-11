/**
 * College Admin - Transcripts API
 * GET: Fetch transcripts (original)
 * POST: Action-based dispatch for transcript CRUD + workflows
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

  let query = supabase.from('transcripts').select('*').order('created_at', { ascending: false });
  if (learnerId) query = query.eq('learner_id', learnerId);

  const { data, error } = await query;
  if (error) return apiDbError(error, context.request);
  return apiSuccess({ transcripts: data }, context.request);
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
    switch (action) {
      case 'generate': {
        if (!params.learner_id || !params.semester_from || !params.semester_to) {
          return apiError(400, 'VALIDATION_ERROR', 'Learner ID and semester range are required', context.request, { startTime });
        }
        let verificationId: string | undefined;
        if (params.include_qr) {
          verificationId = `TR${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const { data: existing } = await supabase.from('transcripts').select('id').eq('verification_id', verificationId).single();
          if (existing) verificationId = `TR${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        }
        const { data, error } = await supabase.from('transcripts').insert([{ ...params, verification_id: verificationId, status: 'draft', generated_at: new Date().toISOString() }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'batch-generate': {
        let learnerQuery = supabase.from('learner_admissions').select('user_id, roll_number');
        if (params.department_id) learnerQuery = learnerQuery.eq('department_id', params.department_id);
        if (params.program_id) learnerQuery = learnerQuery.eq('program_id', params.program_id);
        if (params.type === 'final') learnerQuery = learnerQuery.eq('status', 'graduated');
        const { data: learners } = await learnerQuery;

        const transcripts: any[] = [];
        for (const learner of learners || []) {
          const { data: admission } = await supabase.from('learner_admissions').select('program_id, current_semester').eq('user_id', learner.user_id).single();
          if (!admission) continue;
          const { data: program } = await supabase.from('programs').select('duration_semesters').eq('id', admission.program_id).single();
          const semesterTo = params.type === 'final' ? (program?.duration_semesters || 8) : (admission.current_semester || 1);
          const verificationId = `TR${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const { data: t } = await supabase.from('transcripts').insert([{ learner_id: learner.user_id, type: params.type, semester_from: 1, semester_to: semesterTo, include_qr: true, verification_id: verificationId, status: 'draft', generated_at: new Date().toISOString() }]).select().single();
          if (t) transcripts.push(t);
        }
        return apiSuccess(transcripts, context.request, { startTime });
      }

      case 'approve': {
        const { id, approved_by } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('transcripts').update({ status: 'approved', approved_by, approved_at: new Date().toISOString() }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'publish': {
        const { id } = params;
        const { data: transcript, error: fetchError } = await supabase.from('transcripts').select('status').eq('id', id).single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (transcript.status !== 'approved') {
          return apiError(400, 'INVALID_STATE', 'Transcript must be approved before publishing', context.request, { startTime });
        }
        const { error } = await supabase.from('transcripts').update({ status: 'published' }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'verify': {
        const { verification_id } = params;
        const { data: transcript, error: tError } = await supabase.from('transcripts').select('*').eq('verification_id', verification_id).single();
        if (tError) return apiDbError(tError, context.request, { startTime });
        const { data: admission } = await supabase.from('learner_admissions').select('roll_number, program_id, user_id, cgpa').eq('user_id', transcript.learner_id).single();
        const { data: user } = await supabase.from('users').select('name').eq('id', transcript.learner_id).single();
        const { data: program } = await supabase.from('programs').select('name').eq('id', admission.program_id).single();
        const { data: markEntries } = await supabase.from('mark_entries').select('grade, assessment_id').eq('learner_id', transcript.learner_id);

        return apiSuccess({
          learner: { name: user?.name || '', roll_number: admission?.roll_number || '', program: program?.name || '' },
          semesters: [],
          cgpa: admission?.cgpa || 0,
        }, context.request, { startTime });
      }

      case 'get-transcripts': {
        let query = supabase.from('transcripts').select('*');
        if (params.learner_id) query = query.eq('learner_id', params.learner_id);
        if (params.type) query = query.eq('type', params.type);
        if (params.status) query = query.eq('status', params.status);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[transcripts POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
