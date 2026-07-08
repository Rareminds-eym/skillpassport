import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

const getSub = (context: AuthenticatedContext) => getServiceClient(context.env as any);


export async function handleSaveMentorNote(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { learner_id, mentor_type, school_educator_id, college_lecturer_id, quick_notes, feedback, action_points } = params;
  if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
  const { data, error } = await supabase.from('mentor_notes').insert([{
    learner_id, mentor_type, school_educator_id, college_lecturer_id,
    quick_notes, feedback, action_points,
  }]).select();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleGetMentorLearners(context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { data, error } = await supabase.from('learners').select('id, name').order('name', { ascending: true });
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetMentorNotes(context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { data, error } = await supabase.from('mentor_notes').select('*, learners(name)').order('note_date', { ascending: false });
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleListMentorNotes(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { select, filters } = params;
  if (!filters?.learner_id?.in) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id filter', context.request, { startTime });
  let notesQuery = supabase.from('mentor_notes').select(select || '*').in('learner_id', filters.learner_id.in);
  if (filters.note_date?.order) notesQuery = notesQuery.order('note_date', { ascending: filters.note_date.order === 'asc' });
  const { data, error } = await notesQuery;
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleUpdateMentorNote(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { id, values } = params;
  if (!id || !values) return apiError(400, 'VALIDATION_ERROR', 'Missing id or values', context.request, { startTime });
  const { data, error } = await supabase.from('mentor_notes').update(values).eq('id', id).select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}






