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
}

export const departmentService = {
  // Get all departments for a college
  async getDepartments(collegeId: string): Promise<DepartmentWithStats[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('college_id', collegeId)
      .order('name');

    if (error) throw error;

    // Return departments with default counts (can be enhanced later)
    return (data || []).map(dept => ({
      ...dept,
      faculty_count: 0,
      student_count: 0,
      program_count: 0,
      course_count: 0,
    }));
  },

  // Get single department by ID
  async getDepartment(id: string): Promise<DepartmentWithStats | null> {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        faculty:faculty(count),
        students:students(count),
        programs:programs(count),
        curriculum_courses:curriculum_courses(count)
      `)
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
  async createDepartment(department: Omit<DepartmentInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const { data: { user } } = await supabase.auth.getUser();
    
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
    
    const { data, error } = await supabase
      .from('departments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Department insert error:', error);
      throw error;
    }
    return data;
  },

  // Update department
  async updateDepartment(id: string, updates: DepartmentUpdate): Promise<Department> {
    const { data: { user } } = await supabase.auth.getUser();
    
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
    return data;
  },

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get department faculty
  async getDepartmentFaculty(departmentId: string) {
    const { data, error } = await supabase
      .from('faculty')
      .select(`
        *,
        user:users(name, email, phone)
      `)
      .eq('department_id', departmentId)
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  },

  // Get department students
  async getDepartmentStudents(departmentId: string) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        roll_number,
        name,
        email,
        phone,
        semester,
        program:programs(name, code)
      `)
      .eq('department_id', departmentId)
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
    const { data: { user } } = await supabase.auth.getUser();
    
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
      .select(`
        *,
        faculty:faculty(count),
        students:students(count),
        programs:programs(count),
        curriculum_courses:curriculum_courses(count)
      `)
      .eq('college_id', collegeId)
      .or(`name.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name');

    if (error) throw error;

    return (data || []).map(dept => ({
      ...dept,
      faculty_count: dept.faculty?.[0]?.count || 0,
      student_count: dept.students?.[0]?.count || 0,
      program_count: dept.programs?.[0]?.count || 0,
      course_count: dept.curriculum_courses?.[0]?.count || 0,
    }));
  },
};
