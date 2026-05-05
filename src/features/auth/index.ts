/**
 * Auth Feature - Public API (SSO-only)
 *
 * All authentication is handled by the SSO Worker via @rareminds-eym/auth-client.
 * This barrel re-exports the public interface for consumers.
 */

// ============================================================================
// UI COMPONENTS
// ============================================================================
export {
  UnifiedLogin,
  UnifiedSignup,
  UnifiedForgotPassword,
  PasswordReset,
  ResetPassword,
  TokenPasswordReset,
  LoginAdmin,
  LoginStudent,
  LoginEducator,
  LoginRecruiter,
} from './ui';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
export { useAuth } from './model';
export type { AuthState, AuthContextType } from './model';

// Convenience hooks from authStore
export {
  useUser,
  useUserRole,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useErrorNotification,
} from '@/shared/model/authStore';

// ============================================================================
// API (SSO stubs for backward compatibility)
// ============================================================================
export {
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  sendPasswordResetOTP,
  verifyOTPAndResetPassword,
  loginAdmin,
  sendOtp,
  verifyOtp,
  getUserRole,
  loginStudent,
  loginRecruiter,
  authSessionService,
  checkAuthentication,
  signUpWithRole,
  checkUserRole,
  updateUserMetadata,
  getCurrentUser,
  sendPasswordResetOtp,
  verifyOtpAndResetPassword,
  getCurrentAdmin,
  logoutAdmin,
  checkEmailExists,
  type UserRole,
  type AuthResult,
  type User,
} from './api';

// ============================================================================
// UTILITIES
// ============================================================================
export {
  redirectToRoleDashboard,
  getRouteForRole,
  isValidRouteForRole,
  ssoLoginWithRoleCheck,
  type SsoLoginResult,
} from './lib';

export {
  handleAuthError,
  AUTH_ERROR_CODES,
  validateEmail,
  validatePassword,
  validateCredentials,
  generateCorrelationId,
  logAuthEvent,
  mapSupabaseError,
  buildErrorResponse,
  buildSuccessResponse,
  isJwtExpiryError,
  withRetry,
  withTimeout,
  type AuthError,
  type AuthErrorCode,
} from './lib';
