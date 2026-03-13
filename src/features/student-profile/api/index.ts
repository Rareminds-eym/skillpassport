/**
 * Student Profile API - Public Exports
 * Consolidated student services following FSD architecture
 */

// Re-export from existing services until migration is complete
export { 
  getStudentByEmail,
  getStudentById,
  updateEducationByEmail,
  updateTrainingByEmail,
  updateExperienceByEmail,
  updateTechnicalSkillsByEmail,
  updateSoftSkillsByEmail,
  updateProjectsByEmail,
  updateCertificatesByEmail,
  updateStudentByEmail,
  updateSingleTrainingById
} from '@/services/studentService';

export {
  getStudentSettingsByEmail,
  updateStudentSettings,
  updateStudentPassword
} from '@/services/studentSettingsService';

// Specialized services
export * from './studentDocumentService';
export * from './studentManagementService';
export * from './studentEnrollmentService';
export * from './studentExamService';
export { default as studentActivityService } from './studentActivityService';
export { getStudentRecentActivity } from './studentActivityService';
export { default as studentNotificationService } from './studentNotificationService';
export { default as studentPipelineService } from './studentPipelineService';
export * from './studentClassService';
export { default as studentSettingsService } from './studentSettingsService';
