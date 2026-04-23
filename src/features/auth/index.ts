/**
 * Auth Feature - Public API
 * 
 * This is the main entry point for the auth feature.
 * External modules should import from this file rather than directly from subdirectories.
 * 
 * @example
 * ```typescript
 * import { UnifiedLogin, useAuth, signIn, handleAuthError } from '@/features/auth';
 * ```
 */

// ============================================================================
// UI COMPONENTS (Primary Auth Flows)
// ============================================================================
export {
  UnifiedLogin,
  UnifiedSignup,
  UnifiedForgotPassword,
  PasswordReset,
  ResetPassword,
  TokenPasswordReset
} from './ui';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
export {
  AuthProvider,
  useAuth,
  type AuthState,
  type AuthContextType
} from './model';

// Convenience hooks from authStore
export { 
  useUser,
  useUserRole,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useErrorNotification
} from '@/shared/model/authStore';

// ============================================================================
// API SERVICES (Commonly Used)
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
  type UserRole,
  type AuthResult,
  type User
} from './api';

// ============================================================================
// UTILITIES (Commonly Used)
// ============================================================================
export {
  handleAuthError,
  redirectToRoleDashboard,
  getRouteForRole,
  type AuthError,
  type AuthErrorCode
} from './lib';

// ============================================================================
// TYPES
// ============================================================================
export type { UserRole as Role } from './api';
export type { AuthState as State, AuthContextType as Context } from './model';

/**
 * For advanced usage or internal components, you can import directly from subdirectories:
 * 
 * @example
 * ```typescript
 * // Role-specific login components
 * import { LoginAdmin, LoginStudent } from '@/features/auth/ui';
 * 
 * // Additional auth services
 * import { checkAuthentication, getCurrentUser } from '@/features/auth/api';
 * 
 * // Additional utilities
 * import { TokenMonitor, validateEmail } from '@/features/auth/lib';
 * ```
 */

// API & Data Access
export * from './api';
export { authSessionService } from './api/authSessionService';

export { getGlobalRefreshCoordinator } from './lib/refreshCoordinator';

export { withTimeout } from './lib/authErrorHandler';

export { AUTH_ERROR_CODES } from './lib/authErrorHandler';

export { getGlobalTokenRefreshErrorHandler } from './lib/tokenRefreshErrorHandler';

export { logAuthEvent } from './lib/authErrorHandler';

export { buildErrorResponse } from './lib/authErrorHandler';

export type { RefreshResult } from './lib/refreshCoordinator';

export { checkAuthentication } from './api/authService';

export { validateEmail } from './lib/authErrorHandler';

export { getGlobalTokenMonitor } from './lib/tokenMonitor';

export { validateCredentials } from './lib/authErrorHandler';

export { mapSupabaseError } from './lib/authErrorHandler';

export { RefreshCoordinator } from './lib/refreshCoordinator';

export { TokenMonitor } from './lib/tokenMonitor';

export { isJwtExpiryError } from './lib/authErrorHandler';

export { generateCorrelationId } from './lib/authErrorHandler';

export { withRetry } from './lib/authErrorHandler';
