import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../lib/supabaseClient';
import { secureStorage } from '../lib/secureStorage';

// Types
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

export interface Session {
  access_token: string;
  refresh_token?: string;
  user: any;
  expires_at?: number;
}

interface AuthState {
  // User data
  user: User | null;
  session: Session | null;
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
  login: (userData: User, sessionData?: Session) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Error notification actions
  showErrorNotification: (notification: ErrorNotification) => void;
  dismissErrorNotification: () => void;
  
  // Session management
  initialize: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkSessionValidity: () => Promise<Session | null>;
  
  // Utilities
  restoreUserFromStorage: (sessionUser: any) => User;
}

// Role checks
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

// Helper to get specific admin role from storage
const getSpecificAdminRole = (sessionUser: any, storedUser: User | null): string => {
  const sessionRole = sessionUser.user_metadata?.user_role || 
                      sessionUser.user_metadata?.role || 
                      'user';
  
  // Handle legacy "admin" role
  if (sessionRole === 'admin' && storedUser?.role) {
    const specificRoles = ['school_admin', 'college_admin', 'university_admin'];
    if (specificRoles.includes(storedUser.role)) {
      return storedUser.role;
    }
  }
  
  return sessionRole;
};

export const useAuthStore = create<AuthState>()(
  immer(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        loading: true,
        isAuthenticated: false,
        role: null,
        isStudent: false,
        isEducator: false,
        isAdmin: false,
        isRecruiter: false,
        isLearner: false,
        errorNotification: null,

        // Login
        login: (userData, sessionData) => {
          set((state) => {
            state.user = { ...state.user, ...userData };
            if (sessionData) {
              state.session = sessionData;
            }
            state.isAuthenticated = true;
            state.role = userData.role || null;
            state.isStudent = isStudentRole(userData.role);
            state.isEducator = isEducatorRole(userData.role);
            state.isAdmin = isAdminRole(userData.role);
            state.isRecruiter = isRecruiterRole(userData.role);
            state.isLearner = isLearnerRole(userData.role);
          });
          
          // Persist to localStorage (legacy compatibility)
          localStorage.setItem('user', JSON.stringify(userData));
          if (userData.email) {
            localStorage.setItem('userEmail', userData.email);
          }
        },

        // Logout
        logout: async () => {
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.error('Error signing out:', err);
          }
          
          set((state) => {
            state.user = null;
            state.session = null;
            state.isAuthenticated = false;
            state.role = null;
            state.isStudent = false;
            state.isEducator = false;
            state.isAdmin = false;
            state.isRecruiter = false;
            state.isLearner = false;
          });
          
          localStorage.removeItem('user');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('pendingUser');
        },

        // Update user
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
              localStorage.setItem('user', JSON.stringify(state.user));
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

        // Set session
        setSession: (session) => {
          set((state) => {
            state.session = session;
            if (session?.user) {
              const user = get().restoreUserFromStorage(session.user);
              state.user = user;
              state.isAuthenticated = true;
              state.role = user.role || null;
              state.isStudent = isStudentRole(user.role);
              state.isEducator = isEducatorRole(user.role);
              state.isAdmin = isAdminRole(user.role);
              state.isRecruiter = isRecruiterRole(user.role);
              state.isLearner = isLearnerRole(user.role);
              localStorage.setItem('user', JSON.stringify(user));
            }
          });
        },

        // Set loading
        setLoading: (loading) => {
          set((state) => {
            state.loading = loading;
          });
        },

        // Error notifications
        showErrorNotification: (notification) => {
          set((state) => {
            state.errorNotification = notification;
          });
        },

        dismissErrorNotification: () => {
          set((state) => {
            state.errorNotification = null;
          });
        },

        // Initialize auth state from Supabase
        initialize: async () => {
          set((state) => {
            state.loading = true;
          });

          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Error getting session:', error);
              set((state) => {
                state.loading = false;
              });
              return;
            }

            if (session?.user) {
              const userData = get().restoreUserFromStorage(session.user);
              set((state) => {
                state.user = userData;
                state.session = session as Session;
                state.isAuthenticated = true;
                state.role = userData.role || null;
                state.isStudent = isStudentRole(userData.role);
                state.isEducator = isEducatorRole(userData.role);
                state.isAdmin = isAdminRole(userData.role);
                state.isRecruiter = isRecruiterRole(userData.role);
                state.isLearner = isLearnerRole(userData.role);
              });
              localStorage.setItem('user', JSON.stringify(userData));
            } else {
              // Check for demo users in localStorage
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                try {
                  const parsedUser = JSON.parse(storedUser);
                  if (parsedUser.isDemoMode || parsedUser.id?.includes('-001')) {
                    set((state) => {
                      state.user = parsedUser;
                      state.isAuthenticated = true;
                      state.role = parsedUser.role || null;
                    });
                  }
                } catch {
                  // Invalid stored user
                }
              }
            }
          } catch (err) {
            console.error('Error initializing auth:', err);
          } finally {
            set((state) => {
              state.loading = false;
            });
          }
        },

        // Refresh session
        refreshSession: async () => {
          try {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
              console.warn('Session refresh failed:', error.message);
              return false;
            }
            
            if (data?.session) {
              get().setSession(data.session as Session);
              return true;
            }
            
            return false;
          } catch (err) {
            console.error('Session refresh error:', err);
            return false;
          }
        },

        // Check session validity
        checkSessionValidity: async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Session check error:', error);
              return null;
            }
            
            return session as Session | null;
          } catch (err) {
            console.error('Session validity check failed:', err);
            return null;
          }
        },

        // Restore user from storage/session
        restoreUserFromStorage: (sessionUser) => {
          const sessionRole = getSpecificAdminRole(sessionUser, get().user);
          
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              const userMatches = 
                parsedUser.user_id === sessionUser.id || 
                parsedUser.id === sessionUser.id ||
                parsedUser.email === sessionUser.email;
              
              if (userMatches) {
                return {
                  ...parsedUser,
                  id: sessionUser.id,
                  role: sessionRole,
                };
              }
            } catch {
              // Ignore parse errors
            }
          }
          
          // Create new user from session
          return {
            id: sessionUser.id,
            email: sessionUser.email,
            role: sessionRole,
            name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name,
            user_metadata: sessionUser.user_metadata,
          };
        },
      }),
      {
        name: 'auth-storage',
        storage: secureStorage as any, // Use secure storage for auth data
        partialize: (state) => ({ 
          user: state.user,
          role: state.role,
          isAuthenticated: state.isAuthenticated,
          // Don't persist error notifications
        }),
      }
    )
  )
);

