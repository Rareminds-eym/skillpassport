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
