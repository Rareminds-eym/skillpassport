/**
 * Student Profile API - Public Exports
 * Consolidated student services following FSD architecture
 */

// Student data operations
export {
  getCompleteStudentData,
  updateStudentProfile,
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
} from './studentDataService';

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
  updateSingleTrainingById,
  updateStudent,
  softDeleteStudent
} from '@/entities/student';

export {
  getStudentSettingsByEmail,
  updateStudentSettings,
  updateStudentPassword
} from '@/entities/student';

// Specialized services
export * from './studentDocumentService';
export * from './studentManagementService';
export * from './studentEnrollmentService';
export * from './studentExamService';
export { 
  addCourseEnrollmentActivity,
  notifyAllStudentsNewCourse,
  getStudentRecentActivity,
  logProfileUpdate
} from './studentActivityService';
export { default as studentNotificationService } from './studentNotificationService';
export { default as studentPipelineService } from './studentPipelineService';
export * from './studentClassService';
export * from './profileValidationService';
export * from './studentsService';
