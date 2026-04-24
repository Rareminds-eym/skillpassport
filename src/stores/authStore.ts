import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { secureStorage } from '@/shared/lib/secureStorage';
import {
  ssoClient,
  ssoSignIn,
  ssoSignOut,
  ssoGetMe,
  ssoInitSession,
  ssoForgotPassword,
  ssoResetPassword,
} from '@/features/auth/api/ssoAuthService';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorNotification {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  user_metadata?: any;
  isDemoMode?: boolean;
}

// Session type kept for backward compatibility with exports
export interface Session {
  access_token: string;
  refresh_token?: string;
  user: any;
  expires_at?: number;
}

// ============================================================================
// ROLE HELPERS
// ============================================================================

const isStudentRole = (role: string | null | undefined): boolean =>
  role === 'student' || role === 'school_student' || role === 'college_student';

const isEducatorRole = (role: string | null | undefined): boolean =>
  role === 'educator' || role === 'school_educator' || role === 'college_educator';

const isAdminRole = (role: string | null | undefined): boolean =>
  role === 'admin' ||
  role === 'school_admin' ||
  role === 'college_admin' ||
  role === 'university_admin';

const isRecruiterRole = (role: string | null | undefined): boolean =>
  role === 'recruiter' || role === 'hr';

const isLearnerRole = (role: string | null | undefined): boolean =>
  role === 'learner';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface AuthState {
  // User data
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Role helpers
  role: string | null;
  isStudent: boolean;
  isEducator: boolean;
  isAdmin: boolean;
  isRecruiter: boolean;
  isLearner: boolean;

  // Error notifications
  errorNotification: ErrorNotification | null;

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;

  // Error notification actions
  showErrorNotification: (notification: ErrorNotification) => void;
  dismissErrorNotification: () => void;

  // Session management
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

// ============================================================================
// STORE
// ============================================================================

// Module-level variable to store the unsubscribe function for auth state listener
// This prevents duplicate listener registration when initialize() is called multiple times
let authStateUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>()(
  immer(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        loading: true,
        isAuthenticated: false,
        role: null,
        isStudent: false,
        isEducator: false,
        isAdmin: false,
        isRecruiter: false,
        isLearner: false,
        errorNotification: null,

        // Initialize — called on app load via initializeStores()
        // Checks for existing SSO refresh cookie and restores session silently
        initialize: async () => {
          set((state) => { state.loading = true; });

          try {
            const result = await ssoInitSession();

            if (result.authenticated && result.user) {
              const u = result.user;
              set((state) => {
                state.user = { id: u.id, email: u.email, role: u.role };
                state.isAuthenticated = true;
                state.role = u.role;
                state.isStudent = isStudentRole(u.role);
                state.isEducator = isEducatorRole(u.role);
                state.isAdmin = isAdminRole(u.role);
                state.isRecruiter = isRecruiterRole(u.role);
                state.isLearner = isLearnerRole(u.role);
                state.loading = false;
              });
            } else {
              set((state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.role = null;
                state.isStudent = false;
                state.isEducator = false;
                state.isAdmin = false;
                state.isRecruiter = false;
                state.isLearner = false;
                state.loading = false;
              });
            }
          } catch {
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.loading = false;
            });
          }

          // Unsubscribe previous listener if it exists to prevent duplicates
          if (authStateUnsubscribe) {
            authStateUnsubscribe();
          }

          // Listen for auth state changes from auth-client (multi-tab sync)
          authStateUnsubscribe = ssoClient.onAuthStateChange(async (event) => {
            if (event === 'LOGOUT') {
              set((state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.role = null;
                state.isStudent = false;
                state.isEducator = false;
                state.isAdmin = false;
                state.isRecruiter = false;
                state.isLearner = false;
              });
            }
            if (event === 'LOGIN' || event === 'REFRESH') {
              await get().refreshUser();
            }
          });
        },

        // Login — called by UnifiedLogin on form submit
        login: async (email: string, password: string) => {
          try {
            const signInResult = await ssoSignIn(email, password);
            if (!signInResult.success) {
              return { success: false, error: signInResult.error || 'Login failed' };
            }

            const meResult = await ssoGetMe();
            if (!meResult.success || !meResult.user) {
              return { success: false, error: 'Failed to get user info' };
            }

            const u = meResult.user;
            set((state) => {
              state.user = { id: u.id, email: u.email, role: u.role };
              state.isAuthenticated = true;
              state.role = u.role;
              state.isStudent = isStudentRole(u.role);
              state.isEducator = isEducatorRole(u.role);
              state.isAdmin = isAdminRole(u.role);
              state.isRecruiter = isRecruiterRole(u.role);
              state.isLearner = isLearnerRole(u.role);
              state.loading = false;
            });

            return { success: true, role: u.role };
          } catch (error: any) {
            return { success: false, error: error.message || 'Something went wrong' };
          }
        },

        // Logout — clears store and revokes SSO session
        logout: async () => {
          await ssoSignOut();
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.role = null;
            state.isStudent = false;
            state.isEducator = false;
            state.isAdmin = false;
            state.isRecruiter = false;
            state.isLearner = false;
          });
        },

        // Refresh user — re-fetches user from SSO server
        refreshUser: async () => {
          const result = await ssoGetMe();
          if (result.success && result.user) {
            const u = result.user;
            set((state) => {
              state.user = { id: u.id, email: u.email, role: u.role };
              state.isAuthenticated = true;
              state.role = u.role;
              state.isStudent = isStudentRole(u.role);
              state.isEducator = isEducatorRole(u.role);
              state.isAdmin = isAdminRole(u.role);
              state.isRecruiter = isRecruiterRole(u.role);
              state.isLearner = isLearnerRole(u.role);
            });
          } else {
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.role = null;
              state.isStudent = false;
              state.isEducator = false;
              state.isAdmin = false;
              state.isRecruiter = false;
              state.isLearner = false;
            });
          }
        },

        // Update user — merges partial user data into store
        updateUser: (userData) => {
          set((state) => {
            if (state.user) {
              state.user = { ...state.user, ...userData };
              if (userData.role) {
                state.role = userData.role;
                state.isStudent = isStudentRole(userData.role);
                state.isEducator = isEducatorRole(userData.role);
                state.isAdmin = isAdminRole(userData.role);
                state.isRecruiter = isRecruiterRole(userData.role);
                state.isLearner = isLearnerRole(userData.role);
              }
            }
          });
        },

        // Set user directly
        setUser: (user) => {
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
            state.role = user?.role || null;
            state.isStudent = isStudentRole(user?.role || null);
            state.isEducator = isEducatorRole(user?.role || null);
            state.isAdmin = isAdminRole(user?.role || null);
            state.isRecruiter = isRecruiterRole(user?.role || null);
            state.isLearner = isLearnerRole(user?.role || null);
          });
        },

        // Set loading
        setLoading: (loading) => {
          set((state) => { state.loading = loading; });
        },

        // Forgot password
        forgotPassword: async (email: string) => {
          return await ssoForgotPassword(email);
        },

        // Reset password
        resetPassword: async (token: string, password: string) => {
          return await ssoResetPassword(token, password);
        },

        // Error notifications
        showErrorNotification: (notification) => {
          set((state) => { state.errorNotification = notification; });
        },

        dismissErrorNotification: () => {
          set((state) => { state.errorNotification = null; });
        },
      }),
      {
        name: 'auth-storage',
        storage: secureStorage as any,
        partialize: (state) => ({
          user: state.user,
          role: state.role,
        }),
      }
    )
  )
);

