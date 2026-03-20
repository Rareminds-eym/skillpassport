/**
 * User Entity - Model Layer Public API
 */

// Types
export type {
  User,
  UserRole,
  UserProfile,
  UserProfileExtended,
  UserDocument,
  UserActivity,
  UserPermissions,
  UserEntitlement,
  UserPresence,
  UserData,
  CreateUserData,
  UpdateUserData,
  BulkImportResult,
} from './types';

// Validation
export {
  isValidRole,
  isStudentRole,
  isEducatorRole,
  isAdminRole,
  isRecruiterRole,
  isLearnerRole,
  isValidEmail,
  isValidPassword,
  validatePasswordStrength,
  validateCreateUserData,
  validateUpdateUserData,
  validateUser,
} from './validation';

// Utils
export {
  getUserDisplayName,
  getUserInitials,
  mapRoleToWorkerAPI,
  getRoleDisplayName,
  getSpecificAdminRole,
  restoreUserFromStorage,
  filterUsersByRole,
  filterActiveUsers,
  searchUsers,
  isSameUser,
  sortUsersByName,
} from './utils';
