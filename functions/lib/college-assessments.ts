import type { SupabaseClient } from '@supabase/supabase-js';

export function presentCollegeAssessment<T extends { course_id?: string | null; college_course_id?: string | null }>(row: T) {
  return { ...row, course_id: row.college_course_id || row.course_id };
}

export class CollegeAssessmentError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function prepareCollegeAssessment(db: SupabaseClient, collegeId: string, input: Record<string, any>, existing?: Record<string, any>) {
  const context = { ...existing, ...input };
  const courseId = input.course_id ?? existing?.college_course_id ?? existing?.course_id;
  const semester = Number(context.semester);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (![courseId, context.department_id, context.program_id].every(value => typeof value === 'string' && uuid.test(value)) || !Number.isInteger(semester) || semester < 1 || semester > 12)
    throw new CollegeAssessmentError(400, 'Select a department, program, semester and mapped college course.');
  const program = await db.from('programs').select('id,department:departments!inner(college_id)')
    .eq('id', context.program_id).eq('department_id', context.department_id).eq('department.college_id', collegeId).maybeSingle();
  if (program.error) throw program.error;
  if (!program.data) throw new CollegeAssessmentError(403, 'Select a department and program in your college.');
  const course = await db.from('college_courses').select('id,course_code,course_name')
    .eq('id', courseId).eq('college_id', collegeId).eq('is_active', true).maybeSingle();
  if (course.error) throw course.error;
  if (!course.data) throw new CollegeAssessmentError(400, 'This college course is unavailable. Select a mapped course again.');
  const mapping = await db.from('college_course_mappings').select('id')
    .eq('course_id', courseId).eq('program_id', context.program_id).eq('semester', semester).limit(1);
  if (mapping.error) throw mapping.error;
  if (!mapping.data?.length) throw new CollegeAssessmentError(400, 'Course is not mapped to this program and semester.');
  // Take names from the catalog, never from a client-side cached course list.
  return { ...input, course_id: null, college_course_id: courseId, college_id: collegeId,
    department_id: context.department_id, program_id: context.program_id, semester,
    course_code: course.data.course_code, course_name: course.data.course_name };
}
