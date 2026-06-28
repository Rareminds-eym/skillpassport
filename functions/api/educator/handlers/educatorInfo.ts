import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

const getSub = (context: AuthenticatedContext) => getServiceClient(context.env as any);


export async function handleGetOrganizationById(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { id, select } = params;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
  id = String(id);
  const { data, error } = await supabase
    .from('organizations')
    .select(select || 'name')
    .eq('id', id)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleFetchEducatorSchoolInfo(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { email, userId } = params;
  if (!email && !userId) return apiError(400, 'VALIDATION_ERROR', 'Missing email or userId', context.request, { startTime });

  const { data: schoolEducator } = await supabase
    .from('school_educators')
    .select('*, organizations!school_educators_school_id_fkey(id, name, code, city, state, country)')
    .eq('email', email)
    .maybeSingle();

  if (schoolEducator?.organizations) {
    const org = Array.isArray(schoolEducator.organizations) ? schoolEducator.organizations[0] : schoolEducator.organizations;
    let classIds: string[] = [];
    if (schoolEducator.role !== 'admin') {
      const { data: assignments } = await supabase.from('school_educator_class_assignments').select('class_id').eq('educator_id', schoolEducator.id);
      classIds = (assignments || []).map((a: any) => a.class_id);
    }
    return apiSuccess({ type: 'school', school: org, educatorRole: schoolEducator.role, assignedClassIds: classIds, educatorId: schoolEducator.id }, context.request, { startTime });
  }

  if (userId) {
    userId = String(userId);
    const { data: collegeLecturer } = await supabase.from('college_lecturers').select('id, collegeId').eq('user_id', userId).maybeSingle();
    if (collegeLecturer?.collegeId) {
      const { data: college } = await supabase.from('organizations').select('id, name, code, city, state, country').eq('id', collegeLecturer.collegeId).eq('organization_type', 'college').maybeSingle();
      let classIds: string[] = [];
      if (college) {
        const { data: assignments } = await supabase.from('college_faculty_class_assignments').select('class_id').eq('faculty_id', collegeLecturer.id);
        classIds = (assignments || []).map((a: any) => a.class_id);
      }
      return apiSuccess({ type: 'college', college, educatorRole: 'lecturer', assignedClassIds: classIds, educatorId: collegeLecturer.id }, context.request, { startTime });
    }
  }

  return apiSuccess(null, context.request, { startTime });
}

export async function handleFetchEducatorId(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { userId, email } = params;
  if (!userId && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or email', context.request, { startTime });

  if (userId) {
    userId = String(userId);
    const { data: school } = await supabase.from('school_educators').select('id').eq('user_id', userId).maybeSingle();
    if (school) return apiSuccess(school.id, context.request, { startTime });
    const { data: college } = await supabase.from('college_lecturers').select('id').eq('user_id', userId).maybeSingle();
    if (college) return apiSuccess(college.id, context.request, { startTime });
  }

  if (email) {
    const { data: schoolByEmail } = await supabase.from('school_educators').select('id').eq('email', email).maybeSingle();
    if (schoolByEmail) return apiSuccess(schoolByEmail.id, context.request, { startTime });
    const { data: collegeByEmail } = await supabase.from('college_lecturers').select('id').eq('email', email).maybeSingle();
    if (collegeByEmail) return apiSuccess(collegeByEmail.id, context.request, { startTime });
  }

  return apiSuccess(null, context.request, { startTime });
}

export async function handleFetchEducatorByEmail(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { email } = params;
  if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
  const { data, error } = await supabase
    .from('school_educators')
    .select('first_name, last_name, photo_url, email, specialization')
    .eq('email', email)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleGetSchoolEducatorByEmail(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { email, select } = params;
  if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
  const { data, error } = await supabase.from('school_educators').select(select || 'school_id').eq('email', email).maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleGetSchoolEducatorByUserId(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { userId, select } = params;
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
  userId = String(userId);
  const { data, error } = await supabase.from('school_educators').select(select || 'school_id').eq('user_id', userId).maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleGetSchoolEducatorByUserIdIlike(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { email } = params;
  if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
  const { data, error } = await supabase.from('school_educators').select('*').ilike('email', email).maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleGetSchoolEducatorById(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { id, select } = params;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
  id = String(id);
  const { data, error } = await supabase.from('school_educators').select(select || '*').eq('id', id).maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleCreateSchoolEducator(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { values } = params;
  if (!values) return apiError(400, 'VALIDATION_ERROR', 'Missing values', context.request, { startTime });
  const { data, error } = await supabase.from('school_educators').insert([values]).select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleUpdateSchoolEducator(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { id, values } = params;
  if (!id || !values) return apiError(400, 'VALIDATION_ERROR', 'Missing id or values', context.request, { startTime });
  id = String(id);
  const { data, error } = await supabase.from('school_educators').update(values).eq('id', id).select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleUpdateSchoolEducatorByEmail(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { email, values } = params;
  if (!email || !values) return apiError(400, 'VALIDATION_ERROR', 'Missing email or values', context.request, { startTime });
  email = String(email);
  const { data, error } = await supabase.from('school_educators').update(values).eq('email', email).select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleDeleteSchoolEducator(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { id } = params;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
  id = String(id);
  const { error } = await supabase.from('school_educators').delete().eq('id', id);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ deleted: true }, context.request, { startTime });
}

export async function handleListSchoolEducators(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { select, filters } = params;
  if (!filters?.school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id filter', context.request, { startTime });
  let query = supabase.from('school_educators').select(select || '*').eq('school_id', filters.school_id);
  if (filters.role) query = query.eq('role', filters.role);
  const { data, error } = await query;
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetCollegeLecturerByUserId(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { userId, select } = params;
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
  const { data, error } = await supabase.from('college_lecturers').select(select || 'user_id').eq('user_id', userId).maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleGetUniversityEducatorByUserId(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { userId, select } = params;
  if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
  userId = String(userId);
  const { data, error } = await supabase.from('college_lecturers').select(select || 'user_id').eq('user_id', userId).maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleListOrganizations(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { select, filters } = params;
  let orgQuery = supabase.from('organizations').select(select || '*');
  if (filters?.organization_type) orgQuery = orgQuery.eq('organization_type', filters.organization_type);
  const { data, error } = await orgQuery;
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleSaveEducatorProfile(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { userId, email, isCollege, updates } = params;
  if (!userId && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or email', context.request, { startTime });
  if (userId) userId = String(userId);
  if (email) email = String(email);
  const table = isCollege ? 'college_lecturers' : 'school_educators';
  const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
  let query = supabase.from(table).update({ ...updates, [tsField]: new Date().toISOString() });
  if (userId) query = query.eq('user_id', userId);
  else if (email) query = query.eq('email', email);
  const { data, error } = await query.select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleUpdateEducatorMedia(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { userId, table, field, value } = params;
  if (!userId || !table || !field) return apiError(400, 'VALIDATION_ERROR', 'Missing userId, table, or field', context.request, { startTime });
  userId = String(userId);
  if (!['school_educators', 'college_lecturers'].includes(table)) return apiError(400, 'VALIDATION_ERROR', 'Invalid table', context.request, { startTime });
  const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
  const { data, error } = await supabase.from(table).update({ [field]: value, [tsField]: new Date().toISOString() }).eq('user_id', userId).select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleRemoveEducatorMedia(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { userId, table, field } = params;
  if (!userId || !table || !field) return apiError(400, 'VALIDATION_ERROR', 'Missing userId, table, or field', context.request, { startTime });
  userId = String(userId);
  if (!['school_educators', 'college_lecturers'].includes(table)) return apiError(400, 'VALIDATION_ERROR', 'Invalid table', context.request, { startTime });
  const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
  const { data, error } = await supabase.from(table).update({ [field]: null, [tsField]: new Date().toISOString() }).eq('user_id', userId).select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleRemoveExperienceLetter(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { email, userId, index, isCollege } = params;
  if ((!email && !userId) || index === undefined) return apiError(400, 'VALIDATION_ERROR', 'Missing email/userId or index', context.request, { startTime });
  if (userId) userId = String(userId);
  if (email) email = String(email);
  const table = isCollege ? 'college_lecturers' : 'school_educators';
  const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
  let educatorQuery = supabase.from(table).select('experience_letters_url');
  if (userId) educatorQuery = educatorQuery.eq('user_id', userId);
  else educatorQuery = educatorQuery.eq('email', email);
  const { data: educator } = await educatorQuery.maybeSingle();
  if (!educator) return apiError(404, 'NOT_FOUND', 'Educator not found', context.request, { startTime });
  const urls = (educator.experience_letters_url || []).filter((_: any, i: number) => i !== index);
  let updateQuery = supabase.from(table).update({ experience_letters_url: urls, [tsField]: new Date().toISOString() });
  if (userId) updateQuery = updateQuery.eq('user_id', userId);
  else updateQuery = updateQuery.eq('email', email);
  const { data, error } = await updateQuery.select().maybeSingle();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleFetchOrganizationByAdminId(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { adminId, organizationType } = params;
  if (!adminId) return apiError(400, 'VALIDATION_ERROR', 'Missing adminId', context.request, { startTime });
  adminId = String(adminId);
  let query = supabase.from('organizations').select('id');
  if (organizationType) query = query.eq('organization_type', organizationType);
  const { data, error } = await query.eq('admin_id', adminId).maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleFetchOrganizationByEmail(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { email, organizationType } = params;
  if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
  email = String(email);
  let query = supabase.from('organizations').select('id').ilike('email', email);
  if (organizationType) query = query.eq('organization_type', organizationType);
  const { data, error } = await query.maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleFetchUserByEmail(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { email } = params;
  if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
  email = String(email);
  const { data, error } = await supabase.from('users').select('organizationId').eq('email', email).maybeSingle();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleFetchSchoolClasses(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { schoolId } = params;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing schoolId', context.request, { startTime });
  schoolId = String(schoolId);
  const { data, error } = await supabase
    .from('school_classes')
    .select('id, grade, section, name, academic_year')
    .eq('school_id', schoolId)
    .eq('account_status', 'active');
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetEducatorByUserId(context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const user = getContextUser(context);
  const userId = user.id;

  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'User not authenticated', context.request, { startTime });
  }

  try {
    const { data, error } = await supabase
      .from('school_educators')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return apiDbError(error, context.request, { startTime });
    return apiSuccess(data || {}, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}

export async function handleGetEducatorSchoolAndClasses(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  let { educatorId } = params;
  if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId', context.request, { startTime });
  educatorId = String(educatorId);

  try {
    const { data: educatorData, error: educatorError } = await supabase
      .from('school_educators')
      .select('school_id')
      .eq('id', educatorId)
      .maybeSingle();

    if (educatorError) return apiDbError(educatorError, context.request, { startTime });

    if (!educatorData?.school_id) {
      return apiSuccess({ school_id: null, classes: [] }, context.request, { startTime });
    }

    const { data: classesData, error: classesError } = await supabase
      .from('school_classes')
      .select('id, name, grade, section')
      .eq('school_id', educatorData.school_id)
      .eq('account_status', 'active')
      .order('grade', { ascending: true })
      .order('section', { ascending: true });

    if (classesError) return apiDbError(classesError, context.request, { startTime });

    return apiSuccess({
      school_id: educatorData.school_id,
      classes: classesData || []
    }, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}

export async function handleGetCurriculumSubjects(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { schoolId } = params;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing schoolId', context.request, { startTime });

  try {
    const { data, error } = await supabase
      .from('curriculum_subjects')
      .select('id, name, subject_code')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) return apiDbError(error, context.request, { startTime });
    return apiSuccess(data || [], context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}

export async function handleGetEducatorTypeByUserId(context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const user = getContextUser(context);
  const userId = user.id;

  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'User not authenticated', context.request, { startTime });
  }

  try {
    const { data: schoolEducator } = await supabase
      .from('school_educators')
      .select('id, school_id, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (schoolEducator) {
      return apiSuccess({
        type: 'school',
        schoolEducator
      }, context.request, { startTime });
    }

    const { data: collegeLecturer } = await supabase
      .from('college_lecturers')
      .select('id, collegeId, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (collegeLecturer) {
      return apiSuccess({
        type: 'college',
        collegeLecturer
      }, context.request, { startTime });
    }

    return apiSuccess({ type: null }, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}






