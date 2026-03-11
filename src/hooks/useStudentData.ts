/**
 * useStudentData - Modern Zustand-based student data hook
 * 
 * Replaces useStudentDataByEmail with clean ID-based architecture
 * Integrates with authStore for automatic user_id → student_id mapping
 * 
 * Usage:
 *   const { student, education, skills, isLoading } = useStudentData();
 *   const { updateStudentData, addEducation } = useStudentData();
 */

import { useEffect } from 'react';
import { useUser } from '../stores';
import {
  useStudent,
  useStudentId,
  useStudentLoading,
  useStudentError,
  useStudentEducation,
  useStudentExperience,
  useStudentSkills,
  useStudentProjects,
  useStudentTrainings,
  useStudentCertificates,
  useStudentActions,
  useStudentEntityActions,
  useStudentStore,
} from '../stores/studentStore';

export function useStudentData(options?: { loadRelated?: boolean }) {
  const user = useUser();
  const { loadStudentByUserId } = useStudentActions();
  const studentId = useStudentId();
  
  // Auto-load student data when user is available
  useEffect(() => {
    if (user?.id) {
      const currentStudentId = useStudentStore.getState().studentId;
      
      // Only load if not already loaded for this user
      if (!currentStudentId) {
        loadStudentByUserId(user.id);
      }
    }
  }, [user?.id, loadStudentByUserId]);
  
  // Auto-load related entities when studentId becomes available
  useEffect(() => {
    if (options?.loadRelated && studentId) {
      const store = useStudentStore.getState();
      
      // Check if already loaded to avoid redundant calls
      const hasData = store.education.length > 0 || 
                      store.experience.length > 0 || 
                      store.skills.length > 0;
      
      if (!hasData) {
        store.loadEducation(studentId);
        store.loadExperience(studentId);
        store.loadSkills(studentId);
        store.loadProjects(studentId);
        store.loadTrainings(studentId);
        store.loadCertificates(studentId);
      }
    }
  }, [studentId, options?.loadRelated]);
  
  // Return all student data and actions
  return {
    // Core data
    student: useStudent(),
    studentId: useStudentId(),
    
    // Related entities
    education: useStudentEducation(),
    experience: useStudentExperience(),
    skills: useStudentSkills(),
    projects: useStudentProjects(),
    trainings: useStudentTrainings(),
    certificates: useStudentCertificates(),
    
    // Loading states
    isLoading: useStudentLoading(),
    error: useStudentError(),
    
    // Actions
    ...useStudentActions(),
    ...useStudentEntityActions(),
  };
}

/**
 * Hook for loading full profile with all related entities
 */
export function useStudentFullProfile() {
  const user = useUser();
  const { loadFullProfile } = useStudentActions();
  const studentId = useStudentId();
  
  useEffect(() => {
    if (user?.id && !studentId) {
      // First load student to get student_id
      useStudentStore.getState().loadStudentByUserId(user.id).then(() => {
        const sid = useStudentStore.getState().studentId;
        if (sid) {
          loadFullProfile(sid);
        }
      });
    } else if (studentId) {
      loadFullProfile(studentId);
    }
  }, [user?.id, studentId, loadFullProfile]);
  
  return {
    student: useStudent(),
    education: useStudentEducation(),
    experience: useStudentExperience(),
    skills: useStudentSkills(),
    projects: useStudentProjects(),
    trainings: useStudentTrainings(),
    certificates: useStudentCertificates(),
    isLoading: useStudentStore((state) => state.isLoadingProfile),
    error: useStudentError(),
  };
}

/**
 * Hook for specific entity data only
 */
export function useStudentEntity<T extends 'education' | 'experience' | 'skills' | 'projects' | 'trainings' | 'certificates'>(
  entityType: T
) {
  const studentId = useStudentId();
  const store = useStudentStore();
  
  useEffect(() => {
    if (studentId) {
      switch (entityType) {
        case 'education':
          store.loadEducation(studentId);
          break;
        case 'experience':
          store.loadExperience(studentId);
          break;
        case 'skills':
          store.loadSkills(studentId);
          break;
        case 'projects':
          store.loadProjects(studentId);
          break;
        case 'trainings':
          store.loadTrainings(studentId);
          break;
        case 'certificates':
          store.loadCertificates(studentId);
          break;
      }
    }
  }, [studentId, entityType, store]);
  
  return {
    data: useStudentStore((state) => state[entityType]),
    isLoading: useStudentStore((state) => {
      const loadingKey = `isLoading${entityType.charAt(0).toUpperCase() + entityType.slice(1)}` as keyof typeof state;
      return state[loadingKey] as boolean;
    }),
  };
}
