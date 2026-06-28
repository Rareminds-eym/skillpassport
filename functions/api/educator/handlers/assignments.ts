import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

const getSub = (context: AuthenticatedContext) => getServiceClient(context.env as any);

export async function handleGetEducatorAssignedClassIds(params: any, context: AuthenticatedContext, startTime: number) {
const supabase = getSub(context);
  const { educatorId } = params;
  if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId', context.request, { startTime });
  const { data, error } = await supabase.from('school_educator_class_assignments').select('class_id').eq('educator_id', educatorId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess((data || []).map((a: any) => a.class_id), context.request, { startTime });
}

export async function handleCreateAssignment(params: any, context: AuthenticatedContext, startTime: number) {
const supabase = getSub(context);
  const { assignmentData } = params;
  if (!assignmentData) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentData', context.request, { startTime });
  const { data, error } = await supabase.from('assignments').insert([{
    title: assignmentData.title, description: assignmentData.description,
    instructions: assignmentData.instructions, course_name: assignmentData.course_name,
    course_code: assignmentData.course_code, educator_id: assignmentData.educator_id,
    educator_name: assignmentData.educator_name, total_points: assignmentData.total_points || 100,
    assignment_type: assignmentData.assignment_type, skill_outcomes: assignmentData.skill_outcomes,
    assign_classes: assignmentData.assign_classes, school_class_id: assignmentData.school_class_id || null,
    document_pdf: assignmentData.document_pdf, due_date: assignmentData.due_date,
    available_from: assignmentData.available_from,
    allow_late_submission: assignmentData.allow_late_submission ?? true,
  }]).select().single();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleCreateAssignmentsForClasses(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { baseData, classIds } = params;
  if (!baseData || !classIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing baseData or classIds', context.request, { startTime });
  const toInsert = classIds.map((classId: string) => ({
    title: baseData.title, description: baseData.description, instructions: baseData.instructions,
    course_name: baseData.course_name, course_code: baseData.course_code,
    educator_id: baseData.educator_id, educator_name: baseData.educator_name,
    total_points: baseData.total_points || 100, assignment_type: baseData.assignment_type,
    skill_outcomes: baseData.skill_outcomes, assign_classes: classId, school_class_id: classId,
    document_pdf: baseData.document_pdf, due_date: baseData.due_date,
    available_from: baseData.available_from, allow_late_submission: baseData.allow_late_submission ?? true,
  }));
  const { data, error } = await supabase.from('assignments').insert(toInsert).select();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetAssignmentsByEducator(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { educatorId } = params;
  if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId', context.request, { startTime });
  const { data, error } = await supabase
    .from('assignments')
    .select('*, assignment_attachments (*), school_classes (id, name, grade, section)')
    .eq('educator_id', educatorId).eq('is_deleted', false)
    .order('created_date', { ascending: false });
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetAssignmentById(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { assignmentId } = params;
  if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
  const { data, error } = await supabase
    .from('assignments')
    .select('*, assignment_attachments (*)')
    .eq('assignment_id', assignmentId).single();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleUpdateAssignment(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { assignmentId, updates } = params;
  if (!assignmentId || !updates) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId or updates', context.request, { startTime });
  const { data, error } = await supabase.from('assignments').update({
    ...updates, updated_date: new Date().toISOString(),
  }).eq('assignment_id', assignmentId).select().single();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleDeleteAssignment(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { assignmentId } = params;
  if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
  const { error } = await supabase.from('assignments').update({
    is_deleted: true, updated_date: new Date().toISOString(),
  }).eq('assignment_id', assignmentId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ deleted: true }, context.request, { startTime });
}

export async function handleAddAssignmentAttachment(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { assignmentId, attachmentData } = params;
  if (!assignmentId || !attachmentData) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId or attachmentData', context.request, { startTime });
  const { data, error } = await supabase.from('assignment_attachments').insert([{
    assignment_id: assignmentId, file_name: attachmentData.file_name,
    file_type: attachmentData.file_type, file_size: attachmentData.file_size,
    file_url: attachmentData.file_url,
  }]).select().single();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleRemoveAssignmentAttachment(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { attachmentId } = params;
  if (!attachmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing attachmentId', context.request, { startTime });
  const { error } = await supabase.from('assignment_attachments').delete().eq('attachment_id', attachmentId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ deleted: true }, context.request, { startTime });
}

export async function handleAssignToLearners(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { assignmentId, learnerIds } = params;
  if (!assignmentId || !learnerIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId or learnerIds', context.request, { startTime });

  const { data: existing } = await supabase.from('learner_assignments').select('learner_id').eq('assignment_id', assignmentId).in('learner_id', learnerIds);
  const existingIds = new Set((existing || []).map((a: any) => a.learner_id));
  const newIds = learnerIds.filter((id: string) => !existingIds.has(id));
  if (newIds.length === 0) return apiSuccess([], context.request, { startTime });

  const { data: userIdMappings } = await supabase.from('learners').select('id, user_id').in('id', newIds);
  const mapped = (userIdMappings || []).map((s: any) => ({
    assignment_id: assignmentId, learner_id: s.user_id,
    status: 'todo', priority: 'medium',
  }));
  const { data, error } = await supabase.from('learner_assignments').insert(mapped).select();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetAssignmentLearners(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { assignmentId } = params;
  if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
  const { data, error } = await supabase
    .from('learner_assignments')
    .select('*, learners!inner(id, name, email, university, branch_field, college_school_name, registration_number)')
    .eq('assignment_id', assignmentId).eq('is_deleted', false)
    .order('assigned_date', { ascending: false });
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGradeAssignment(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { learnerAssignmentId, gradingData } = params;
  if (!learnerAssignmentId || !gradingData) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerAssignmentId or gradingData', context.request, { startTime });
  const { data, error } = await supabase.from('learner_assignments').update({
    grade_received: gradingData.grade_received, instructor_feedback: gradingData.instructor_feedback,
    graded_by: gradingData.graded_by, graded_date: new Date().toISOString(),
    feedback_date: new Date().toISOString(), status: 'graded', updated_date: new Date().toISOString(),
  }).eq('learner_assignment_id', learnerAssignmentId).select().single();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleGetAssignmentStatistics(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { assignmentId } = params;
  if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
  const { data, error } = await supabase
    .from('learner_assignments')
    .select('status, grade_percentage, is_late')
    .eq('assignment_id', assignmentId).eq('is_deleted', false);
  if (error) return apiDbError(error, context.request, { startTime });
  const items = data || [];
  const grades = items.filter((a: any) => a.grade_percentage !== null).map((a: any) => a.grade_percentage);
  return apiSuccess({
    total: items.length,
    todo: items.filter((a: any) => a.status === 'todo').length,
    inProgress: items.filter((a: any) => a.status === 'in-progress').length,
    submitted: items.filter((a: any) => a.status === 'submitted').length,
    graded: items.filter((a: any) => a.status === 'graded').length,
    lateSubmissions: items.filter((a: any) => a.is_late).length,
    averageGrade: grades.length > 0 ? Math.round(grades.reduce((s: number, g: number) => s + g, 0) / grades.length) : 0,
  }, context.request, { startTime });
}

export async function handleGetAssignmentAttachments(params: any, context: AuthenticatedContext, startTime: number) {
 const supabase = getSub(context);
  const { assignmentId, fileNamePattern } = params;
  if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
  let query = supabase.from('assignment_attachments').select('*').eq('assignment_id', assignmentId);
  if (fileNamePattern) {
    if (fileNamePattern.startsWith('LEARNER:')) {
      query = query.like('file_name', fileNamePattern);
    } else {
      query = query.not('file_name', 'like', 'LEARNER:%');
    }
  }
  if (fileNamePattern?.startsWith('LEARNER:') && fileNamePattern.split(':').length > 2) {
    const learnerLaId = fileNamePattern.split(':')[1];
    query = query.like('file_name', `LEARNER:${learnerLaId}:%`);
  }
  const { data, error } = await query.order('uploaded_date', { ascending: false });
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetAttachmentById(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { attachmentId } = params;
  if (!attachmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing attachmentId', context.request, { startTime });
  const { data, error } = await supabase.from('assignment_attachments').select('file_url, file_name').eq('attachment_id', attachmentId).single();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleGetAssignmentWithAttachments(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { assignmentId } = params;
  if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });

  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, assignment_attachments (*)')
      .eq('assignment_id', assignmentId)
      .single();

    if (error) return apiDbError(error, context.request, { startTime });
    return apiSuccess(data || {}, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}







