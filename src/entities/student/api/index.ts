/**
 * Student Entity - API Layer Public API
 */

export * from './studentActivityService';
export * from './studentClassService';
export * from './studentEnrollmentService';
export * from './studentExamService';
export * from './studentManagementService';
export * from './studentService';
export * from './studentSettingsService';

// Student profile CRUD operations (entity-level operations on student data)
// Re-exported from feature's studentDataService so entity hooks don't import from features
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
} from '@/features/student-profile/api/studentDataService';
