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
  receipt_url?: string;
  organization_id?: string;
  organization_type?: string;
  seat_count?: number;
  is_organization_subscription?: boolean;
  is_bulk_purchase?: boolean;
  purchased_by?: string;
  is_recruiter_subscription?: boolean;
  is_b2b?: boolean;
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
  failure_reason?: string;
  product_id?: string;
  organization_id?: string;
  organization_type?: string;
  seat_count?: number;
  is_bulk_purchase?: boolean;
  /** R2 key to the payment receipt PDF (not a presigned URL) */
  receipt_url?: string;
  notes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

type SsoFetcher = Fetcher & {
  createSubscription(data: unknown): Promise<Record<string, unknown>>;
  createFreemiumSubscription(data: unknown): Promise<Record<string, unknown>>;
  createMember(data: { email: string; password: string; role: string; org_id: string }):
    Promise<{ user_id: string; org_id: string; membership_id: string }>;
  updateSubscriptionStatus(subscriptionId: string, data: unknown): Promise<Record<string, unknown>>;
  updateSubscriptionField(subscriptionId: string, data: unknown): Promise<Record<string, unknown>>;
  recordTransaction(data: unknown): Promise<Record<string, unknown>>;
  updateTransaction(transactionId: string, data: unknown): Promise<Record<string, unknown>>;
  getUserSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  syncSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  getUserTransactions(userId: string, subscriptionId?: string): Promise<Record<string, unknown>[]>;
  syncPlans(): Promise<{ plans: Record<string, unknown>[] }>;
  listRoles(): Promise<{ roles: { id: string; name: string; description: string | null }[] }>;
  getUserByEmail(email: string): Promise<{ id: string; email: string; is_email_verified: boolean } | null>;
  getUserMemberships(userId: string): Promise<{ memberships: { id: string; org_id: string; role: string; status: string }[] }>;
  createMembership(data: { user_id: string; org_id: string; status: string }): Promise<{ id: string; status: string }>;
  updateMembershipStatus(data: { membership_id: string; status: string }): Promise<{ success: boolean }>;
  assignMembershipRole(data: { membership_id: string; role_id: string }): Promise<{ success: boolean }>;
  recordAddonPurchase(data: unknown): Promise<Record<string, unknown>>;
  recordBundlePurchase(data: unknown): Promise<Record<string, unknown>>;
  listAddonCatalog(): Promise<any>;
  getAddonByFeatureKey(featureKey: string): Promise<any>;
  listBundles(): Promise<any>;
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

/**
 * Admin-create a member user (e.g. school admin adding a teacher) in the SSO DB.
 * Creates the SSO user + active membership + role. The caller is responsible for
 * creating any app-DB profile rows (e.g. school_educators) using the returned
 * user_id.
 */
export async function ssoCreateMember(
  env: SsoClientEnv,
  data: { email: string; password: string; role: string; org_id: string },
): Promise<{ user_id: string; org_id: string; membership_id: string }> {
  return getSsoService(env).createMember(data);
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

/**
 * Update transaction metadata (e.g., receipt_url after async generation)
 */
export async function ssoUpdateTransaction(
  env: SsoClientEnv,
  transactionId: string,
  data: { receipt_url?: string; status?: string; metadata?: Record<string, unknown> },
): Promise<Record<string, unknown>> {
  const ssoService = getSsoService(env);
  
  if (typeof ssoService.updateTransaction !== 'function') {
    throw new Error('SSO_SERVICE.updateTransaction RPC method not implemented');
  }
  
  return ssoService.updateTransaction(transactionId, data);
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

/**
 * Pull the canonical authorization roles from the sso-worker (source of truth).
 *
 * Mirrors {@link ssoSyncPlans}. Used by the roles-shadow sync
 * (`sync-shadow.ts` → `syncRolesShadow`) for the scheduled reconcile and the
 * on-demand cache-miss refresh. The returned list is read-only reference data,
 * never an authorization source.
 */
export async function ssoListRoles(
  env: SsoClientEnv,
): Promise<{ roles: { id: string; name: string; description: string | null }[] }> {
  return getSsoService(env).listRoles();
}

/**
 * Look up a user by their email via the SSO-Worker RPC.
 * Returns the user record or null if no user is found with that email.
 */
export async function ssoGetUserByEmail(
  env: SsoClientEnv,
  email: string,
): Promise<{ id: string; email: string; is_email_verified: boolean } | null> {
  return getSsoService(env).getUserByEmail(email);
}

/**
 * Get all organization memberships for a user via the SSO-Worker RPC.
 */
export async function ssoGetUserMemberships(
  env: SsoClientEnv,
  userId: string,
): Promise<{ memberships: { id: string; org_id: string; role: string; status: string }[] }> {
  return getSsoService(env).getUserMemberships(userId);
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

export async function ssoListAddonCatalog(env: SsoClientEnv): Promise<any> {
  return getSsoService(env).listAddonCatalog();
}

export async function ssoGetAddonByFeatureKey(env: SsoClientEnv, featureKey: string): Promise<any> {
  return getSsoService(env).getAddonByFeatureKey(featureKey);
}

export async function ssoListBundles(env: SsoClientEnv): Promise<any> {
  return getSsoService(env).listBundles();
}

/**
 * Create a new membership in the SSO-Worker database
 * Used when accepting invitations
 */
export async function ssoCreateMembership(
  env: SsoClientEnv,
  data: { user_id: string; org_id: string; status: string },
): Promise<{ id: string; status: string }> {
  return getSsoService(env).createMembership(data);
}

/**
 * Assign a role to a membership in the SSO-Worker database
 */
export async function ssoAssignMembershipRole(
  env: SsoClientEnv,
  data: { membership_id: string; role_id: string },
): Promise<{ success: boolean }> {
  return getSsoService(env).assignMembershipRole(data);
}

/**
 * Update membership status in the SSO-Worker database
 */
export async function ssoUpdateMembershipStatus(
  env: SsoClientEnv,
  data: { membership_id: string; status: string },
): Promise<{ success: boolean }> {
  return getSsoService(env).updateMembershipStatus(data);
}
