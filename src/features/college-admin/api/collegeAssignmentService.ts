import { supabase } from '@/shared/api/supabaseClient';
import { uploadMultipleFiles } from '@/shared/api/fileUploadService';
import type {
  Department,
  Program,
  ProgramSection,
  Course,
  CollegeStudent,
  CollegeAssignment,
  CreateAssignmentData,
  ServiceResponse,
} from './collegeAssignmentTypes';

// Re-export all types so existing imports keep working
export * from './collegeAssignmentTypes';

// Re-export student functions so existing imports keep working
export {
  fetchCollegeStudentAssignments,
  getCollegeStudentAssignmentStats,
  updateCollegeStudentAssignmentStatus,
  submitCollegeAssignment,
} from './collegeStudentAssignmentService';

/**
 * Fetch departments assigned to a college educator
 */
export const fetchEducatorDepartments = async (educatorUserId: string): Promise<ServiceResponse<Department[]>> => {
  try {
    const { data: lecturer, error: lecturerError } = await supabase
      .from('college_lecturers')
      .select('id')
      .eq('user_id', educatorUserId)
      .single();

    if (lecturerError) throw lecturerError;
    if (!lecturer) return { data: [], error: null };

    const { data, error } = await supabase
      .from('department_faculty_assignments')
      .select(`
        department_id,
        departments!inner(id, name, code, college_id, status)
      `)
      .eq('lecturer_id', lecturer.id)
      .eq('is_active', true)
      .eq('departments.status', 'active')
      .order('departments(name)');

    if (error) throw error;

    const departments = (data || []).map(assignment => {
      const dept = Array.isArray(assignment.departments) ? assignment.departments[0] : assignment.departments;
      return { id: dept.id, name: dept.name, code: dept.code, college_id: dept.college_id };
    });

    return { data: departments, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch departments' };
  }
};

/**
 * Fetch programs for a department where educator has sections assigned
 */
export const fetchEducatorPrograms = async (educatorUserId: string, departmentId?: string): Promise<ServiceResponse<Program[]>> => {
  try {
    let query = supabase
      .from('program_sections')
      .select(`
        program_id,
        programs!inner(id, name, code, department_id, status)
      `)
      .eq('faculty_id', educatorUserId)
      .eq('status', 'active')
      .eq('programs.status', 'active');

    if (departmentId) {
      query = query.eq('programs.department_id', departmentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const programsMap = new Map();
    (data || []).forEach(section => {
      const prog = Array.isArray(section.programs) ? section.programs[0] : section.programs;
      if (!programsMap.has(prog.id)) {
        programsMap.set(prog.id, {
          id: prog.id, name: prog.name, code: prog.code, department_id: prog.department_id
        });
      }
    });

    return { data: Array.from(programsMap.values()).sort((a, b) => a.name.localeCompare(b.name)), error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch programs' };
  }
};

/**
 * Fetch program sections assigned to a college educator
 */
export const fetchEducatorProgramSections = async (educatorUserId: string): Promise<ServiceResponse<ProgramSection[]>> => {
  try {
    const { data, error } = await supabase
      .from('program_sections')
      .select(`
        id, department_id, program_id, semester, section, academic_year,
        max_students, current_students, faculty_id, status,
        programs!inner(id, name, code),
        departments!inner(id, name, code)
      `)
      .eq('faculty_id', educatorUserId)
      .eq('status', 'active')
      .order('semester')
      .order('section');

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const sectionsWithDetails: ProgramSection[] = (data || []).map((section: any) => ({
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
        id: section.programs.id, name: section.programs.name, code: section.programs.code,
        department_id: section.programs.department_id || section.department_id, college_id: section.programs.college_id || ''
      },
      department: {
        id: section.departments.id, name: section.departments.name, code: section.departments.code,
        college_id: section.departments.college_id || ''
      }
    }));

    return { data: sectionsWithDetails, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch program sections' };
  }
};

/**
 * Fetch courses for a program where educator is assigned
 */
export const fetchEducatorCoursesByProgram = async (
  educatorUserId: string,
  programId: string
): Promise<ServiceResponse<Course[]>> => {
  try {
    const { data, error } = await supabase
      .from('college_course_mappings')
      .select(`
        course_id, semester,
        college_courses!inner(id, course_name, course_code, college_id)
      `)
      .eq('faculty_id', educatorUserId)
      .eq('program_id', programId);

    if (error) throw error;

    const coursesMap = new Map();
    (data || []).forEach(mapping => {
      const course = Array.isArray(mapping.college_courses) ? mapping.college_courses[0] : mapping.college_courses;
      if (!coursesMap.has(course.id)) {
        coursesMap.set(course.id, {
          id: course.id, course_name: course.course_name, course_code: course.course_code, college_id: course.college_id
        });
      }
    });

    return { data: Array.from(coursesMap.values()).sort((a, b) => a.course_name.localeCompare(b.course_name)), error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch courses' };
  }
};

/**
 * Fetch students for a program section
 */
export const fetchProgramSectionStudents = async (sectionId: string): Promise<ServiceResponse<CollegeStudent[]>> => {
  try {
    const { data: section, error: sectionError } = await supabase
      .from('program_sections')
      .select('program_id, semester, section')
      .eq('id', sectionId)
      .single();

    if (sectionError) throw sectionError;

    const { data, error } = await supabase
      .from('students')
      .select('id, user_id, name, email, program_id, section, semester, roll_number')
      .eq('program_id', section.program_id)
      .eq('section', section.section)
      .eq('semester', section.semester)
      .eq('is_deleted', false)
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch students' };
  }
};

/**
 * Create a new college assignment with file uploads
 */
export const createCollegeAssignment = async (
  assignmentData: CreateAssignmentData,
  educatorUserId: string,
  instructionFiles?: File[]
): Promise<ServiceResponse<CollegeAssignment>> => {
  try {
    const { data: educator, error: educatorError } = await supabase
      .from('college_lecturers')
      .select('first_name, last_name')
      .eq('user_id', educatorUserId)
      .single();

    if (educatorError) console.warn('Could not fetch educator details:', educatorError);

    const educatorName = educator
      ? `${educator.first_name} ${educator.last_name}`.trim()
      : 'Unknown Educator';

    const insertData = {
      ...assignmentData,
      college_educator_id: educatorUserId,
      educator_name: educatorName,
      available_from: assignmentData.available_from || new Date().toISOString(),
      instruction_files: []
    };

    const { data, error } = await supabase
      .from('college_assignments')
      .insert([insertData])
      .select(`
        *,
        programs!college_assignments_program_id_fkey(name),
        departments!college_assignments_department_id_fkey(name)
      `)
      .single();

    if (error) throw error;

    let uploadedFiles: Array<{ name: string; url: string; size: number; type: string }> = [];

    if (instructionFiles && instructionFiles.length > 0) {
      const folder = `college_assignments_tasks/${educatorUserId}/${data.assignment_id}`;
      const results = await uploadMultipleFiles(instructionFiles, folder);

      uploadedFiles = results
        .map((result, index) => {
          if (result.success && result.url) {
            const file = instructionFiles[index];
            return { name: file.name, url: result.url, size: file.size, type: file.type };
          }
          return null;
        })
        .filter((file): file is { name: string; url: string; size: number; type: string } => file !== null);

      if (uploadedFiles.length > 0) {
        await supabase
          .from('college_assignments')
          .update({ instruction_files: uploadedFiles })
          .eq('assignment_id', data.assignment_id);
      }
    }

    const assignment: CollegeAssignment = {
      ...data,
      program_name: data.programs?.name,
      department_name: data.departments?.name,
      status: 'active',
      instruction_files: uploadedFiles
    };

    return { data: assignment, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create assignment' };
  }
};

/**
 * Fetch assignments for a college educator
 */
export const fetchEducatorAssignments = async (educatorUserId: string): Promise<ServiceResponse<CollegeAssignment[]>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_college_educator_assignments', { educator_user_id: educatorUserId });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err: any) {
    try {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('college_assignments')
        .select(`
          assignment_id, title, description, instructions, course_name, course_code,
          due_date, total_points, assignment_type, skill_outcomes, created_date,
          program_section_id, instruction_files,
          program_sections!college_assignments_program_section_id_fkey(semester, section, academic_year),
          programs!college_assignments_program_id_fkey(name),
          departments!college_assignments_department_id_fkey(name)
        `)
        .eq('college_educator_id', educatorUserId)
        .eq('is_deleted', false)
        .order('created_date', { ascending: false });

      if (fallbackError) throw fallbackError;

      const assignments = (fallbackData || []).map((a: any) => ({
        assignment_id: a.assignment_id, title: a.title, description: a.description || '',
        instructions: a.instructions || '', course_name: a.course_name, course_code: a.course_code || '',
        college_educator_id: a.college_educator_id, educator_name: a.educator_name || '',
        college_id: a.college_id, program_section_id: a.program_section_id,
        department_id: a.department_id, program_id: a.program_id,
        total_points: a.total_points, assignment_type: a.assignment_type,
        skill_outcomes: a.skill_outcomes || [], due_date: a.due_date,
        available_from: a.available_from || '', allow_late_submission: a.allow_late_submission || false,
        document_pdf: a.document_pdf, instruction_files: a.instruction_files || [],
        created_date: a.created_date,
        status: a.due_date < new Date().toISOString() ? 'completed' : 'active',
        program_name: a.programs?.name || '', department_name: a.departments?.name || '',
        semester: a.program_sections?.semester, section: a.program_sections?.section,
        academic_year: a.program_sections?.academic_year, student_count: 0
      }));

      return { data: assignments, error: null };
    } catch (fallbackErr: any) {
      return { data: null, error: fallbackErr.message || 'Failed to fetch assignments' };
    }
  }
};

/**
 * Ensure user accounts exist for students
 */
const ensureUserAccountsExist = async (students: CollegeStudent[]): Promise<string[]> => {
  const userIds: string[] = [];
  for (const student of students) {
    try {
      const { data: existingUser } = await supabase
        .from('users').select('id').eq('email', student.email).single();
      if (existingUser) {
        if (!student.user_id) {
          await supabase.from('students').update({ user_id: existingUser.id }).eq('id', student.id);
        }
        userIds.push(existingUser.id);
      }
    } catch (error) {
      console.error(`Error processing student ${student.email}:`, error);
    }
  }
  return userIds;
};

export const ensureStudentUserAccounts = async (students: CollegeStudent[]): Promise<ServiceResponse<string[]>> => {
  try {
    const userIds = await ensureUserAccountsExist(students);
    if (userIds.length === 0) {
      return { data: null, error: 'No valid user accounts found for selected students.' };
    }
    return { data: userIds, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to find user accounts' };
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
    const studentAssignments = studentUserIds.map(studentUserId => ({
      assignment_id: assignmentId, student_id: studentUserId, status: 'todo', priority: 'medium'
    }));

    const { error } = await supabase.from('college_student_assignments').insert(studentAssignments);
    if (error) throw error;
    return { data: true, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to assign task to students' };
  }
};

/**
 * Get assignment statistics for an educator
 */
export const getAssignmentStatistics = async (educatorUserId: string): Promise<ServiceResponse<{
  totalAssignments: number;
  activeAssignments: number;
  totalSubmissions: number;
  pendingReviews: number;
  averageScore: number;
}>> => {
  try {
    const { data: assignments, error: assignmentsError } = await supabase
      .from('college_assignments')
      .select('assignment_id, due_date')
      .eq('college_educator_id', educatorUserId)
      .eq('is_deleted', false);

    if (assignmentsError) throw assignmentsError;

    const totalAssignments = assignments?.length || 0;
    const activeAssignments = assignments?.filter(a => new Date(a.due_date) > new Date()).length || 0;
    const assignmentIds = assignments?.map(a => a.assignment_id) || [];

    let totalSubmissions = 0;
    let pendingReviews = 0;
    let averageScore = 0;

    if (assignmentIds.length > 0) {
      const { data: submissions, error: submissionsError } = await supabase
        .from('college_student_assignments')
        .select('status, grade_percentage')
        .in('assignment_id', assignmentIds)
        .eq('is_deleted', false);

      if (!submissionsError && submissions) {
        totalSubmissions = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
        pendingReviews = submissions.filter(s => s.status === 'submitted').length;
        const graded = submissions.filter(s => s.grade_percentage !== null);
        averageScore = graded.length > 0
          ? graded.reduce((sum, s) => sum + (s.grade_percentage || 0), 0) / graded.length
          : 0;
      }
    }

    return {
      data: { totalAssignments, activeAssignments, totalSubmissions, pendingReviews, averageScore: Math.round(averageScore * 10) / 10 },
      error: null
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch statistics' };
  }
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (assignmentId: string): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('college_assignments').update({ is_deleted: true }).eq('assignment_id', assignmentId);
    if (error) throw error;
    return { data: true, error: null };
  } catch (err: any) {
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
      .from('college_assignments')
      .update(updateData)
      .eq('assignment_id', assignmentId)
      .select(`*, programs!college_assignments_program_id_fkey(name), departments!college_assignments_department_id_fkey(name)`)
      .single();

    if (error) throw error;

    const assignment: CollegeAssignment = {
      ...data,
      program_name: data.programs?.name,
      department_name: data.departments?.name,
      status: data.due_date < new Date().toISOString() ? 'completed' : 'active'
    };

    return { data: assignment, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to update assignment' };
  }
};
