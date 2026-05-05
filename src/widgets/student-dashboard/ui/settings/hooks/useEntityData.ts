/**
 * Custom hook to manage entity data fetching
 * Reduces repetitive data fetching patterns
 */

import { 
  useStudentCertificates,
  useStudentProjects,
  useStudentExperience,
  useStudentEducation,
  useStudentTechnicalSkills,
  useStudentSoftSkills
} from '@/entities/student';

interface StudentDataWithEducation {
  education?: any[];
  softSkills?: any[];
  technicalSkills?: any[];
  experience?: any[];
  certificates?: any[];
  projects?: any[];
}

interface EntityData {
  education: any[];
  softSkills: any[];
  technicalSkills: any[];
  experience: any[];
  certificates: any[];
  projects: any[];
}

interface LoadingState {
  certificates: boolean;
  projects: boolean;
  experience: boolean;
  education: boolean;
  technicalSkills: boolean;
  softSkills: boolean;
}

interface ErrorState {
  certificates: Error | null;
  projects: Error | null;
  experience: Error | null;
  education: Error | null;
  technicalSkills: Error | null;
  softSkills: Error | null;
}

interface RefreshFunctions {
  certificates: () => Promise<void>;
  projects: () => Promise<void>;
  experience: () => Promise<void>;
  education: () => Promise<void>;
  technicalSkills: () => Promise<void>;
  softSkills: () => Promise<void>;
}

interface UseEntityDataResult {
  entities: EntityData;
  loading: LoadingState;
  errors: ErrorState;
  refresh: RefreshFunctions;
}

/**
 * Unified entity data hook
 * Fetches all entity data with consistent patterns
 */
export const useEntityData = (studentId: string | undefined, studentDataWithEducation?: StudentDataWithEducation): UseEntityDataResult => {
  // Fetch certificates from dedicated table
  const {
    certificates: tableCertificates,
    loading: certificatesLoading,
    error: certificatesError,
    refresh: refreshCertificates
  } = useStudentCertificates(studentId, !!studentId);

  // Fetch projects from dedicated table
  const {
    projects: tableProjects,
    loading: projectsLoading,
    error: projectsError,
    refresh: refreshProjects
  } = useStudentProjects(studentId, !!studentId);

  // Fetch experience from dedicated table
  const {
    experience: tableExperience,
    loading: experienceLoading,
    error: experienceError,
    refresh: refreshExperience
  } = useStudentExperience(studentId, !!studentId);

  // Fetch education from dedicated table
  const {
    education: tableEducation,
    loading: educationTableLoading,
    error: educationTableError,
    refresh: refreshEducation
  } = useStudentEducation(studentId, !!studentId);

  // Fetch technical skills from dedicated table
  const {
    skills: tableTechnicalSkills,
    loading: technicalSkillsLoading,
    error: technicalSkillsError,
    refresh: refreshTechnicalSkills
  } = useStudentTechnicalSkills(studentId, !!studentId);

  // Fetch soft skills from dedicated table
  const {
    skills: tableSoftSkills,
    loading: softSkillsLoading,
    error: softSkillsError,
    refresh: refreshSoftSkills
  } = useStudentSoftSkills(studentId, !!studentId);

  // Helper to merge table data with fallback data
  const mergeData = (tableData: any[] | undefined, fallbackData: any[] | undefined): any[] => {
    return Array.isArray(tableData) && tableData.length > 0 
      ? tableData 
      : fallbackData || [];
  };

  // Return merged data with consistent structure
  return {
    entities: {
      education: mergeData(tableEducation, studentDataWithEducation?.education),
      softSkills: mergeData(tableSoftSkills, studentDataWithEducation?.softSkills),
      technicalSkills: mergeData(tableTechnicalSkills, studentDataWithEducation?.technicalSkills),
      experience: mergeData(tableExperience, studentDataWithEducation?.experience),
      certificates: mergeData(tableCertificates, studentDataWithEducation?.certificates),
      projects: mergeData(tableProjects, studentDataWithEducation?.projects),
    },
    loading: {
      certificates: certificatesLoading,
      projects: projectsLoading,
      experience: experienceLoading,
      education: educationTableLoading,
      technicalSkills: technicalSkillsLoading,
      softSkills: softSkillsLoading,
    },
    errors: {
      certificates: certificatesError,
      projects: projectsError,
      experience: experienceError,
      education: educationTableError,
      technicalSkills: technicalSkillsError,
      softSkills: softSkillsError,
    },
    refresh: {
      certificates: refreshCertificates,
      projects: refreshProjects,
      experience: refreshExperience,
      education: refreshEducation,
      technicalSkills: refreshTechnicalSkills,
      softSkills: refreshSoftSkills,
    }
  };
};
