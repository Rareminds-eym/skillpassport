import { z } from 'zod';
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';
import { R2Client } from '../storage/utils/r2-client';

const uuid = z.string().uuid();
const scopeSchema = z.object({ courseId: uuid, programId: uuid, semester: z.coerce.number().int().min(1).max(8) });
const text = z.string().max(10000);
const url = z.string().url().max(2048).refine(value => /^https?:\/\//i.test(value), 'Use an HTTP or HTTPS URL');
const planSchema = z.object({
  id: uuid.optional(), curriculum_id: uuid, unit_id: uuid,
  title: z.string().trim().min(1).max(255), session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration_minutes: z.number().int().min(1).max(1440),
  session_objectives: text.trim().min(1), teaching_methodology: text.trim().min(1),
  required_materials: text, evaluation_criteria: text, follow_up_activities: text, additional_notes: text,
  selected_learning_outcomes: z.array(uuid).max(100),
  resource_links: z.array(z.object({ id: z.string().max(100), title: z.string().trim().min(1).max(255), url }).strict()).max(50),
  resource_files: z.array(z.object({ id: z.string().max(100), name: z.string().max(255), size: z.number().nonnegative(), type: z.string().max(255), url }).strict()).max(50),
  evaluation_items: z.array(z.object({ id: z.string().max(100), criterion: z.string().trim().min(1).max(1000), percentage: z.number().min(0).max(100) }).strict()).max(50),
}).strict();
const fields = 'id,title,session_date,duration_minutes,college_id,department_id,program_id,course_id,semester,academic_year,curriculum_id,unit_id,selected_learning_outcomes,session_objectives,teaching_methodology,required_materials,resource_files,resource_links,evaluation_criteria,evaluation_items,follow_up_activities,additional_notes,status,updated_at';

const handle = withAuth(async context => {
  const actor = getContextUser(context);
  const db = getServiceClient(context.env);
  try {
    const body = context.request.method === 'GET'
      ? Object.fromEntries(new URL(context.request.url).searchParams)
      : await context.request.json();
    const parsed = scopeSchema.safeParse(body);
    if (!parsed.success) return apiError(400, 'VALIDATION_ERROR', 'Select a mapped course, program and semester.', context.request);
    const scope = parsed.data;
    const account = await db.from('users').select('organizationId,isActive').eq('id', actor.id).maybeSingle();
    if (account.error) return apiDbError(account.error, context.request);
    const collegeId = account.data?.organizationId;
    if (!account.data?.isActive || !collegeId || !actor.roles?.includes('college_educator'))
      return apiError(403, 'FORBIDDEN', 'An active college educator account is required.', context.request);
    const lecturer = await db.from('college_lecturers').select('id').eq('user_id', actor.id).eq('collegeId', collegeId).eq('accountStatus', 'active').maybeSingle();
    if (lecturer.error) return apiDbError(lecturer.error, context.request);
    if (!lecturer.data) return apiError(403, 'FORBIDDEN', 'An active faculty assignment is required.', context.request);
    const mappings = await db.from('college_course_mappings')
      .select('faculty_access,is_locked,course:college_courses!inner(college_id,is_active),program:programs!inner(department_id,department:departments!inner(college_id))')
      .eq('course_id', scope.courseId).eq('program_id', scope.programId).eq('semester', scope.semester)
      .in('faculty_id', [actor.id, lecturer.data.id]).eq('course.college_id', collegeId).eq('course.is_active', true)
      .eq('program.department.college_id', collegeId);
    if (mappings.error) return apiDbError(mappings.error, context.request);
    if (!mappings.data?.length) return apiError(403, 'FORBIDDEN', 'This course is not mapped to you.', context.request);
    const canEdit = mappings.data.some(mapping => mapping.faculty_access === 'edit' && !mapping.is_locked);
    if (context.request.method === 'GET') {
      const plans = await db.from('college_lesson_plans').select(fields).eq('college_id', collegeId)
        .eq('course_id', scope.courseId).eq('program_id', scope.programId).eq('semester', scope.semester)
        .in('status', ['draft', 'published']).order('session_date');
      if (plans.error) return apiDbError(plans.error, context.request);
      const curricula = await db.from('college_curriculums').select('id,academic_year,units:college_curriculum_units(id,name),outcomes:college_curriculum_outcomes(id,unit_id,outcome_text)')
        .eq('college_id', collegeId).eq('course_id', scope.courseId).eq('program_id', scope.programId);
      if (curricula.error) return apiDbError(curricula.error, context.request);
      return apiSuccess({ plans: plans.data || [], curricula: curricula.data || [], canEdit }, context.request);
    }
    if (!canEdit) return apiError(403, 'FORBIDDEN', 'Your course mapping is read-only or locked.', context.request);
    const input = planSchema.safeParse(body.plan);
    if (!input.success) return apiError(400, 'VALIDATION_ERROR', input.error.issues[0]?.message || 'Check the lesson plan fields.', context.request);
    const { id, ...plan } = input.data;
    let existingFiles: { id: string; url: string }[] = [];
    if (id) {
      const existing = await db.from('college_lesson_plans').select('resource_files').eq('id', id).eq('college_id', collegeId)
        .eq('course_id', scope.courseId).eq('program_id', scope.programId).eq('semester', scope.semester).maybeSingle();
      if (existing.error) return apiDbError(existing.error, context.request);
      if (!existing.data) return apiError(404, 'NOT_FOUND', 'Lesson plan is unavailable.', context.request);
      existingFiles = Array.isArray(existing.data.resource_files) ? existing.data.resource_files : [];
    }
    for (const file of plan.resource_files) {
      if (existingFiles.some(existing => existing.id === file.id && existing.url === file.url)) continue;
      const key = R2Client.extractKeyFromUrl(file.url);
      if (!key?.startsWith(`uploads/${actor.id}/`) || key.includes('..'))
        return apiError(403, 'FORBIDDEN', 'New attachments must be files you uploaded.', context.request);
    }
    const curriculum = await db.from('college_curriculums').select('id,academic_year,department_id').eq('id', plan.curriculum_id)
      .eq('college_id', collegeId).eq('course_id', scope.courseId).eq('program_id', scope.programId).maybeSingle();
    if (curriculum.error) return apiDbError(curriculum.error, context.request);
    if (!curriculum.data) return apiError(403, 'FORBIDDEN', 'Curriculum does not belong to this mapped course.', context.request);
    const unit = await db.from('college_curriculum_units').select('id').eq('id', plan.unit_id).eq('curriculum_id', plan.curriculum_id).maybeSingle();
    if (unit.error) return apiDbError(unit.error, context.request);
    if (!unit.data) return apiError(400, 'VALIDATION_ERROR', 'Select a unit from this curriculum.', context.request);
    if (plan.selected_learning_outcomes.length) {
      const outcomes = await db.from('college_curriculum_outcomes').select('id').eq('unit_id', plan.unit_id).eq('curriculum_id', plan.curriculum_id).in('id', plan.selected_learning_outcomes);
      if (outcomes.error) return apiDbError(outcomes.error, context.request);
      if (new Set(plan.selected_learning_outcomes).size !== outcomes.data?.length) return apiError(400, 'VALIDATION_ERROR', 'Select learning outcomes from this unit.', context.request);
    }
    if (plan.evaluation_items.length && Math.abs(plan.evaluation_items.reduce((sum, item) => sum + item.percentage, 0) - 100) > 0.01)
      return apiError(400, 'VALIDATION_ERROR', 'Evaluation weightages must total 100%.', context.request);
    // Publication and ownership fields are server-owned. Edits preserve status.
    const values = { ...plan, academic_year: curriculum.data.academic_year, department_id: curriculum.data.department_id,
      college_id: collegeId, course_id: scope.courseId, program_id: scope.programId, semester: scope.semester, updated_by: actor.id };
    const saved = id
      ? await db.from('college_lesson_plans').update(values).eq('id', id).eq('college_id', collegeId).eq('course_id', scope.courseId)
          .eq('program_id', scope.programId).eq('semester', scope.semester).in('status', ['draft', 'published']).select('id').maybeSingle()
      : await db.from('college_lesson_plans').insert({ ...values, status: 'draft', created_by: actor.id }).select('id').single();
    if (saved.error) return apiDbError(saved.error, context.request);
    if (!saved.data) return apiError(404, 'NOT_FOUND', 'Lesson plan is no longer available.', context.request);
    return apiSuccess(saved.data, context.request);
  } catch (error) { return apiDbError(error, context.request); }
});
export const onRequestGet = handle;
export const onRequestPost = handle;
