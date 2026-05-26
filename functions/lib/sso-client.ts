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

export async function ssoCreateSubscription(
  env: SsoClientEnv,
  data: SsoSubscriptionData,
): Promise<Record<string, unknown>> {
  return env.SSO_SERVICE.createSubscription(data);
}

export async function ssoCreateFreemiumSubscription(
  env: SsoClientEnv,
  data: { user_id: string; email: string; full_name?: string },
): Promise<Record<string, unknown>> {
  return env.SSO_SERVICE.createFreemiumSubscription(data);
}

export async function ssoUpdateSubscriptionStatus(
  env: SsoClientEnv,
  subscriptionId: string,
  data: { status: string; receipt_url?: string; cancellation_reason?: string; cancelled_by?: string },
): Promise<Record<string, unknown>> {
  return env.SSO_SERVICE.updateSubscriptionStatus(subscriptionId, data);
}

export async function ssoUpdateSubscriptionField(
  env: SsoClientEnv,
  subscriptionId: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return env.SSO_SERVICE.updateSubscriptionField(subscriptionId, data);
}

export async function ssoRecordTransaction(
  env: SsoClientEnv,
  data: SsoTransactionData,
): Promise<Record<string, unknown>> {
  return env.SSO_SERVICE.recordTransaction(data);
}

export async function ssoGetUserSubscription(
  env: SsoClientEnv,
  userId: string,
): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }> {
  return env.SSO_SERVICE.getUserSubscription(userId);
}

export async function ssoSyncSubscription(
  env: SsoClientEnv,
  userId: string,
): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }> {
  return env.SSO_SERVICE.syncSubscription(userId);
}

export async function ssoGetUserTransactions(
  env: SsoClientEnv,
  userId: string,
  subscriptionId?: string,
): Promise<Record<string, unknown>[]> {
  return env.SSO_SERVICE.getUserTransactions(userId, subscriptionId);
}

export async function ssoSyncPlans(
  env: SsoClientEnv,
): Promise<{ plans: Record<string, unknown>[] }> {
  return env.SSO_SERVICE.syncPlans();
}
