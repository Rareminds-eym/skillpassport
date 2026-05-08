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
  islearnerRole,
  isEducatorRole,
  isAdminRole,
  isRecruiterRole,
  isLearnerRole,
  isValidPassword,
  validatePasswordStrength,
  validateCreateUserData,
  validateUpdateUserData,
  validateUser,
} from './validation';

// Re-export from shared lib
export { isValidEmail } from '@/shared/lib/validation';

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
