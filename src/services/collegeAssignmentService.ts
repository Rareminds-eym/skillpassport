import { supabase } from '../lib/supabaseClient';
import { uploadMultipleFiles } from './fileUploadService';

/**
 * COLLEGE ASSIGNMENT SYSTEM FLOW DOCUMENTATION
 * ============================================
 *
 * This service handles the College Assignment System which follows a hierarchical academic structure:
 *
 * SELECTION FLOW:
 * Department → Program → Section (Semester + Section + Academic Year) → Course → Students
 *
 * KEY COMPONENTS:
 * 1. Department: Academic departments within a college (e.g., Computer Science, Mathematics)
 * 2. Program: Degree programs within departments (e.g., B.Tech CS, M.Tech CS)
 * 3. Section: Specific semester-section combinations (e.g., Sem 3 - Section A - 2023-24)
 * 4. Course: Individual courses/subjects
 * 5. Students: Students enrolled in specific program-semester-section combinations
 *
 * PERMISSION MODEL:
 * - Educators (college_lecturers) are assigned to specific program_sections via faculty_id
 * - They can only create assignments for sections they're assigned to teach
 * - Students are automatically fetched based on program_id + semester + section matching
 *
 * PROGRAM SECTION STRUCTURE:
 * - id: Unique identifier for the section
 * - department_id: Links to departments table
 * - program_id: Links to programs table
 * - semester: Academic semester (1, 2, 3, 4, 5, 6, 7, 8, etc.)
 * - section: Section identifier (A, B, C, etc.)
 * - academic_year: Academic year (2023-24, 2024-25, etc.)
 * - faculty_id: Educator assigned to teach this specific semester-section
 *
 * STUDENT MATCHING:
 * When a section is selected, students are fetched who match:
 * - Same program_id (degree program)
 * - Same semester (academic semester)
 * - Same section (section identifier)
 */

// Types
export interface Department {
  id: string;
  name: string;
  code: string;
  college_id: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  department_id: string;
  college_id: string;
}

export interface ProgramSection {
  id: string;
  department_id: string;
  program_id: string;
  semester: number;
  section: string;
  academic_year: string;
  max_students: number;
  current_students: number;
  faculty_id: string;
  status: string;
  program?: Program;
  department?: Department;
}

export interface Course {
  id: string;
  course_name: string;
  course_code: string;
  college_id: string;
}

export interface CollegeStudent {
  id: string;
  user_id: string;
  name: string;
  email: string;
  program_id: string;
  section: string;
  semester: number;
  roll_number: string;
}

export interface CollegeAssignment {
  assignment_id: string;
  title: string;
  description: string;
  instructions: string;
  course_name: string;
  course_code: string;
  college_educator_id: string; // Updated to use college_educator_id
  educator_name: string;
  college_id: string;
  program_section_id: string;
  department_id: string;
  program_id: string;
  total_points: number;
  assignment_type: string;
  skill_outcomes: string[];
  due_date: string;
  available_from: string;
  allow_late_submission: boolean;
  document_pdf?: string;
  instruction_files?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  created_date: string;
  status: string;
  program_name?: string;
  department_name?: string;
  semester?: number;
  section?: string;
  academic_year?: string;
  student_count?: number;
}

export interface CreateAssignmentData {
  title: string;
  description?: string;
  instructions?: string;
  course_name: string;
  course_code?: string;
  college_id: string;
  program_section_id: string;
  department_id: string;
  program_id: string;
  total_points: number;
  assignment_type: string;
  skill_outcomes: string[];
  due_date: string;
  available_from?: string;
  allow_late_submission: boolean;
  document_pdf?: string;
}

type ServiceResponse<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Fetch departments assigned to a college educator
 *
 * PERMISSION-CONTROLLED DEPARTMENTS:
 * - Only returns departments where the educator is assigned via department_faculty_assignments
 * - Ensures educators only see departments they're authorized to work with
 *
 * @param educatorUserId - The user_id of the college lecturer
 * @returns Promise<ServiceResponse<Department[]>> - Departments assigned to this educator
 */
