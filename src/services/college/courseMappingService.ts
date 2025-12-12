import { supabase } from '@/lib/supabaseClient';

export interface CourseMapping {
  id: string;
  program_id: string;
  semester: number;
  course_code: string;
  course_name: string;
  credits: number;
  type: 'core' | 'dept_elective' | 'open_elective';
  faculty_id?: string;
  capacity?: number;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkloadSummary {
  faculty_id: string;
  faculty_name: string;
  total_credits: number;
  courses: Array<{ course_name: string; credits: number; program: string }>;
}

/**
 * Map a course to a program semester
 */
export async function mapCourse(data: Partial<CourseMapping>): Promise<CourseMapping> {
  // Check if semester is locked
  const { data: existing } = await supabase
    .from('course_mappings')
    .select('is_locked')
    .eq('program_id', data.program_id)
    .eq('semester', data.semester)
    .limit(1)
    .single();

  if (existing?.is_locked) {
    throw new Error('INVALID_STATE: Semester is locked and cannot be modified');
  }

  const { data: mapping, error } = await supabase
    .from('course_mappings')
    .insert([{
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('DUPLICATE_ENTRY: Course already mapped to this program semester');
    }
    throw error;
  }

  return mapping;
}

/**
 * Update a course mapping
 */
export async function updateCourseMapping(id: string, updates: Partial<CourseMapping>): Promise<CourseMapping> {
  // Check if locked
  const { data: existing } = await supabase
    .from('course_mappings')
    .select('is_locked')
    .eq('id', id)
    .single();

  if (existing?.is_locked) {
    throw new Error('INVALID_STATE: Course mapping is locked and cannot be modified');
  }

  const { data, error } = await supabase
    .from('course_mappings')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Allocate faculty to a course
 */
export async function allocateFaculty(mappingId: string, facultyId: string): Promise<void> {
  const { error } = await supabase
    .from('course_mappings')
    .update({ 
      faculty_id: facultyId,
      updated_at: new Date().toISOString()
    })
    .eq('id', mappingId);

  if (error) throw error;
}

/**
 * Calculate faculty workload
 */
export async function calculateWorkload(facultyId: string): Promise<WorkloadSummary> {
  const { data: courses, error: coursesError } = await supabase
    .from('course_mappings')
    .select(`
      course_name,
      credits,
      programs:program_id (name)
    `)
    .eq('faculty_id', facultyId);

  if (coursesError) throw coursesError;

  const { data: faculty, error: facultyError } = await supabase
    .from('users')
    .select('name')
    .eq('id', facultyId)
    .single();

  if (facultyError) throw facultyError;

  const total_credits = (courses || []).reduce((sum, course) => sum + course.credits, 0);

  return {
    faculty_id: facultyId,
    faculty_name: faculty.name,
    total_credits,
    courses: (courses || []).map(c => ({
      course_name: c.course_name,
      credits: c.credits,
      program: (c.programs as any)?.name || 'Unknown'
    }))
  };
}

/**
 * Lock a semester to prevent modifications
 */
export async function lockSemester(programId: string, semester: number): Promise<void> {
  const { error } = await supabase
    .from('course_mappings')
    .update({ 
      is_locked: true,
      updated_at: new Date().toISOString()
    })
    .eq('program_id', programId)
    .eq('semester', semester);

  if (error) throw error;
}

/**
 * Unlock a semester
 */
export async function unlockSemester(programId: string, semester: number): Promise<void> {
  const { error } = await supabase
    .from('course_mappings')
    .update({ 
      is_locked: false,
      updated_at: new Date().toISOString()
    })
    .eq('program_id', programId)
    .eq('semester', semester);

  if (error) throw error;
}

/**
 * Clone semester structure
 */
export async function cloneSemesterStructure(fromProgramId: string, fromSemester: number, toProgramId: string, toSemester: number): Promise<void> {
  // Get source mappings
  const { data: sourceMappings, error: fetchError } = await supabase
    .from('course_mappings')
    .select('*')
    .eq('program_id', fromProgramId)
    .eq('semester', fromSemester);

  if (fetchError) throw fetchError;

  // Clone to target
  const clonedMappings = (sourceMappings || []).map(mapping => ({
    program_id: toProgramId,
    semester: toSemester,
    course_code: mapping.course_code,
    course_name: mapping.course_name,
    credits: mapping.credits,
    type: mapping.type,
    capacity: mapping.capacity,
    is_locked: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { error: insertError } = await supabase
    .from('course_mappings')
    .insert(clonedMappings);

  if (insertError) throw insertError;
}

/**
 * Get course mappings for a program semester
 */
export async function getCourseMappings(programId: string, semester?: number): Promise<CourseMapping[]> {
  let query = supabase
    .from('course_mappings')
    .select('*')
    .eq('program_id', programId);

  if (semester !== undefined) {
    query = query.eq('semester', semester);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Check elective capacity
 */
export async function checkElectiveCapacity(mappingId: string): Promise<{ enrolled: number; capacity: number; available: number }> {
  const { data: mapping, error: mappingError } = await supabase
    .from('course_mappings')
    .select('capacity')
    .eq('id', mappingId)
    .single();

  if (mappingError) throw mappingError;

  // Count enrolled students (this would need a student_enrollments table in real implementation)
  // For now, return mock data
  const capacity = mapping.capacity || 0;
  const enrolled = 0; // TODO: Implement actual enrollment count

  return {
    enrolled,
    capacity,
    available: capacity - enrolled
  };
}
