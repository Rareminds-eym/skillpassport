/**
 * User Entity - API Layer Public API
 */

// Queries
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
} from './queries';

// Mutations
export {
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  updateUserProfile,
  verifyDocument,
  logActivity,
  resetUserPassword,
  updatePassword,
} from './mutations';

// Services
export * from './permissionService';
export * from './roleLookupService';
export * from './userApiService';
export * from './userManagementService';
export * from './userSettingsService';
