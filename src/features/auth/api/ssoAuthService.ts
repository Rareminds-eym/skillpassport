import {
  AuthClient,
  type AuthClientConfig,
} from "@rareminds-eym/auth-client";

// ============================================================================
// SSO CLIENT — single instance, shared across the entire app
// ============================================================================

const config: AuthClientConfig = {
  baseURL:
    import.meta.env.VITE_SSO_BASE_URL ||
    "https://sso-api.dark-mode-d021.workers.dev",
  onSessionExpired: () => {
    window.location.href = "/login";
  },
  debug: import.meta.env.DEV,
};

export const ssoClient = new AuthClient(config);

// ============================================================================
// TYPES
// ============================================================================

export interface SSOUser {
  id: string;
  email: string;
  role: string;
  metadata: {
    org_id: string;
    roles: string[];
    products: string[];
    membership_status: string;
    is_email_verified: boolean;
  };
}

// ============================================================================
// ROLE MAPPING
// Maps SSO "products" field to SkillPassport role strings
// ============================================================================

export function mapProductsToRole(products: string[]): string {
  if (products.includes("university_admin")) return "university_admin";
  if (products.includes("college_admin"))    return "college_admin";
  if (products.includes("school_admin"))     return "school_admin";
  if (products.includes("educator"))         return "educator";
  if (products.includes("recruiter"))        return "recruiter";
  return "student";
}

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

export const ssoSignIn = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await ssoClient.login({ email, password });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Login failed" };
  }
};

export const ssoGetMe = async (): Promise<{
  success: boolean;
  user?: SSOUser;
  error?: string;
}> => {
  try {
    const me = await ssoClient.getMe();
    return {
      success: true,
      user: {
        id: me.sub,
        email: me.email,
        role: mapProductsToRole(me.products),
        metadata: {
          org_id:            me.org_id,
          roles:             me.roles,
          products:          me.products,
          membership_status: me.membership_status,
          is_email_verified: me.is_email_verified,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get user" };
  }
};

export const ssoInitSession = async (): Promise<{
  authenticated: boolean;
  user?: SSOUser;
  error?: string;
}> => {
  try {
    const result = await ssoClient.initSession();
    if (result.authenticated) {
      const me = await ssoGetMe();
      return { authenticated: true, user: me.user };
    }
    return { authenticated: false };
  } catch (error: any) {
    return { authenticated: false, error: error.message };
  }
};

export const ssoSignOut = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await ssoClient.logout();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Logout failed" };
  }
};

export const ssoForgotPassword = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await ssoClient.forgotPassword({ email });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to send reset email" };
  }
};

export const ssoResetPassword = async (
  token: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await ssoClient.resetPassword({ token, password });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Reset failed" };
  }
};
