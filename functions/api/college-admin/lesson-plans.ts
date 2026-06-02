import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      case 'get-lesson-plans': {
        const { college_id, department_id, program_id, course_id, semester, academic_year, status, created_by } = params;
        let query = supabase
          .from('college_lesson_plans')
          .select(`
            *,
            course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
            department:departments!college_lesson_plans_department_id_fkey(name),
            program:programs!college_lesson_plans_program_id_fkey(name),
            unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
          `);
        if (college_id) query = query.eq('college_id', college_id);
        if (department_id) query = query.eq('department_id', department_id);
        if (program_id) query = query.eq('program_id', program_id);
        if (course_id) query = query.eq('course_id', course_id);
        if (semester) query = query.eq('semester', semester);
        if (academic_year) query = query.eq('academic_year', academic_year);
        if (status) query = query.eq('status', status);
        if (created_by) query = query.eq('created_by', created_by);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const result = (data || []).map((p: any) => ({
          ...p,
          course_code: p.course?.course_code,
          course_name: p.course?.course_name,
          department_name: p.department?.name,
          program_name: p.program?.name,
          unit_name: p.unit?.name,
        }));
        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-lesson-plan': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lesson_plans')
          .select(`
            *,
            course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
            department:departments!college_lesson_plans_department_id_fkey(name),
            program:programs!college_lesson_plans_program_id_fkey(name),
            unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
          `)
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({
          ...data,
          course_code: data.course?.course_code,
          course_name: data.course?.course_name,
          department_name: data.department?.name,
          program_name: data.program?.name,
          unit_name: data.unit?.name,
        }, context.request, { startTime });
      }

      case 'create-lesson-plan': {
        const { data, error } = await supabase
          .from('college_lesson_plans')
          .insert([{ ...params, created_by: user.id }])
          .select(`
            *,
            course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
            department:departments!college_lesson_plans_department_id_fkey(name),
            program:programs!college_lesson_plans_program_id_fkey(name),
            unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
          `)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-lesson-plan': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lesson_plans')
          .update({ ...updates, updated_by: user.id, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select(`
            *,
            course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
            department:departments!college_lesson_plans_department_id_fkey(name),
            program:programs!college_lesson_plans_program_id_fkey(name),
            unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
          `)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-lesson-plan': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('college_lesson_plans')
          .delete()
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-lesson-plan-curriculums': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data: departments, error: deptError } = await supabase
          .from('departments')
          .select('id, name, code')
          .eq('college_id', college_id)
          .eq('status', 'active')
          .order('name');
        if (deptError) return apiDbError(deptError, context.request, { startTime });

        const result: any[] = [];
        for (const dept of (departments || [])) {
          const { data: programs } = await supabase
            .from('programs')
            .select('id, name, code')
            .eq('department_id', dept.id)
            .eq('status', 'active')
            .order('name');
          const progList: any[] = [];
          for (const prog of (programs || [])) {
            const { data: mappings } = await supabase
              .from('college_course_mappings')
              .select(`
                id, semester, offering_type,
                course:college_courses(id, course_code, course_name, credits, course_type)
              `)
              .eq('program_id', prog.id);
            const courses = (mappings || []).map((m: any) => ({
              mapping_id: m.id,
              semester: m.semester,
              offering_type: m.offering_type,
              ...m.course,
            })).filter((c: any) => c.id);
            progList.push({ ...prog, courses });
          }
          result.push({ ...dept, programs: progList });
        }
        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-lesson-plan-units': {
        const { curriculum_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculum_units')
          .select('*')
          .eq('curriculum_id', curriculum_id)
          .order('order_index');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-lesson-plan-outcomes': {
        const { unit_id } = params;
        if (!unit_id) return apiError(400, 'VALIDATION_ERROR', 'Missing unit_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculum_outcomes')
          .select('*')
          .eq('unit_id', unit_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'debug-curriculums': {
        const { course_id, program_id, academic_year, college_id } = params;
        let q = supabase.from('college_curriculums').select(`
          id, course_id, program_id, academic_year, status, college_id,
          course:college_courses(course_code, course_name),
          program:programs(name)
        `);
        if (course_id) q = q.eq('course_id', course_id);
        if (program_id) q = q.eq('program_id', program_id);
        if (academic_year) q = q.eq('academic_year', academic_year);
        if (college_id) q = q.eq('college_id', college_id);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[lesson-plans POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
