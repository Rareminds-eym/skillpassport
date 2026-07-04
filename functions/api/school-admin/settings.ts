import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const supabase = getServiceClient(context.env);
  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;
  try {
    switch (action) {
      case 'fetchCurrentSchool': return handleFetchCurrentSchool(supabase, context, body);
      case 'fetchSchoolEducators': return handleFetchSchoolEducators(supabase, context, body);
      case 'fetchSchoolClasses': return handleFetchSchoolClasses(supabase, context, body);
      case 'fetchAcademicYears': return handleFetchAcademicYears(supabase, context, body);
      case 'fetchSubjects': return handleFetchSubjects(supabase, context, body);
      case 'fetchRolePermissions': return handleFetchRolePermissions(supabase, context, body);
      case 'saveRolePermissions': return handleSaveRolePermissions(supabase, context, body);
      case 'fetchNotificationSettings': return handleFetchNotificationSettings(supabase, context, body);
      case 'saveNotificationSettings': return handleSaveNotificationSettings(supabase, context, body);
      case 'updateOrganization': return handleUpdateOrganization(supabase, context, body);
      case 'updateEducator': return handleUpdateEducator(supabase, context, body);
      case 'toggleUserStatus': return handleToggleUserStatus(supabase, context, body);
      case 'createAcademicYear': return handleCreateAcademicYear(supabase, context, body);
      case 'updateAcademicYear': return handleUpdateAcademicYear(supabase, context, body);
      case 'deleteAcademicYear': return handleDeleteAcademicYear(supabase, context, body);
      case 'activateAcademicYear': return handleActivateAcademicYear(supabase, context, body);
      case 'createClass': return handleCreateClass(supabase, context, body);
      case 'updateClass': return handleUpdateClass(supabase, context, body);
      case 'deleteClass': return handleDeleteClass(supabase, context, body);
      case 'createSubject': return handleCreateSubject(supabase, context, body);
      case 'updateSubject': return handleUpdateSubject(supabase, context, body);
      case 'deleteSubject': return handleDeleteSubject(supabase, context, body);
      case 'deactivateAllAcademicYears': return handleDeactivateAllAcademicYears(supabase, context, body);
      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
    }
  } catch (error) {
    console.error('[SchoolAdmin/Settings] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
});

async function handleFetchCurrentSchool(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);

  // Resolves the current user's `school_id` (data-scope) only. `role` is NOT selected/read here
  // (task 22.3 — no `school_educators.role` authority use); authorization is enforced separately
  // from the verified JWT. `handleFetchSchoolEducators` below still selects `role` purely for the
  // school-admin roster DISPLAY (never an authz decision).
  const { data: educator } = await supabase.from('school_educators').select('school_id').eq('user_id', user.id).maybeSingle();
  let schoolId = educator?.school_id;

  if (!schoolId) {
    const { data: org } = await supabase.from('organizations').select('id').eq('admin_id', user.id).eq('organization_type', 'school').maybeSingle();
    if (org?.id) schoolId = org.id;
  }

  if (!schoolId) return apiSuccess({ schoolId: null, systemConfig: null }, context.request);

  const { data: org } = await supabase.from('organizations').select('*').eq('id', schoolId).maybeSingle();

  return apiSuccess({
    schoolId,
    systemConfig: org ? {
      schoolName: org.name || '',
      schoolCode: org.code || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || '',
      sessionTimeout: 30,
      maxLoginAttempts: 3,
      passwordExpiryDays: 90,
      enableMFA: false,
      enableBiometric: false,
    } : null,
  }, context.request);
}

async function handleFetchSchoolEducators(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase.from('school_educators').select('id, user_id, first_name, last_name, email, role, account_status, created_at, metadata').eq('school_id', schoolId).order('created_at', { ascending: false });
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleFetchSchoolClasses(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase.from('school_classes').select('*').eq('school_id', schoolId).eq('account_status', 'active').order('grade', { ascending: true });
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleFetchAcademicYears(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase.from('curriculum_academic_years').select('*').eq('school_id', schoolId).eq('is_active', true).order('year', { ascending: false });
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleFetchSubjects(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase.from('curriculum_subjects').select('*').or(`school_id.eq.${schoolId},school_id.is.null`).eq('is_active', true).order('display_order', { ascending: true });
  if (error) throw error;

  const subjectsWithClasses = await Promise.all(
    (data || []).map(async (subject: any) => {
      const { data: curriculums } = await supabase.from('curriculums').select('id, class').eq('school_id', schoolId).eq('subject', subject.name);
      return { ...subject, classIds: curriculums?.map((c: any) => c.id) || [] };
    })
  );

  return apiSuccess(subjectsWithClasses, context.request);
}

async function handleFetchRolePermissions(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);

  const { data, error } = await supabase.from('user_settings').select('privacy_settings').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return apiSuccess(data?.privacy_settings?.rolePermissions || null, context.request);
}

async function handleSaveRolePermissions(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);
  const { permissions } = body;
  if (!permissions) return apiError(400, 'VALIDATION_ERROR', 'permissions is required', context.request);

  const { data: existing } = await supabase.from('user_settings').select('id, privacy_settings').eq('user_id', user.id).maybeSingle();

  const updatedPrivacySettings = { ...(existing?.privacy_settings || {}), rolePermissions: permissions };

  if (existing) {
    const { error } = await supabase.from('user_settings').update({ privacy_settings: updatedPrivacySettings, updated_at: new Date().toISOString(), updated_by: user.id }).eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_settings').insert({ user_id: user.id, privacy_settings: updatedPrivacySettings, notification_preferences: {}, ui_preferences: {}, communication_preferences: {}, updated_by: user.id });
    if (error) throw error;
  }

  return apiSuccess({ success: true }, context.request);
}

async function handleFetchNotificationSettings(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);

  const { data, error } = await supabase.from('user_settings').select('notification_preferences').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return apiSuccess(data?.notification_preferences?.notificationSettings || null, context.request);
}

