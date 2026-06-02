import { apiPost } from '@/shared/api/apiClient';

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

/**
 * Get all available courses from master catalog
 */
export async function getCourses(searchQuery?: string, courseType?: string): Promise<Course[]> {
  const response = await apiPost('/college-admin/academic', { action: 'get-courses', searchQuery, courseType });
  if (!response.success) throw new Error(response.error || 'Failed to fetch courses');
  return response.data || [];
}

/**
 * Create a new course in the master catalog
 */
export async function createCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
  const response = await apiPost('/college-admin/academic', { action: 'create-course', ...courseData });
  if (!response.success) {
    if (response.error?.includes('23505') || response.error?.includes('duplicate')) {
      throw new Error('Course code already exists in this college');
    }
    throw new Error(response.error || 'Failed to create course');
  }
  return response.data;
}

/**
 * Update a course in the master catalog
 */
export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
  const response = await apiPost('/college-admin/academic', { action: 'update-course', courseId, ...updates });
  if (!response.success) throw new Error(response.error || 'Failed to update course');
  return response.data;
}

/**
 * Get all departments for the current user's college
 */
export async function getCourseMappingDepartments(): Promise<Department[]> {
  const response = await apiPost('/college-admin/academic', { action: 'get-mapping-departments' });
  if (!response.success) throw new Error(response.error || 'Failed to fetch departments');
  return response.data || [];
}

/**
 * Get programs for a department
 */
export async function getCourseMappingPrograms(departmentId?: string): Promise<Program[]> {
  const response = await apiPost('/college-admin/academic', { action: 'get-mapping-programs', departmentId });
  if (!response.success) throw new Error(response.error || 'Failed to fetch programs');
  return response.data || [];
}

/**
 * Get faculty members with workload info (optimized with batch processing)
 */
export async function getCourseMappingFaculty(departmentId?: string): Promise<Faculty[]> {
  const response = await apiPost('/college-admin/academic', { action: 'get-faculty', departmentId });
  if (!response.success) throw new Error(response.error || 'Failed to fetch faculty');
  return response.data || [];
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

  const response = await apiPost('/college-admin/academic', { action: 'map-course', ...data });
  if (!response.success) {
    if (response.error?.includes('23505') || response.error?.includes('duplicate')) {
      throw new Error('DUPLICATE_ENTRY: Course already mapped to this program semester');
    }
    throw new Error(response.error || 'Failed to map course');
  }
  return response.data;
}

/**
 * Update a course mapping (optimized with validation)
 */
export async function updateCourseMapping(id: string, updates: Partial<CourseMapping>): Promise<CourseMapping> {
  if (!id) {
    throw new Error('VALIDATION_ERROR: Mapping ID is required');
  }

  const response = await apiPost('/college-admin/academic', { action: 'update-course-mapping', id, ...updates });
  if (!response.success) throw new Error(response.error || 'Failed to update course mapping');
  return response.data;
}

/**
 * Delete a course mapping (optimized with validation)
 */
export async function deleteCourseMapping(id: string): Promise<void> {
  if (!id) {
    throw new Error('VALIDATION_ERROR: Mapping ID is required');
  }

  const response = await apiPost('/college-admin/academic', { action: 'delete-course-mapping', id });
  if (!response.success) throw new Error(response.error || 'Failed to delete course mapping');
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

  const response = await apiPost('/college-admin/academic', {
    action: 'get-course-mappings',
    programId,
    semester,
    searchQuery,
    typeFilter
  });
  if (!response.success) throw new Error(response.error || 'Failed to fetch course mappings');
  return response.data || [];
}

/**
 * Check if semester is locked (optimized with caching)
 */
export async function isSemesterLocked(programId: string, semester: number): Promise<boolean> {
  if (!programId || semester === undefined) {
    return false;
  }

  const response = await apiPost('/college-admin/academic', { action: 'is-semester-locked', programId, semester });
  if (!response.success) return false;
  return response.data || false;
}

/**
 * Lock/unlock semester operations (batch operations)
 */
export async function lockSemester(programId: string, semester: number): Promise<void> {
  if (!programId || semester === undefined) {
    throw new Error('VALIDATION_ERROR: Program ID and semester are required');
  }

  const response = await apiPost('/college-admin/academic', { action: 'lock-semester', programId, semester });
  if (!response.success) throw new Error(response.error || 'Failed to lock semester');
}

export async function unlockSemester(programId: string, semester: number): Promise<void> {
  if (!programId || semester === undefined) {
    throw new Error('VALIDATION_ERROR: Program ID and semester are required');
  }

  const response = await apiPost('/college-admin/academic', { action: 'unlock-semester', programId, semester });
  if (!response.success) throw new Error(response.error || 'Failed to unlock semester');
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

  const response = await apiPost('/college-admin/academic', {
    action: 'clone-semester-structure',
    fromProgramId,
    fromSemester,
    toProgramId,
    toSemester
  });
  if (!response.success) throw new Error(response.error || 'Failed to clone semester structure');
}

/**
 * Allocate faculty to a course
 */
export async function allocateFaculty(mappingId: string, facultyId: string): Promise<void> {
  if (!mappingId || !facultyId) {
    throw new Error('VALIDATION_ERROR: Mapping ID and Faculty ID are required');
  }

  const response = await apiPost('/college-admin/academic', { action: 'allocate-faculty', mappingId, facultyId });
  if (!response.success) throw new Error(response.error || 'Failed to allocate faculty');
}

/**
 * Calculate faculty workload (optimized)
 */
export async function calculateWorkload(facultyId: string): Promise<WorkloadSummary> {
  if (!facultyId) {
    throw new Error('VALIDATION_ERROR: Faculty ID is required');
  }

  const response = await apiPost('/college-admin/academic', { action: 'calculate-workload', facultyId });
  if (!response.success) throw new Error(response.error || 'Failed to calculate workload');
  return response.data;
}

/**
 * Get all course mappings with detailed info (with pagination support)
 */
export async function getAllCourseMappings(
  limit?: number,
  offset?: number
): Promise<CourseMapping[]> {
  const response = await apiPost('/college-admin/academic', { action: 'get-all-course-mappings', limit, offset });
  if (!response.success) throw new Error(response.error || 'Failed to fetch all course mappings');
  return response.data || [];
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

  const response = await apiPost('/college-admin/academic', { action: 'check-elective-capacity', mappingId });
  if (!response.success) throw new Error(response.error || 'Failed to check elective capacity');
  return response.data;
}
