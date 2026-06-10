import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const supabase = getServiceClient(context.env as any);
  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;
  try {
    switch (action) {
      case 'initUser': return handleInitUser(supabase, context, body);
      case 'getClassesBySchool': return handleGetClassesBySchool(supabase, context, body);
      case 'getAvailableCurriculums': return handleGetAvailableCurriculums(supabase, context, body);
      case 'getCurriculumPreview': return handleGetCurriculumPreview(supabase, context, body);
      case 'checkExistingCurriculum': return handleCheckExistingCurriculum(supabase, context, body);
      case 'deleteCurriculum': return handleDeleteCurriculum(supabase, context, body);
      case 'getCopiedCurriculum': return handleGetCopiedCurriculum(supabase, context, body);
      case 'getOrganizationName': return handleGetOrganizationName(supabase, context, body);
      case 'getAvailableClasses': return handleGetClassesBySchool(supabase, context, body);
      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
    }
  } catch (error) {
    console.error('[SchoolAdmin/Curriculum] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
});

async function handleInitUser(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);
  const result: any = { userId: user.id };

  // §7.3 fix (task 12.1): authorize from the verified JWT roles (canonical SSO
  // source) instead of the app-DB shadow `users.role` column. `school_admin` is
  // a canonical SSO role, so this is a JWT-role authorization read.
  result.isSchoolAdmin = user.roles.includes('school_admin');

  const { data: educator } = await supabase.from('school_educators').select('id, school_id').eq('user_id', user.id).maybeSingle();
  if (educator) {
    result.educatorData = educator;
  } else {
    const { data: org } = await supabase.from('organizations').select('id').eq('organization_type', 'school').or(`admin_id.eq.${user.id},email.eq.${user.email}`).maybeSingle();
    if (org?.id) {
      result.educatorData = { id: user.id, school_id: org.id };
    }
  }

  return apiSuccess(result, context.request);
}

async function handleGetClassesBySchool(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase.from('school_classes').select('grade, academic_year').eq('school_id', schoolId).order('grade');
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleGetAvailableCurriculums(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, academicYear, classGrade, subject } = body;
  if (!schoolId || !academicYear || !classGrade || !subject) {
    return apiError(400, 'VALIDATION_ERROR', 'schoolId, academicYear, classGrade, and subject are required', context.request);
  }

  const { data, error } = await supabase
    .from('curriculums')
    .select('id, subject, class, academic_year, status, last_modified, curriculum_chapters(id, name, order_number)')
    .eq('school_id', schoolId)
    .eq('academic_year', academicYear)
    .eq('class', classGrade)
    .eq('subject', subject)
    .in('status', ['approved', 'draft'])
    .order('last_modified', { ascending: false });

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleGetCurriculumPreview(supabase: any, context: AuthenticatedContext, body: any) {
  const { curriculumId } = body;
  if (!curriculumId) return apiError(400, 'VALIDATION_ERROR', 'curriculumId is required', context.request);

  const { data, error } = await supabase
    .from('curriculums')
    .select('id, subject, class, academic_year, curriculum_chapters(id, name, description, order_number, curriculum_learning_outcomes(id, outcome))')
    .eq('id', curriculumId)
    .maybeSingle();

  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function handleCheckExistingCurriculum(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, subject, classGrade, academicYear } = body;
  if (!schoolId || !subject || !classGrade || !academicYear) {
    return apiError(400, 'VALIDATION_ERROR', 'schoolId, subject, classGrade, academicYear are required', context.request);
  }

  const { data, error } = await supabase
    .from('curriculums')
    .select('id, status')
    .eq('school_id', schoolId)
    .eq('subject', subject)
    .eq('class', classGrade)
    .eq('academic_year', academicYear)
    .maybeSingle();

  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function handleDeleteCurriculum(supabase: any, context: AuthenticatedContext, body: any) {
  const { curriculumId } = body;
  if (!curriculumId) return apiError(400, 'VALIDATION_ERROR', 'curriculumId is required', context.request);

  const { error } = await supabase.from('curriculums').delete().eq('id', curriculumId);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleGetCopiedCurriculum(supabase: any, context: AuthenticatedContext, body: any) {
  const { curriculumId } = body;
  if (!curriculumId) return apiError(400, 'VALIDATION_ERROR', 'curriculumId is required', context.request);

  const { data, error } = await supabase
    .from('curriculums')
    .select('id, subject, class, academic_year, status, curriculum_chapters(id, name, code, description, order_number, estimated_duration, duration_unit, curriculum_learning_outcomes(id, outcome, bloom_level, outcome_assessment_mappings(id, assessment_type_id, weightage, assessment_types(id, name))))')
    .eq('id', curriculumId)
    .maybeSingle();

  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function handleGetOrganizationName(supabase: any, context: AuthenticatedContext, body: any) {
  const { organizationId } = body;
  if (!organizationId) return apiError(400, 'VALIDATION_ERROR', 'organizationId is required', context.request);

  const { data, error } = await supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle();
  if (error) throw error;
  return apiSuccess(data?.name || '', context.request);
}