async function handleSaveNotificationSettings(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);
  const { settings } = body;
  if (!settings) return apiError(400, 'VALIDATION_ERROR', 'settings is required', context.request);

  const { data: existing } = await supabase.from('user_settings').select('id, notification_preferences').eq('user_id', user.id).maybeSingle();

  const updatedPreferences = { ...(existing?.notification_preferences || {}), notificationSettings: settings };

  if (existing) {
    const { error } = await supabase.from('user_settings').update({ notification_preferences: updatedPreferences, updated_at: new Date().toISOString(), updated_by: user.id }).eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_settings').insert({ user_id: user.id, notification_preferences: updatedPreferences, privacy_settings: {}, ui_preferences: {}, communication_preferences: {}, updated_by: user.id });
    if (error) throw error;
  }

  return apiSuccess({ success: true }, context.request);
}

async function handleUpdateOrganization(supabase: any, context: AuthenticatedContext, body: any) {
  const { id, name, address, phone, email } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('organizations').update({ name, address, phone, email, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_type', 'school');
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleUpdateEducator(supabase: any, context: AuthenticatedContext, body: any) {
  const { id, firstName, lastName, email, role, accountStatus, permissions } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('school_educators').update({ first_name: firstName, last_name: lastName, email, role, account_status: accountStatus, metadata: { permissions }, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleToggleUserStatus(supabase: any, context: AuthenticatedContext, body: any) {
  const { id, accountStatus } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('school_educators').update({ account_status: accountStatus, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleCreateAcademicYear(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, year, startDate, endDate } = body;
  if (!schoolId || !year || !startDate || !endDate) {
    return apiError(400, 'VALIDATION_ERROR', 'schoolId, year, startDate, endDate are required', context.request);
  }

  const { data, error } = await supabase.from('curriculum_academic_years').insert({ school_id: schoolId, year, start_date: startDate, end_date: endDate, is_active: true, is_current: false }).select().single();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function handleUpdateAcademicYear(supabase: any, context: AuthenticatedContext, body: any) {
  const { id, year, startDate, endDate } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('curriculum_academic_years').update({ year, start_date: startDate, end_date: endDate, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleDeleteAcademicYear(supabase: any, context: AuthenticatedContext, body: any) {
  const { id } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('curriculum_academic_years').delete().eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleActivateAcademicYear(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, yearId } = body;
  if (!schoolId || !yearId) return apiError(400, 'VALIDATION_ERROR', 'schoolId and yearId are required', context.request);

  const { error: deactivateError } = await supabase.from('curriculum_academic_years').update({ is_current: false }).eq('school_id', schoolId);
  if (deactivateError) throw deactivateError;

  const { error } = await supabase.from('curriculum_academic_years').update({ is_current: true }).eq('id', yearId);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleDeactivateAllAcademicYears(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { error } = await supabase.from('curriculum_academic_years').update({ is_current: false }).eq('school_id', schoolId);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleCreateClass(supabase: any, context: AuthenticatedContext, body: any) {
  const { classInserts } = body;
  if (!classInserts || !Array.isArray(classInserts) || classInserts.length === 0) {
    return apiError(400, 'VALIDATION_ERROR', 'classInserts array is required', context.request);
  }

  const { data, error } = await supabase.from('school_classes').insert(classInserts).select();
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleUpdateClass(supabase: any, context: AuthenticatedContext, body: any) {
  const { id, name, maxLearners } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('school_classes').update({ name, max_learners: maxLearners, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleDeleteClass(supabase: any, context: AuthenticatedContext, body: any) {
  const { id } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('school_classes').delete().eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleCreateSubject(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, name, description, displayOrder } = body;
  if (!schoolId || !name) return apiError(400, 'VALIDATION_ERROR', 'schoolId and name are required', context.request);

  const { data, error } = await supabase.from('curriculum_subjects').insert({ school_id: schoolId, name, description: description || '', is_active: true, display_order: displayOrder || 0 }).select().single();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function handleUpdateSubject(supabase: any, context: AuthenticatedContext, body: any) {
  const { id, name, description } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('curriculum_subjects').update({ name, description, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleDeleteSubject(supabase: any, context: AuthenticatedContext, body: any) {
  const { id } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('curriculum_subjects').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}
