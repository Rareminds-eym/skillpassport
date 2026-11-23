import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { hasFeatureEntitlement } from '../../lib/entitlements';
import { apiSuccess, apiError } from '../../lib/response';
import { parseCollegeCourseRequest } from '../../lib/college-course-request';
import { publishCollegeCourseNotifications } from '../../lib/college-course-notifications';

export const onRequestPost = withAuth(async context => {
  let operation;
  try { operation = parseCollegeCourseRequest(await context.request.json()); }
  catch { return apiError(400,'VALIDATION_ERROR','Invalid course request. Check required fields and import limits.',context.request); }
  const user = getContextUser(context);
  const db = getServiceClient(context.env);
  if (operation.action === 'import' && !(await hasFeatureEntitlement(db,user.id,'curriculum_builder'))) {
    return apiError(403,'FEATURE_ACCESS_DENIED','Curriculum Builder access is required.',context.request);
  }
  if (operation.action === 'rareminds-content') {
    const access = await db.rpc('college_course_workflow', { p_actor: user.id, p_action: 'courses', p_payload: {} });
    if (access.error) return apiError(503,'COURSE_WORKFLOW_ERROR','Could not verify mapped courses.',context.request);
    if (!access.data?.courses?.some((course: { id: string; ownership: string }) => course.id===operation.payload.courseId && course.ownership==='rareminds')) {
      return apiError(403,'FORBIDDEN','Course is not mapped to you.',context.request);
    }
    const content = await db.from('course_modules').select('module_id,title,description,lessons(lesson_id,title,description,content,lesson_resources(resource_id,name,url))').eq('course_id',operation.payload.courseId).order('order_index');
    if (content.error) return apiError(503,'CONTENT_UNAVAILABLE','Course content is unavailable.',context.request);
    return apiSuccess(content.data || [],context.request);
  }
  const { data, error } = operation.action === 'create-assessment-type'
    ? await db.rpc('create_college_assessment_type', { p_actor: user.id, p_course: operation.payload.courseId, p_program: operation.payload.programId, p_name: operation.payload.name, p_description: operation.payload.description || '' })
    : await db.rpc('college_course_workflow', { p_actor: user.id, p_action: operation.action, p_payload: operation.payload });
  if (error) {
    const status = error.code === '42501' ? 403 : ['23505','40001'].includes(error.code) ? 409 : error.code === '22023' ? 400 : 503;
    return apiError(status,status===403?'FORBIDDEN':status===409?'CONFLICT':'COURSE_WORKFLOW_ERROR',status===503?'Course service is unavailable. Please retry.':error.message,context.request);
  }
  if (operation.action === 'courses' && data?.courses) {
    const programIds = [...new Set<string>(data.courses.map((course: { program_id?: string }) => course.program_id).filter(Boolean))];
    if (programIds.length) {
      const programs = await db.from('programs').select('id,name,code,department:departments(id,name,code)').in('id', programIds);
      if (programs.error) return apiError(503,'COURSE_WORKFLOW_ERROR','Could not load course program details. Please retry.',context.request);
      data.courses = data.courses.map((course: { program_id?: string }) => {
        const program = programs.data?.find(item => item.id === course.program_id);
        const department = Array.isArray(program?.department) ? program.department[0] : program?.department;
        return { ...course, program_name: program?.name ?? null, program_code: program?.code ?? null,
          department_id: department?.id ?? null, department_name: department?.name ?? null, department_code: department?.code ?? null };
      });
    }
  }
  if ((operation.action === 'propose' || operation.action === 'propose-add') && data?.requestId) {
    context.waitUntil(publishCollegeCourseNotifications(db, context.env, data.requestId, 'curriculum_change_submitted'));
  } else if (operation.action === 'review') {
    context.waitUntil(publishCollegeCourseNotifications(db, context.env, operation.payload.requestId, `curriculum_change_${operation.payload.decision}`));
  }
  return apiSuccess(data,context.request);
});
