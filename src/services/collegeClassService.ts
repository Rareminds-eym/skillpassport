import { supabase } from '../lib/supabaseClient';

export interface CollegeClassInfo {
  id: string; // This is the student ID, not program_section_id
  program_id: string;
  program_name: string;
  program_code: string;
  department_name: string;
  semester: number;
  section?: string;
  academic_year?: string;
  college_name?: string;
  current_students: number;
  max_students?: number;
  college_id?: string;
  program_section_id?: string; // Add this field
}

export interface CollegeClassmate {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  semester: number;
  roll_number?: string;
  admission_number?: string;
}

/**
 * Get college student's class information including program, department, and college details
 */
export const getCollegeStudentClassInfo = async (studentId: string): Promise<CollegeClassInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        program_id,
        semester,
        program_section_id,
        college_id,
        programs (
          id,
          name,
          code,
          departments (
            id,
            name
          )
        ),
        program_sections (
          id,
          section,
          academic_year,
          current_students,
          max_students,
          semester
        )
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('Error fetching college class info:', error);
      return null;
    }

    if (!data || !data.program_id) {
      console.warn('Student has no program assigned');
      return null;
    }

    const program = Array.isArray(data.programs) ? data.programs[0] : data.programs;
    const department = program?.departments ? 
      (Array.isArray(program.departments) ? program.departments[0] : program.departments) : null;
    const programSection = Array.isArray(data.program_sections) ? data.program_sections[0] : data.program_sections;

    // Determine the actual semester - use program_section semester if student semester is null
    const actualSemester = data.semester || programSection?.semester || 1;

    // Get college name if college_id exists
    let collegeName = '';
    if (data.college_id) {
      const { data: collegeData } = await supabase
        .from('colleges')
        .select('name')
        .eq('id', data.college_id)
        .single();
      
      collegeName = collegeData?.name || '';
    }

    // Calculate actual current students count for college students only
    let actualCurrentStudents = 0;
    if (data.program_section_id) {
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact' })
        .eq('program_section_id', data.program_section_id)
        .not('is_deleted', 'is', true)
        .not('is_deleted', 'eq', true);
      
      // Filter by college students only
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id,
          users!inner (
            role
          )
        `)
        .eq('program_section_id', data.program_section_id)
        .eq('users.role', 'college_student')
        .not('is_deleted', 'is', true);
      
      actualCurrentStudents = studentsData?.length || 0;
    }

    return {
      id: data.id,
      program_id: data.program_id,
      program_name: program?.name || 'Unknown Program',
      program_code: program?.code || 'N/A',
      department_name: department?.name || 'Unknown Department',
      semester: actualSemester,
      section: programSection?.section || undefined,
      academic_year: programSection?.academic_year || undefined,
      college_name: collegeName,
      current_students: actualCurrentStudents,
      max_students: programSection?.max_students || 0,
      college_id: data.college_id || undefined,
      program_section_id: data.program_section_id || undefined,
    };
  } catch (error) {
    console.error('Error in getCollegeStudentClassInfo:', error);
    return null;
  }
};

/**
 * Get college classmates based on program, semester, and section
 */
export const getCollegeClassmates = async (
  programId: string, 
  semester: number, 
  programSectionId?: string, 
  currentStudentId?: string
): Promise<CollegeClassmate[]> => {
  try {
    let query = supabase
      .from('students')
      .select(`
        id,
        name,
        email,
        profilePicture,
        semester,
        roll_number,
        admission_number,
        program_section_id,
        users!inner (
          role
        )
      `)
      .eq('program_id', programId)
      .eq('users.role', 'college_student');

    // Exclude current student
    if (currentStudentId) {
      query = query.neq('id', currentStudentId);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching college classmates:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Filter classmates based on program section and semester logic
    const filteredClassmates = data.filter(student => {
      // If current student has a program_section_id, find others in the same section
      if (programSectionId) {
        return student.program_section_id === programSectionId;
      }
      
      // If current student has no program_section_id, find others with same semester or no section
      // This handles cases where semester might be null but they're in the same program
      const studentSemester = student.semester || semester; // Use provided semester as fallback
      return studentSemester === semester && !student.program_section_id;
    });

    return filteredClassmates.map(student => ({
      id: student.id,
      name: student.name || 'Unknown',
      email: student.email,
      profilePicture: student.profilePicture,
      semester: student.semester || semester,
      roll_number: student.roll_number,
      admission_number: student.admission_number,
    }));
  } catch (error) {
    console.error('Error in getCollegeClassmates:', error);
    return [];
  }
};

/**
 * Check if a student is a college student based on their user role
 */
export const isCollegeStudent = async (studentId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        users!inner (
          role
        )
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('Error checking student type:', error);
      return false;
    }

    const user = Array.isArray(data.users) ? data.users[0] : data.users;
    return user?.role === 'college_student';
  } catch (error) {
    console.error('Error in isCollegeStudent:', error);
    return false;
  }
};

/**
 * Get college student type and basic info for routing decisions
 */
export const getStudentTypeInfo = async (studentId: string): Promise<{
  isCollege: boolean;
  isSchool: boolean;
  hasProgram: boolean;
  hasClass: boolean;
}> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        program_id,
        school_class_id,
        users!inner (
          role
        )
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('Error getting student type info:', error);
      return { isCollege: false, isSchool: false, hasProgram: false, hasClass: false };
    }

    const user = Array.isArray(data.users) ? data.users[0] : data.users;
    const role = user?.role;

    return {
      isCollege: role === 'college_student',
      isSchool: role === 'school_student',
      hasProgram: !!data.program_id,
      hasClass: !!data.school_class_id,
    };
  } catch (error) {
    console.error('Error in getStudentTypeInfo:', error);
    return { isCollege: false, isSchool: false, hasProgram: false, hasClass: false };
  }
};