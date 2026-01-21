import { supabase } from '@/lib/supabaseClient';

// Types
export interface Course {
  id: string;
  college_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  description?: string;
  prerequisites: string[];
  course_type: 'theory' | 'lab' | 'project' | 'seminar' | 'workshop' | 'practical';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  metadata?: any;
}

export interface CourseMapping {
  id: string;
  course_id: string;
  program_id: string;
  semester: number;
  offering_type: 'core' | 'dept_elective' | 'open_elective';
  faculty_id?: string;
  capacity?: number;
  current_enrollment: number;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  metadata?: any;
  // Joined course data
  course?: Course;
  // Legacy fields for backward compatibility with UI
  course_code?: string;
  course_name?: string;
  credits?: number;
  type?: 'core' | 'dept_elective' | 'open_elective';
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
 * Get all available courses from master catalog
 */
export async function getCourses(searchQuery?: string, courseType?: string): Promise<Course[]> {
  const collegeId = await getCurrentUserCollegeId();
  if (!collegeId) {
    throw new Error('Unable to determine user college');
  }

  try {
    let query = supabase
      .from('college_courses')
      .select('*')
      .eq('college_id', collegeId)
      .eq('is_active', true);

    if (searchQuery?.trim()) {
      const searchTerm = searchQuery.trim();
      query = query.or(`course_name.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%`);
    }

    if (courseType) {
      query = query.eq('course_type', courseType);
    }

    query = query.order('course_code');

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

/**
 * Create a new course in the master catalog
 */
export async function createCourse(
  courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>
): Promise<Course> {
  const collegeId = await getCurrentUserCollegeId();
  const currentUserId = await getCurrentUserId();

  if (!collegeId) {
    throw new Error('Unable to determine user college');
  }

  try {
    const { data, error } = await supabase
      .from('college_courses')
      .insert([
        {
          ...courseData,
          college_id: collegeId,
          created_by: currentUserId,
          updated_by: currentUserId,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Course code already exists in this college');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

/**
 * Update a course in the master catalog
 */
export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
  const currentUserId = await getCurrentUserId();

  try {
    const { data, error } = await supabase
      .from('college_courses')
      .update({
        ...updates,
        updated_by: currentUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
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
    // Strategy 1: Try to get faculty from department assignments if they exist
    if (departmentId) {
      const { data: assignments } = await supabase
        .from('department_faculty_assignments')
        .select(
          `
          lecturer_id,
          college_lecturers!inner(
            id,
            first_name,
            last_name,
            email,
            user_id,
            accountStatus,
            collegeId
          )
        `
        )
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .eq('college_lecturers.collegeId', collegeId)
        .eq('college_lecturers.accountStatus', 'active');

      if (assignments && assignments.length > 0) {
        // Get user IDs for workload calculation
        const lecturerUserIds = assignments
          // @ts-expect-error - Auto-suppressed for migration
          .map((a) => a.college_lecturers?.user_id)
          .filter(Boolean);

        // Calculate workload for assigned faculty
        const workloadMap = await calculateFacultyWorkload(lecturerUserIds);

        return assignments.map((assignment) => {
          const lecturer = assignment.college_lecturers;
          const displayName =
            // @ts-expect-error - Auto-suppressed for migration
            `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim() ||
            // @ts-expect-error - Auto-suppressed for migration
            lecturer.email ||
            'Unknown';

          return {
            // @ts-expect-error - Auto-suppressed for migration
            id: lecturer.user_id || lecturer.id, // Prefer user_id if available
            name: displayName,
            // @ts-expect-error - Auto-suppressed for migration
            email: lecturer.email || '',
            maxWorkload: 18,
            // @ts-expect-error - Auto-suppressed for migration
            currentWorkload: workloadMap.get(lecturer.user_id || lecturer.id) || 0,
          };
        });
      }
    }

    // Strategy 2: Get all college educators for this college (fallback)
    // First, get college lecturers with user accounts
    const { data: collegeLecturers, error: lecturersError } = await supabase
      .from('college_lecturers')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        user_id,
        department,
        accountStatus
      `
      )
      .eq('collegeId', collegeId)
      .eq('accountStatus', 'active')
      .not('user_id', 'is', null);

    if (lecturersError) throw lecturersError;

    // Get users with college_educator role for this college
    const { data: educatorUsers, error: usersError } = await supabase
      .from('users')
      .select('id, firstName, lastName, email')
      .eq('role', 'college_educator');

    if (usersError) throw usersError;

    // Combine both sources
    const facultyMap = new Map<string, Faculty>();

    // Add college lecturers with user accounts
    if (collegeLecturers) {
      for (const lecturer of collegeLecturers) {
        if (lecturer.user_id) {
          const displayName =
            `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim() ||
            lecturer.email ||
            'Unknown';
          facultyMap.set(lecturer.user_id, {
            id: lecturer.user_id,
            name: displayName,
            email: lecturer.email || '',
            maxWorkload: 18,
            currentWorkload: 0,
          });
        }
      }
    }

    // Add college_educator users (in case some don't have lecturer records)
    if (educatorUsers) {
      for (const user of educatorUsers) {
        if (!facultyMap.has(user.id)) {
          const displayName =
            `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
          facultyMap.set(user.id, {
            id: user.id,
            name: displayName,
            email: user.email || '',
            maxWorkload: 18,
            currentWorkload: 0,
          });
        }
      }
    }

    // Filter by department if specified
    if (departmentId && collegeLecturers) {
      // Get department info to filter by department name
      const { data: department } = await supabase
        .from('departments')
        .select('name, code')
        .eq('id', departmentId)
        .single();

      if (department) {
        // Filter lecturers by department
        const departmentLecturers = collegeLecturers.filter(
          (lecturer) =>
            lecturer.department &&
            (lecturer.department.toLowerCase().includes(department.name.toLowerCase()) ||
              lecturer.department.toLowerCase().includes(department.code.toLowerCase()) ||
              department.name.toLowerCase().includes(lecturer.department.toLowerCase()))
        );

        // Keep only faculty from this department
        const departmentFacultyIds = new Set(
          departmentLecturers.map((l) => l.user_id).filter(Boolean)
        );

        for (const [id, faculty] of facultyMap.entries()) {
          if (!departmentFacultyIds.has(id)) {
            facultyMap.delete(id);
          }
        }
      }
    }

    // Calculate workload for all faculty
    const facultyIds = Array.from(facultyMap.keys());
    if (facultyIds.length > 0) {
      const workloadMap = await calculateFacultyWorkload(facultyIds);

      // Update workload in faculty map
      for (const [id, faculty] of facultyMap.entries()) {
        faculty.currentWorkload = workloadMap.get(id) || 0;
      }
    }

    return Array.from(facultyMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching faculty:', error);
    throw error;
  }
}

/**
 * Helper function to calculate faculty workload
 */
async function calculateFacultyWorkload(facultyIds: string[]): Promise<Map<string, number>> {
  const workloadMap = new Map<string, number>();

  if (facultyIds.length === 0) return workloadMap;

  try {
    const { data: workloadData } = await supabase
      .from('college_course_mappings')
      .select(
        `
        faculty_id,
        course:college_courses(credits)
      `
      )
      .in('faculty_id', facultyIds);

    (workloadData || []).forEach((mapping) => {
      const current = workloadMap.get(mapping.faculty_id) || 0;
      // @ts-expect-error - Auto-suppressed for migration
      const credits = mapping.course?.credits || 0;
      workloadMap.set(mapping.faculty_id, current + Number(credits));
    });
  } catch (error) {
    console.error('Error calculating faculty workload:', error);
  }

  return workloadMap;
}

/**
 * Map a course to a program semester (optimized with validation)
 */
export async function mapCourse(data: {
  course_id?: string;
  program_id: string;
  semester: number;
  offering_type?: 'core' | 'dept_elective' | 'open_elective';
  faculty_id?: string;
  capacity?: number;
  // Legacy fields for backward compatibility
  course_code?: string;
  course_name?: string;
  credits?: number;
  type?: 'core' | 'dept_elective' | 'open_elective';
}): Promise<CourseMapping> {
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

    // Handle legacy format where course data is provided directly
    let courseId = data.course_id;

    if (!courseId && data.course_code && data.course_name) {
      // Create course in catalog first if it doesn't exist
      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        throw new Error('Unable to determine user college');
      }

      // Check if course already exists
      const { data: existingCourse } = await supabase
        .from('college_courses')
        .select('id')
        .eq('college_id', collegeId)
        .eq('course_code', data.course_code)
        .single();

      if (existingCourse) {
        courseId = existingCourse.id;
      } else {
        // Create new course
        const newCourse = await createCourse({
          college_id: collegeId,
          course_code: data.course_code,
          course_name: data.course_name,
          credits: data.credits || 3,
          description: '',
          prerequisites: [],
          course_type: 'theory',
          is_active: true,
        });
        courseId = newCourse.id;
      }
    }

    if (!courseId) {
      throw new Error('VALIDATION_ERROR: Course ID is required or course data must be provided');
    }

    // Map offering_type from legacy type field
    let offeringType = data.offering_type;
    if (!offeringType && data.type) {
      switch (data.type) {
        case 'core':
          offeringType = 'core';
          break;
        case 'dept_elective':
          offeringType = 'dept_elective';
          break;
        case 'open_elective':
          offeringType = 'open_elective';
          break;
        default:
          offeringType = 'core';
      }
    } else if (offeringType) {
      // Map from service layer types to database types
      switch (offeringType) {
        // @ts-expect-error - Auto-suppressed for migration
        case 'mandatory':
          offeringType = 'core';
          break;
        // @ts-expect-error - Auto-suppressed for migration
        case 'department_elective':
          offeringType = 'dept_elective';
          break;
        // @ts-expect-error - Auto-suppressed for migration
        case 'elective':
          offeringType = 'open_elective';
          break;
        // Keep existing valid values
        case 'core':
        case 'dept_elective':
        case 'open_elective':
          break;
        default:
          offeringType = 'core';
      }
    } else {
      offeringType = 'core'; // Default to core
    }

    // Validate faculty ID if provided
    if (data.faculty_id) {
      const { data: facultyCheck } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', data.faculty_id)
        .eq('role', 'college_educator')
        .single();

      if (!facultyCheck) {
        // Try to find in college_lecturers table
        const { data: lecturerCheck } = await supabase
          .from('college_lecturers')
          .select('id, user_id')
          .eq('user_id', data.faculty_id)
          .eq('accountStatus', 'active')
          .single();

        if (!lecturerCheck) {
          throw new Error('VALIDATION_ERROR: Invalid faculty ID provided');
        }
      }
    }

    const { data: mapping, error } = await supabase
      .from('college_course_mappings')
      .insert([
        {
          course_id: courseId,
          program_id: data.program_id,
          semester: data.semester,
          offering_type: offeringType || 'mandatory',
          faculty_id: data.faculty_id,
          capacity: data.capacity,
          current_enrollment: 0,
          created_by: currentUserId,
          updated_by: currentUserId,
          created_at: timestamp,
          updated_at: timestamp,
        },
      ])
      .select(
        `
        *,
        course:college_courses(*)
      `
      )
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
export async function updateCourseMapping(
  id: string,
  updates: Partial<CourseMapping>
): Promise<CourseMapping> {
  if (!id) {
    throw new Error('VALIDATION_ERROR: Mapping ID is required');
  }

  try {
    // Check if locked
    const { data: existing } = await supabase
      .from('college_course_mappings')
      .select('is_locked, offering_type')
      .eq('id', id)
      .single();

    if (existing?.is_locked) {
      throw new Error('INVALID_STATE: Course mapping is locked and cannot be modified');
    }

    const currentUserId = await getCurrentUserId();

    // Handle capacity constraint based on offering_type
    const finalUpdates = { ...updates };
    if (finalUpdates.offering_type) {
      if (finalUpdates.offering_type === 'core') {
        finalUpdates.capacity = null; // Core courses must have no capacity
      } else if (
        (finalUpdates.offering_type === 'dept_elective' ||
          finalUpdates.offering_type === 'open_elective') &&
        !finalUpdates.capacity
      ) {
        throw new Error('VALIDATION_ERROR: Elective courses must have a capacity');
      }
    } else if (existing?.offering_type === 'core' && finalUpdates.capacity !== undefined) {
      // If updating a core course, ensure capacity remains null
      finalUpdates.capacity = null;
    }

    const { data, error } = await supabase
      .from('college_course_mappings')
      .update({
        ...finalUpdates,
        updated_by: currentUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        course:college_courses(*)
      `
      )
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

    const { error } = await supabase.from('college_course_mappings').delete().eq('id', id);

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
      .select(
        `
        *,
        course:college_courses(*)
      `
      )
      .eq('program_id', programId);

    if (semester !== undefined) {
      query = query.eq('semester', semester);
    }

    if (typeFilter) {
      query = query.eq('offering_type', typeFilter);
    }

    query = query.order('semester', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    let mappings = data || [];

    // Add legacy fields for backward compatibility
    mappings = mappings.map((mapping) => ({
      ...mapping,
      course_code: mapping.course?.course_code,
      course_name: mapping.course?.course_name,
      credits: mapping.course?.credits,
      type: mapping.offering_type, // Use offering_type directly since they now match
    }));

    // Apply client-side search filter if provided
    if (searchQuery?.trim()) {
      const searchTerm = searchQuery.trim().toLowerCase();
      mappings = mappings.filter(
        (mapping) =>
          mapping.course?.course_name?.toLowerCase().includes(searchTerm) ||
          mapping.course?.course_code?.toLowerCase().includes(searchTerm)
      );
    }

    return mappings;
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
        updated_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
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
    const currentUserId = await getCurrentUserId();

    const clonedMappings = sourceMappings.map((mapping) => ({
      course_id: mapping.course_id,
      program_id: toProgramId,
      semester: toSemester,
      offering_type: mapping.offering_type,
      capacity: mapping.capacity,
      current_enrollment: 0,
      is_locked: false,
      created_by: currentUserId,
      updated_by: currentUserId,
      created_at: timestamp,
      updated_at: timestamp,
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
        updated_at: new Date().toISOString(),
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
        .select(
          `
          course:college_courses(course_name, credits),
          programs:program_id (name)
        `
        )
        .eq('faculty_id', facultyId),
      supabase.from('users').select('firstName, lastName, email').eq('id', facultyId).single(),
    ]);

    if (coursesResult.error) throw coursesResult.error;
    if (facultyResult.error) throw facultyResult.error;

    const courses = coursesResult.data || [];
    const faculty = facultyResult.data;

    const total_credits = courses.reduce((sum, mapping) => {
      // @ts-expect-error - Auto-suppressed for migration
      return sum + (mapping.course?.credits || 0);
    }, 0);

    const faculty_name =
      `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim() || faculty.email;

    return {
      faculty_id: facultyId,
      faculty_name,
      total_credits,
      courses: courses.map((mapping) => ({
        // @ts-expect-error - Auto-suppressed for migration
        course_name: mapping.course?.course_name || 'Unknown',
        // @ts-expect-error - Auto-suppressed for migration
        credits: mapping.course?.credits || 0,
        program: (mapping.programs as any)?.name || 'Unknown',
      })),
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
      .select(
        `
        *,
        course:college_courses(*)
      `
      )
      .order('semester', { ascending: true });

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
  available: number;
}> {
  if (!mappingId) {
    throw new Error('VALIDATION_ERROR: Mapping ID is required');
  }

  try {
    const { data: mapping, error: mappingError } = await supabase
      .from('college_course_mappings')
      .select('capacity, current_enrollment')
      .eq('id', mappingId)
      .single();

    if (mappingError) throw mappingError;

    const capacity = mapping.capacity || 0;
    const enrolled = mapping.current_enrollment || 0;

    return {
      enrolled,
      capacity,
      available: Math.max(0, capacity - enrolled),
    };
  } catch (error) {
    console.error('Error checking elective capacity:', error);
    throw error;
  }
}
