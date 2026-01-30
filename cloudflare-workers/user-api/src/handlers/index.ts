/**
 * Handlers barrel export
 */

// School handlers
export { handleEducatorSignup, handleSchoolAdminSignup, handleStudentSignup } from './school';

// College handlers
export {
    handleCollegeAdminSignup,
    handleCollegeEducatorSignup,
    handleCollegeStudentSignup
} from './college';

// University handlers
export {
    handleUniversityAdminSignup,
    handleUniversityEducatorSignup,
    handleUniversityStudentSignup
} from './university';

// Recruiter handlers
export { handleRecruiterAdminSignup, handleRecruiterSignup } from './recruiter';

// Unified signup handler
export { handleUnifiedSignup } from './unified';

// Utility handlers
export {
    handleCheckCollegeCode, handleCheckCompanyCode,
    handleCheckEmail, handleCheckSchoolCode, handleCheckUniversityCode, handleGetColleges, handleGetCompanies, handleGetSchools, handleGetUniversities
} from './utility';

// Authenticated handlers
export { handleCreateCollegeStaff, handleCreateStudent, handleCreateTeacher, handleUpdateStudentDocuments } from './authenticated';

// Event handlers
export { handleCreateEventUser, handleSendInterviewReminder } from './events';

// Password handlers
export { handleResetPassword } from './password';

