import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiError, apiDbError } from '../../lib/response';
import { academicYearVariants, getCollegeLearnerAcademicYear } from '../../lib/college-learner-academic-year';
import { R2Client } from '../storage/utils/r2-client';

export const onRequestGet = withAuth(async context => {
  const actor = getContextUser(context);
  const db = getServiceClient(context.env);
  const url = new URL(context.request.url);
  const planId = url.searchParams.get('planId');
  const resourceId = url.searchParams.get('resourceId');
  if (!planId || !/^[0-9a-f-]{36}$/i.test(planId) || !resourceId || resourceId.length > 100)
    return apiError(400, 'VALIDATION_ERROR', 'Select a lesson resource.', context.request);
  try {
    const account = await db.from('users').select('organizationId,isActive,role').eq('id', actor.id).maybeSingle();
    if (account.error) return apiDbError(account.error, context.request);
    if (!account.data?.isActive) return apiError(403, 'FORBIDDEN', 'Active account required.', context.request);
    const result = await db.from('college_lesson_plans').select('id,college_id,program_id,course_id,semester,academic_year,curriculum_id,unit_id,status,resource_files').eq('id', planId).maybeSingle();
    if (result.error) return apiDbError(result.error, context.request);
    const plan = result.data;
    if (!plan) return apiError(404, 'NOT_FOUND', 'Resource is unavailable.', context.request);
    const roles = actor.roles || [];
    const adminRoles = ['college_admin', 'university_admin', 'university_admin_dean'];
    let allowed = account.data.organizationId === plan.college_id &&
      (adminRoles.includes(account.data.role) || roles.some(role => adminRoles.includes(role)));
    if (!allowed && roles.includes('college_educator') && account.data.organizationId === plan.college_id) {
      const lecturer = await db.from('college_lecturers').select('id').eq('user_id', actor.id).eq('collegeId', plan.college_id).eq('accountStatus', 'active').maybeSingle();
      if (lecturer.error) return apiDbError(lecturer.error, context.request);
      if (lecturer.data) {
        const mappings = await db.from('college_course_mappings').select('id').eq('course_id', plan.course_id)
          .eq('program_id', plan.program_id).eq('semester', plan.semester).in('faculty_id', [actor.id, lecturer.data.id]).limit(1);
        if (mappings.error) return apiDbError(mappings.error, context.request);
        allowed = Boolean(mappings.data?.length);
      }
    }
    if (!allowed && plan.status === 'published') {
      let learner = await db.from('learners').select('id,college_id,program_id,semester,program_section_id,college_class_id')
        .eq('user_id', actor.id).not('is_deleted', 'is', true).maybeSingle();
      if (learner.error) return apiDbError(learner.error, context.request);
      if (!learner.data && actor.email) learner = await db.from('learners').select('id,college_id,program_id,semester,program_section_id,college_class_id')
        .is('user_id', null).eq('email', actor.email).not('is_deleted', 'is', true).maybeSingle();
      if (learner.error) return apiDbError(learner.error, context.request);
      const enrollment = learner.data;
      if (enrollment?.college_id === plan.college_id && enrollment.program_id === plan.program_id && enrollment.semester === plan.semester) {
        const program = await db.from('programs').select('department_id,department:departments!inner(college_id)')
          .eq('id', enrollment.program_id).eq('department.college_id', plan.college_id).maybeSingle();
        if (program.error) return apiDbError(program.error, context.request);
        const year = program.data ? await getCollegeLearnerAcademicYear(db, enrollment, program.data.department_id) : null;
        if (year && academicYearVariants(year).includes(plan.academic_year)) {
          const curriculum = await db.from('college_curriculums').select('id,units:college_curriculum_units(id)')
            .eq('college_id', plan.college_id).eq('program_id', plan.program_id).eq('course_id', plan.course_id)
            .eq('status', 'published').in('academic_year', academicYearVariants(year));
          if (curriculum.error) return apiDbError(curriculum.error, context.request);
          const mapping = await db.from('college_course_mappings').select('id,course:college_courses!inner(college_id,is_active)')
            .eq('program_id', plan.program_id).eq('semester', plan.semester).eq('course_id', plan.course_id)
            .eq('course.college_id', plan.college_id).eq('course.is_active', true).limit(1);
          if (mapping.error) return apiDbError(mapping.error, context.request);
          allowed = Boolean(mapping.data?.length && curriculum.data?.some(item => (!plan.curriculum_id || item.id === plan.curriculum_id) && item.units.some(unit => unit.id === plan.unit_id)));
        }
      }
    }
    if (!allowed) return apiError(403, 'FORBIDDEN', 'This resource is not available for your course access.', context.request);
    const file = Array.isArray(plan.resource_files) ? plan.resource_files.find((item: { id?: string }) => item.id === resourceId) : null;
    const key = typeof file?.url === 'string' ? R2Client.extractKeyFromUrl(file.url) : null;
    if (!key || key.includes('..')) return apiError(404, 'NOT_FOUND', 'Resource file is unavailable.', context.request);
    // Lesson uploads use the existing uploader-scoped R2 path. Do not expose
    // arbitrary bucket keys supplied through an attachment URL.
    const uploaderId = key.match(/^uploads\/([0-9a-f-]{36})\//i)?.[1];
    if (!uploaderId) return apiError(404, 'NOT_FOUND', 'Resource upload is unavailable.', context.request);
    const uploader = await db.from('users').select('organizationId,role').eq('id', uploaderId).maybeSingle();
    if (uploader.error) return apiDbError(uploader.error, context.request);
    if (uploader.data?.organizationId !== plan.college_id || !['college_admin', 'college_educator', 'owner', 'university_admin', 'university_admin_dean'].includes(uploader.data.role))
      return apiError(403, 'FORBIDDEN', 'Resource does not belong to this college teaching staff.', context.request);
    const storage = new R2Client(context.env);
    const response = await storage.getObject(key);
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name || 'resource')}`);
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) return apiError(404, 'NOT_FOUND', 'Resource file was not found in storage.', context.request);
    return apiDbError(error, context.request);
  }
});
