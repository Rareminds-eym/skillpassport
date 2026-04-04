/**
 * User Entity - Public API
 * Central export point for all user entity functionality
 */

// Model exports
export { useUserRole } from './model/useUserRole';
export { useRoleResponsibilities } from './model/useRoleResponsibilities';
export { useRoleOverview } from './model/useRoleOverview';
export { useRequisitions } from './model/useRequisitions';
export { useRecruitmentFunnel } from './model/useRecruitmentFunnel';
export { useRecentUpdatesLegacy } from './model/useRecentUpdatesLegacy';
export { useRecentUpdates } from './model/useRecentUpdates';
export { useUsers } from './model/useUsers';
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
} from './model';

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
} from './model';

// API exports
export {
  getUsers,
  getUser,
  getCurrentUser,
  getUserProfile,
  getUserDocuments,
  getUserActivity,
  getUserStats,
  getUserRoleHistory,
  getBulkImportStatus,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  updateUserProfile,
  uploadDocument,
  verifyDocument,
  logActivity,
  resetUserPassword,
  updatePassword,
  bulkImportUsers,
} from './api';

// UI exports
export { UserAvatar, UserCard } from './ui';
export { default as userApiService } from './api/userApiService';
