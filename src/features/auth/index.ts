/**
 * Auth Feature - Public API (SSO-only)
 *
 * All authentication is handled by the SSO Worker via @rareminds-eym/auth-client.
 * This barrel re-exports the public interface for consumers.
 */

// ============================================================================
// UI COMPONENTS (Import directly from '@/features/auth/ui' to prevent bundle bloat)

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
export { useIdentity } from './hooks/useIdentity';
export { useAuth } from './model';
export type { AuthContextType, AuthState } from './model';

// Convenience hooks from authStore
export {
  useAuthLoading,
  useErrorNotification, useIsAuthenticated, useSession, useUser,
  useUserRole
} from '@/shared/model/authStore';

// ============================================================================
// API (SSO stubs for backward compatibility)
// ============================================================================
export {
  checkAuthentication, checkEmailExists, checkUserRole, getCurrentAdmin, getCurrentUser, getUserRole, loginAdmin, loginLearner,
  loginRecruiter, logoutAdmin, resetPassword, sendOtp, sendPasswordResetOTP, sendPasswordResetOtp, signIn,
  signOut, signUpWithRole, updatePassword, updateUserMetadata, verifyOtp, verifyOTPAndResetPassword, verifyOtpAndResetPassword, type AuthResult,
  type User, type UserRole
} from './api';

// ============================================================================
// UTILITIES
// ============================================================================
export {
  getRouteForRole,
  isValidRouteForRole, redirectToRoleDashboard, resolveRouteRole,
  ssoLoginWithRoleCheck,
  type SsoLoginResult
} from './lib';

export {
  AUTH_ERROR_CODES, buildErrorResponse,
  buildSuccessResponse, generateCorrelationId, handleAuthError, isJwtExpiryError, logAuthEvent,
  mapSupabaseError, validateCredentials, validateEmail,
  validatePassword, withRetry,
  withTimeout,
  type AuthError,
  type AuthErrorCode
} from './lib';

