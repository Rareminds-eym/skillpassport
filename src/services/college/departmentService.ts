import { supabase } from '../../lib/supabaseClient';

export interface Department {
  id: string;
  school_id?: string | null;
  college_id?: string | null;
  name: string;
  code: string;
  description?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface DepartmentInsert {
  school_id?: string | null;
  college_id?: string | null;
  name: string;
  code: string;
  description?: string | null;
  status?: string;
  metadata?: any;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface DepartmentUpdate {
  name?: string;
  code?: string;
  description?: string | null;
  status?: string;
  metadata?: any;
  updated_by?: string | null;
  updated_at?: string;
}

export interface DepartmentWithStats extends Department {
  faculty_count?: number;
  student_count?: number;
  program_count?: number;
  course_count?: number;
  programs_offered?: Program[];
}

export interface Program {
  id: string;
  name: string;
  code: string;
  degree_level: string;
  description?: string;
  status?: string;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  designation: string;
  specialization: string;
  employeeId?: string;
  qualification?: string;
  experienceYears?: number;
  phone?: string;
  idProofUrl?: string;
  degreeCertificateUrl?: string;
  experienceLettersUrl?: string[];
}

export const departmentService = {
  // Get all departments for a college with real faculty counts and programs
  async getDepartments(collegeId: string): Promise<DepartmentWithStats[]> {
    const { data, error } = await supabase
      .from('departments')
      .select(
        `
        *,
        department_faculty_assignments (
          id,
          is_active,
          is_hod,
          college_lecturers!inner (
            id,
            first_name,
            last_name,
            email,
            designation
          )
        ),
        programs!programs_department_id_fkey (
          id,
          name,
          code,
          degree_level,
          description,
          status,
          students!students_program_id_fkey (
            id,
            is_deleted,
            approval_status
          )
        )
      `
      )
      .eq('college_id', collegeId)
      .order('name');

    if (error) throw error;

    // Process departments with HOD information and programs
    return (data || []).map((dept) => {
      const assignments = dept.department_faculty_assignments || [];
      const activeAssignments = assignments.filter((assignment: any) => assignment.is_active);
      const hodAssignment = activeAssignments.find((assignment: any) => assignment.is_hod);

      let hodInfo = null;
      if (hodAssignment && hodAssignment.college_lecturers) {
        const lecturer = hodAssignment.college_lecturers;
        hodInfo = {
          name: `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim() || 'Unknown',
          email: lecturer.email || '',
          designation: lecturer.designation || 'Head of Department',
        };
      }

      // Process programs offered
      const programs = (dept.programs || [])
        .filter((program: any) => program.status === 'active')
        .map((program: any) => ({
          id: program.id,
          name: program.name,
          code: program.code,
          degree_level: program.degree_level,
          description: program.description,
          status: program.status,
        }));

      // Calculate student count via programs only
      const studentCount = (dept.programs || [])
        .filter((program: any) => program.status === 'active')
        .reduce((total: number, program: any) => {
          const activeStudents = (program.students || []).filter(
            (student: any) => !student.is_deleted && student.approval_status !== 'rejected'
          );
          return total + activeStudents.length;
        }, 0);

      return {
        ...dept,
        faculty_count: activeAssignments.length || 0,
        student_count: studentCount,
        program_count: programs.length,
        course_count: 0, // TODO: Implement course count
        programs_offered: programs,
        // Add HOD information to metadata
        metadata: {
          ...dept.metadata,
          hod: hodInfo?.name || dept.metadata?.hod || 'Not Assigned',
          email: hodInfo?.email || dept.metadata?.email || '',
          hod_designation: hodInfo?.designation || dept.metadata?.hod_designation || '',
        },
      };
    });
  },

  // Get single department by ID
  async getDepartment(id: string): Promise<DepartmentWithStats | null> {
    const { data, error } = await supabase
      .from('departments')
      .select(
        `
        *,
        faculty:faculty(count),
        students:students(count),
        programs:programs(count),
        curriculum_courses:curriculum_courses(count)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      faculty_count: data.faculty?.[0]?.count || 0,
      student_count: data.students?.[0]?.count || 0,
      program_count: data.programs?.[0]?.count || 0,
      course_count: data.curriculum_courses?.[0]?.count || 0,
    };
  },

  // Create new department
  async createDepartment(
    department: Omit<DepartmentInsert, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Department> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Ensure only one of school_id or college_id is set
    // Explicitly check for null/undefined to avoid setting both
    const insertData: any = {
      name: department.name,
      code: department.code,
      description: department.description || null,
      status: department.status || 'active',
      metadata: department.metadata || null,
      created_by: user?.id,
      updated_by: user?.id,
    };

    // Only set school_id if it's explicitly provided and not null
    if (department.school_id !== null && department.school_id !== undefined) {
      insertData.school_id = department.school_id;
      insertData.college_id = null;
    }
    // Only set college_id if it's explicitly provided and not null
    else if (department.college_id !== null && department.college_id !== undefined) {
      insertData.school_id = null;
      insertData.college_id = department.college_id;
    }

    console.log('Inserting department:', insertData);

    const { data, error } = await supabase.from('departments').insert(insertData).select().single();

    if (error) {
      console.error('Department insert error:', error);
      throw error;
    }

    // If HOD is specified in metadata, create faculty assignment
    if (data && department.metadata?.hod_id) {
      try {
        await this.assignHODToDepartment(data.id, department.metadata.hod_id);
        console.log('HOD assigned to new department:', department.metadata.hod_id);
      } catch (hodError) {
        console.error('Error assigning HOD to new department:', hodError);
        // Don't throw error here - department was created successfully
        // HOD can be assigned later if needed
      }
    }

    return data;
  },

  // Update department
  async updateDepartment(id: string, updates: DepartmentUpdate): Promise<Department> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('departments')
      .update({
        ...updates,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Handle HOD assignment changes if hod_id is provided in metadata
    if (data && updates.metadata?.hod_id) {
      try {
        // Get current HOD assignment
        const { data: currentHOD } = await supabase
          .from('department_faculty_assignments')
          .select('lecturer_id')
          .eq('department_id', id)
          .eq('is_hod', true)
          .eq('is_active', true)
          .single();

        // Only update if HOD has changed
        if (!currentHOD || currentHOD.lecturer_id !== updates.metadata.hod_id) {
          await this.assignHODToDepartment(id, updates.metadata.hod_id);
          console.log(
            'HOD assignment updated for department:',
            id,
            'new HOD:',
            updates.metadata.hod_id
          );
        }
      } catch (hodError) {
        console.error('Error updating HOD assignment:', hodError);
        // Don't throw error here - department was updated successfully
        // HOD can be assigned manually if needed
      }
    }

    return data;
  },

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase.from('departments').delete().eq('id', id);

    if (error) throw error;
  },

  // Get department faculty
  async getDepartmentFaculty(departmentId: string): Promise<Faculty[]> {
    const { data, error } = await supabase
      .from('department_faculty_assignments')
      .select(
        `
        lecturer_id,
        is_hod,
        college_lecturers!inner (
          id,
          employeeId,
          specialization,
          qualification,
          experienceYears,
          designation,
          accountStatus,
          first_name,
          last_name,
          email,
          phone,
          id_proof_url,
          degree_certificate_url,
          experience_letters_url,
          users!fk_college_lecturers_user (
            id,
            firstName,
            lastName,
            email,
            phone
          )
        )
      `
      )
      .eq('department_id', departmentId)
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.college_lecturers.id,
      name:
        `${item.college_lecturers.first_name || item.college_lecturers.users?.firstName || ''} ${item.college_lecturers.last_name || item.college_lecturers.users?.lastName || ''}`.trim() ||
        'Unknown',
      email: item.college_lecturers.email || item.college_lecturers.users?.email || '',
      designation: item.is_hod
        ? 'Head of Department'
        : item.college_lecturers.designation || 'Faculty',
      specialization: item.college_lecturers.specialization || '',
      employeeId: item.college_lecturers.employeeId,
      qualification: item.college_lecturers.qualification,
      experienceYears: item.college_lecturers.experienceYears,
      phone: item.college_lecturers.phone || item.college_lecturers.users?.phone,
      idProofUrl: item.college_lecturers.id_proof_url,
      degreeCertificateUrl: item.college_lecturers.degree_certificate_url,
      experienceLettersUrl: item.college_lecturers.experience_letters_url || [],
    }));
  },

  // Get all available faculty for a college
  async getCollegeFaculty(collegeId: string): Promise<Faculty[]> {
    const { data, error } = await supabase
      .from('college_lecturers')
      .select(
        `
        id,
        employeeId,
        specialization,
        qualification,
        experienceYears,
        designation,
        accountStatus,
        first_name,
        last_name,
        email,
        phone,
        id_proof_url,
        degree_certificate_url,
        experience_letters_url,
        users!fk_college_lecturers_user (
          id,
          firstName,
          lastName,
          email,
          phone
        )
      `
      )
      .eq('collegeId', collegeId)
      .eq('accountStatus', 'active');

    if (error) throw error;

    return (data || []).map((lecturer: any) => ({
      id: lecturer.id,
      name:
        `${lecturer.first_name || lecturer.users?.firstName || ''} ${lecturer.last_name || lecturer.users?.lastName || ''}`.trim() ||
        'Unknown',
      email: lecturer.email || lecturer.users?.email || '',
      designation: lecturer.designation || 'Faculty',
      specialization: lecturer.specialization || '',
      employeeId: lecturer.employeeId,
      qualification: lecturer.qualification,
      experienceYears: lecturer.experienceYears,
      phone: lecturer.phone || lecturer.users?.phone,
      idProofUrl: lecturer.id_proof_url,
      degreeCertificateUrl: lecturer.degree_certificate_url,
      experienceLettersUrl: lecturer.experience_letters_url || [],
    }));
  },

  // Assign HOD to department
  async assignHODToDepartment(departmentId: string, lecturerId: string): Promise<void> {
    // First, reset any existing HOD assignments in this department
    await supabase
      .from('department_faculty_assignments')
      .update({
        is_hod: false,
        // Remove manual updated_at - let trigger handle it
      })
      .eq('department_id', departmentId)
      .eq('is_hod', true);

    // Check if faculty assignment already exists for this lecturer in this department
    const { data: existingAssignment } = await supabase
      .from('department_faculty_assignments')
      .select('id')
      .eq('department_id', departmentId)
      .eq('lecturer_id', lecturerId)
      .eq('is_active', true)
      .single();

    if (existingAssignment) {
      // Update existing assignment to make them HOD
      const { error } = await supabase
        .from('department_faculty_assignments')
        .update({
          is_hod: true,
          // Remove manual updated_at - let trigger handle it
        })
        .eq('department_id', departmentId)
        .eq('lecturer_id', lecturerId)
        .eq('is_active', true);

      if (error) throw error;
    } else {
      // Create new faculty assignment with HOD role
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from('department_faculty_assignments').insert({
        department_id: departmentId,
        lecturer_id: lecturerId,
        assignment_type: 'faculty',
        assigned_by: user?.id,
        is_active: true,
        is_hod: true,
      });

      if (error) throw error;
    }
  },

  // Assign faculty to department
  async assignFacultyToDepartment(
    departmentId: string,
    lecturerIds: string[],
    assignedBy: string
  ): Promise<void> {
    // First, deactivate existing assignments for this department
    await supabase
      .from('department_faculty_assignments')
      .update({
        is_active: false,
        // Remove manual updated_at - let trigger handle it
      })
      .eq('department_id', departmentId);

    // Then create new assignments
    if (lecturerIds.length > 0) {
      const assignments = lecturerIds.map((lecturerId) => ({
        department_id: departmentId,
        lecturer_id: lecturerId,
        assignment_type: 'faculty',
        assigned_by: assignedBy,
        is_active: true,
        is_hod: false, // Default to not HOD
      }));

      // Use upsert with the new unique constraint
      const { error } = await supabase.from('department_faculty_assignments').upsert(assignments, {
        onConflict: 'department_id,lecturer_id',
        ignoreDuplicates: false,
      });

      if (error) throw error;
    }
  },

  // Get department students
  async getDepartmentStudents(departmentId: string) {
    const { data, error } = await supabase
      .from('students')
      .select(
        `
        id,
        roll_number,
        name,
        email,
        contactNumber,
        semester,
        approval_status,
        is_deleted,
        program:programs!students_program_id_fkey(
          id,
          name, 
          code,
          department_id
        )
      `
      )
      .eq('program.department_id', departmentId)
      .eq('is_deleted', false)
      .neq('approval_status', 'rejected')
      .order('roll_number');

    if (error) throw error;
    return data || [];
  },

  // Get department programs
  async getDepartmentPrograms(departmentId: string) {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('department_id', departmentId)
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Get department courses
  async getDepartmentCourses(departmentId: string) {
    const { data, error } = await supabase
      .from('curriculum_courses')
      .select('*')
      .eq('department_id', departmentId)
      .order('course_name');

    if (error) throw error;
    return data || [];
  },

  // Bulk update department status
  async updateDepartmentStatus(ids: string[], status: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('departments')
      .update({
        status,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (error) throw error;
  },

  // Search departments
  async searchDepartments(collegeId: string, query: string): Promise<DepartmentWithStats[]> {
    const { data, error } = await supabase
      .from('departments')
      .select(
        `
        *,
        faculty:faculty(count),
        students:students(count),
        programs:programs(count),
        curriculum_courses:curriculum_courses(count)
      `
      )
      .eq('college_id', collegeId)
      .or(`name.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name');

    if (error) throw error;

    return (data || []).map((dept) => ({
      ...dept,
      faculty_count: dept.faculty?.[0]?.count || 0,
      student_count: dept.students?.[0]?.count || 0,
      program_count: dept.programs?.[0]?.count || 0,
      course_count: dept.curriculum_courses?.[0]?.count || 0,
    }));
  },

  // Validate unique department code within college
  async validateDepartmentCode(
    collegeId: string,
    code: string,
    excludeDepartmentId?: string
  ): Promise<{ isValid: boolean; message?: string }> {
    let query = supabase
      .from('departments')
      .select('id, code, name')
      .eq('college_id', collegeId)
      .ilike('code', code.trim());

    // Exclude current department when editing
    if (excludeDepartmentId) {
      query = query.neq('id', excludeDepartmentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error validating department code:', error);
      return { isValid: false, message: 'Error validating department code. Please try again.' };
    }

    if (data && data.length > 0) {
      const existingDept = data[0];
      return {
        isValid: false,
        message: `Department code "${code.toUpperCase()}" is already used by "${existingDept.name}". Please choose a different code.`,
      };
    }

    return { isValid: true };
  },

  // Add students to department
  async addStudentsToDepartment(
    departmentId: string,
    students: Array<{
      rollNumber: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      semester?: number;
      program?: string;
    }>
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // First, get the department to find the college_id
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('college_id')
      .eq('id', departmentId)
      .single();

    if (deptError) throw deptError;

    // Prepare student data for insertion
    const studentsData = students.map((student) => ({
      roll_number: student.rollNumber,
      first_name: student.firstName,
      last_name: student.lastName,
      email: student.email,
      phone: student.phone || null,
      semester: student.semester || 1,
      program: student.program || null,
      department_id: departmentId,
      college_id: department.college_id,
      status: 'active',
      created_by: user?.id,
      updated_by: user?.id,
    }));

    const { error } = await supabase.from('students').insert(studentsData);

    if (error) throw error;
  },
};
