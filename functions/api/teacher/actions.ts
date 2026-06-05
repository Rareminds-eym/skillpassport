import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequest = async (context: any) => {
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;

  if (action === 'get-educator-by-email') {
    const { email } = body;
    const { data, error } = await supabase
      .from('school_educators')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'create-lesson-plan') {
    const { insertData } = body;
    const { data, error } = await supabase
      .from('lesson_plans')
      .insert(insertData)
      .select()
      .single();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-college-lecturer') {
    const { userId } = body;
    const { data, error } = await supabase
      .from('college_lecturers')
      .select('id, first_name, last_name, "collegeId"')
      .eq('user_id', userId)
      .single();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-school-educator') {
    const { userId } = body;
    const { data, error } = await supabase
      .from('school_educators')
      .select('id, first_name, last_name, school_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-department-assignment') {
    const { lecturerId } = body;
    const { data, error } = await supabase
      .from('department_faculty_assignments')
      .select('department_id, is_hod')
      .eq('lecturer_id', lecturerId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-department') {
    const { departmentId } = body;
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code')
      .eq('id', departmentId)
      .single();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-faculty-class-assignments') {
    const { facultyId } = body;
    const { data, error } = await supabase
      .from('college_faculty_class_assignments')
      .select('class_id')
      .eq('faculty_id', facultyId);
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'get-college-classes-by-ids') {
    const { classIds } = body;
    const { data, error } = await supabase
      .from('college_classes')
      .select('id, name, grade, section')
      .in('id', classIds);
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'get-college-timetable') {
    const { collegeId, academicYear } = body;
    const { data, error } = await supabase
      .from('college_timetables')
      .select('id, status')
      .eq('college_id', collegeId)
      .eq('academic_year', academicYear)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-college-breaks') {
    const { collegeId } = body;
    const { data, error } = await supabase
      .from('college_breaks')
      .select('*')
      .eq('college_id', collegeId)
      .order('start_date');
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'get-school-timetable') {
    const { schoolId, academicYear } = body;
    const { data, error } = await supabase
      .from('timetables')
      .select('id, status')
      .eq('school_id', schoolId)
      .eq('academic_year', academicYear)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-school-breaks') {
    const { schoolId } = body;
    const { data, error } = await supabase
      .from('school_breaks')
      .select('*')
      .eq('school_id', schoolId)
      .order('start_date');
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'get-school-classes') {
    const { schoolId } = body;
    const { data, error } = await supabase
      .from('school_classes')
      .select('id, name, grade, section')
      .eq('school_id', schoolId)
      .eq('account_status', 'active')
      .order('grade');
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'get-college-timetable-slots') {
    const { timetableId, educatorId } = body;
    const { data, error } = await supabase
      .from('college_timetable_slots')
      .select(`*, college_classes!college_timetable_slots_class_id_fkey(id, name)`)
      .eq('timetable_id', timetableId)
      .eq('educator_id', educatorId)
      .order('day_of_week')
      .order('period_number');
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'get-school-timetable-slots') {
    const { timetableId, educatorId } = body;
    const { data, error } = await supabase
      .from('timetable_slots')
      .select(`*, school_classes!timetable_slots_class_id_fkey(id, name, grade, section)`)
      .eq('timetable_id', timetableId)
      .eq('educator_id', educatorId)
      .order('day_of_week')
      .order('period_number');
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'get-college-time-periods') {
    const { timetableId } = body;
    const { data, error } = await supabase
      .from('college_time_periods')
      .select('*')
      .eq('timetable_id', timetableId)
      .order('period_number');
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'get-school-time-periods') {
    const { timetableId } = body;
    const { data, error } = await supabase
      .from('school_time_periods')
      .select('*')
      .eq('timetable_id', timetableId)
      .order('period_number');
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data ?? [], context.request);
  }

  if (action === 'list-table-samples') {
    const { tables } = body;
    const results: Record<string, any[]> = {};
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(5);
      if (!error && data) results[table] = data;
    }
    return apiSuccess(results, context.request);
  }

  return apiError(400, 'BAD_REQUEST', `Unknown action: ${action}`, context.request);
});
