/**
 * Auth API Public Exports (SSO-only)
 *
 * Legacy Supabase auth services have been removed.
 * All authentication goes through @rareminds-eym/auth-client via ssoClient.
 */

// Types (kept for backward compatibility with consumers)
export type UserRole =
  | 'learner'
  | 'recruiter'
  | 'educator'
  | 'school_educator'
  | 'college_educator'
  | 'school_admin'
  | 'college_admin'
  | 'university_admin';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string };
}

export interface User {
  id: string;
  email?: string;
  role?: string;
}

// Auth Session Service (SSO adapter for backward compatibility)
export { authSessionService, getUser, getSession } from './authSessionService';

// OTP Service (deprecated — kept as no-op stubs for consumers that haven't migrated)
export const sendOtp = async () => ({ success: false, error: 'OTP is no longer supported. Use password login.' });
export const verifyOtp = async () => ({ success: false, error: 'OTP is no longer supported.' });
export const resendOtp = async () => ({ success: false, error: 'OTP is no longer supported.' });

// Legacy signIn/signOut stubs (consumers should use useAuthStore directly)
export const signIn = async (_email: string, _password: string): Promise<AuthResult> => {
  return { success: false, error: 'Use useAuthStore.getState().login(email, password) instead.' };
};

export const signOut = async (): Promise<void> => {
  const { useAuthStore } = await import('@/shared/model/authStore');
  await useAuthStore.getState().logout();
};

// Legacy role lookup stub
export const getUserRole = async (_userId: string, _email: string) => {
  const { useAuthStore } = await import('@/shared/model/authStore');
  const user = useAuthStore.getState().user;
  return {
    role: user?.role || null,
    roles: user?.roles || [],
    userData: user,
    allUserData: user ? [user] : [],
  };
};

// Legacy exports kept as no-ops
export const loginAdmin = async () => ({ success: false, error: 'Use SSO login' });
export const loginLearner = async () => ({ success: false, error: 'Use SSO login' });
export const loginRecruiter = async () => ({ success: false, error: 'Use SSO login' });
export const resetPassword = async () => ({ success: false, error: 'Use ssoClient.forgotPassword()' });
export const updatePassword = async () => ({ success: false, error: 'Use ssoClient.resetPassword()' });
export const sendPasswordResetOTP = async () => ({ success: false, error: 'Use ssoClient.forgotPassword()' });
export const verifyOTPAndResetPassword = async () => ({ success: false, error: 'Use ssoClient.resetPassword()' });
export const checkAuthentication = async () => ({ user: null, role: null, isAuthenticated: false });
export const signUpWithRole = async () => ({ success: false, error: 'Use ssoClient.signup/signupMember' });
export const checkUserRole = async () => null;
export const updateUserMetadata = async () => ({ success: false });
export const getCurrentUser = async () => null;
export const sendPasswordResetOtp = async () => ({ success: false });
export const verifyOtpAndResetPassword = async () => ({ success: false });
export const getCurrentAdmin = async () => null;
export const logoutAdmin = async () => { };
export const checkEmailExists = async () => false;
