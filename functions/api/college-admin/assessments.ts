/**
 * College Admin - Assessments & Timetable API
 * GET: Fetch assessments (original)
 * POST: Action-based dispatch for assessments + exam_timetable operations
 */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import { CollegeAssessmentError, prepareCollegeAssessment, presentCollegeAssessment } from '../../lib/college-assessments';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const account = await supabase.from('users').select('organizationId').eq('id', user.id).maybeSingle();
  if (account.error) return apiDbError(account.error, context.request);
  if (!account.data?.organizationId) return apiError(403, 'AFFILIATION_ERROR', 'A college affiliation is required.', context.request);

  const { data, error, count } = await supabase
    .from('assessments')
    .select('*', { count: 'exact' })
    .eq('college_id', account.data.organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return apiDbError(error, context.request);
  return apiSuccess({ assessments: (data || []).map(presentCollegeAssessment), total: count }, context.request);
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
    const account = await supabase.from('users').select('organizationId').eq('id', user.id).maybeSingle();
    if (account.error) return apiDbError(account.error, context.request, { startTime });
    const collegeId = account.data?.organizationId;
    if (!collegeId) return apiError(403, 'AFFILIATION_ERROR', 'A college affiliation is required.', context.request, { startTime });
    // No action → original upsert on assessments
    if (!action) {
      let existing;
      if (params.id) {
        const found = await supabase.from('assessments').select('*').eq('id', params.id).eq('college_id', collegeId).maybeSingle();
        if (found.error) return apiDbError(found.error, context.request, { startTime });
        if (!found.data) return apiError(404, 'NOT_FOUND', 'Assessment not found in your college.', context.request, { startTime });
        existing = found.data;
      }
      const prepared = await prepareCollegeAssessment(supabase, collegeId, params, existing);
      const { data, error } = await supabase.from('assessments').upsert({ ...prepared, created_by: existing?.created_by || user.id }).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ assessment: presentCollegeAssessment(data) }, context.request);
    }

    switch (action) {
      case 'create-assessment': {
        const prepared = await prepareCollegeAssessment(supabase, collegeId, params);
        const { data, error } = await supabase.from('assessments').insert([{ ...prepared, status: 'draft', created_by: user.id }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(presentCollegeAssessment(data), context.request, { startTime });
      }

      case 'update-assessment': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const found = await supabase.from('assessments').select('*').eq('id', id).eq('college_id', collegeId).maybeSingle();
        if (found.error) return apiDbError(found.error, context.request, { startTime });
        if (!found.data) return apiError(404, 'NOT_FOUND', 'Assessment not found in your college.', context.request, { startTime });
        const prepared = await prepareCollegeAssessment(supabase, collegeId, updates, found.data);
        const { data, error } = await supabase.from('assessments').update({ ...prepared, created_by: found.data.created_by }).eq('id', id).eq('college_id', collegeId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(presentCollegeAssessment(data), context.request, { startTime });
      }

      case 'submit-to-exam-cell': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('assessments').update({ status: 'scheduled' }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'approve-assessment': {
        const { id, approved_by } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('assessments').update({ approved_by }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'get-assessments': {
        let query = supabase.from('assessments').select('*').eq('college_id', collegeId);
        if (params.type) query = query.eq('type', params.type);
        if (params.academic_year) query = query.eq('academic_year', params.academic_year);
        if (params.department_id) query = query.eq('department_id', params.department_id);
        if (params.program_id) query = query.eq('program_id', params.program_id);
        if (params.semester) query = query.eq('semester', params.semester);
        if (params.status) query = query.eq('status', params.status);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess((data || []).map(presentCollegeAssessment), context.request, { startTime });
      }

      // ── Timetable ──
      case 'create-exam-slot': {
        const { data, error } = await supabase.from('exam_timetable').insert([params]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-exam-slots': {
        const { assessment_id } = params;
        let query = supabase.from('exam_timetable').select('*');
        if (assessment_id) query = query.eq('assessment_id', assessment_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'assign-invigilator': {
        const { slot_id, faculty_id } = params;
        const { data: slot, error: fetchError } = await supabase.from('exam_timetable').select('*').eq('id', slot_id).single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        const { data: conflictingSlots, error: conflictError } = await supabase.from('exam_timetable').select('*').eq('exam_date', slot.exam_date).contains('invigilators', [faculty_id]).neq('id', slot_id);
        if (conflictError) return apiDbError(conflictError, context.request, { startTime });

        if (conflictingSlots?.length) {
          for (const conflictSlot of conflictingSlots) {
            const start1 = new Date(`${slot.exam_date}T${slot.start_time}`).getTime();
            const end1 = new Date(`${slot.exam_date}T${slot.end_time}`).getTime();
            const start2 = new Date(`${conflictSlot.exam_date}T${conflictSlot.start_time}`).getTime();
            const end2 = new Date(`${conflictSlot.exam_date}T${conflictSlot.end_time}`).getTime();
            if (start1 < end2 && end1 > start2) {
              return apiError(409, 'CONFLICT', 'Faculty member is already assigned to another exam at this time', context.request, { startTime });
            }
          }
        }

        const updatedInvigilators = [...(slot.invigilators || []), faculty_id];
        const { error } = await supabase.from('exam_timetable').update({ invigilators: updatedInvigilators }).eq('id', slot_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'publish-timetable': {
        const { assessment_id } = params;
        const { data: slots, error: fetchError } = await supabase.from('exam_timetable').select('*').eq('assessment_id', assessment_id);
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        const conflicts: Array<{ type: string; message: string }> = [];
        for (let i = 0; i < (slots || []).length; i++) {
          for (let j = i + 1; j < (slots || []).length; j++) {
            const a = slots![i], b = slots![j];
            if (a.exam_date !== b.exam_date) continue;
            const s1 = new Date(`${a.exam_date}T${a.start_time}`).getTime();
            const e1 = new Date(`${a.exam_date}T${a.end_time}`).getTime();
            const s2 = new Date(`${b.exam_date}T${b.start_time}`).getTime();
            const e2 = new Date(`${b.exam_date}T${b.end_time}`).getTime();
            if (s1 >= e2 || e1 <= s2) continue;
            if (a.room && b.room && a.room === b.room) conflicts.push({ type: 'room', message: `Room ${a.room} is double-booked` });
            if (a.batch_section && b.batch_section && a.batch_section === b.batch_section) conflicts.push({ type: 'learner_batch', message: `Batch ${a.batch_section} has overlapping exams` });
          }
        }

        if (conflicts.length > 0) {
          return apiError(409, 'CONFLICT', `Cannot publish timetable with ${conflicts.length} conflicts`, context.request, { startTime });
        }

        const { error } = await supabase.from('assessments').update({ status: 'ongoing' }).eq('id', assessment_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    if (error instanceof CollegeAssessmentError) return apiError(error.status, error.status === 403 ? 'FORBIDDEN' : 'VALIDATION_ERROR', error.message, context.request, { startTime });
    console.error(`[assessments POST] action=${action || 'upsert'}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
