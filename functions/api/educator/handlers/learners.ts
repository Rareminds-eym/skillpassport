import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

const getSub = (context: AuthenticatedContext) => getServiceClient(context.env as any);


export async function handleGetUserById(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { ids, select } = params;
  if (!ids?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing ids', context.request, { startTime });
  const { data, error } = await supabase
    .from('users')
    .select(select || 'id, firstName, lastName')
    .in('id', ids);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetLearnersByEmails(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { emails } = params;
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing emails array', context.request, { startTime });
  }
  const { data, error } = await supabase
    .from('learners')
    .select('id, user_id, email')
    .in('email', emails);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleFetchLearnerProjects(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { learnerId } = params;
  if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
  const { data, error } = await supabase.from('projects').select('*').eq('learner_id', learnerId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleFetchLearnerCertificates(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { learnerId } = params;
  if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
  const { data, error } = await supabase.from('certificates').select('*').eq('learner_id', learnerId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleFetchLearnersByIds(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { ids } = params;
  if (!ids?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing ids', context.request, { startTime });
  const { data, error } = await supabase.from('learners').select('*').in('id', ids);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleFetchLearnersWithFilters(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { filters } = params;
  let query = supabase.from('learners').select('*');
  if (filters) {
    if (filters.school_id) query = query.eq('school_id', filters.school_id);
    if (filters.school_class_id) query = query.eq('school_class_id', filters.school_class_id);
    if (filters.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    if (filters.limit) query = query.limit(filters.limit);
  }
  const { data, error } = await query.order('name', { ascending: true });
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleFetchClassesByIds(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { ids } = params;
  if (!ids?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing ids', context.request, { startTime });
  const { data, error } = await supabase.from('school_classes').select('name, grade, section').in('id', ids);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetAssignedLearnerIds(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { assignmentId } = params;
  if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
  const { data, error } = await supabase.from('learner_assignments').select('learner_id').eq('assignment_id', assignmentId).eq('is_deleted', false);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess((data || []).map((a: any) => a.learner_id), context.request, { startTime });
}

export async function handleFetchLearnerAssignmentSubmissions(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { learnerId } = params;
  if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
  const { data, error } = await supabase
    .from('learner_assignments')
    .select('*, assignments(title, description, course_name, course_code, assignment_type, due_date, total_points, skill_outcomes, educator_name)')
    .eq('learner_id', learnerId).eq('is_deleted', false);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleFetchLearnerProfilesData(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { schoolId, classIds } = params;
  let query = supabase.from('learners').select('profile, grade').eq('is_deleted', false);
  if (schoolId) query = query.eq('school_id', schoolId);
  if (classIds?.length) query = query.in('school_class_id', classIds);
  const { data, error } = await query;
  if (error) return apiDbError(error, context.request, { startTime });
  const depts = [...new Set((data || []).map((s: any) => s.profile?.department).filter(Boolean))];
  const years = [...new Set((data || []).map((s: any) => s.profile?.year || s.grade).filter(Boolean))];
  return apiSuccess({ departments: depts, years }, context.request, { startTime });
}

export async function handleGetEducatorLearners(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { educatorType, schoolId, collegeId, assignedClassIds } = params;
  if (!educatorType) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorType', context.request, { startTime });

  try {
    let query = supabase.from('learners').select('id, user_id, email, name, grade, section, roll_number, school_id, school_class_id, college_id').eq('is_deleted', false);

    if (educatorType === 'school') {
      if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing schoolId for school educator', context.request, { startTime });
      query = query.eq('school_id', schoolId);
      if (assignedClassIds && assignedClassIds.length > 0) {
        query = query.in('school_class_id', assignedClassIds);
      }
    } else if (educatorType === 'college') {
      if (!collegeId) return apiError(400, 'VALIDATION_ERROR', 'Missing collegeId for college educator', context.request, { startTime });
      query = query.eq('college_id', collegeId);
    }

    const { data: learners, error } = await query.order('name');
    if (error) return apiDbError(error, context.request, { startTime });

    const mapped = (learners || []).map((l: any) => ({
      id: l.user_id || l.id,
      user_id: l.user_id,
      email: l.email,
      name: l.name || l.email,
      grade: l.grade || 'N/A',
      section: l.section || '',
      rollNumber: l.roll_number || '',
      school_id: l.school_id || l.college_id || '',
      school_class_id: l.school_class_id
    }));

    return apiSuccess(mapped, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}






