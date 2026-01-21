import { supabase } from '../lib/supabaseClient';

export interface ProgramSection {
  id: string;
  department_id: string;
  program_id: string;
  semester: number;
  section: string;
  academic_year: string;
  max_students: number;
  current_students: number;
  faculty_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  program: {
    name: string;
    code: string;
    degree_level: string;
    department: {
      name: string;
      college: {
        name: string;
      };
    };
  };
  faculty?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface ProgramStudent {
  id: string;
  name: string;
  email: string;
  city: string;
  program_id: string;
  semester: number;
  enrollment_number: string;
  contact_number: string;
  progress?: number;
  lastActive?: string;
}

type ServiceResponse<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Update student count in program section
 */
const updateProgramSectionStudentCount = async (
  programId: string,
  semester: number,
  section: string
): Promise<void> => {
  try {
    // Count students in this specific program, semester, and section
    const { count, error: countError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId)
      .eq('semester', semester)
      .eq('section', section)
      .eq('is_deleted', false);

    if (countError) {
      console.error('Error counting students:', countError);
      return;
    }

    // Update the specific program section's current_students count
    const { error: updateError } = await supabase
      .from('program_sections')
      .update({
        current_students: count || 0,
      })
      .eq('program_id', programId)
      .eq('semester', semester)
      .eq('section', section);

    if (updateError) {
      console.error('Error updating student count:', updateError);
    }
  } catch (err) {
    console.error('Error in updateProgramSectionStudentCount:', err);
  }
};

/**
 * Get program sections assigned to a college lecturer
 */
export const getCollegeLecturerProgramSections = async (
  userId: string
): Promise<ServiceResponse<ProgramSection[]>> => {
  try {
    const { data, error } = await supabase
      .from('program_sections')
      .select(
        `
        *,
        program:programs(
          name,
          code,
          degree_level,
          department:departments(
            name,
            college_id
          )
        )
      `
      )
      .eq('faculty_id', userId)
      .eq('status', 'active')
      .order('academic_year', { ascending: false });

    if (error) {
      console.error('Error fetching program sections:', error);
      return { data: null, error: error.message };
    }

    // Fetch college names for departments
    const sectionsWithCollegeNames = await Promise.all(
      (data || []).map(async (section: any) => {
        if (section.program?.department?.college_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', section.program.department.college_id)
            .maybeSingle();

          if (orgData && section.program?.department) {
            section.program.department.college = { name: orgData.name };
          }
        }
        return section;
      })
    );

    // Get faculty info from college_lecturers table using user_id
    if (sectionsWithCollegeNames && sectionsWithCollegeNames.length > 0) {
      const { data: facultyData } = await supabase
        .from('college_lecturers')
        .select('first_name, last_name, email, user_id')
        .eq('user_id', userId)
        .single();

      // Add faculty info to each section
      const sectionsWithFaculty = sectionsWithCollegeNames.map((section) => ({
        ...section,
        faculty: facultyData
          ? {
              first_name: facultyData.first_name,
              last_name: facultyData.last_name,
              email: facultyData.email,
            }
          : null,
      }));

      return { data: sectionsWithFaculty, error: null };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Error in getCollegeLecturerProgramSections:', err);
    return { data: null, error: err?.message || 'Unable to fetch program sections' };
  }
};

/**
 * Get departments for a college (needed for creating program sections)
 */
export const getCollegeDepartments = async (collegeId: string): Promise<ServiceResponse<any[]>> => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code')
      .eq('college_id', collegeId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching departments:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Error in getCollegeDepartments:', err);
    return { data: null, error: err?.message || 'Unable to fetch departments' };
  }
};

/**
 * Create a new program section (like creating a class for school educators)
 */
export const createProgramSection = async (
  departmentId: string,
  programData: {
    name: string;
    code: string;
    degree_level: string;
  },
  sectionData: {
    semester: number;
    section: string;
    academic_year: string;
    max_students: number;
    status: string;
  },
  facultyId: string
): Promise<ServiceResponse<ProgramSection>> => {
  try {
    // First, check if program exists or create it
    const { data: existingProgram } = await supabase
      .from('programs')
      .select('id')
      .eq('department_id', departmentId)
      .eq('code', programData.code)
      .single();

    let programId = existingProgram?.id;

    if (!programId) {
      // Create new program
      const { data: newProgram, error: programError } = await supabase
        .from('programs')
        .insert([
          {
            department_id: departmentId,
            name: programData.name,
            code: programData.code,
            degree_level: programData.degree_level,
            status: 'active',
          },
        ])
        .select('id')
        .single();

      if (programError) {
        console.error('Error creating program:', programError);
        return { data: null, error: programError.message };
      }

      programId = newProgram.id;
    }

    // Create program section
    const { data, error } = await supabase
      .from('program_sections')
      .insert([
        {
          department_id: departmentId,
          program_id: programId,
          semester: sectionData.semester,
          section: sectionData.section,
          academic_year: sectionData.academic_year,
          max_students: sectionData.max_students,
          faculty_id: facultyId, // Assign to the creating lecturer
          status: sectionData.status,
        },
      ])
      .select(
        `
        *,
        program:programs(
          name,
          code,
          degree_level,
          department:departments(
            name,
            college_id
          )
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating program section:', error);
      return { data: null, error: error.message };
    }

    // Fetch college name from organizations table
    if (data?.program?.department?.college_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', data.program.department.college_id)
        .maybeSingle();

      if (orgData && data.program?.department) {
        data.program.department.college = { name: orgData.name };
      }
    }

    return { data: data, error: null };
  } catch (err: any) {
    console.error('Error in createProgramSection:', err);
    return { data: null, error: err?.message || 'Unable to create program section' };
  }
};

/**
 * Unassign a college lecturer from a program section
 */
export const unassignLecturerFromProgramSection = async (
  programSectionId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('program_sections')
      .update({
        faculty_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', programSectionId);

    if (error) {
      console.error('Error unassigning lecturer from program section:', error);
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (err: any) {
    console.error('Error in unassignLecturerFromProgramSection:', err);
    return { data: null, error: err?.message || 'Unable to unassign from program section' };
  }
};

/**
 * Get students from lecturer's assigned program sections with full rich data
 */
export const getProgramSectionStudents = async (
  userId: string
): Promise<ServiceResponse<any[]>> => {
  try {
    // First get the program IDs from lecturer's assigned sections
    const { data: sections, error: sectionsError } = await supabase
      .from('program_sections')
      .select('program_id, semester, section')
      .eq('faculty_id', userId)
      .eq('status', 'active');

    if (sectionsError) {
      console.error('Error fetching lecturer program sections:', sectionsError);
      return { data: null, error: sectionsError.message };
    }

    if (!sections || sections.length === 0) {
      return { data: [], error: null };
    }

    const programIds = sections.map((s) => s.program_id);

    // Get students with full rich data (same as school educators)
    // Note: schools and colleges tables don't exist - use organizations table instead
    const { data, error } = await supabase
      .from('students')
      .select(
        `
        id,
        user_id,
        student_id,
        name,
        email,
        contact_number,
        alternate_number,
        contact_dial_code,
        date_of_birth,
        age,
        gender,
        bloodGroup,
        district_name,
        university,
        university_main,
        branch_field,
        college_school_name,
        course_name,
        registration_number,
        enrollmentNumber,
        github_link,
        linkedin_link,
        twitter_link,
        facebook_link,
        instagram_link,
        portfolio_link,
        youtube_link,
        other_social_links,
        approval_status,
        trainer_name,
        bio,
        address,
        city,
        state,
        country,
        pincode,
        resumeUrl,
        profilePicture,
        contactNumber,
        created_at,
        createdAt,
        updated_at,
        updatedAt,
        imported_at,
        school_id,
        college_id,
        program_id,
        semester,
        section,
        grade,
        roll_number,
        admission_number,
        currentCgpa,
        guardianName,
        guardianPhone,
        guardianEmail,
        guardianRelation,
        enrollmentDate,
        expectedGraduationDate,
        student_type,
        hobbies,
        languages,
        interests,
        category,
        quota,
        metadata,
        notification_settings,
        skills!skills_student_id_fkey(
          id,
          name,
          type,
          level,
          description,
          verified,
          enabled,
          approval_status,
          created_at,
          updated_at
        ),
        projects!projects_student_id_fkey(
          id,
          title,
          description,
          status,
          start_date,
          end_date,
          duration,
          tech_stack,
          demo_link,
          github_link,
          approval_status,
          certificate_url,
          video_url,
          ppt_url,
          organization,
          enabled,
          created_at,
          updated_at
        ),
        certificates!certificates_student_id_fkey(
          id,
          title,
          issuer,
          level,
          credential_id,
          link,
          issued_on,
          description,
          status,
          approval_status,
          document_url,
          enabled,
          created_at,
          updated_at
        ),
        experience!experience_student_id_fkey(
          id,
          organization,
          role,
          start_date,
          end_date,
          duration,
          verified,
          approval_status,
          created_at,
          updated_at
        ),
        trainings!trainings_student_id_fkey(
          id,
          title,
          organization,
          start_date,
          end_date,
          duration,
          description,
          approval_status,
          created_at,
          updated_at
        )
      `
      )
      .in('program_id', programIds)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching program students:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Error in getProgramSectionStudents:', err);
    return { data: null, error: err?.message || 'Unable to fetch students' };
  }
};

/**
 * Get students for a specific program section
 */
export const getStudentsByProgramSection = async (
  programSectionId: string
): Promise<ServiceResponse<ProgramStudent[]>> => {
  try {
    // Get the program section details
    const { data: section, error: sectionError } = await supabase
      .from('program_sections')
      .select('program_id, semester, section')
      .eq('id', programSectionId)
      .single();

    if (sectionError || !section) {
      return { data: null, error: 'Program section not found' };
    }

    // Get students from that specific program, semester, and section
    const { data, error } = await supabase
      .from('students')
      .select(
        `
        id,
        name,
        email,
        city,
        program_id,
        semester,
        section,
        "enrollmentNumber",
        contact_number,
        updated_at
      `
      )
      .eq('program_id', section.program_id)
      .eq('semester', section.semester)
      .eq('section', section.section)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching section students:', error);
      return { data: null, error: error.message };
    }

    const students: ProgramStudent[] = (data || []).map((student) => ({
      id: student.id,
      name: student.name || 'Unknown',
      email: student.email || '',
      city: student.city || '',
      program_id: student.program_id,
      semester: student.semester || 1,
      enrollment_number: student.enrollmentNumber || '',
      contact_number: student.contact_number || '',
      progress: 0, // TODO: Calculate actual progress
      lastActive: student.updated_at || new Date().toISOString(),
    }));

    return { data: students, error: null };
  } catch (err: any) {
    console.error('Error in getStudentsByProgramSection:', err);
    return { data: null, error: err?.message || 'Unable to fetch section students' };
  }
};

/**
 * Get available students that can be added to a program (students without program_id)
 */
export const getAvailableStudentsForProgram = async (
  collegeId: string
): Promise<ServiceResponse<ProgramStudent[]>> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(
        `
        id,
        name,
        email,
        city,
        program_id,
        semester,
        "enrollmentNumber",
        contact_number,
        updated_at
      `
      )
      .eq('college_id', collegeId)
      .is('program_id', null) // Only students without program assignment
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching available students:', error);
      return { data: null, error: error.message };
    }

    const students: ProgramStudent[] = (data || []).map((student) => ({
      id: student.id,
      name: student.name || 'Unknown',
      email: student.email || '',
      city: student.city || '',
      program_id: student.program_id,
      semester: student.semester || 1,
      enrollment_number: student.enrollmentNumber || '',
      contact_number: student.contact_number || '',
      progress: 0,
      lastActive: student.updated_at || new Date().toISOString(),
    }));

    return { data: students, error: null };
  } catch (err: any) {
    console.error('Error in getAvailableStudentsForProgram:', err);
    return { data: null, error: err?.message || 'Unable to fetch available students' };
  }
};

/**
 * Add student to a program
 */
export const addStudentToProgram = async (
  studentId: string,
  programId: string,
  semester: number,
  section: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('students')
      .update({
        program_id: programId,
        semester: semester,
        section: section,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (error) {
      console.error('Error adding student to program:', error);
      return { data: null, error: error.message };
    }

    // Update the student count in program section
    await updateProgramSectionStudentCount(programId, semester, section);

    return { data: true, error: null };
  } catch (err: any) {
    console.error('Error in addStudentToProgram:', err);
    return { data: null, error: err?.message || 'Unable to add student to program' };
  }
};

/**
 * Remove student from program
 */
export const removeStudentFromProgram = async (
  studentId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    // First get the student's current program info before removing
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('program_id, semester, section')
      .eq('id', studentId)
      .single();

    if (fetchError || !student) {
      console.error('Error fetching student info:', fetchError);
      return { data: null, error: 'Student not found' };
    }

    const { program_id: oldProgramId, semester: oldSemester, section: oldSection } = student;

    // Remove student from program
    const { error } = await supabase
      .from('students')
      .update({
        program_id: null,
        semester: null,
        section: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (error) {
      console.error('Error removing student from program:', error);
      return { data: null, error: error.message };
    }

    // Update the student count in the old program section
    if (oldProgramId && oldSemester && oldSection) {
      await updateProgramSectionStudentCount(oldProgramId, oldSemester, oldSection);
    }

    return { data: true, error: null };
  } catch (err: any) {
    console.error('Error in removeStudentFromProgram:', err);
    return { data: null, error: err?.message || 'Unable to remove student from program' };
  }
};
