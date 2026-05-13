/**
 * Auth Lib Public Exports (SSO-only)
 */

// Auth Error Handler (still useful for validation utilities)
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

// SSO Login Helper
export { ssoLoginWithRoleCheck, type SsoLoginResult } from './ssoLogin';
