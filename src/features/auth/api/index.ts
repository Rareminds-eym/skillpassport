/**
 * Auth API Public Exports
 * Centralized exports for all authentication services
 */

// UNIFIED AUTH SERVICE (Primary)
export { 
  signIn, 
  signOut, 
  resetPassword,
  updatePassword,
  sendPasswordResetOTP,
  verifyOTPAndResetPassword,
  type UserRole,
  type AuthResult,
  type User
} from './unifiedAuthService';

// ADMIN AUTH SERVICE
export { 
  loginAdmin,
  getCurrentAdmin,
  logoutAdmin
} from './adminAuthService';

// OTP SERVICE
export { 
  sendOtp, 
  verifyOtp,
  resendOtp
} from './otpService';

// PASSWORD RESET SERVICE
export { 
  sendPasswordResetOTP as sendPasswordResetOTPDirect,
  verifyOTPAndResetPassword as verifyOTPAndResetPasswordDirect,
  checkEmailExists
} from './passwordResetService';

// LEGACY AUTH SERVICE (Backward Compatibility)
export { 
  checkAuthentication,
  signUpWithRole,
  signIn as legacySignIn,
  signOut as legacySignOut,
  checkUserRole,
  updateUserMetadata,
  getCurrentUser,
  sendPasswordResetOtp,
  verifyOtpAndResetPassword
} from './authService';

// ROLE-SPECIFIC AUTH (Re-exports from wrapper services)
export { getUserRole } from './roleLookupService';
export { loginStudent } from './studentAuthService';
export { loginRecruiter } from './recruiterAuthService';

// USER API SERVICE (Default export for backward compatibility)
export { default as default } from './userApiService';
export * from './adminAuthService';
export * from './authService';
export * from './otpService';
export * from './passwordResetService';
export * from './studentAuthService';
export * from './unifiedAuthService';

// AUTH SESSION SERVICE (Session and user management)
export * from './authSessionService';
