/**
 * SSO subscription client — communicates with sso-worker via Service Binding RPC.
 *
 * Uses typed RPC methods on the SsoWorker WorkerEntrypoint binding.
 * No SERVICE_AUTH_SECRET needed — the binding itself is the trust boundary.
 */

import type { Fetcher } from '@cloudflare/workers-types';

// ─── RPC Interface Types ───────────────────────────────────────
// These define the SsoWorker RPC methods available via the SSO_SERVICE binding.

interface SsoClientEnv {
  SSO_SERVICE: Fetcher;
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

type SsoFetcher = Fetcher & {
  createSubscription(data: unknown): Promise<Record<string, unknown>>;
  createFreemiumSubscription(data: unknown): Promise<Record<string, unknown>>;
  updateSubscriptionStatus(subscriptionId: string, data: unknown): Promise<Record<string, unknown>>;
  updateSubscriptionField(subscriptionId: string, data: unknown): Promise<Record<string, unknown>>;
  recordTransaction(data: unknown): Promise<Record<string, unknown>>;
  getUserSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  syncSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  getUserTransactions(userId: string, subscriptionId?: string): Promise<Record<string, unknown>[]>;
  syncPlans(): Promise<{ plans: Record<string, unknown>[] }>;
  recordAddonPurchase(data: unknown): Promise<Record<string, unknown>>;
  recordBundlePurchase(data: unknown): Promise<Record<string, unknown>>;
};

// ─── Binding Guard ─────────────────────────────────────────────
/**
 * Get the typed SSO service binding from the environment.
 * Throws a descriptive error if the binding is not configured.
 *
 * @param env - Pages Functions environment object
 * @returns The SSO_SERVICE binding for RPC calls
 * @throws Error if SSO_SERVICE binding is not configured
 */
function getSsoService(env: SsoClientEnv): SsoFetcher {
  if (!env.SSO_SERVICE) {
    throw new Error(
      'SSO_SERVICE binding is not configured. ' +
      'Add [[services]] to wrangler.toml or use --service SSO_SERVICE=sso-api in local dev.'
    );
  }
  return env.SSO_SERVICE as SsoFetcher;
}

// ─── RPC Client Functions ──────────────────────────────────────

export async function ssoCreateSubscription(
  env: SsoClientEnv,
  data: SsoSubscriptionData,
): Promise<Record<string, unknown>> {
  return getSsoService(env).createSubscription(data);
}

export async function ssoCreateFreemiumSubscription(
  env: SsoClientEnv,
  data: { user_id: string; email: string; full_name?: string },
): Promise<Record<string, unknown>> {
  return getSsoService(env).createFreemiumSubscription(data);
}

export async function ssoUpdateSubscriptionStatus(
  env: SsoClientEnv,
  subscriptionId: string,
  data: { status: string; receipt_url?: string; cancellation_reason?: string; cancelled_by?: string },
): Promise<Record<string, unknown>> {
  return getSsoService(env).updateSubscriptionStatus(subscriptionId, data);
}

export async function ssoUpdateSubscriptionField(
  env: SsoClientEnv,
  subscriptionId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return getSsoService(env).updateSubscriptionField(subscriptionId, data);
}

export async function ssoRecordTransaction(
  env: SsoClientEnv,
  data: SsoTransactionData,
): Promise<Record<string, unknown>> {
  return getSsoService(env).recordTransaction(data);
}

export async function ssoGetUserSubscription(
  env: SsoClientEnv,
  userId: string,
): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }> {
  return getSsoService(env).getUserSubscription(userId);
}

export async function ssoSyncSubscription(
  env: SsoClientEnv,
  userId: string,
): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }> {
  return getSsoService(env).syncSubscription(userId);
}

export async function ssoGetUserTransactions(
  env: SsoClientEnv,
  userId: string,
  subscriptionId?: string,
): Promise<Record<string, unknown>[]> {
  return getSsoService(env).getUserTransactions(userId, subscriptionId);
}

export async function ssoSyncPlans(
  env: SsoClientEnv,
): Promise<{ plans: Record<string, unknown>[] }> {
  return getSsoService(env).syncPlans();
}

export async function ssoRecordAddonPurchase(
  env: SsoClientEnv,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return getSsoService(env).recordAddonPurchase(data);
}

export async function ssoRecordBundlePurchase(
  env: SsoClientEnv,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return getSsoService(env).recordBundlePurchase(data);
}

export async function ssoFetch(
  env: SsoClientEnv,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = new URL(path, "http://sso-worker").toString();
  return getSsoService(env).fetch(new Request(url, init));
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
  });

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
  });

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
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SSO update membership status failed [${res.status}]: ${text}`);
  }
  return res.json() as Promise<{ success: boolean }>;
}
