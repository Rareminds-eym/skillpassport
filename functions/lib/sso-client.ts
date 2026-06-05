/**
 * SSO subscription client — communicates with sso-worker subscription endpoints
 * via the SSO_SERVICE binding (Cloudflare internal network, ~10-30ms).
 *
 * Used by payment handlers to write subscription/transaction data to the auth DB.
 */

interface SsoClientEnv {
  SSO_SERVICE: Fetcher;
  SSO_DOMAIN?: string;
  /** Required: shared secret for authenticating with the sso-worker */
  SERVICE_AUTH_SECRET: string;
}

interface SsoSubscriptionData {
  user_id: string;
  plan_id: string;
  plan_code: string;
  plan_type: string;
  plan_amount: number;
  billing_cycle: string;
  features: unknown[];
  full_name: string;
  email: string;
  phone?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  organization_id?: string;
  organization_type?: string;
  seat_count?: number;
  is_organization_subscription?: boolean;
  is_bulk_purchase?: boolean;
  purchased_by?: string;
}

interface SsoTransactionData {
  subscription_id?: string;
  user_id: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency?: string;
  status: string;
  transaction_type?: string;
  payment_method?: string;
  organization_id?: string;
  organization_type?: string;
  seat_count?: number;
  is_bulk_purchase?: boolean;
  receipt_url?: string;
  notes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Cloudflare Service Bindings require a full URL for the Fetch API, 
// but the hostname is ignored by the internal router.
// Using a .internal TLD makes it clear this is a direct worker-to-worker call.
const INTERNAL_SSO_HOST = 'http://sso-worker.internal';

function getFetcher(env: SsoClientEnv): Fetcher {
  if (!env.SSO_SERVICE) {
    throw new Error("SSO_SERVICE binding is not configured in wrangler.toml");
  }
  return env.SSO_SERVICE;
}

async function ssoFetch(env: SsoClientEnv, path: string, options: RequestInit, authToken: string, useServiceAuth?: boolean): Promise<Response> {
  const fetcher = getFetcher(env);
  const token = useServiceAuth ? env.SERVICE_AUTH_SECRET : authToken;
  return fetcher.fetch(`${INTERNAL_SSO_HOST}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });
}

export async function ssoCreateSubscription(
  env: SsoClientEnv,
  _authToken: string,
  data: SsoSubscriptionData,
): Promise<Record<string, unknown>> {
  const res = await ssoFetch(env, "/api/subscriptions/create", {
    method: "POST",
    body: JSON.stringify(data),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO create subscription failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function ssoCreateFreemiumSubscription(
  env: SsoClientEnv,
  _authToken: string,
  data: { user_id: string; email: string; full_name?: string },
): Promise<Record<string, unknown>> {
  const res = await ssoFetch(env, "/api/subscriptions/create-freemium", {
    method: "POST",
    body: JSON.stringify(data),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO create freemium failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function ssoUpdateSubscriptionStatus(
  env: SsoClientEnv,
  _authToken: string,
  subscriptionId: string,
  data: { status: string; receipt_url?: string; cancellation_reason?: string; cancelled_by?: string },
): Promise<Record<string, unknown>> {
  const res = await ssoFetch(env, `/api/subscriptions/${subscriptionId}/status`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO update status failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function ssoUpdateSubscriptionField(
  env: SsoClientEnv,
  _authToken: string,
  subscriptionId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await ssoFetch(env, `/api/subscriptions/${subscriptionId}/update`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO update subscription failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function ssoRecordTransaction(
  env: SsoClientEnv,
  _authToken: string,
  data: SsoTransactionData,
): Promise<Record<string, unknown>> {
  const res = await ssoFetch(env, "/api/transactions/record", {
    method: "POST",
    body: JSON.stringify(data),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO record transaction failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function ssoGetUserSubscription(
  env: SsoClientEnv,
  _authToken: string,
  userId: string,
): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }> {
  const res = await ssoFetch(env, `/api/subscriptions/user/${userId}`, {
    method: "GET",
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO get subscription failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
}

export async function ssoSyncSubscription(
  env: SsoClientEnv,
  authToken: string,
  userId: string,
): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }> {
  const res = await ssoFetch(env, "/api/sync/subscription", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO sync subscription failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
}

export async function ssoGetUserTransactions(
  env: SsoClientEnv,
  _authToken: string,
  userId: string,
  subscriptionId?: string,
): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (subscriptionId) params.set('subscription_id', subscriptionId);
  const res = await ssoFetch(env, `/api/transactions/user?${params}`, {
    method: "GET",
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO get transactions failed [${res.status}]: ${text}`);
  }
  const result = await res.json() as { transactions: Record<string, unknown>[] };
  return result.transactions || [];
}

export async function ssoSyncPlans(
  env: SsoClientEnv,
): Promise<{ plans: Record<string, unknown>[] }> {
  const res = await ssoFetch(env, "/api/sync/plans", {
    method: "POST",
    body: JSON.stringify({}),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO sync plans failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<{ plans: Record<string, unknown>[] }>;
}

/**
 * Create a new membership in the SSO-Worker database
 * Used when accepting invitations (cannot write to foreign tables directly)
 */
export async function ssoCreateMembership(
  env: SsoClientEnv,
  data: { user_id: string; org_id: string; status: string },
): Promise<{ id: string; status: string }> {
  const res = await ssoFetch(env, "/api/memberships/create", {
    method: "POST",
    body: JSON.stringify(data),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO create membership failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<{ id: string; status: string }>;
}

/**
 * Assign a role to a membership in the SSO-Worker database
 */
export async function ssoAssignMembershipRole(
  env: SsoClientEnv,
  data: { membership_id: string; role_id: string },
): Promise<{ success: boolean }> {
  const res = await ssoFetch(env, "/api/memberships/assign-role", {
    method: "POST",
    body: JSON.stringify(data),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO assign role failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<{ success: boolean }>;
}

/**
 * Update membership status in the SSO-Worker database
 */
export async function ssoUpdateMembershipStatus(
  env: SsoClientEnv,
  data: { membership_id: string; status: string },
): Promise<{ success: boolean }> {
  const res = await ssoFetch(env, "/api/memberships/update-status", {
    method: "PUT",
    body: JSON.stringify(data),
  }, "", true);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO update membership status failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<{ success: boolean }>;
}
