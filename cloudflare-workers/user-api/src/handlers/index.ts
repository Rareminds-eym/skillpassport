/**
 * Handlers barrel export
 */

// School handlers
export { handleSchoolAdminSignup, handleEducatorSignup, handleStudentSignup } from './school';

// College handlers
export {
  handleCollegeAdminSignup,
  handleCollegeEducatorSignup,
  handleCollegeStudentSignup,
} from './college';

// University handlers
export {
  handleUniversityAdminSignup,
  handleUniversityEducatorSignup,
  handleUniversityStudentSignup,
} from './university';

// Recruiter handlers
export { handleRecruiterAdminSignup, handleRecruiterSignup } from './recruiter';

// Utility handlers
export {
  handleGetSchools,
  handleGetColleges,
  handleGetUniversities,
  handleGetCompanies,
  handleCheckSchoolCode,
  handleCheckCollegeCode,
  handleCheckUniversityCode,
  handleCheckCompanyCode,
  handleCheckEmail,
} from './utility';

// Authenticated handlers
export { handleCreateStudent, handleCreateTeacher, handleUpdateStudentDocuments } from './authenticated';

// Event handlers
export { handleCreateEventUser, handleSendInterviewReminder } from './events';

// Password handlers
export { handleResetPassword } from './password';
