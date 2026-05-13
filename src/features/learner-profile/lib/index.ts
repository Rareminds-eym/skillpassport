/**
 * Learner Profile Library
 * 
 * Exports utility functions for profile validation, completion tracking, and export
 */

// Profile Validation
export {
  validateEmail,
  validatePhone,
  validateDateOfBirth,
  validateCGPA,
  validateURL,
  validateBasicProfile,
  validateSchoolProfile,
  validateCollegeProfile,
  validateSocialLinks,
  validatelearnerProfile,
  type ValidationResult,
  type FieldValidationResult
} from './profileValidation';

// Profile Completion
export {
  calculateProfileCompletion,
  getProfileCompletionStatus,
  getNextRecommendedFields,
  type ProfileCompletionResult
} from './profileCompletion';

// Profile Export
export {
  prepareExportData,
  exportAsJSON,
  downloadAsJSON,
  generateHTMLForPDF,
  exportAsPDF,
  type ExportOptions,
  type ExportData
} from './profileExport';