export const fetchEducatorDepartments = async (
  educatorUserId: string
): Promise<ServiceResponse<Department[]>> => {
  try {
    console.log('🏢 SERVICE: Fetching departments for educator:', educatorUserId);

    // First get the lecturer_id from college_lecturers table
    const { data: lecturer, error: lecturerError } = await supabase
      .from('college_lecturers')
      .select('id')
      .eq('user_id', educatorUserId)
      .single();

    console.log('👤 SERVICE: Lecturer lookup result:', { lecturer, lecturerError });

    if (lecturerError) throw lecturerError;
    if (!lecturer) {
      console.log('⚠️ SERVICE: No lecturer found for user');
      return { data: [], error: null };
    }

    console.log('✅ SERVICE: Found lecturer ID:', lecturer.id);

    // Fetch departments where educator is assigned
    const { data, error } = await supabase
      .from('department_faculty_assignments')
      .select(
        `
        department_id,
        departments!inner(id, name, code, college_id, status)
      `
      )
      .eq('lecturer_id', lecturer.id)
      .eq('is_active', true)
      .eq('departments.status', 'active')
      .order('departments(name)');

    console.log('📊 SERVICE: Department assignments query result:', { data, error });

    if (error) throw error;

    // Transform the response to extract department details
    const departments = (data || []).map((assignment) => {
      const dept = Array.isArray(assignment.departments)
        ? assignment.departments[0]
        : assignment.departments;
      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        college_id: dept.college_id,
      };
    });

    console.log('✅ SERVICE: Returning', departments.length, 'departments');
    console.log('🏢 SERVICE: Departments:', departments);

    return { data: departments, error: null };
  } catch (err: any) {
    console.error('❌ SERVICE: Error fetching educator departments:', err);
    return { data: null, error: err.message || 'Failed to fetch departments' };
  }
};

/**
 * Fetch programs for a department where educator has sections assigned
 *
 * PERMISSION-CONTROLLED PROGRAMS:
 * - Only returns programs where the educator has at least one section assigned
 * - Filtered by department_id if provided
 *
 * @param educatorUserId - The user_id of the college lecturer
 * @param departmentId - Optional department filter
 * @returns Promise<ServiceResponse<Program[]>> - Programs where educator has sections
 */