// ============================================================================
// CONVENIENCE HOOKS — kept identical so all existing imports still work
// ============================================================================

export const useUser = () => useAuthStore((state) => state.user);
// useSession kept as null-returning stub so existing imports don't break
export const useSession = () => null;
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useErrorNotification = () => useAuthStore((state) => state.errorNotification);

export const useUserRole = () => {
  const role = useAuthStore((state) => state.role);
  const isStudent = useAuthStore((state) => state.isStudent);
  const isEducator = useAuthStore((state) => state.isEducator);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const isRecruiter = useAuthStore((state) => state.isRecruiter);
  const isLearner = useAuthStore((state) => state.isLearner);
  return { role, isStudent, isEducator, isAdmin, isRecruiter, isLearner };
};

export const useAuthActions = () => {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const initialize = useAuthStore((state) => state.initialize);
  const showErrorNotification = useAuthStore((state) => state.showErrorNotification);
  const dismissErrorNotification = useAuthStore((state) => state.dismissErrorNotification);

  return {
    login,
    logout,
    updateUser,
    initialize,
    showErrorNotification,
    dismissErrorNotification,
  };
};

export const useTokenRefreshErrorNotification = () => {
  const showErrorNotification = useAuthStore((state) => state.showErrorNotification);
  const dismissErrorNotification = useAuthStore((state) => state.dismissErrorNotification);
  return { showErrorNotification, dismissErrorNotification };
};

export default useAuthStore;
