import { authClient } from "@/shared/api/authClient";
import { AuthClientError } from "@rareminds-eym/auth-client";
import { getLogger } from "@/shared/config/logging";
import { clearUserContext } from "@/shared/config/monitoring";
import { ROLE_CATEGORIES, type RoleCategory } from "@/shared/types/generated/roles";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const logger = getLogger("auth-store");

interface ErrorNotification {
  title: string;
  message: string;
  type: "error" | "warning" | "info";
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
  orgId?: string;
  roles?: string[];
  products?: string[];
  membershipStatus?: string;
  isEmailVerified?: boolean;
}

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

  login: (emailOrUser: string | User, passwordOrSession?: string | Session) => Promise<any>;
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
  restoreUserFromStorage: (sessionUser: any) => User;
}

const isInCategory = (roles: string[], category: RoleCategory): boolean => {
  const members = ROLE_CATEGORIES[category] as readonly string[];
  return roles.some((r) => members.includes(r));
};

export function pickPrimaryRole(roles: string[]): string | null {
  if (roles.length === 0) return null;
  const priority = [
    "university_admin",
    "college_admin",
    "school_admin",
    "owner",
    "admin",
    "company_admin",
    "college_educator",
    "school_educator",
    "educator",
    "learner",
    "recruiter",
    "hr",
    "member",
  ];
  for (const p of priority) {
    if (roles.includes(p)) return p;
  }
  return roles[0];
}

function mapIdentityToUser(identity: any): User {
  const roles = identity.roles ? [...identity.roles] : [];
  return {
    id: identity.subject || identity.id,
    email: identity.email,
    role: pickPrimaryRole(roles) ?? undefined,
    orgId: identity.organizationId || identity.org_id,
    roles,
    products: identity.products ? [...identity.products] : [],
    membershipStatus: identity.membershipStatus || identity.membership_status,
    isEmailVerified: identity.emailVerified ?? identity.is_email_verified,
    isDemoMode: false,
    user_metadata: identity.userMetadata || identity.user_metadata || {},
  };
}

export function computeRoleFlags(roles: string[]) {
  return {
    isLearner: isInCategory(roles, "learner"),
    isEducator: isInCategory(roles, "educator"),
    isAdmin: isInCategory(roles, "admin"),
    isRecruiter: isInCategory(roles, "recruiter"),
  };
}

const AUTH_STORAGE_KEY = "skillpassport-auth-v1";
const AUTH_STORAGE_VERSION = 1;

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
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

      login: async (emailOrUser, passwordOrSession) => {
        if (typeof emailOrUser !== "string") {
          const userData = emailOrUser;
          const sessionData = typeof passwordOrSession === "string" ? null : passwordOrSession ?? null;
          const roles = userData.roles ?? (userData.role ? [userData.role] : []);
          set((state) => {
            state.user = { ...state.user, ...userData };
            if (sessionData) state.session = sessionData;
            state.isAuthenticated = true;
            state.role = userData.role ?? pickPrimaryRole(roles);
            Object.assign(state, computeRoleFlags(roles));
          });
          return;
        }

        const email = emailOrUser;
        const password = passwordOrSession as string;
        const res = await authClient.login({ email, password });

        if (res.status === "rejected") {
          const httpStatus = res.code === "invalid_credentials" ? 401 : res.code === "blocked" ? 403 : 400;
          const message = res.code === "invalid_credentials"
            ? "Invalid email or password"
            : res.code === "blocked"
            ? "Your account is not active. Contact support."
            : `Authentication failed (${res.code})`;
          throw new AuthClientError(message, "INVALID_RESPONSE", httpStatus);
        }

        if (res.status === "succeeded") {
          const identityData = (res.data as any)?.identity;
          if (identityData) {
            const user = mapIdentityToUser(identityData);
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.role = user.role ?? null;
              Object.assign(state, computeRoleFlags(user.roles ?? []));
            });
          } else {
            try {
              const me = await authClient.getMe();
              if (me.status === "succeeded") {
                const user = mapIdentityToUser(me.data);
                set((state) => {
                  state.user = user;
                  state.isAuthenticated = true;
                  state.role = user.role ?? null;
                  Object.assign(state, computeRoleFlags(user.roles ?? []));
                });
              }
            } catch (err) {
              logger.warn("getMe failed after login, relying on session state", err as Error);
            }
          }
        }
        return res;
      },

      logout: async () => {
        try {
          await authClient.logout();
        } catch (err) {
          logger.error("SSO logout failed", err as Error);
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

        clearUserContext();
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

      initialize: async () => {
        set((state) => {
          state.loading = true;
        });

        try {
          const outcome = await authClient.initialize();
          if (outcome.status === "authenticated") {
            const me = await authClient.getMe();
            if (me.status === "succeeded") {
              const user = mapIdentityToUser(me.data);
              set((state) => {
                state.user = user;
                state.isAuthenticated = true;
                state.role = user.role ?? null;
                Object.assign(state, computeRoleFlags(user.roles ?? []));
                state.loading = false;
              });
              return;
            }
          }

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
        } catch (err) {
          logger.error("Error initializing auth", err as Error);
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
          const outcome = await authClient.initialize();
          if (outcome.status === "authenticated") {
            const me = await authClient.getMe();
            if (me.status === "succeeded") {
              const user = mapIdentityToUser(me.data);
              set((state) => {
                state.user = user;
                state.isAuthenticated = true;
                state.role = user.role ?? null;
                Object.assign(state, computeRoleFlags(user.roles ?? []));
              });
              return true;
            }
          }
          return false;
        } catch (err) {
          logger.warn("Session refresh failed", { message: (err as Error).message });
          return false;
        }
      },

      checkSessionValidity: async () => {
        return get().session;
      },

      restoreUserFromStorage: (sessionUser) => {
        return {
          id: sessionUser?.id ?? sessionUser?.sub ?? "",
          email: sessionUser?.email,
        };
      },
    })),
    {
      name: AUTH_STORAGE_KEY,
      version: AUTH_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.loading = true;
          state.session = null;
          state.errorNotification = null;

          const roles = state.user?.roles ?? (state.user?.role ? [state.user.role] : []);
          state.role = state.user?.role ?? pickPrimaryRole(roles);
          Object.assign(state, computeRoleFlags(roles));
        }
      },
    }
  )
);

// Subscribe to AuthClient state transitions
authClient.subscribe((event) => {
  const phase = event.state.phase;
  if (phase === "unauthenticated" || phase === "destroyed") {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      role: null,
      isLearner: false,
      isEducator: false,
      isAdmin: false,
      isRecruiter: false,
      loading: false,
    });
  }
});

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

export default useAuthStore;

export const initializeStores = async () => {
  await useAuthStore.getState().initialize();
};
