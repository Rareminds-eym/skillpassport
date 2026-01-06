import { supabase } from '@/lib/supabaseClient';

// Types
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
  created_by?: string;
  updated_by?: string;
  metadata?: any;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  college_id?: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  department_id: string;
  degree_level: string;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  maxWorkload: number;
  currentWorkload: number;
}

export interface WorkloadSummary {
  faculty_id: string;
  faculty_name: string;
  total_credits: number;
  courses: Array<{ course_name: string; credits: number; program: string }>;
}

// Cache for user college ID to avoid repeated queries
let userCollegeIdCache: string | null = null;
let userIdCache: string | null = null;

/**
 * Get current user's college ID with caching
 */
async function getCurrentUserCollegeId(): Promise<string | null> {
  if (userCollegeIdCache) return userCollegeIdCache;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: lecturer } = await supabase
    .from('college_lecturers')
    .select('collegeId')
    .eq('user_id', user.id)
    .single();

  userCollegeIdCache = lecturer?.collegeId || null;
  return userCollegeIdCache;
}

/**
 * Get current user ID from Supabase auth with caching
 */
async function getCurrentUserId(): Promise<string | null> {
  if (userIdCache) return userIdCache;

  const { data: { user } } = await supabase.auth.getUser();
  userIdCache = user?.id || null;
  return userIdCache;
}

/**
 * Clear user cache (call on logout or user change)
 */
export function clearUserCache(): void {
  userCollegeIdCache = null;
  userIdCache = null;
}

/**
 * Get all departments for the current user's college
 */
