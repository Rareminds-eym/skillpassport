import { apiPost } from '@/shared/api/apiClient'

export interface ProgramSection {
  id: string
  department_id: string
  program_id: string
  semester: number
  section: string
  academic_year: string
  max_learners: number
  current_learners: number
  faculty_id: string | null
  status: string
  created_at: string
  updated_at: string
  program: {
    name: string
    code: string
    degree_level: string
    department: {
      name: string
      college: {
        name: string
      }
    }
  }
  faculty?: {
    first_name: string
    last_name: string
    email: string
  } | null
}

export interface ProgramLearner {
  id: string
  name: string
  email: string
  city: string
  program_id: string
  semester: number
  enrollment_number: string
  contact_number: string
  progress?: number
  lastActive?: string
}

type ServiceResponse<T> = { data: T; error: null } | { data: null; error: string }

/**
 * Get program sections assigned to a college lecturer
 */
export const getCollegeLecturerProgramSections = async (userId: string): Promise<ServiceResponse<ProgramSection[]>> => {
  try {
    const response = await apiPost('/college-admin/academic', { action: 'get-lecturer-program-sections', userId });
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to fetch program sections' };
    }
    return { data: response.data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to fetch program sections' };
  }
}

/**
 * Get departments for a college (needed for creating program sections)
 */
export const getCollegeDepartments = async (collegeId: string): Promise<ServiceResponse<any[]>> => {
  try {
    const response = await apiPost('/college-admin/academic', { action: 'get-college-departments', collegeId });
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to fetch departments' };
    }
    return { data: response.data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to fetch departments' };
  }
}

/**
 * Create a new program section (like creating a class for school educators)
 */
export const createProgramSection = async (
  departmentId: string,
  programData: {
    name: string
    code: string
    degree_level: string
  },
  sectionData: {
    semester: number
    section: string
    academic_year: string
    max_learners: number
    status: string
  },
  facultyId: string
): Promise<ServiceResponse<ProgramSection>> => {
  try {
    const response = await apiPost('/college-admin/academic', {
      action: 'create-program-section',
      departmentId,
      programData,
      sectionData,
      facultyId
    });
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to create program section' };
    }
    return { data: response.data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to create program section' };
  }
}

/**
 * Unassign a college lecturer from a program section
 */
export const unassignLecturerFromProgramSection = async (
  programSectionId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const response = await apiPost('/college-admin/academic', { action: 'unassign-lecturer', programSectionId });
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to unassign from program section' };
    }
    return { data: true, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to unassign from program section' };
  }
}

/**
 * Get learners from lecturer's assigned program sections with full rich data
 * Filters learners by exact match of program_id, semester, and section from assigned program sections
 */
export const getProgramSectionlearners = async (userId: string): Promise<ServiceResponse<any[]>> => {
  try {
    const response = await apiPost('/college-admin/academic', { action: 'get-program-section-learners', userId });
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to fetch learners' };
    }
    return { data: response.data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to fetch learners' };
  }
}

/**
 * Get learners for a specific program section
 */
export const getlearnersByProgramSection = async (programSectionId: string): Promise<ServiceResponse<ProgramLearner[]>> => {
  try {
    const response = await apiPost('/college-admin/academic', { action: 'get-learners-by-section', programSectionId });
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to fetch section learners' };
    }
    const learners: ProgramLearner[] = (response.data || []).map((learner: any) => ({
      id: learner.id,
      name: learner.name || 'Unknown',
      email: learner.email || '',
      city: learner.city || '',
      program_id: learner.program_id,
      semester: learner.semester || 1,
      enrollment_number: learner.enrollmentNumber || '',
      contact_number: learner.contact_number || '',
      progress: 0,
      lastActive: learner.updated_at || new Date().toISOString()
    }));
    return { data: learners, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to fetch section learners' };
  }
}

/**
 * Get available learners that can be added to a program (learners without program_id)
 */
export const getAvailablelearnersForProgram = async (collegeId: string): Promise<ServiceResponse<ProgramLearner[]>> => {
  try {
    const response = await apiPost('/college-admin/academic', { action: 'get-available-learners', collegeId });
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to fetch available learners' };
    }
    const learners: ProgramLearner[] = (response.data || []).map((learner: any) => ({
      id: learner.id,
      name: learner.name || 'Unknown',
      email: learner.email || '',
      city: learner.city || '',
      program_id: learner.program_id,
      semester: learner.semester || 1,
      enrollment_number: learner.enrollmentNumber || '',
      contact_number: learner.contact_number || '',
      progress: 0,
      lastActive: learner.updated_at || new Date().toISOString()
    }));
    return { data: learners, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to fetch available learners' };
  }
}

/**
 * Add learner to a program
 */
export const addlearnerToProgram = async (
  learnerId: string, 
  programId: string, 
  semester: number,
  section: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const response = await apiPost('/college-admin/academic', {
      action: 'add-learner-to-program',
      learnerId,
      programId,
      semester,
      section
    });
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to add learner to program' };
    }
    return { data: true, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to add learner to program' };
  }
}

/**
 * Remove learner from program
 */
export const removelearnerFromProgram = async (learnerId: string): Promise<ServiceResponse<boolean>> => {
  try {
    const response = await apiPost('/college-admin/academic', { action: 'remove-learner-from-program', learnerId });
    if (!response.success) {
      return { data: null, error: response.error || 'Unable to remove learner from program' };
    }
    return { data: true, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Unable to remove learner from program' };
  }
}
