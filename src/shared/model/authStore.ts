/**
 * Auth Store (SSO-only)
 *
 * Uses @rareminds-eym/auth-client to communicate with the SSO worker.
 * All auth state (user, roles, session) derives from the SSO JWT.
 * No Supabase Auth calls are made from this store.
 *
 * The public API (hooks and types) is preserved from the legacy store
 * so existing consumers continue to work without import changes.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';
import { startTokenRefresh, stopTokenRefresh, tokenRefreshService } from '@/shared/services/tokenRefreshService';
import type { MeResponse, LoginResponse } from '@rareminds-eym/auth-client';

const logger = getLogger('auth-store');

// ─── Types ─────────────────────────────────────────────────────

interface ErrorNotification {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * User shape — kept compatible with the legacy store's User type.
 * All fields except `id` are optional so existing consumers continue to work.
 */
export interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  user_metadata?: any;
  /** @deprecated Demo mode removed — always false in SSO mode. */
  isDemoMode?: boolean;
  /** SSO-specific: the org the user is active in */
  orgId?: string;
  /** SSO-specific: full role list from the JWT */
  roles?: string[];
  /** SSO-specific: products the user has access to */
  products?: string[];
  /** SSO-specific: membership status */
  membershipStatus?: string;
  /** SSO-specific: whether the email has been verified */
  isEmailVerified?: boolean;
}

/**
 * Session shape — kept for backward compatibility.
 * In SSO mode, the access token is held in memory by auth-client (not persisted here).
 * The `session` field will be null — use `isAuthenticated` instead.
 */
export interface Session {
  access_token: string;
  refresh_token?: string;
  user: any;
  expires_at?: number;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;

  role: string | null;
  isLearner: boolean;
  isEducator: boolean;
  isAdmin: boolean;
  isRecruiter: boolean;

  errorNotification: ErrorNotification | null;

  // Actions
  login: (emailOrUser: string | User, passwordOrSession?: string | Session) => Promise<LoginResponse | void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;

  showErrorNotification: (notification: ErrorNotification) => void;
  dismissErrorNotification: () => void;

  initialize: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkSessionValidity: () => Promise<Session | null>;

  /** @deprecated No longer needed in SSO mode. Kept for compatibility. */
  restoreUserFromStorage: (sessionUser: any) => User;
}

// ─── Role helpers ──────────────────────────────────────────────

const isLearnerRole = (roles: string[]): boolean =>
  roles.some((r) => r === 'learner');

const isEducatorRole = (roles: string[]): boolean =>
  roles.some((r) => r === 'educator' || r === 'school_educator' || r === 'college_educator');

const isAdminRole = (roles: string[]): boolean =>
  roles.some(
    (r) =>
      r === 'admin' ||
      r === 'school_admin' ||
      r === 'college_admin' ||
      r === 'university_admin' ||
      r === 'owner',
  );

const isRecruiterRole = (roles: string[]): boolean =>
  roles.some((r) => r === 'recruiter' || r === 'hr');

/**
 * Pick the most specific role for the legacy `role` field.
 * Prefers specific admin/learner/educator roles over generic ones.
 */
function pickPrimaryRole(roles: string[]): string | null {
  if (roles.length === 0) return null;
  const priority = [
    'university_admin',
    'college_admin',
    'school_admin',
    'owner',
    'admin',
    'college_educator',
    'school_educator',
    'educator',
    'learner',
    'recruiter',
    'hr',
    'member',
  ];
  for (const p of priority) {
    if (roles.includes(p)) return p;
  }
  return roles[0];
}

function mapMeToUser(me: MeResponse): User {
  return {
    id: me.sub,
    email: me.email,
    role: pickPrimaryRole(me.roles) ?? undefined,
    orgId: me.org_id,
    roles: me.roles,
    products: me.products,
    membershipStatus: me.membership_status,
    isEmailVerified: me.is_email_verified,
    isDemoMode: false,
  };
}

function computeRoleFlags(roles: string[]) {
  return {
    isLearner: isLearnerRole(roles),
    isEducator: isEducatorRole(roles),
    isAdmin: isAdminRole(roles),
    isRecruiter: isRecruiterRole(roles),
  };
}

