import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';
import { academicYearVariants, getCollegeLearnerAcademicYear } from '../../lib/college-learner-academic-year';

export const onRequestGet = withAuth(async context => {
  const actor = getContextUser(context);
  const db = getServiceClient(context.env);
  try {
    const fields = 'id,user_id,college_id,program_id,semester,program_section_id,college_class_id';
    let result = await db.from('learners').select(fields).eq('user_id', actor.id).not('is_deleted', 'is', true).maybeSingle();
    if (result.error) return apiDbError(result.error, context.request);
    // Legacy profiles may not yet be linked to a user. Never override another user's link.
    if (!result.data && actor.email) {
      result = await db.from('learners').select(fields).is('user_id', null).eq('email', actor.email).not('is_deleted', 'is', true).maybeSingle();
      if (result.error) return apiDbError(result.error, context.request);
    }
    const learner = result.data;
    if (!learner) return apiError(403, 'LEARNER_REQUIRED', 'An enrolled learner account is required.', context.request);
    const empty = (reason: string) => apiSuccess({ courses: [], enrollment: null, setupRequired: reason }, context.request);
    if (!learner.college_id || !learner.program_id || !learner.semester) return empty('Your college, program and current semester need to be assigned before courses can be shown.');

    const program = await db.from('programs').select('id,name,department_id').eq('id', learner.program_id).maybeSingle();
    if (program.error) return apiDbError(program.error, context.request);
    if (!program.data) return empty('Your program enrollment needs to be updated. Please contact your college administrator.');
    const department = await db.from('departments').select('id').eq('id', program.data.department_id).eq('college_id', learner.college_id).maybeSingle();
    if (department.error) return apiDbError(department.error, context.request);
    if (!department.data) return empty('Your program must belong to your college before courses can be shown.');
    const year = await getCollegeLearnerAcademicYear(db, learner, program.data.department_id);
    if (!year) return empty('Your current academic year needs to be set on your program section or college class. Please contact your college administrator.');
    const enrollment = { program_name: program.data.name, semester: learner.semester, academic_year: year };

    const mappings = await db.from('college_course_mappings').select('course_id').eq('program_id', learner.program_id).eq('semester', learner.semester);
    if (mappings.error) return apiDbError(mappings.error, context.request);
    const ids = [...new Set((mappings.data || []).map(row => row.course_id))];
    if (!ids.length) return apiSuccess({ courses: [], enrollment, setupRequired: null }, context.request);
    const courses = await db.from('college_courses').select('id,course_code,course_name,description,credits')
      .eq('college_id', learner.college_id).eq('is_active', true).in('id', ids);
    if (courses.error) return apiDbError(courses.error, context.request);
    if (!courses.data?.length) return apiSuccess({ courses: [], enrollment, setupRequired: null }, context.request);

    // Explicit fields keep pending proposals, review notes and educator metadata private.
    const curricula = await db.from('college_curriculums').select(`id,course_id,academic_year,
      units:college_curriculum_units(id,name,code,description,credits,estimated_duration,duration_unit,order_index),
      outcomes:college_curriculum_outcomes(id,unit_id,outcome_text,bloom_level)`)
      .eq('college_id', learner.college_id).eq('program_id', learner.program_id).eq('status', 'published')
      .in('academic_year', academicYearVariants(year)).in('course_id', courses.data.map(row => row.id));
    if (curricula.error) return apiDbError(curricula.error, context.request);
    const years = academicYearVariants(year);
    const current = [...(curricula.data || [])].sort((a, b) => years.indexOf(a.academic_year) - years.indexOf(b.academic_year))
      .filter((curriculum, index, all) => all.findIndex(item => item.course_id === curriculum.course_id) === index);
    const published = current.map(curriculum => ({
      ...curriculum, course: courses.data!.find(row => row.id === curriculum.course_id),
      units: [...(curriculum.units || [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
      outcomes: [...(curriculum.outcomes || [])].sort((a, b) => a.id.localeCompare(b.id)),
    })).sort((a, b) => (a.course?.course_code || '').localeCompare(b.course?.course_code || ''));
    return apiSuccess({ courses: published, enrollment, setupRequired: null }, context.request);
  } catch (error) {
    return apiDbError(error, context.request);
  }
});
