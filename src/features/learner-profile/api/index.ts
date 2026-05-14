/**
 * Learner Profile API - Public Exports
 * Consolidated learner services following FSD architecture
 */

// Learner data operations - re-exported from entities layer
export {
  getCompleteLearnerData,
  updateLearnerProfile,
  addEducation,
  updateEducation,
  deleteEducation,
  addTraining,
  updateTraining,
  deleteTraining,
  addExperience,
  updateExperience,
  deleteExperience,
  addTechnicalSkill,
  updateTechnicalSkill,
  deleteTechnicalSkill,
  addSoftSkill,
  updateSoftSkill,
  deleteSoftSkill
} from '@/entities/learner/api';

// Re-export from existing services until migration is complete
export {
  getlearnerByEmail,
  getlearnerById,
  updateEducationByEmail,
  updateTrainingByEmail,
  updateExperienceByEmail,
  updateTechnicalSkillsByEmail,
  updateSoftSkillsByEmail,
  updateProjectsByEmail,
  updateCertificatesByEmail,
  updatelearnerByEmail,
  updateSingleTrainingById,
  updateLearner,
  softDeleteLearner
} from '@/entities/learner';

export {
  getlearnerSettingsByEmail,
  updatelearnerSettings,
  updatelearnerPassword
} from '@/entities/learner';

// Specialized services
export * from './learnerDocumentService';
export * from './learnerManagementService';
export * from './learnerEnrollmentService';
export * from './learnerExamService';
export * from './learnerDashboardService';
export {
  addCourseEnrollmentActivity,
  notifyAlllearnersNewCourse,
  getlearnerRecentActivity,
  logProfileUpdate
} from '../../../shared/api/learnerActivityService';
export { default as learnerNotificationService } from './learnerNotificationService';
export { default as learnerPipelineService } from './learnerPipelineService';
export * from './learnerClassService';
export * from './profileValidationService';
export * from './learnersService';
