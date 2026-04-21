// Auth Cleanup Utilities
export {
  clearPendingUserData,
  clearStaleAuthData,
  userExistsInDatabase,
  validateLocalStorageUser,
} from './authCleanup';

// Auth Error Handler
export {
  AUTH_ERROR_CODES,
  AuthError,
  buildErrorResponse,
  buildSuccessResponse,
  generateCorrelationId,
  handleAuthError,
  isJwtExpiryError,
  logAuthEvent,
  mapSupabaseError,
  validateCredentials,
  validateEmail,
  validatePassword,
  withRetry,
  withTimeout,
  type AuthErrorCode,
} from './authErrorHandler';

// Role-Based Router
export {
  getRouteForRole,
  isValidRouteForRole,
  redirectToRoleDashboard,
} from './roleBasedRouter';

// Token Monitor
export {
  getGlobalTokenMonitor,
  resetGlobalTokenMonitor,
  TokenMonitor,
  type TokenInfo,
  type TokenMonitorConfig,
} from './tokenMonitor';
