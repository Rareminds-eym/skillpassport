import { authClient } from "./authClient";

const REJECTION_HTTP_STATUS: Record<string, number> = {
  invalid_input: 400,
  invalid_credentials: 401,
  not_authenticated: 401,
  not_authorized: 403,
  conflict: 409,
  not_found: 404,
  expired: 400,
  blocked: 403,
};

function throwOnNonSuccess<T extends { status: string }>(outcome: T, operation: string): asserts outcome is T & { status: "succeeded" } {
  if (outcome.status !== "succeeded") {
    const code = outcome.status === "rejected" ? (outcome as { code?: string }).code ?? undefined : undefined;
    const error = new Error(`${operation} failed${code ? ` (${code})` : ""}`);
    if (code && REJECTION_HTTP_STATUS[code] !== undefined) {
      (error as Error & { httpStatus?: number }).httpStatus = REJECTION_HTTP_STATUS[code];
    }
    throw error;
  }
}

function legacyUser(identity: { subject: string; email: string; organizationId: string; roles: readonly string[]; products: readonly string[]; membershipStatus: string; emailVerified: boolean; userMetadata?: Readonly<Record<string, unknown>> }) {
  return {
    id: identity.subject,
    sub: identity.subject,
    email: identity.email,
    org_id: identity.organizationId,
    roles: [...identity.roles],
    products: [...identity.products],
    membership_status: identity.membershipStatus,
    is_email_verified: identity.emailVerified,
    user_metadata: identity.userMetadata ?? {},
  };
}

/**
 * SSO AuthClient wrapper for backward-compatible call-site delegation.
 * Delegates all lifecycle operations, preserved workflows, and requests to authClient 2.0.0.
 */
export const ssoClient = {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => authClient.request(input, init),
  getAccessToken: () => null,
  initSession: async () => {
    const outcome = await authClient.initialize();
    return { authenticated: outcome.status === "authenticated" };
  },
  isInitialized: () => {
    const state = authClient.getState();
    return state.phase !== "uninitialized";
  },
  isAuthenticated: () => {
    const state = authClient.getState();
    return state.phase === "authenticated" || state.phase === "refreshing";
  },
  login: async (input: { email: string; password: string }) => {
    const outcome = await authClient.login(input);
    throwOnNonSuccess(outcome, "Login");
  },
  signup: async (input: {
    email: string;
    password: string;
    org_name: string | null;
    role: string;
    redirect_url?: string;
    user_metadata?: Readonly<Record<string, unknown>>;
  }) => {
    const outcome = await authClient.signup({
      email: input.email,
      password: input.password,
      organizationName: input.org_name ?? "",
      role: input.role,
      redirectUrl: input.redirect_url,
      userMetadata: input.user_metadata,
    });
    throwOnNonSuccess(outcome, "Signup");
    const { identity, organization, emailSent } = outcome.data;
    return {
      user: legacyUser(identity),
      org: { id: organization.id, name: organization.name, slug: organization.slug, roles: [...organization.roles], active: organization.active },
      email_sent: emailSent,
    };
  },
  signupMember: async (input: {
    email: string;
    password: string;
    role: string;
    redirect_url?: string;
    user_metadata?: Readonly<Record<string, unknown>>;
  }) => {
    const outcome = await authClient.signupMember({
      email: input.email,
      password: input.password,
      role: input.role,
      redirectUrl: input.redirect_url,
      userMetadata: input.user_metadata,
    });
    throwOnNonSuccess(outcome, "Signup");
    const { identity, organization, emailSent } = outcome.data;
    return {
      user: legacyUser(identity),
      ...(organization === undefined ? {} : { org: { id: organization.id, name: organization.name, slug: organization.slug, roles: [...organization.roles], active: organization.active } }),
      email_sent: emailSent,
    };
  },
  acceptInvite: async (input: { token: string; password?: string }) => {
    const outcome = await authClient.acceptInvite({ invitationToken: input.token, password: input.password });
    throwOnNonSuccess(outcome, "Invite acceptance");
  },
  forgotPassword: async (input: { email: string; redirect_url?: string }) => {
    const outcome = await authClient.forgotPassword({ email: input.email, redirectUrl: input.redirect_url });
    throwOnNonSuccess(outcome, "Password reset request");
  },
  resetPassword: async (input: { token: string; password: string }) => {
    const outcome = await authClient.resetPassword({ resetToken: input.token, password: input.password });
    throwOnNonSuccess(outcome, "Password reset");
  },
  verifyEmail: async (input: { token: string }) => {
    const outcome = await authClient.verifyEmail({ verificationToken: input.token });
    throwOnNonSuccess(outcome, "Email verification");
  },
  requestVerification: async (input: { redirect_url?: string }) => {
    const outcome = await authClient.requestVerification({ redirectUrl: input.redirect_url });
    throwOnNonSuccess(outcome, "Verification request");
  },
  logout: async () => {
    const result = await authClient.logout();
    if (result.outcome === "current_session_revocation_unconfirmed") {
      throw new Error("Logout could not be confirmed");
    }
  },
  logoutAllSessions: async () => {
    const result = await authClient.logoutAllSessions({ confirm: true });
    if (result.outcome === "all_sessions_revocation_unconfirmed") {
      throw new Error("Logout could not be confirmed");
    }
  },
  getMe: async () => {
    const result = await authClient.getMe();
    throwOnNonSuccess(result, "Fetching identity");
    return legacyUser(result.data);
  },
  refresh: async () => {
    const outcome = await authClient.initialize();
    return outcome;
  },
  onAuthStateChange: (listener: (event: any) => void) => authClient.subscribe(listener),
};