// ─── Store ─────────────────────────────────────────────────────

/** Storage key for the persisted auth state. Bumping this value invalidates all existing sessions. */
const AUTH_STORAGE_KEY = 'skillpassport-auth-v1';
/** Current persisted state version. Increment when making breaking shape changes. */
const AUTH_STORAGE_VERSION = 1;

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
    // Initial state
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    role: null,
    isLearner: false,
    isEducator: false,
    isAdmin: false,
    isRecruiter: false,
    errorNotification: null,

    /**
     * login() accepts either:
     *  - (email, password) — performs SSO login via auth-client
     *  - (user, session?) — legacy signature; sets user directly (used by signup flows that already have user data)
     */
    login: async (emailOrUser, passwordOrSession) => {
      // Legacy signature: called with (User, Session?)
      if (typeof emailOrUser !== 'string') {
        const userData = emailOrUser;
        const sessionData = typeof passwordOrSession === 'string' ? null : (passwordOrSession ?? null);
        const roles = userData.roles ?? (userData.role ? [userData.role] : []);
        set((state) => {
          state.user = { ...state.user, ...userData };
          if (sessionData) state.session = sessionData;
          state.isAuthenticated = true;
          state.role = userData.role ?? pickPrimaryRole(roles);
          Object.assign(state, computeRoleFlags(roles));
        });
        // Start token refresh service after successful login
        startTokenRefresh();
        return;
      }

      // SSO signature: (email, password)
      const email = emailOrUser;
      const password = passwordOrSession as string;
      const res = await ssoClient.login({ email, password });
      const me = await ssoClient.getMe();
      const user = mapMeToUser(me);
      set((state) => {
        state.user = user;
        state.isAuthenticated = true;
        state.role = user.role ?? null;
        Object.assign(state, computeRoleFlags(me.roles));
      });
      // Start token refresh service after successful login
      startTokenRefresh();
      return res;
    },

    logout: async () => {
      // Stop token refresh service before logout
      stopTokenRefresh();
      
      try {
        await ssoClient.logout();
      } catch (err) {
        logger.error('SSO logout failed', err as Error);
      }

      set((state) => {
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.role = null;
        state.isLearner = false;
        state.isEducator = false;
        state.isAdmin = false;
        state.isRecruiter = false;
      });
    },

    updateUser: (userData) => {
      set((state) => {
        if (state.user) {
          state.user = { ...state.user, ...userData };
          if (userData.roles) {
            state.role = pickPrimaryRole(userData.roles);
            Object.assign(state, computeRoleFlags(userData.roles));
          } else if (userData.role) {
            state.role = userData.role;
            Object.assign(state, computeRoleFlags([userData.role]));
          }
        }
      });
    },

    setUser: (user) => {
      set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
        const roles = user?.roles ?? (user?.role ? [user.role] : []);
        state.role = user?.role ?? pickPrimaryRole(roles);
        Object.assign(state, computeRoleFlags(roles));
      });
    },

    setSession: (session) => {
      set((state) => {
        state.session = session;
      });
    },

    setLoading: (loading) => {
      set((state) => {
        state.loading = loading;
      });
    },

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

    /**
     * Initialize auth state from the SSO worker.
     * Called once at app startup before rendering protected routes.
     *
     * Strategy (for fast initial render):
     *  1. Persisted user data from Zustand is already rehydrated (UI renders immediately).
     *  2. Call initSession() to validate the session with SSO (refresh cookie).
     *  3. If valid, fetch fresh /auth/me and update state.
     *  4. If invalid, clear the persisted state.
     */
    initialize: async () => {
      set((state) => {
        state.loading = true;
      });

      try {
        const { authenticated } = await ssoClient.initSession();
        if (authenticated) {
          const me = await ssoClient.getMe();
          const user = mapMeToUser(me);
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.role = user.role ?? null;
            Object.assign(state, computeRoleFlags(me.roles));
            state.loading = false;
          });
          // Start token refresh service after successful session restoration
          startTokenRefresh();
        } else {
          // No valid session — clear any stale persisted state
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.role = null;
            state.isLearner = false;
            state.isEducator = false;
            state.isAdmin = false;
            state.isRecruiter = false;
            state.loading = false;
          });
        }
      } catch (err) {
        logger.error('Error initializing auth', err as Error);
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.role = null;
          state.isLearner = false;
          state.isEducator = false;
          state.isAdmin = false;
          state.isRecruiter = false;
          state.loading = false;
        });
      }
    },

    refreshSession: async () => {
      try {
        await ssoClient.refresh();
        const me = await ssoClient.getMe();
        const user = mapMeToUser(me);
        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
          state.role = user.role ?? null;
          Object.assign(state, computeRoleFlags(me.roles));
        });
        return true;
      } catch (err) {
        logger.warn('Session refresh failed', { message: (err as Error).message });
        return false;
      }
    },

    checkSessionValidity: async () => {
      // In SSO mode, we don't have a Session object. Return null always.
      // Consumers should use isAuthenticated instead.
      return get().session;
    },

    restoreUserFromStorage: (sessionUser) => {
      // Legacy method — no longer used in SSO mode. Return a minimal user.
      return {
        id: sessionUser?.id ?? sessionUser?.sub ?? '',
        email: sessionUser?.email,
      };
    },
  })),
    {
      name: AUTH_STORAGE_KEY,
      version: AUTH_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      /**
       * Only persist non-sensitive user data. Never persist:
       * - Access/refresh tokens (auth-client handles these)
       * - Session objects (derived from SSO)
       * - Loading state (always starts fresh)
       * - Error notifications (ephemeral)
       */
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        isLearner: state.isLearner,
        isEducator: state.isEducator,
        isAdmin: state.isAdmin,
        isRecruiter: state.isRecruiter,
      }),
      /**
       * When rehydrating from storage, reset transient fields
       * so the UI correctly shows a loading state until initialize() completes.
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loading = true;
          state.session = null;
          state.errorNotification = null;
        }
      },
    },
  ),
);

// ─── Cross-tab sync via auth-client ────────────────────────────

if (typeof window !== 'undefined') {
  ssoClient.onAuthStateChange(async (event) => {
    const store = useAuthStore.getState();

    if (event === 'LOGOUT') {
      stopTokenRefresh();
      store.setUser(null);
    } else if (event === 'LOGIN' || event === 'REFRESH') {
      try {
        const me = await ssoClient.getMe();
        const user = mapMeToUser(me);
        useAuthStore.setState({
          user,
          isAuthenticated: true,
          role: user.role ?? null,
          ...computeRoleFlags(me.roles),
        });
        // Ensure token refresh is running after cross-tab login/refresh
        if (event === 'LOGIN' || !tokenRefreshService.isRunning()) {
          startTokenRefresh();
        }
      } catch {
        // Session expired during rehydration — ignore
      }
    }
  });
}

// ─── Convenience hooks (same API as legacy store) ──────────────

export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useErrorNotification = () => useAuthStore((state) => state.errorNotification);

export const useUserRole = () => {
  const role = useAuthStore((state) => state.role);
  const isLearner = useAuthStore((state) => state.isLearner);
  const isEducator = useAuthStore((state) => state.isEducator);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const isRecruiter = useAuthStore((state) => state.isRecruiter);
  return { role, isLearner, isEducator, isAdmin, isRecruiter };
};

export const useAuthActions = () => {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const initialize = useAuthStore((state) => state.initialize);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const showErrorNotification = useAuthStore((state) => state.showErrorNotification);
  const dismissErrorNotification = useAuthStore((state) => state.dismissErrorNotification);
  return { login, logout, updateUser, initialize, refreshSession, showErrorNotification, dismissErrorNotification };
};

export const useTokenRefreshErrorNotification = () => {
  const showErrorNotification = useAuthStore((state) => state.showErrorNotification);
  const dismissErrorNotification = useAuthStore((state) => state.dismissErrorNotification);
  return { showErrorNotification, dismissErrorNotification };
};

// Export store for direct access
export default useAuthStore;

/**
 * Initialize all stores.
 * Called once at app startup to initialize auth state via SSO.
 */
export const initializeStores = async () => {
  await useAuthStore.getState().initialize();
};
