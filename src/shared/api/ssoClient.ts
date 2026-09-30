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

// ─── Request budget (circuit breaker against runaway loops) ────────
// A misbehaving effect must never translate into thousands of identity
// requests. Budgets are per endpoint family per page-load; tripping opens a
// short cooldown that fails loud instead of silently spamming the backend.
const REQUEST_BUDGETS = {
  me: { max: 20, windowMs: 10_000, cooldownMs: 5_000 },
  session: { max: 20, windowMs: 10_000, cooldownMs: 5_000 },
} as const;

type BudgetKey = keyof typeof REQUEST_BUDGETS;
const budgetHits: Record<BudgetKey, number[]> = { me: [], session: [] };
const budgetBlockedUntil: Record<BudgetKey, number> = { me: 0, session: 0 };

export class AuthRequestBudgetError extends Error {
  constructor(key: BudgetKey) {
    super(`[ssoClient] '${key}' request budget exceeded — runaway loop detected`);
    this.name = "AuthRequestBudgetError";
  }
}

function enforceRequestBudget(key: BudgetKey): void {
  const { max, windowMs, cooldownMs } = REQUEST_BUDGETS[key];
  const now = Date.now();
  if (now < budgetBlockedUntil[key]) throw new AuthRequestBudgetError(key);
  const hits = (budgetHits[key] = budgetHits[key].filter((t) => now - t < windowMs));
  hits.push(now);
  if (hits.length > max) {
    budgetBlockedUntil[key] = now + cooldownMs;
    // eslint-disable-next-line no-console
    console.error(
      `[ssoClient] '${key}' called ${hits.length}x in ${windowMs / 1000}s — circuit open for ${cooldownMs / 1000}s`,
      new Error("runaway-caller stack"),
    );
    throw new AuthRequestBudgetError(key);
  }
}

/** @internal test seam */
export function __resetRequestBudgetsForTests(): void {
  budgetHits.me = [];
  budgetHits.session = [];
  budgetBlockedUntil.me = 0;
  budgetBlockedUntil.session = 0;
}

// ─── Single-flight identity (concurrent callers share one request) ──
let getMeInFlight: Promise<ReturnType<typeof legacyUser>> | null = null;
let getMeDevCallCount = 0;

export const ssoClient = {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => authClient.request(input, init),
  // Deprecated: direct token access bypasses vault + replay guard. Use ssoClient.fetch / apiPost which attaches Bearer via authClient vault.
  // Kept for legacy httpClient callers - now reads from authClient state vault via private accessor.
  getAccessToken: (): string | null => {
    try {
      // @ts-ignore - access private vault for legacy callers; returns null if unauthenticated
      const vault = (authClient as unknown as { _vault?: { read: () => string | null } })?._vault
        ?? (authClient as unknown as { vault?: { read: () => string | null } })?.vault;
      if (vault?.read) return vault.read();
      // Fallback: derive from state - identity presence means vault has token, but raw token not exposed; return null to force apiClient path
      return null;
    } catch {
      return null;
    }
  },
  initSession: () => {
    enforceRequestBudget("session");
    return (async () => {
      const outcome = await authClient.initialize();
      return { authenticated: outcome.status === "authenticated" };
    })();
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
  getMe: () => {
    enforceRequestBudget("me");
    // Single-flight: concurrent callers (StrictMode remounts, multiple
    // components, parallel bootstraps) share one network request.
    getMeInFlight ??= (async () => {
      try {
        if (import.meta.env.DEV) {
          getMeDevCallCount += 1;
          if (getMeDevCallCount % 25 === 0) {
            // eslint-disable-next-line no-console
            console.trace(`[ssoClient][dev] getMe call #${getMeDevCallCount} — investigate caller if unexpected`);
          }
        }
        const result = await authClient.getMe();
        throwOnNonSuccess(result, "Fetching identity");
        return legacyUser(result.data);
      } finally {
        getMeInFlight = null;
      }
    })();
    return getMeInFlight;
  },
  refresh: (force = false) => {
    enforceRequestBudget("session");
    return authClient.initialize({ force });
  },
  onAuthStateChange: (listener: (event: any) => void) => authClient.subscribe(listener),
};