export async function getDepartments(): Promise<Department[]> {
  // Get current user's college ID
  const collegeId = await getCurrentUserCollegeId();
  if (!collegeId) {
    throw new Error('Unable to determine user college');
  }

  const { data, error } = await supabase
    .from('departments')
    .select('id, name, code, college_id')
    .eq('college_id', collegeId)
    .eq('status', 'active')
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Get programs for a department
 */
export async function getPrograms(departmentId?: string): Promise<Program[]> {
  let query = supabase
    .from('programs')
    .select('id, name, code, department_id, degree_level')
    .eq('status', 'active')
    .order('name');

  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get faculty members with workload info (optimized with batch processing)
 */
export async function getFaculty(departmentId?: string): Promise<Faculty[]> {
  const collegeId = await getCurrentUserCollegeId();
  if (!collegeId) {
    throw new Error('Unable to determine user college');
  }

  try {
    let userIds: string[] = [];

    if (departmentId) {
      // Get assigned lecturer IDs for the department
      const { data: assignments, error: assignmentError } = await supabase
        .from('department_faculty_assignments')
        .select('lecturer_id')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Get user IDs for assigned lecturers
      const { data: collegeLecturers, error: lecturerError } = await supabase
        .from('college_lecturers')
        .select('user_id')
        .in('id', assignments.map(a => a.lecturer_id))
        .eq('collegeId', collegeId)
        .eq('accountStatus', 'active')
        .not('user_id', 'is', null);

      if (lecturerError) throw lecturerError;

      userIds = (collegeLecturers || []).map(cl => cl.user_id).filter(Boolean);
      
      if (userIds.length === 0) {
        return [];
      }
    }

    // Build query for educators
    let query = supabase
      .from('users')
      .select(`
        id, 
        firstName, 
        lastName, 
        email,
        college_lecturers!inner(
          collegeId,
          first_name,
          last_name,
          accountStatus
        )
      `)
      .eq('role', 'college_educator')
      .eq('college_lecturers.collegeId', collegeId)
      .eq('college_lecturers.accountStatus', 'active');

    if (departmentId && userIds.length > 0) {
      query = query.in('id', userIds);
    }

    const { data: educators, error: educatorsError } = await query;
    if (educatorsError) throw educatorsError;

    if (!educators || educators.length === 0) {
      return [];
    }

    // Batch fetch workload for all educators
    const { data: workloadData } = await supabase
      .from('college_course_mappings')
      .select('faculty_id, credits')
      .in('faculty_id', educators.map(e => e.id));

    // Calculate workload map
    const workloadMap = new Map<string, number>();
    (workloadData || []).forEach(mapping => {
      const current = workloadMap.get(mapping.faculty_id) || 0;
      workloadMap.set(mapping.faculty_id, current + Number(mapping.credits));
    });

    // Build faculty list with workload
    return educators.map(educator => {
      const lecturerData = educator.college_lecturers[0];
      let displayName = '';
      
      if (educator.firstName || educator.lastName) {
        displayName = `${educator.firstName || ''} ${educator.lastName || ''}`.trim();
      } else if (lecturerData?.first_name || lecturerData?.last_name) {
        displayName = `${lecturerData.first_name || ''} ${lecturerData.last_name || ''}`.trim();
      }
      
      if (!displayName) {
        displayName = educator.email;
      }
      
      return {
        id: educator.id,
        name: displayName,
        email: educator.email,
        maxWorkload: 18,
        currentWorkload: workloadMap.get(educator.id) || 0
      };
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    throw error;
  }
}

/**
 * Map a course to a program semester (optimized with validation)
 */
export async function mapCourse(data: Partial<CourseMapping>): Promise<CourseMapping> {
  if (!data.program_id || !data.semester) {
    throw new Error('VALIDATION_ERROR: Program ID and semester are required');
  }

  try {
    // Check if semester is locked
    const locked = await isSemesterLocked(data.program_id, data.semester);
    if (locked) {
      throw new Error('INVALID_STATE: Semester is locked and cannot be modified');
    }

    const currentUserId = await getCurrentUserId();
    const timestamp = new Date().toISOString();

    const { data: mapping, error } = await supabase
      .from('college_course_mappings')
      .insert([{
        ...data,
        created_by: currentUserId,
        updated_by: currentUserId,
        created_at: timestamp,
        updated_at: timestamp
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
  } catch (error) {
    console.error('Error mapping course:', error);
    throw error;
  }
}

/**
 * Update a course mapping (optimized with validation)
 */
export async function updateCourseMapping(id: string, updates: Partial<CourseMapping>): Promise<CourseMapping> {
  if (!id) {
    throw new Error('VALIDATION_ERROR: Mapping ID is required');
  }

  try {
    // Check if locked
    const { data: existing } = await supabase
      .from('college_course_mappings')
      .select('is_locked')
      .eq('id', id)
      .single();

    if (existing?.is_locked) {
      throw new Error('INVALID_STATE: Course mapping is locked and cannot be modified');
    }

    const currentUserId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('college_course_mappings')
      .update({
        ...updates,
        updated_by: currentUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating course mapping:', error);
    throw error;
  }
}

/**
 * Delete a course mapping (optimized with validation)
 */
export async function deleteCourseMapping(id: string): Promise<void> {
  if (!id) {
    throw new Error('VALIDATION_ERROR: Mapping ID is required');
  }

  try {
    // Check if locked
    const { data: existing } = await supabase
      .from('college_course_mappings')
      .select('is_locked')
      .eq('id', id)
      .single();

    if (existing?.is_locked) {
      throw new Error('INVALID_STATE: Course mapping is locked and cannot be modified');
    }

    const { error } = await supabase
      .from('college_course_mappings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting course mapping:', error);
    throw error;
  }
}

/**
 * Get course mappings for a program semester with search and filters (optimized)
 */
export async function getCourseMappings(
  programId: string, 
  semester?: number,
  searchQuery?: string,
  typeFilter?: 'core' | 'dept_elective' | 'open_elective'
): Promise<CourseMapping[]> {
  if (!programId) {
    throw new Error('VALIDATION_ERROR: Program ID is required');
  }

  try {
    let query = supabase
      .from('college_course_mappings')
      .select('*')
      .eq('program_id', programId);

    if (semester !== undefined) {
      query = query.eq('semester', semester);
    }

    if (searchQuery?.trim()) {
      const searchTerm = searchQuery.trim();
      query = query.or(`course_name.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%`);
    }

    if (typeFilter) {
      query = query.eq('type', typeFilter);
    }

    query = query
      .order('semester', { ascending: true })
      .order('course_code', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching course mappings:', error);
    throw error;
  }
}

/**
 * Check if semester is locked (optimized with caching)
 */
export async function isSemesterLocked(programId: string, semester: number): Promise<boolean> {
  if (!programId || semester === undefined) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('college_course_mappings')
      .select('is_locked')
      .eq('program_id', programId)
      .eq('semester', semester)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.is_locked || false;
  } catch (error) {
    console.error('Error checking semester lock:', error);
    return false;
  }
}

/**
 * Lock/unlock semester operations (batch operations)
 */
export async function lockSemester(programId: string, semester: number): Promise<void> {
  if (!programId || semester === undefined) {
    throw new Error('VALIDATION_ERROR: Program ID and semester are required');
  }

  try {
    const { error } = await supabase
      .from('college_course_mappings')
      .update({ 
        is_locked: true,
        updated_at: new Date().toISOString()
      })
      .eq('program_id', programId)
      .eq('semester', semester);

    if (error) throw error;
  } catch (error) {
    console.error('Error locking semester:', error);
    throw error;
  }
}

export async function unlockSemester(programId: string, semester: number): Promise<void> {
  if (!programId || semester === undefined) {
    throw new Error('VALIDATION_ERROR: Program ID and semester are required');
  }

  try {
    const { error } = await supabase
      .from('college_course_mappings')
      .update({ 
        is_locked: false,
        updated_at: new Date().toISOString()
      })
      .eq('program_id', programId)
      .eq('semester', semester);

    if (error) throw error;
  } catch (error) {
    console.error('Error unlocking semester:', error);
    throw error;
  }
}

/**
 * Clone semester structure (optimized with batch operations)
 */
export async function cloneSemesterStructure(
  fromProgramId: string, 
  fromSemester: number, 
  toProgramId: string, 
  toSemester: number
): Promise<void> {
  if (!fromProgramId || !toProgramId || fromSemester === undefined || toSemester === undefined) {
    throw new Error('VALIDATION_ERROR: All parameters are required for cloning');
  }

  try {
    // Get source mappings
    const { data: sourceMappings, error: fetchError } = await supabase
      .from('college_course_mappings')
      .select('*')
      .eq('program_id', fromProgramId)
      .eq('semester', fromSemester);

    if (fetchError) throw fetchError;

    if (!sourceMappings || sourceMappings.length === 0) {
      throw new Error('No courses found in source semester to clone');
    }

    // Prepare cloned mappings
    const timestamp = new Date().toISOString();
    const clonedMappings = sourceMappings.map(mapping => ({
      program_id: toProgramId,
      semester: toSemester,
      course_code: mapping.course_code,
      course_name: mapping.course_name,
      credits: mapping.credits,
      type: mapping.type,
      capacity: mapping.capacity,
      is_locked: false,
      created_at: timestamp,
      updated_at: timestamp
    }));

    // Insert cloned mappings
    const { error: insertError } = await supabase
      .from('college_course_mappings')
      .insert(clonedMappings);

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('Some courses already exist in the target semester');
      }
      throw insertError;
    }
  } catch (error) {
    console.error('Error cloning semester structure:', error);
    throw error;
  }
}
/**
 * Additional utility functions for optimization
 */

/**
 * Allocate faculty to a course
 */
export async function allocateFaculty(mappingId: string, facultyId: string): Promise<void> {
  if (!mappingId || !facultyId) {
    throw new Error('VALIDATION_ERROR: Mapping ID and Faculty ID are required');
  }

  try {
    const { error } = await supabase
      .from('college_course_mappings')
      .update({ 
        faculty_id: facultyId,
        updated_at: new Date().toISOString()
      })
      .eq('id', mappingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error allocating faculty:', error);
    throw error;
  }
}

/**
 * Calculate faculty workload (optimized)
 */
export async function calculateWorkload(facultyId: string): Promise<WorkloadSummary> {
  if (!facultyId) {
    throw new Error('VALIDATION_ERROR: Faculty ID is required');
  }

  try {
    const [coursesResult, facultyResult] = await Promise.all([
      supabase
        .from('college_course_mappings')
        .select(`
          course_name,
          credits,
          programs:program_id (name)
        `)
        .eq('faculty_id', facultyId),
      supabase
        .from('users')
        .select('firstName, lastName, email')
        .eq('id', facultyId)
        .single()
    ]);

    if (coursesResult.error) throw coursesResult.error;
    if (facultyResult.error) throw facultyResult.error;

    const courses = coursesResult.data || [];
    const faculty = facultyResult.data;

    const total_credits = courses.reduce((sum, course) => sum + course.credits, 0);
    const faculty_name = `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim() || faculty.email;

    return {
      faculty_id: facultyId,
      faculty_name,
      total_credits,
      courses: courses.map(c => ({
        course_name: c.course_name,
        credits: c.credits,
        program: (c.programs as any)?.name || 'Unknown'
      }))
    };
  } catch (error) {
    console.error('Error calculating workload:', error);
    throw error;
  }
}

/**
 * Get all course mappings with detailed info (with pagination support)
 */
export async function getAllCourseMappings(
  limit?: number,
  offset?: number
): Promise<CourseMapping[]> {
  try {
    let query = supabase
      .from('college_course_mappings')
      .select('*')
      .order('semester', { ascending: true })
      .order('course_code', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all course mappings:', error);
    throw error;
  }
}

/**
 * Check elective capacity (optimized for future enrollment tracking)
 */
export async function checkElectiveCapacity(mappingId: string): Promise<{ 
  enrolled: number; 
  capacity: number; 
  available: number 
}> {
  if (!mappingId) {
    throw new Error('VALIDATION_ERROR: Mapping ID is required');
  }

  try {
    const { data: mapping, error: mappingError } = await supabase
      .from('college_course_mappings')
      .select('capacity')
      .eq('id', mappingId)
      .single();

    if (mappingError) throw mappingError;

    // TODO: Implement actual enrollment count when student_enrollments table is available
    // const { count: enrolled } = await supabase
    //   .from('student_enrollments')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('course_mapping_id', mappingId)
    //   .eq('status', 'enrolled');

    const capacity = mapping.capacity || 0;
    const enrolled = 0; // Placeholder until enrollment tracking is implemented

    return {
      enrolled,
      capacity,
      available: Math.max(0, capacity - enrolled)
    };
  } catch (error) {
    console.error('Error checking elective capacity:', error);
    throw error;
  }
}