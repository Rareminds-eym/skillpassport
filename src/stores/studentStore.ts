/**
 * Student Store - Zustand State Management
 * 
 * Single source of truth for student profile data
 * Integrates with existing authStore for user_id → student_id mapping
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import {
  getStudentById,
  getStudentByUserId,
  getStudentProfile,
  updateStudent,
  type Student,
  type Education,
  type Experience,
  type Skill,
  type Project,
  type Training,
  type Certificate,
  type UpdateStudentInput,
  type CreateEducationInput,
  type CreateExperienceInput,
  type CreateSkillInput,
  type CreateProjectInput,
  type CreateTrainingInput,
  type CreateCertificateInput,
} from '../services/student';
import * as educationService from '../services/student/educationService';
import * as experienceService from '../services/student/experienceService';
import * as skillsService from '../services/student/skillsService';
import * as projectsService from '../services/student/projectsService';
import * as trainingsService from '../services/student/trainingsService';
import * as certificatesService from '../services/student/certificatesService';

// ==================== STATE INTERFACE ====================

interface StudentState {
  // Core student data
  student: Student | null;
  studentId: string | null;
  
  // Related entities
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  projects: Project[];
  trainings: Training[];
  certificates: Certificate[];
  
  // Loading states
  isLoading: boolean;
  isLoadingProfile: boolean;
  isLoadingEducation: boolean;
  isLoadingExperience: boolean;
  isLoadingSkills: boolean;
  isLoadingProjects: boolean;
  isLoadingTrainings: boolean;
  isLoadingCertificates: boolean;
  
  // Error states
  error: string | null;
  
  // Computed flags
  hasStudent: boolean;
  isProfileComplete: boolean;
  
  // ==================== ACTIONS ====================
  
  // Core student actions
  loadStudentByUserId: (userId: string) => Promise<void>;
  loadStudentById: (studentId: string) => Promise<void>;
  loadFullProfile: (studentId: string) => Promise<void>;
  updateStudentData: (updates: UpdateStudentInput) => Promise<void>;
  clearStudent: () => void;
  
  // Related entity actions
  loadEducation: (studentId: string) => Promise<void>;
  loadExperience: (studentId: string) => Promise<void>;
  loadSkills: (studentId: string) => Promise<void>;
  loadProjects: (studentId: string) => Promise<void>;
  loadTrainings: (studentId: string) => Promise<void>;
  loadCertificates: (studentId: string) => Promise<void>;
  
  // Bulk update actions
  updateEducationBulk: (records: Partial<Education>[]) => Promise<{ success: boolean; data?: Education[] | null; error?: string | null }>;
  updateExperienceBulk: (records: Partial<Experience>[]) => Promise<{ success: boolean; data?: Experience[] | null; error?: string | null }>;
  updateSkillsBulk: (records: Partial<Skill>[]) => Promise<{ success: boolean; data?: Skill[] | null; error?: string | null }>;
  updateProjectsBulk: (records: Partial<Project>[]) => Promise<{ success: boolean; data?: Project[] | null; error?: string | null }>;
  updateTrainingsBulk: (records: Partial<Training>[]) => Promise<{ success: boolean; data?: Training[] | null; error?: string | null }>;
  updateCertificatesBulk: (records: Partial<Certificate>[]) => Promise<{ success: boolean; data?: Certificate[] | null; error?: string | null }>;
  
  // Single entity CRUD
  addEducation: (input: Partial<CreateEducationInput>) => Promise<void>;
  updateEducationItem: (id: string, updates: Partial<CreateEducationInput>) => Promise<void>;
  deleteEducationItem: (id: string) => Promise<void>;
  
  addExperience: (input: Partial<CreateExperienceInput>) => Promise<void>;
  updateExperienceItem: (id: string, updates: Partial<CreateExperienceInput>) => Promise<void>;
  deleteExperienceItem: (id: string) => Promise<void>;
  
  addSkill: (input: Partial<CreateSkillInput>) => Promise<void>;
  updateSkillItem: (id: string, updates: Partial<CreateSkillInput>) => Promise<void>;
  deleteSkillItem: (id: string) => Promise<void>;
  
  addProject: (input: Partial<CreateProjectInput>) => Promise<void>;
  updateProjectItem: (id: string, updates: Partial<CreateProjectInput>) => Promise<void>;
  deleteProjectItem: (id: string) => Promise<void>;
  
  addTraining: (input: Partial<CreateTrainingInput>) => Promise<void>;
  updateTrainingItem: (id: string, updates: Partial<CreateTrainingInput>) => Promise<{ success: boolean; data?: Training | null; error?: string | null }>;
  deleteTrainingItem: (id: string) => Promise<void>;
  
  addCertificate: (input: Partial<CreateCertificateInput>) => Promise<void>;
  updateCertificateItem: (id: string, updates: Partial<CreateCertificateInput>) => Promise<void>;
  deleteCertificateItem: (id: string) => Promise<void>;
  
  // Utilities
  refreshProfile: () => Promise<void>;
  setError: (error: string | null) => void;
}

// ==================== STORE IMPLEMENTATION ====================

export const useStudentStore = create<StudentState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      student: null,
      studentId: null,
      education: [],
      experience: [],
      skills: [],
      projects: [],
      trainings: [],
      certificates: [],
      
      isLoading: false,
      isLoadingProfile: false,
      isLoadingEducation: false,
      isLoadingExperience: false,
      isLoadingSkills: false,
      isLoadingProjects: false,
      isLoadingTrainings: false,
      isLoadingCertificates: false,
      
      error: null,
      hasStudent: false,
      isProfileComplete: false,
      
      // ==================== CORE STUDENT ACTIONS ====================
      
      loadStudentByUserId: async (userId) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          const result = await getStudentByUserId(userId);
          
          if (result.success && result.data) {
            set((state) => {
              state.student = result.data!;
              state.studentId = result.data!.id;
              state.hasStudent = true;
              state.isProfileComplete = !!(result.data!.name && result.data!.contact_number && result.data!.date_of_birth);
              state.isLoading = false;
            });
          } else {
            set((state) => {
              state.error = result.error || 'Student not found';
              state.isLoading = false;
            });
          }
        } catch (err: any) {
          set((state) => {
            state.error = err.message;
            state.isLoading = false;
          });
        }
      },
      
      loadStudentById: async (studentId) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          const result = await getStudentById(studentId);
          
          if (result.success && result.data) {
            set((state) => {
              state.student = result.data!;
              state.studentId = result.data!.id;
              state.hasStudent = true;
              state.isProfileComplete = !!(result.data!.name && result.data!.contact_number && result.data!.date_of_birth);
              state.isLoading = false;
            });
          } else {
            set((state) => {
              state.error = result.error || 'Student not found';
              state.isLoading = false;
            });
          }
        } catch (err: any) {
          set((state) => {
            state.error = err.message;
            state.isLoading = false;
          });
        }
      },
      
      loadFullProfile: async (studentId) => {
        set((state) => {
          state.isLoadingProfile = true;
          state.error = null;
        });
        
        try {
          const result = await getStudentProfile(studentId);
          
          if (result.success && result.data) {
            set((state) => {
              state.student = result.data!;
              state.studentId = result.data!.id;
              state.education = result.data!.education || [];
              state.experience = result.data!.experience || [];
              state.skills = result.data!.skills || [];
              state.projects = result.data!.projects || [];
              state.trainings = result.data!.trainings || [];
              state.certificates = result.data!.certificates || [];
              state.hasStudent = true;
              state.isProfileComplete = !!(result.data!.name && result.data!.contact_number && result.data!.date_of_birth);
              state.isLoadingProfile = false;
            });
          } else {
            set((state) => {
              state.error = result.error || 'Failed to load profile';
              state.isLoadingProfile = false;
            });
          }
        } catch (err: any) {
          set((state) => {
            state.error = err.message;
            state.isLoadingProfile = false;
          });
        }
      },
      
      updateStudentData: async (updates) => {
        const { studentId } = get();
        if (!studentId) {
          set((state) => {
            state.error = 'No student loaded';
          });
          return;
        }
        
        try {
          const result = await updateStudent(studentId, updates);
          
          if (result.success && result.data) {
            set((state) => {
              state.student = result.data!;
              state.hasStudent = true;
              state.isProfileComplete = !!(result.data!.name && result.data!.contact_number && result.data!.date_of_birth);
            });
          } else {
            set((state) => {
              state.error = result.error || 'Failed to update student';
            });
          }
        } catch (err: any) {
          set((state) => {
            state.error = err.message;
          });
        }
      },
      
      clearStudent: () => {
        set((state) => {
          state.student = null;
          state.studentId = null;
          state.education = [];
          state.experience = [];
          state.skills = [];
          state.projects = [];
          state.trainings = [];
          state.certificates = [];
          state.hasStudent = false;
          state.isProfileComplete = false;
          state.error = null;
        });
      },
      
      // ==================== RELATED ENTITY LOADERS ====================
      
      loadEducation: async (studentId) => {
        set((state) => {
          state.isLoadingEducation = true;
        });
        
        try {
          const result = await educationService.getEducationByStudentId(studentId);
          
          if (result.success) {
            set((state) => {
              state.education = result.data || [];
              state.isLoadingEducation = false;
            });
          } else {
            set((state) => {
              state.isLoadingEducation = false;
            });
          }
        } catch (err) {
          set((state) => {
            state.isLoadingEducation = false;
          });
        }
      },
      
      loadExperience: async (studentId) => {
        set((state) => {
          state.isLoadingExperience = true;
        });
        
        try {
          const result = await experienceService.getExperienceByStudentId(studentId);
          
          if (result.success) {
            set((state) => {
              state.experience = result.data || [];
              state.isLoadingExperience = false;
            });
          } else {
            set((state) => {
              state.isLoadingExperience = false;
            });
          }
        } catch (err) {
          set((state) => {
            state.isLoadingExperience = false;
          });
        }
      },
      
      loadSkills: async (studentId) => {
        set((state) => {
          state.isLoadingSkills = true;
        });
        
        try {
          const result = await skillsService.getSkillsByStudentId(studentId);
          
          if (result.success) {
            set((state) => {
              state.skills = result.data || [];
              state.isLoadingSkills = false;
            });
          } else {
            set((state) => {
              state.isLoadingSkills = false;
            });
          }
        } catch (err) {
          set((state) => {
            state.isLoadingSkills = false;
          });
        }
      },
      
      loadProjects: async (studentId) => {
        set((state) => {
          state.isLoadingProjects = true;
        });
        
        try {
          const result = await projectsService.getProjectsByStudentId(studentId);
          
          if (result.success) {
            set((state) => {
              state.projects = result.data || [];
              state.isLoadingProjects = false;
            });
          } else {
            set((state) => {
              state.isLoadingProjects = false;
            });
          }
        } catch (err) {
          set((state) => {
            state.isLoadingProjects = false;
          });
        }
      },
      
      loadTrainings: async (studentId) => {
        console.log('🔵 [studentStore] loadTrainings called', { studentId });
        
        set((state) => {
          state.isLoadingTrainings = true;
        });
        
        try {
          const result = await trainingsService.getTrainingsByStudentId(studentId);
          
          console.log('🔵 [studentStore] loadTrainings result', { success: result.success, count: result.data?.length, trainings: result.data });
          
          if (result.success) {
            set((state) => {
              state.trainings = result.data || [];
              state.isLoadingTrainings = false;
            });
          } else {
            console.error('🔴 [studentStore] loadTrainings failed', result.error);
            set((state) => {
              state.isLoadingTrainings = false;
            });
          }
        } catch (err) {
          console.error('🔴 [studentStore] loadTrainings error', err);
          set((state) => {
            state.isLoadingTrainings = false;
          });
        }
      },
      
      loadCertificates: async (studentId) => {
        set((state) => {
          state.isLoadingCertificates = true;
        });
        
        try {
          const result = await certificatesService.getCertificatesByStudentId(studentId);
          
          if (result.success) {
            set((state) => {
              state.certificates = result.data || [];
              state.isLoadingCertificates = false;
            });
          } else {
            set((state) => {
              state.isLoadingCertificates = false;
            });
          }
        } catch (err) {
          set((state) => {
            state.isLoadingCertificates = false;
          });
        }
      },
      
      // ==================== BULK UPDATE ACTIONS ====================
      
      updateEducationBulk: async (records) => {
        const { studentId } = get();
        if (!studentId) return { success: false, error: 'No student ID' };
        
        try {
          const result = await educationService.bulkUpsertEducation(studentId, records);
          if (result.success) {
            set((state) => {
              state.education = result.data || [];
            });
            return { success: true, data: result.data };
          }
          return { success: false, error: result.error };
        } catch (err) {
          console.error('Failed to bulk update education', err);
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      },
      
      updateExperienceBulk: async (records) => {
        const { studentId } = get();
        if (!studentId) return { success: false, error: 'No student ID' };
        
        try {
          const result = await experienceService.bulkUpsertExperience(studentId, records);
          if (result.success) {
            set((state) => {
              state.experience = result.data || [];
            });
            return { success: true, data: result.data };
          }
          return { success: false, error: result.error };
        } catch (err) {
          console.error('Failed to bulk update experience', err);
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      },
      
      updateSkillsBulk: async (records) => {
        const { studentId } = get();
        if (!studentId) return { success: false, error: 'No student ID' };
        
        try {
          const result = await skillsService.bulkUpsertSkills(studentId, records);
          if (result.success) {
            set((state) => {
              state.skills = result.data || [];
            });
            return { success: true, data: result.data };
          }
          return { success: false, error: result.error };
        } catch (err) {
          console.error('Failed to bulk update skills', err);
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      },
      
      updateProjectsBulk: async (records) => {
        const { studentId } = get();
        if (!studentId) return { success: false, error: 'No student ID' };
        
        try {
          const result = await projectsService.bulkUpsertProjects(studentId, records);
          if (result.success) {
            set((state) => {
              state.projects = result.data || [];
            });
            return { success: true, data: result.data };
          }
          return { success: false, error: result.error };
        } catch (err) {
          console.error('Failed to bulk update projects', err);
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      },
      
      updateTrainingsBulk: async (records) => {
        const { studentId } = get();
        if (!studentId) return { success: false, error: 'No student ID' };
        
        try {
          const result = await trainingsService.bulkUpsertTrainings(studentId, records);
          if (result.success) {
            set((state) => {
              state.trainings = result.data || [];
            });
            return { success: true, data: result.data };
          }
          return { success: false, error: result.error };
        } catch (err) {
          console.error('Failed to bulk update trainings', err);
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      },
      
      updateCertificatesBulk: async (records) => {
        const { studentId } = get();
        if (!studentId) return { success: false, error: 'No student ID' };
        
        try {
          const result = await certificatesService.bulkUpsertCertificates(studentId, records);
          if (result.success) {
            set((state) => {
              state.certificates = result.data || [];
            });
            return { success: true, data: result.data };
          }
          return { success: false, error: result.error };
        } catch (err) {
          console.error('Failed to bulk update certificates', err);
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      },
      
      // ==================== SINGLE ENTITY CRUD ====================
      
      // Education
      addEducation: async (input) => {
        const { studentId } = get();
        if (!studentId) return;
        
        const result = await educationService.createEducation({ ...input, student_id: studentId });
        if (result.success) {
          await get().loadEducation(studentId);
        }
      },
      
      updateEducationItem: async (id, updates) => {
        const result = await educationService.updateEducation(id, updates);
        if (result.success && get().studentId) {
          await get().loadEducation(get().studentId!);
        }
      },
      
      deleteEducationItem: async (id) => {
        const result = await educationService.deleteEducation(id);
        if (result.success && get().studentId) {
          await get().loadEducation(get().studentId!);
        }
      },
      
      // Experience
      addExperience: async (input) => {
        const { studentId } = get();
        if (!studentId) return;
        
        const result = await experienceService.createExperience({ ...input, student_id: studentId });
        if (result.success) {
          await get().loadExperience(studentId);
        }
      },
      
      updateExperienceItem: async (id, updates) => {
        const result = await experienceService.updateExperience(id, updates);
        if (result.success && get().studentId) {
          await get().loadExperience(get().studentId!);
        }
      },
      
      deleteExperienceItem: async (id) => {
        const result = await experienceService.deleteExperience(id);
        if (result.success && get().studentId) {
          await get().loadExperience(get().studentId!);
        }
      },
      
      // Skills
      addSkill: async (input) => {
        const { studentId } = get();
        if (!studentId || !input.name) return;
        
        const result = await skillsService.createSkill({ ...input, student_id: studentId, name: input.name });
        if (result.success) {
          await get().loadSkills(studentId);
        }
      },
      
      updateSkillItem: async (id, updates) => {
        const result = await skillsService.updateSkill(id, updates);
        if (result.success && get().studentId) {
          await get().loadSkills(get().studentId!);
        }
      },
      
      deleteSkillItem: async (id) => {
        const result = await skillsService.deleteSkill(id);
        if (result.success && get().studentId) {
          await get().loadSkills(get().studentId!);
        }
      },
      
      // Projects
      addProject: async (input) => {
        const { studentId } = get();
        if (!studentId || !input.title) return;
        
        const result = await projectsService.createProject({ ...input, student_id: studentId, title: input.title });
        if (result.success) {
          await get().loadProjects(studentId);
        }
      },
      
      updateProjectItem: async (id, updates) => {
        const result = await projectsService.updateProject(id, updates);
        if (result.success && get().studentId) {
          await get().loadProjects(get().studentId!);
        }
      },
      
      deleteProjectItem: async (id) => {
        const result = await projectsService.deleteProject(id);
        if (result.success && get().studentId) {
          await get().loadProjects(get().studentId!);
        }
      },
      
      // Trainings
      addTraining: async (input) => {
        const { studentId } = get();
        if (!studentId || !input.title) return;
        
        const result = await trainingsService.createTraining({ ...input, student_id: studentId, title: input.title });
        if (result.success) {
          await get().loadTrainings(studentId);
        }
      },
      
      updateTrainingItem: async (id, updates) => {
        const result = await trainingsService.updateTraining(id, updates);
        if (result.success && get().studentId) {
          await get().loadTrainings(get().studentId!);
        }
        return result;
      },
      
      deleteTrainingItem: async (id) => {
        const result = await trainingsService.deleteTraining(id);
        if (result.success && get().studentId) {
          await get().loadTrainings(get().studentId!);
        }
      },
      
      // Certificates
      addCertificate: async (input) => {
        const { studentId } = get();
        if (!studentId || !input.title) return;
        
        const result = await certificatesService.createCertificate({ ...input, student_id: studentId, title: input.title });
        if (result.success) {
          await get().loadCertificates(studentId);
        }
      },
      
      updateCertificateItem: async (id, updates) => {
        const result = await certificatesService.updateCertificate(id, updates);
        if (result.success && get().studentId) {
          await get().loadCertificates(get().studentId!);
        }
      },
      
      deleteCertificateItem: async (id) => {
        const result = await certificatesService.deleteCertificate(id);
        if (result.success && get().studentId) {
          await get().loadCertificates(get().studentId!);
        }
      },
      
      // ==================== UTILITIES ====================
      
      refreshProfile: async () => {
        const { studentId } = get();
        if (studentId) {
          await get().loadFullProfile(studentId);
        }
      },
      
      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },
    })),
    { name: 'StudentStore' }
  )
);

// ==================== CONVENIENCE HOOKS ====================

export const useStudent = () => useStudentStore((state) => state.student);
export const useStudentId = () => useStudentStore((state) => state.studentId);
export const useStudentLoading = () => useStudentStore((state) => state.isLoading);
export const useStudentError = () => useStudentStore((state) => state.error);

export const useStudentEducation = () => useStudentStore((state) => state.education);
export const useStudentExperience = () => useStudentStore((state) => state.experience);
export const useStudentSkills = () => useStudentStore((state) => state.skills);
export const useStudentProjects = () => useStudentStore((state) => state.projects);
export const useStudentTrainings = () => useStudentStore((state) => state.trainings);
export const useStudentCertificates = () => useStudentStore((state) => state.certificates);

export const useStudentActions = () => ({
  loadStudentByUserId: useStudentStore((state) => state.loadStudentByUserId),
  loadStudentById: useStudentStore((state) => state.loadStudentById),
  loadFullProfile: useStudentStore((state) => state.loadFullProfile),
  updateStudentData: useStudentStore((state) => state.updateStudentData),
  clearStudent: useStudentStore((state) => state.clearStudent),
  refreshProfile: useStudentStore((state) => state.refreshProfile),
});

export const useStudentEntityActions = () => ({
  // Education
  addEducation: useStudentStore((state) => state.addEducation),
  updateEducationItem: useStudentStore((state) => state.updateEducationItem),
  deleteEducationItem: useStudentStore((state) => state.deleteEducationItem),
  updateEducationBulk: useStudentStore((state) => state.updateEducationBulk),
  
  // Experience
  addExperience: useStudentStore((state) => state.addExperience),
  updateExperienceItem: useStudentStore((state) => state.updateExperienceItem),
  deleteExperienceItem: useStudentStore((state) => state.deleteExperienceItem),
  updateExperienceBulk: useStudentStore((state) => state.updateExperienceBulk),
  
  // Skills
  addSkill: useStudentStore((state) => state.addSkill),
  updateSkillItem: useStudentStore((state) => state.updateSkillItem),
  deleteSkillItem: useStudentStore((state) => state.deleteSkillItem),
  updateSkillsBulk: useStudentStore((state) => state.updateSkillsBulk),
  
  // Projects
  addProject: useStudentStore((state) => state.addProject),
  updateProjectItem: useStudentStore((state) => state.updateProjectItem),
  deleteProjectItem: useStudentStore((state) => state.deleteProjectItem),
  updateProjectsBulk: useStudentStore((state) => state.updateProjectsBulk),
  
  // Trainings
  addTraining: useStudentStore((state) => state.addTraining),
  updateTrainingItem: useStudentStore((state) => state.updateTrainingItem),
  deleteTrainingItem: useStudentStore((state) => state.deleteTrainingItem),
  updateTrainingsBulk: useStudentStore((state) => state.updateTrainingsBulk),
  
  // Certificates
  addCertificate: useStudentStore((state) => state.addCertificate),
  updateCertificateItem: useStudentStore((state) => state.updateCertificateItem),
  deleteCertificateItem: useStudentStore((state) => state.deleteCertificateItem),
  updateCertificatesBulk: useStudentStore((state) => state.updateCertificatesBulk),
});

// Combined hook for full profile access
export const useStudentProfile = () => {
  const student = useStudent();
  const education = useStudentEducation();
  const experience = useStudentExperience();
  const skills = useStudentSkills();
  const projects = useStudentProjects();
  const trainings = useStudentTrainings();
  const certificates = useStudentCertificates();
  const isLoading = useStudentLoading();
  const error = useStudentError();
  
  return {
    student,
    education,
    experience,
    skills,
    projects,
    trainings,
    certificates,
    isLoading,
    error,
  };
};
