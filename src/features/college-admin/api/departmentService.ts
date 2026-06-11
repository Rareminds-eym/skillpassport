import { apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';

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
  learner_count?: number;
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
    const response = await apiPost('/college-admin/academic', { action: 'get-departments', college_id: collegeId });
    if (!response.success) throw new Error(response.error || 'Failed to fetch departments');
    return response.data || [];
  },

  // Get single department by ID
  async getDepartment(id: string): Promise<DepartmentWithStats | null> {
    const response = await apiPost('/college-admin/academic', { action: 'get-department', department_id: id });
    if (!response.success) throw new Error(response.error || 'Failed to fetch department');
    return response.data || null;
  },

  // Create new department
  async createDepartment(department: Omit<DepartmentInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const user = useAuthStore.getState().user;

    const response = await apiPost('/college-admin/academic', {
      action: 'create-department',
      ...department,
      created_by: user?.id,
      updated_by: user?.id,
    });
    if (!response.success) throw new Error(response.error || 'Failed to create department');
    return response.data;
  },

  // Update department
  async updateDepartment(id: string, updates: DepartmentUpdate): Promise<Department> {
    const user = useAuthStore.getState().user;

    const response = await apiPost('/college-admin/academic', {
      action: 'update-department',
      department_id: id,
      ...updates,
      updated_by: user?.id,
    });
    if (!response.success) throw new Error(response.error || 'Failed to update department');
    return response.data;
  },

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    const response = await apiPost('/college-admin/academic', { action: 'delete-department', department_id: id });
    if (!response.success) throw new Error(response.error || 'Failed to delete department');
  },

  // Get department faculty
  async getDepartmentFaculty(departmentId: string): Promise<Faculty[]> {
    const response = await apiPost('/college-admin/academic', { action: 'get-department-faculty', department_id: departmentId });
    if (!response.success) throw new Error(response.error || 'Failed to fetch department faculty');
    return response.data || [];
  },

  // Get all available faculty for a college
  async getCollegeFaculty(collegeId: string): Promise<Faculty[]> {
    const response = await apiPost('/college-admin/academic', { action: 'get-college-faculty', college_id: collegeId });
    if (!response.success) throw new Error(response.error || 'Failed to fetch college faculty');
    return response.data || [];
  },

  // Assign HOD to department
  async assignHODToDepartment(
    departmentId: string, 
    lecturerId: string
  ): Promise<void> {
    const user = useAuthStore.getState().user;

    const response = await apiPost('/college-admin/academic', {
      action: 'assign-hod',
      department_id: departmentId,
      lecturer_id: lecturerId,
      assigned_by: user?.id,
    });
    if (!response.success) throw new Error(response.error || 'Failed to assign HOD');
  },

  // Assign faculty to department
  async assignFacultyToDepartment(
    departmentId: string, 
    lecturerIds: string[], 
    assignedBy: string
  ): Promise<void> {
    const response = await apiPost('/college-admin/academic', {
      action: 'assign-faculty',
      department_id: departmentId,
      lecturer_ids: lecturerIds,
      assigned_by: assignedBy,
    });
    if (!response.success) throw new Error(response.error || 'Failed to assign faculty');
  },

  // Get department learners
  async getDepartmentlearners(departmentId: string) {
    const response = await apiPost('/college-admin/academic', { action: 'get-department-learners', department_id: departmentId });
    if (!response.success) throw new Error(response.error || 'Failed to fetch department learners');
    return response.data || [];
  },

  // Get department programs
  async getDepartmentPrograms(departmentId: string) {
    const response = await apiPost('/college-admin/academic', { action: 'get-department-programs', department_id: departmentId });
    if (!response.success) throw new Error(response.error || 'Failed to fetch department programs');
    return response.data || [];
  },

  // Get department courses
  async getDepartmentCourses(departmentId: string) {
    const response = await apiPost('/college-admin/academic', { action: 'get-department-courses', department_id: departmentId });
    if (!response.success) throw new Error(response.error || 'Failed to fetch department courses');
    return response.data || [];
  },

  // Bulk update department status
  async updateDepartmentStatus(ids: string[], status: string): Promise<void> {
    const user = useAuthStore.getState().user;

    const response = await apiPost('/college-admin/academic', {
      action: 'update-department-status',
      ids,
      status,
      updatedBy: user?.id,
    });
    if (!response.success) throw new Error(response.error || 'Failed to update department status');
  },

  // Search departments
  async searchDepartments(collegeId: string, query: string): Promise<DepartmentWithStats[]> {
    const response = await apiPost('/college-admin/academic', {
      action: 'search-departments',
      college_id: collegeId,
      query,
    });
    if (!response.success) throw new Error(response.error || 'Failed to search departments');
    return response.data || [];
  },

  // Validate unique department code within college
  async validateDepartmentCode(collegeId: string, code: string, excludeDepartmentId?: string): Promise<{ isValid: boolean; message?: string }> {
    const response = await apiPost('/college-admin/academic', {
      action: 'validate-department-code',
      college_id: collegeId,
      code,
      exclude_department_id: excludeDepartmentId,
    });
    if (!response.success) {
      return { isValid: false, message: response.error || 'Error validating department code. Please try again.' };
    }
    return response.data;
  },

  // Add learners to department
  async addlearnersToDepartment(
    departmentId: string,
    learners: Array<{
      rollNumber: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      semester?: number;
      program?: string;
    }>
  ): Promise<void> {
    const user = useAuthStore.getState().user;

    const response = await apiPost('/college-admin/academic', {
      action: 'add-learners-to-department',
      department_id: departmentId,
      learners,
      created_by: user?.id,
    });
    if (!response.success) throw new Error(response.error || 'Failed to add learners');
  },
};
