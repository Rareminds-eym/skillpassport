/**
 * Type definitions for useStudentDataByEmail hook
 */

export interface StudentData {
  id: string;
  email: string;
  profile?: {
    name?: string;
    age?: number;
    contact_number?: string;
    date_of_birth?: string;
    district_name?: string;
    university?: string;
    college_school_name?: string;
    branch_field?: string;
    registration_number?: string;
    nm_id?: string;
    education?: any[];
    training?: any[];
    experience?: any[];
    softSkills?: any[];
    technicalSkills?: any[];
    projects?: any[];
    certificates?: any[];
  };
  school_id?: string;
  university_college_id?: string;
  [key: string]: any;
}

export interface UseStudentDataByEmailResult {
  studentData: StudentData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>;
  updateEducation: (educationData: any) => Promise<{ success: boolean; error?: string }>;
  updateTraining: (trainingData: any) => Promise<{ success: boolean; error?: string }>;
  updateSingleTraining: (trainingId: string, updateData: any) => Promise<{ success: boolean; error?: string }>;
  updateExperience: (experienceData: any) => Promise<{ success: boolean; error?: string }>;
  updateSkills: (skillsData: any) => Promise<{ success: boolean; error?: string }>;
  updateTechnicalSkills: (skillsData: any) => Promise<{ success: boolean; error?: string }>;
  updateSoftSkills: (skillsData: any) => Promise<{ success: boolean; error?: string }>;
  updateProjects: (projectsData: any) => Promise<{ success: boolean; error?: string }>;
  updateCertificates: (certificatesData: any) => Promise<{ success: boolean; error?: string }>;
}

export function useStudentDataByEmail(
  email: string | undefined | null,
  fallbackToMock?: boolean
): UseStudentDataByEmailResult;
