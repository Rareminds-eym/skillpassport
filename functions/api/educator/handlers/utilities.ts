import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';
import { notifyRealtime } from '../../../lib/realtime';

const getSub = (context: AuthenticatedContext) => getServiceClient(context.env as any);


export async function handleFetchCourseEnrollments(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { courseId } = params;
  if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
  const { data, error } = await supabase.from('course_enrollments').select('*').eq('course_id', courseId).order('enrolled_at', { ascending: false });
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleFetchLearnerCourseProgress(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { courseId } = params;
  if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
  const { data, error } = await supabase.from('learner_course_progress').select('*').eq('course_id', courseId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleListConversations(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { filters, select } = params;
  if (!filters?.educator_id) return apiError(400, 'VALIDATION_ERROR', 'Missing educator_id', context.request, { startTime });
  let query = supabase
    .from('conversations')
    .select(select || '*');
  if (filters.educator_id) query = query.eq('educator_id', filters.educator_id);
  if (filters.conversation_type) query = query.eq('conversation_type', filters.conversation_type);
  if (filters.deleted_by_educator !== undefined) query = query.eq('deleted_by_educator', filters.deleted_by_educator);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.last_message_at?.order) query = query.order('last_message_at', { ascending: filters.last_message_at.order === 'asc' });
  const { data, error } = await query;
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleFetchEducatorConversations(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { userId, collegeId, userType, includeArchived } = params;
  if (!userId || !collegeId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or collegeId', context.request, { startTime });

  let query = supabase
    .from('conversations')
    .select('*, college:organizations!conversations_college_id_fkey(id, name, admin_id)')
    .eq('conversation_type', 'college_educator_admin')
    .eq('college_id', collegeId);

  if (userType === 'college_educator') {
    query = query.eq('educator_id', userId).eq('deleted_by_educator', false);
  } else {
    query = query.eq('deleted_by_college_admin', false);
  }

  if (includeArchived) {
    query = query.eq('status', 'archived');
  } else {
    query = query.neq('status', 'archived');
  }

  const { data, error } = await query.order('last_message_at', { ascending: false, nullsFirst: false });
  if (error && (error.message?.includes('college_educator_admin') || error.code === 'PGRST200')) {
    return apiSuccess([], context.request, { startTime });
  }
  if (error) return apiDbError(error, context.request, { startTime });

  const educatorIds = [...new Set((data || []).map((c: any) => c.educator_id).filter(Boolean))];
  let educatorMap: Record<string, any> = {};
  if (educatorIds.length > 0) {
    const { data: educators } = await supabase.from('college_lecturers').select('id, first_name, last_name, email, department, specialization, user_id').in('id', educatorIds);
    if (educators) {
      educatorMap = Object.fromEntries(educators.map((e: any) => [e.id, e]));
    }
  }

  return apiSuccess((data || []).map((c: any) => ({ ...c, college_educator: educatorMap[c.educator_id] || null })), context.request, { startTime });
}

export async function handleCreateCourseNotification(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { schoolId, type, courseTitle, educatorName, env } = params;
  if (!schoolId || !type || !courseTitle || !educatorName)
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
  const { data: learners } = await supabase.from('learners').select('user_id').eq('school_id', schoolId);
  if (learners?.length) {
    const { data: insertedNotifications, error } = await supabase.from('notifications').insert(
      learners.map((l: any) => ({
        recipient_id: l.user_id, type,
        title: type === 'course_added' ? `New Course: ${courseTitle}` : `Course Updated: ${courseTitle}`,
        message: type === 'course_added'
          ? `${educatorName} has added a new course "${courseTitle}"`
          : `${educatorName} has updated the course "${courseTitle}"`,
        read: false,
      }))
    ).select();
    if (error) return apiDbError(error, context.request, { startTime });

    if (insertedNotifications) {
      insertedNotifications.forEach(notification => context.waitUntil(notifyRealtime(env as any, 'notifications', 'INSERT', notification)));
    }
  }
  return apiSuccess({ sent: true }, context.request, { startTime });
}

export async function handleDbSelect(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { table, dbSelect, dbFilters } = params;
  const allowedTables = ['learners', 'projects', 'trainings', 'certificates'];
  if (!table || !allowedTables.includes(table)) return apiError(400, 'VALIDATION_ERROR', `Table not allowed: ${table}`, context.request, { startTime });
  let dbQuery = supabase.from(table).select(dbSelect || '*');
  if (dbFilters) {
    if (dbFilters.school_id?.eq) dbQuery = dbQuery.eq('school_id', dbFilters.school_id.eq);
    if (dbFilters.college_id?.eq) dbQuery = dbQuery.eq('college_id', dbFilters.college_id.eq);
    if (dbFilters.school_class_id?.in) dbQuery = dbQuery.in('school_class_id', dbFilters.school_class_id.in);
    if (dbFilters.is_deleted?.eq !== undefined) dbQuery = dbQuery.eq('is_deleted', dbFilters.is_deleted.eq);
    if (dbFilters.learner_id?.in) dbQuery = dbQuery.in('learner_id', dbFilters.learner_id.in);
    if (dbFilters.learner_id?.eq) dbQuery = dbQuery.eq('learner_id', dbFilters.learner_id.eq);
  }
  const { data, error } = await dbQuery;
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleDbUpdate(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { table, values, filters } = params;
  const allowedUpdateTables = ['projects', 'trainings', 'certificates'];
  if (!table || !allowedUpdateTables.includes(table)) return apiError(400, 'VALIDATION_ERROR', `Table not allowed: ${table}`, context.request, { startTime });
  if (!values || !filters?.id?.eq) return apiError(400, 'VALIDATION_ERROR', 'Missing values or id filter', context.request, { startTime });
  const { data, error } = await supabase.from(table).update(values).eq('id', filters.id.eq).select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleUpdateEducatorTable(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const allowedTables2 = ['school_educators', 'college_lecturers'];
  if (!table || !allowedTables2.includes(table)) return apiError(400, 'VALIDATION_ERROR', `Table not allowed: ${table}`, context.request, { startTime });
  if (!values || !id || !idField) return apiError(400, 'VALIDATION_ERROR', 'Missing values, id, or idField', context.request, { startTime });
  const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
  const { data, error } = await supabase.from(table).update({ ...values, [tsField]: new Date().toISOString() }).eq(idField, id).select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleUpdateCollegeAssignment(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  if (!assignmentId || !updateData) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId or updateData', context.request, { startTime });
  }
  const { error } = await supabase
    .from('college_assignments')
    .update(updateData)
    .eq('assignment_id', assignmentId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ updated: true }, context.request, { startTime });
}

export async function handleDeleteCollegeAssignment(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  if (!assignmentId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
  }
  const { error } = await supabase
    .from('college_assignments')
    .delete()
    .eq('assignment_id', assignmentId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ deleted: true }, context.request, { startTime });
}

export async function handleGetAssignedLearners(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  if (!assignmentId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
  }
  const { data, error } = await supabase
    .from('college_learner_assignments')
    .select('learner_id')
    .eq('assignment_id', assignmentId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess((data || []).map((a: any) => a.learner_id), context.request, { startTime });
}

export async function handleCheckClubMembership(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { clubId, learnerEmail } = params;
  if (!clubId || !learnerEmail) return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });

  try {
    const { data, error } = await supabase
      .from('club_memberships')
      .select('*')
      .eq('club_id', clubId)
      .eq('learner_email', learnerEmail)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
    return apiSuccess(data || null, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}

export async function handleGetClubParticipationReport(context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  try {
    const { data, error } = await supabase
      .from('club_participation_report')
      .select('*');

    if (error) return apiDbError(error, context.request, { startTime });
    return apiSuccess(data || [], context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}

export async function handleGetCompetitionPerformanceReport(context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  try {
    const { data, error } = await supabase
      .from('competition_performance_report')
      .select('*');

    if (error) return apiDbError(error, context.request, { startTime });
    return apiSuccess(data || [], context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}