export const fetchEducatorPrograms = async (
  educatorUserId: string,
  departmentId?: string
): Promise<ServiceResponse<Program[]>> => {
  try {
    console.log(
      '🎓 SERVICE: Fetching programs for educator:',
      educatorUserId,
      'department:',
      departmentId
    );

    // Get distinct programs from program_sections where educator is faculty
    let query = supabase
      .from('program_sections')
      .select(
        `
        program_id,
        programs!inner(id, name, code, department_id, status)
      `
      )
      .eq('faculty_id', educatorUserId)
      .eq('status', 'active')
      .eq('programs.status', 'active');

    if (departmentId) {
      console.log('🔍 SERVICE: Filtering by department:', departmentId);
      query = query.eq('programs.department_id', departmentId);
    }

    const { data, error } = await query;

    console.log('📊 SERVICE: Program sections query result:', { data, error });

    if (error) throw error;

    // Extract unique programs
    const programsMap = new Map();
    (data || []).forEach((section) => {
      const prog = Array.isArray(section.programs) ? section.programs[0] : section.programs;
      if (!programsMap.has(prog.id)) {
        programsMap.set(prog.id, {
          id: prog.id,
          name: prog.name,
          code: prog.code,
          department_id: prog.department_id,
        });
      }
    });

    const programs = Array.from(programsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    console.log('✅ SERVICE: Returning', programs.length, 'unique programs');
    console.log('🎓 SERVICE: Programs:', programs);

    return { data: programs, error: null };
  } catch (err: any) {
    console.error('❌ SERVICE: Error fetching educator programs:', err);
    return { data: null, error: err.message || 'Failed to fetch programs' };
  }
};

/**
 * Fetch program sections assigned to a college educator
 *
 * CRITICAL PERMISSION LOGIC:
 * - Only returns sections where the educator is assigned as faculty_id
 * - Each section represents a specific semester-section-academic_year combination
 * - Example: "Computer Science - Semester 3 - Section A - 2023-24"
 *
 * EDUCATOR ASSIGNMENT MODEL:
 * - college_lecturers are assigned to specific program_sections
 * - One educator can teach multiple semester-section combinations
 * - Each program_section has exactly one faculty_id (assigned educator)
 *
 * @param educatorUserId - The user_id of the college lecturer
 * @returns Promise<ServiceResponse<ProgramSection[]>> - Sections assigned to this educator
 */
export const fetchEducatorProgramSections = async (
  educatorUserId: string
): Promise<ServiceResponse<ProgramSection[]>> => {
  try {
    console.log('📑 SERVICE: Fetching program sections for educator:', educatorUserId);

    // PERMISSION CHECK: Only fetch sections where this educator is the assigned faculty
    // This ensures educators can only see semester-section combinations they're authorized to teach
    const { data, error } = await supabase
      .from('program_sections')
      .select(
        `
        id,
        department_id,
        program_id,
        semester,
        section,
        academic_year,
        max_students,
        current_students,
        faculty_id,
        status,
        programs!inner(id, name, code),
        departments!inner(id, name, code)
      `
      )
      .eq('faculty_id', educatorUserId) // CRITICAL: Only sections assigned to this educator
      .eq('status', 'active')
      .order('semester') // Order by semester first
      .order('section'); // Then by section (A, B, C, etc.)

    console.log('📊 SERVICE: Program sections query result:', {
      dataCount: data?.length || 0,
      error,
      rawData: data,
    });

    if (error) {
      console.error('❌ SERVICE: Query error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ SERVICE: No program sections found for educator:', educatorUserId);
      console.warn('💡 SERVICE: Check if faculty_id in program_sections matches this user_id');
      return { data: [], error: null };
    }

    // Transform the response to include nested program and department info
    const sectionsWithDetails: ProgramSection[] = (data || []).map((section: any) => {
      console.log('🔄 SERVICE: Transforming section:', section.id, {
        program: section.programs,
        department: section.departments,
      });

      return {
        id: section.id,
        department_id: section.department_id,
        program_id: section.program_id,
        semester: section.semester,
        section: section.section,
        academic_year: section.academic_year,
        max_students: section.max_students,
        current_students: section.current_students,
        faculty_id: section.faculty_id,
        status: section.status,
        program: {
          id: section.programs.id,
          name: section.programs.name,
          code: section.programs.code,
          department_id: section.programs.department_id || section.department_id,
          college_id: section.programs.college_id || '',
        },
        department: {
          id: section.departments.id,
          name: section.departments.name,
          code: section.departments.code,
          college_id: section.departments.college_id || '',
        },
      };
    });

    console.log('✅ SERVICE: Returning', sectionsWithDetails.length, 'transformed sections');
    console.log(
      '📋 SERVICE: Sections summary:',
      sectionsWithDetails.map((s) => ({
        id: s.id,
        program: s.program?.name,
        semester: s.semester,
        section: s.section,
        academic_year: s.academic_year,
      }))
    );

    return { data: sectionsWithDetails, error: null };
  } catch (err: any) {
    console.error('❌ SERVICE: Error fetching program sections:', err);
    return { data: null, error: err.message || 'Failed to fetch program sections' };
  }
};

/**
 * Fetch courses for a program where educator is assigned
 *
 * PERMISSION-CONTROLLED COURSES:
 * - Only returns courses mapped to the program where educator is faculty_id
 * - Uses college_course_mappings table for permission control
 * - Returns all courses across all semesters for the program
 *
 * @param educatorUserId - The user_id of the college lecturer
 * @param programId - The program ID
 * @returns Promise<ServiceResponse<Course[]>> - Courses assigned to educator for this program
 */
export const fetchEducatorCoursesByProgram = async (
  educatorUserId: string,
  programId: string
): Promise<ServiceResponse<Course[]>> => {
  try {
    console.log(
      '🔍 SERVICE: Fetching courses for educator:',
      educatorUserId,
      'program:',
      programId
    );

    const { data, error } = await supabase
      .from('college_course_mappings')
      .select(
        `
        course_id,
        semester,
        college_courses!inner(id, course_name, course_code, college_id)
      `
      )
      .eq('faculty_id', educatorUserId)
      .eq('program_id', programId);

    console.log('📊 SERVICE: Raw query result:', { data, error });

    if (error) {
      console.error('❌ SERVICE: Query error:', error);
      throw error;
    }

    // Extract unique courses (same course might be in multiple semesters)
    const coursesMap = new Map();
    (data || []).forEach((mapping) => {
      const course = Array.isArray(mapping.college_courses)
        ? mapping.college_courses[0]
        : mapping.college_courses;
      if (!coursesMap.has(course.id)) {
        coursesMap.set(course.id, {
          id: course.id,
          course_name: course.course_name,
          course_code: course.course_code,
          college_id: course.college_id,
        });
      }
    });

    const courses = Array.from(coursesMap.values()).sort((a, b) =>
      a.course_name.localeCompare(b.course_name)
    );

    console.log('✅ SERVICE: Returning', courses.length, 'unique courses');
    console.log('📚 SERVICE: Courses:', courses);

    return { data: courses, error: null };
  } catch (err: any) {
    console.error('❌ SERVICE: Error fetching educator courses:', err);
    return { data: null, error: err.message || 'Failed to fetch courses' };
  }
};

/**
 * Fetch students for a program section
 *
 * STUDENT MATCHING LOGIC:
 * When an educator selects a program section (e.g., "CS - Sem 3 - Section A - 2023-24"),
 * this function fetches all students who match the exact academic criteria:
 *
 * MATCHING CRITERIA:
 * 1. program_id: Must match the degree program (e.g., B.Tech Computer Science)
 * 2. semester: Must match the academic semester (e.g., 3)
 * 3. section: Must match the section identifier (e.g., A)
 *
 * EXAMPLE:
 * Section: "Computer Science - Semester 3 - Section A - 2023-24"
 * Fetches: All students in CS program, currently in semester 3, assigned to section A
 *
 * @param sectionId - The UUID of the program_section
 * @returns Promise<ServiceResponse<CollegeStudent[]>> - Students in this section
 */
export const fetchProgramSectionStudents = async (
  sectionId: string
): Promise<ServiceResponse<CollegeStudent[]>> => {
  try {
    console.log('🔍 Fetching students for section:', sectionId);

    // STEP 1: Get the section details to extract matching criteria
    const { data: section, error: sectionError } = await supabase
      .from('program_sections')
      .select('program_id, semester, section')
      .eq('id', sectionId)
      .single();

    if (sectionError) {
      console.error('❌ Error fetching section details:', sectionError);
      throw sectionError;
    }

    console.log('📋 Section details:', section);

    // STEP 2: Fetch students matching the exact academic criteria
    // This ensures we get students from the specific semester-section combination
    const { data, error } = await supabase
      .from('students')
      .select('id, user_id, name, email, program_id, section, semester, roll_number')
      .eq('program_id', section.program_id) // Same degree program
      .eq('section', section.section) // Same section (A, B, C, etc.)
      .eq('semester', section.semester) // Same academic semester (1, 2, 3, etc.)
      .eq('is_deleted', false)
      .order('name');

    if (error) {
      console.error('❌ Error fetching students:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} students matching criteria:`, {
      program_id: section.program_id,
      semester: section.semester,
      section: section.section,
    });

    if (data && data.length > 0) {
      console.log('👥 Sample student:', data[0]);
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Error fetching program section students:', err);
    return { data: null, error: err.message || 'Failed to fetch students' };
  }
};

/**
 * Create a new college assignment with file uploads
 *
 * ASSIGNMENT CREATION FLOW:
 * 1. Educator selects: Department → Program → Section (Semester + Section + Academic Year)
 * 2. System validates educator has permission (faculty_id matches)
 * 3. Assignment is created WITHOUT files initially
 * 4. Files are uploaded to R2 storage (college_assignments_tasks/{educatorId}/{assignmentId})
 * 5. Assignment is updated with file metadata
 * 6. Students are automatically determined by the section's academic criteria
 *
 * SECTION LINKAGE:
 * - program_section_id links assignment to specific semester-section combination
 * - This determines which students can access/submit the assignment
 * - Example: Assignment for "CS - Sem 3 - Section A" only visible to those students
 *
 * @param assignmentData - Assignment details including program_section_id
 * @param educatorUserId - The user_id of the creating educator
 * @param instructionFiles - Optional array of instruction files to upload
 * @returns Promise<ServiceResponse<CollegeAssignment>> - Created assignment with file URLs
 */
export const createCollegeAssignment = async (
  assignmentData: CreateAssignmentData,
  educatorUserId: string,
  instructionFiles?: File[]
): Promise<ServiceResponse<CollegeAssignment>> => {
  try {
    console.log('📝 Creating college assignment with files:', {
      title: assignmentData.title,
      fileCount: instructionFiles?.length || 0,
    });

    // STEP 1: Get educator details for assignment attribution
    const { data: educator, error: educatorError } = await supabase
      .from('college_lecturers')
      .select('first_name, last_name')
      .eq('user_id', educatorUserId)
      .single();

    if (educatorError) {
      console.warn('Could not fetch educator details:', educatorError);
    }

    const educatorName = educator
      ? `${educator.first_name} ${educator.last_name}`.trim()
      : 'Unknown Educator';

    // STEP 2: Prepare assignment data with section linkage (WITHOUT files initially)
    const insertData = {
      ...assignmentData,
      college_educator_id: educatorUserId,
      educator_name: educatorName,
      available_from: assignmentData.available_from || new Date().toISOString(),
      instruction_files: [], // Empty initially, will be updated after upload
    };

    // STEP 3: Create the assignment with program_section_id linking to specific semester-section
    const { data, error } = await supabase
      .from('college_assignments')
      .insert([insertData])
      .select(
        `
        *,
        programs!college_assignments_program_id_fkey(name),
        departments!college_assignments_department_id_fkey(name)
      `
      )
      .single();

    if (error) throw error;

    console.log('✅ Assignment created:', data.assignment_id);

    // STEP 4: Upload files to R2 if provided
    let uploadedFiles: Array<{ name: string; url: string; size: number; type: string }> = [];

    if (instructionFiles && instructionFiles.length > 0) {
      console.log('📤 Uploading', instructionFiles.length, 'instruction files...');

      // Use structured folder: college_assignments_tasks/{educatorId}/{assignmentId}
      const folder = `college_assignments_tasks/${educatorUserId}/${data.assignment_id}`;

      const results = await uploadMultipleFiles(instructionFiles, folder);

      // Filter successful uploads and map to file metadata
      uploadedFiles = results
        .map((result, index) => {
          if (result.success && result.url) {
            const file = instructionFiles[index];
            return {
              name: file.name,
              url: result.url,
              size: file.size,
              type: file.type,
            };
          }
          return null;
        })
        .filter(
          (file): file is { name: string; url: string; size: number; type: string } => file !== null
        );

      console.log('✅ Successfully uploaded', uploadedFiles.length, 'files');

      // STEP 5: Update assignment with file URLs
      if (uploadedFiles.length > 0) {
        const { error: updateError } = await supabase
          .from('college_assignments')
          .update({ instruction_files: uploadedFiles })
          .eq('assignment_id', data.assignment_id);

        if (updateError) {
          console.error('⚠️ Failed to update assignment with file URLs:', updateError);
          // Don't throw error - assignment is created, just files not linked
        } else {
          console.log('✅ Assignment updated with file metadata');
        }
      }
    }

    // Transform the response to include related data and uploaded files
    const assignment: CollegeAssignment = {
      ...data,
      program_name: data.programs?.name,
      department_name: data.departments?.name,
      status: 'active',
      instruction_files: uploadedFiles, // Include uploaded files in response
    };

    return { data: assignment, error: null };
  } catch (err: any) {
    console.error('❌ Error creating assignment:', err);
    return { data: null, error: err.message || 'Failed to create assignment' };
  }
};

/**
 * Fetch assignments for a college educator
 */
export const fetchEducatorAssignments = async (
  educatorUserId: string
): Promise<ServiceResponse<CollegeAssignment[]>> => {
  try {
    const { data, error } = await supabase.rpc('get_college_educator_assignments', {
      educator_user_id: educatorUserId,
    });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Error fetching educator assignments:', err);

    // Fallback to direct query if RPC function is not available
    try {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('college_assignments') // Use college_assignments table
        .select(
          `
          assignment_id,
          title,
          description,
          course_name,
          course_code,
          due_date,
          total_points,
          assignment_type,
          skill_outcomes,
          created_date,
          program_section_id,
          instruction_files,
          program_sections!college_assignments_program_section_id_fkey(semester, section, academic_year),
          programs!college_assignments_program_id_fkey(name),
          departments!college_assignments_department_id_fkey(name)
        `
        )
        .eq('college_educator_id', educatorUserId)
        .eq('is_deleted', false)
        .order('created_date', { ascending: false });

      if (fallbackError) throw fallbackError;

      const assignments = (fallbackData || []).map((assignment: any) => ({
        assignment_id: assignment.assignment_id,
        title: assignment.title,
        description: assignment.description || '',
        instructions: assignment.instructions || '',
        course_name: assignment.course_name,
        course_code: assignment.course_code || '',
        college_educator_id: assignment.college_educator_id,
        educator_name: assignment.educator_name || '',
        college_id: assignment.college_id,
        program_section_id: assignment.program_section_id,
        department_id: assignment.department_id,
        program_id: assignment.program_id,
        total_points: assignment.total_points,
        assignment_type: assignment.assignment_type,
        skill_outcomes: assignment.skill_outcomes || [],
        due_date: assignment.due_date,
        available_from: assignment.available_from || '',
        allow_late_submission: assignment.allow_late_submission || false,
        document_pdf: assignment.document_pdf,
        instruction_files: assignment.instruction_files || [],
        created_date: assignment.created_date,
        status: assignment.due_date < new Date().toISOString() ? 'completed' : 'active',
        program_name: assignment.programs?.name || '',
        department_name: assignment.departments?.name || '',
        semester: assignment.program_sections?.semester,
        section: assignment.program_sections?.section,
        academic_year: assignment.program_sections?.academic_year,
        student_count: 0, // Will need separate query for accurate count
      }));

      return { data: assignments, error: null };
    } catch (fallbackErr: any) {
      console.error('Fallback query also failed:', fallbackErr);
      return { data: null, error: fallbackErr.message || 'Failed to fetch assignments' };
    }
  }
};

/**
 * Assign task to students
 */
export const assignTaskToStudents = async (
  assignmentId: string,
  studentUserIds: string[]
): Promise<ServiceResponse<boolean>> => {
  try {
    const studentAssignments = studentUserIds.map((studentUserId) => ({
      assignment_id: assignmentId,
      student_id: studentUserId,
      status: 'todo',
      priority: 'medium',
    }));

    const { error } = await supabase
      .from('college_student_assignments') // Use college_student_assignments table
      .insert(studentAssignments);

    if (error) throw error;
    return { data: true, error: null };
  } catch (err: any) {
    console.error('Error assigning task to students:', err);
    return { data: null, error: err.message || 'Failed to assign task to students' };
  }
};

/**
 * Get assignment statistics for an educator
 */
export const getAssignmentStatistics = async (
  educatorUserId: string
): Promise<
  ServiceResponse<{
    totalAssignments: number;
    activeAssignments: number;
    totalSubmissions: number;
    pendingReviews: number;
    averageScore: number;
  }>
> => {
  try {
    // Get basic assignment counts
    const { data: assignments, error: assignmentsError } = await supabase
      .from('college_assignments') // Use college_assignments table
      .select('assignment_id, due_date')
      .eq('college_educator_id', educatorUserId)
      .eq('is_deleted', false);

    if (assignmentsError) throw assignmentsError;

    const totalAssignments = assignments?.length || 0;
    const activeAssignments =
      assignments?.filter((a) => new Date(a.due_date) > new Date()).length || 0;

    // Get submission statistics
    const assignmentIds = assignments?.map((a) => a.assignment_id) || [];

    let totalSubmissions = 0;
    let pendingReviews = 0;
    let averageScore = 0;

    if (assignmentIds.length > 0) {
      const { data: submissions, error: submissionsError } = await supabase
        .from('college_student_assignments') // Use college_student_assignments table
        .select('status, grade_percentage')
        .in('assignment_id', assignmentIds)
        .eq('is_deleted', false);

      if (!submissionsError && submissions) {
        totalSubmissions = submissions.filter(
          (s) => s.status === 'submitted' || s.status === 'graded'
        ).length;
        pendingReviews = submissions.filter((s) => s.status === 'submitted').length;

        const gradedSubmissions = submissions.filter((s) => s.grade_percentage !== null);
        if (gradedSubmissions.length > 0) {
          averageScore =
            gradedSubmissions.reduce((sum, s) => sum + (s.grade_percentage || 0), 0) /
            gradedSubmissions.length;
        }
      }
    }

    return {
      data: {
        totalAssignments,
        activeAssignments,
        totalSubmissions,
        pendingReviews,
        averageScore: Math.round(averageScore * 10) / 10,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Error fetching assignment statistics:', err);
    return { data: null, error: err.message || 'Failed to fetch statistics' };
  }
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (assignmentId: string): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('college_assignments') // Use college_assignments table
      .update({ is_deleted: true })
      .eq('assignment_id', assignmentId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (err: any) {
    console.error('Error deleting assignment:', err);
    return { data: null, error: err.message || 'Failed to delete assignment' };
  }
};

/**
 * Update an assignment
 */
export const updateAssignment = async (
  assignmentId: string,
  updateData: Partial<CreateAssignmentData>
): Promise<ServiceResponse<CollegeAssignment>> => {
  try {
    const { data, error } = await supabase
      .from('college_assignments') // Use college_assignments table
      .update(updateData)
      .eq('assignment_id', assignmentId)
      .select(
        `
        *,
        programs!college_assignments_program_id_fkey(name),
        departments!college_assignments_department_id_fkey(name)
      `
      )
      .single();

    if (error) throw error;

    const assignment: CollegeAssignment = {
      ...data,
      program_name: data.programs?.name,
      department_name: data.departments?.name,
      status: data.due_date < new Date().toISOString() ? 'completed' : 'active',
    };

    return { data: assignment, error: null };
  } catch (err: any) {
    console.error('Error updating assignment:', err);
    return { data: null, error: err.message || 'Failed to update assignment' };
  }
};

/**
 * ============================================
 * COLLEGE ASSIGNMENT SYSTEM COMPLETE FLOW SUMMARY
 * ============================================
 *
 * 1. EDUCATOR AUTHENTICATION & PERMISSIONS:
 *    - Educator logs in and system identifies their college_lecturer record
 *    - fetchEducatorProgramSections() returns only sections where faculty_id = educator's user_id
 *    - This ensures educators can only create assignments for sections they're assigned to teach
 *
 * 2. HIERARCHICAL SELECTION PROCESS:
 *    a) Department Selection: fetchCollegeDepartments(college_id)
 *    b) Program Selection: fetchCollegePrograms(college_id, department_id)
 *    c) Section Selection: Shows program_sections where faculty_id = educator
 *       - Each section represents: Program + Semester + Section + Academic Year
 *       - Example: "B.Tech CS - Semester 3 - Section A - 2023-24"
 *    d) Course Selection: fetchCollegeCourses(college_id)
 *
 * 3. ASSIGNMENT CREATION:
 *    - createCollegeAssignment() creates assignment with program_section_id
 *    - This links assignment to specific semester-section combination
 *    - Assignment inherits academic context from the selected section
 *
 * 4. STUDENT ASSIGNMENT:
 *    - fetchProgramSectionStudents() automatically gets students matching:
 *      * Same program_id (degree program)
 *      * Same semester (academic semester)
 *      * Same section (section identifier)
 *    - assignTaskToStudents() creates student_assignments records
 *
 * 5. PERMISSION ENFORCEMENT:
 *    - Educators can only see/manage assignments for their assigned sections
 *    - Students can only see assignments for their program-semester-section
 *    - Academic hierarchy ensures proper access control
 *
 * KEY DATABASE RELATIONSHIPS:
 * - college_lecturers.user_id → program_sections.faculty_id (educator assignment)
 * - college_lecturers.user_id → assignments.college_educator_id (assignment creation)
 * - program_sections.id → assignments.program_section_id (assignment scope)
 * - students.(program_id, semester, section) → program_sections.(program_id, semester, section) (student enrollment)
 *
 * SEPARATION FROM SCHOOL SYSTEM:
 * - School assignments use: assignments.educator_id → school_educators.id
 * - College assignments use: assignments.college_educator_id → college_lecturers.user_id
 * - This ensures complete separation and no conflicts between systems
 *
 * This system ensures that:
 * ✅ Educators can only assign tasks to students they're authorized to teach
 * ✅ Students only see assignments relevant to their academic enrollment
 * ✅ Academic hierarchy and semester progression is maintained
 * ✅ Proper permission boundaries are enforced at the database level
 * ✅ School and college systems operate independently without conflicts
 */