// Setup Supabase auth state change listener
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    const store = useAuthStore.getState();
    
    console.log('Auth state changed:', event, session?.user?.id);
    
    if (event === 'SIGNED_IN' && session?.user) {
      store.setSession(session as Session);
    } else if (event === 'SIGNED_OUT') {
      store.setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      store.setSession(session as Session);
    } else if (event === 'USER_UPDATED' && session?.user) {
      const userData = store.restoreUserFromStorage(session.user);
      store.setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  });
}

// Convenience hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
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
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const showErrorNotification = useAuthStore((state) => state.showErrorNotification);
  const dismissErrorNotification = useAuthStore((state) => state.dismissErrorNotification);
  
  return {
    login,
    logout,
    updateUser,
    initialize,
    refreshSession,
    showErrorNotification,
    dismissErrorNotification,
  };
};

// Token Refresh Error Notification
export const useTokenRefreshErrorNotification = () => {
  const showErrorNotification = useAuthStore((state) => state.showErrorNotification);
  const dismissErrorNotification = useAuthStore((state) => state.dismissErrorNotification);
  
  return { showErrorNotification, dismissErrorNotification };
};

// Subscription Prefetch
export const useSubscriptionPrefetch = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  return { user, isAuthenticated };
};

// Export store for direct access
export default useAuthStore;
