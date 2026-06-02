import { apiPost } from '@/shared/api/apiClient';

export interface CollegeClassInfo {
  id: string;
  program_id: string;
  program_name: string;
  program_code: string;
  department_name: string;
  semester: number;
  section?: string;
  academic_year?: string;
  college_name?: string;
  current_learners: number;
  max_learners?: number;
  college_id?: string;
  program_section_id?: string;
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

export const getCollegeLearnerClassInfo = async (learnerId: string): Promise<CollegeClassInfo | null> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'get-learner-class-info', learnerId });
    if (!result.success || !result.data) return null;
    return result.data;
  } catch {
    return null;
  }
};

export const getCollegeClassmates = async (
  programId: string, 
  semester: number, 
  programSectionId?: string, 
  currentLearnerId?: string
): Promise<CollegeClassmate[]> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'get-classmates', programId, semester, programSectionId, currentLearnerId });
    if (!result.success) return [];
    return result.data || [];
  } catch {
    return [];
  }
};

export const isCollegeLearner = async (learnerId: string): Promise<boolean> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'is-college-learner', learnerId });
    if (!result.success) return false;
    return result.data ?? false;
  } catch {
    return false;
  }
};

export const getlearnerTypeInfo = async (learnerId: string): Promise<{
  isCollege: boolean;
  isSchool: boolean;
  hasProgram: boolean;
  hasClass: boolean;
}> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'get-learner-type-info', learnerId });
    if (!result.success) {
      return { isCollege: false, isSchool: false, hasProgram: false, hasClass: false };
    }
    return result.data || { isCollege: false, isSchool: false, hasProgram: false, hasClass: false };
  } catch {
    return { isCollege: false, isSchool: false, hasProgram: false, hasClass: false };
  }
};
