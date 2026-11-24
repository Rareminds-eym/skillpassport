/**
 * SSO Service RPC Client Wrapper
 *
 * Cloudflare Pages Functions binding helper to delegate calls to the SSO Worker (`env.SSO_SERVICE`).
 *
 * All methods invoke RPC endpoints exposed by `SsoWorker` on the service binding.
 */

export interface SsoEnv {
  SSO_SERVICE: {
    [key: string]: (...args: any[]) => Promise<any>;
  };
}

export async function ssoSyncPlans(env: SsoEnv): Promise<any> {
  return env.SSO_SERVICE.syncPlans();
}

export async function ssoSyncSubscription(env: SsoEnv, userId: string): Promise<any> {
  return env.SSO_SERVICE.syncSubscription(userId);
}

export async function ssoListAddonCatalog(env: SsoEnv, params?: any): Promise<any> {
  return env.SSO_SERVICE.listAddonCatalog(params);
}

export async function ssoListBundles(env: SsoEnv, params?: any): Promise<any> {
  return env.SSO_SERVICE.listBundles(params);
}

export async function ssoGetUserSubscriptionStatus(env: SsoEnv, userId: string): Promise<any> {
  return env.SSO_SERVICE.getUserSubscription(userId);
}

export async function ssoGetUserSubscription(env: SsoEnv, userId: string): Promise<any> {
  return env.SSO_SERVICE.getUserSubscription(userId);
}

export async function ssoGetAddonByFeatureKey(env: SsoEnv, featureKey: string): Promise<any> {
  return env.SSO_SERVICE.getAddonByFeatureKey(featureKey);
}

export async function ssoGetUserTransactions(env: SsoEnv, userId: string, subscriptionId?: string): Promise<any> {
  return env.SSO_SERVICE.getUserTransactions(userId, subscriptionId);
}

export async function ssoRecordAddonPurchase(env: SsoEnv, data: any): Promise<any> {
  return env.SSO_SERVICE.recordAddonPurchase(data);
}

export async function ssoRecordBundlePurchase(env: SsoEnv, data: any): Promise<any> {
  return env.SSO_SERVICE.recordBundlePurchase(data);
}

export async function ssoListRoles(env: SsoEnv): Promise<any> {
  return env.SSO_SERVICE.listRoles();
}

export async function ssoListFeatureKeys(env: SsoEnv): Promise<any> {
  return env.SSO_SERVICE.listFeatureKeys();
}

export async function ssoCreateMembership(env: SsoEnv, data: any): Promise<any> {
  return env.SSO_SERVICE.createMembership(data);
}

export async function ssoCreateMember(env: SsoEnv, data: any): Promise<any> {
  return env.SSO_SERVICE.createMember(data);
}

export async function ssoAssignMembershipRole(env: SsoEnv, data: any): Promise<any> {
  return env.SSO_SERVICE.assignMembershipRole(data);
}

export async function ssoUpdateMembershipStatus(env: SsoEnv, data: any): Promise<any> {
  return env.SSO_SERVICE.updateMembershipStatus(data);
}

export async function ssoGetUserByEmail(env: SsoEnv, email: string): Promise<any> {
  return env.SSO_SERVICE.getUserByEmail(email);
}

export async function ssoGetUserById(env: SsoEnv, userId: string): Promise<any> {
  return env.SSO_SERVICE.getUserById(userId);
}

export async function ssoGetOrganizationById(env: SsoEnv, orgId: string): Promise<any> {
  return env.SSO_SERVICE.getOrganizationById(orgId);
}

export async function ssoGetUserMemberships(env: SsoEnv, userId: string): Promise<any> {
  return env.SSO_SERVICE.getUserMemberships(userId);
}

export async function ssoUpdateSubscriptionField(env: SsoEnv, subscriptionId: string, data: any): Promise<any> {
  return env.SSO_SERVICE.updateSubscriptionField(subscriptionId, data);
}

export async function ssoCancelSubscription(env: SsoEnv, subscriptionId: string, data?: any): Promise<any> {
  return env.SSO_SERVICE.cancelSubscription(subscriptionId, data);
}

export async function ssoUpdateSubscriptionStatus(env: SsoEnv, subscriptionId: string, data: any): Promise<any> {
  return env.SSO_SERVICE.updateSubscriptionStatus(subscriptionId, data);
}

export async function ssoCreateSubscription(env: SsoEnv, data: any): Promise<any> {
  return env.SSO_SERVICE.createSubscription(data);
}

export async function ssoGetSubscriptionByPayment(env: SsoEnv, paymentId: string): Promise<any> {
  return env.SSO_SERVICE.getSubscriptionByPayment(paymentId);
}

export async function ssoCreateFreemiumSubscription(env: SsoEnv, data: any): Promise<any> {
  return env.SSO_SERVICE.createFreemiumSubscription(data);
}

export async function ssoRecordTransaction(env: SsoEnv, data: any): Promise<any> {
  return env.SSO_SERVICE.recordTransaction(data);
}

export interface SubscriptionPaymentInput {
  user_id: string; plan_id: string; organization_id?: string; organization_type?: string;
  razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature?: string;
  amount: number; currency: string; billing_cycle: 'monthly' | 'yearly';
  full_name: string; email: string; seat_count?: number; payment_method?: string;
}
export interface SubscriptionPaymentResult {
  subscription: Record<string, unknown>; transaction_id: string;
  already_fulfilled: boolean; is_upgrade: boolean; receipt_url?: string | null;
}
export async function ssoFulfillSubscriptionPayment(env: SsoEnv, data: SubscriptionPaymentInput): Promise<SubscriptionPaymentResult> {
  return env.SSO_SERVICE.fulfillSubscriptionPayment(data);
}
export async function ssoGetSubscriptionPaymentFulfillment(env: SsoEnv, data: Pick<SubscriptionPaymentInput,
  'user_id' | 'plan_id' | 'organization_id' | 'razorpay_order_id' | 'razorpay_payment_id' | 'amount' | 'currency'>): Promise<SubscriptionPaymentResult | null> {
  return env.SSO_SERVICE.getSubscriptionPaymentFulfillment(data);
}

export async function ssoUpdateTransaction(env: SsoEnv, transactionId: string, data: any): Promise<any> {
  if (typeof env.SSO_SERVICE.updateTransaction === 'function') {
    return env.SSO_SERVICE.updateTransaction(transactionId, data);
  }
  // Graceful fallback if method is not implemented on worker
  return { id: transactionId, ...data };
}

export interface SsoOAuthAuthenticateParams {
  provider: string;
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  picture?: string | null;
}

/** Mirrors the worker's SessionIssueRpcOutcome discriminated union. */
export type SsoOauthAuthenticateOutcome =
  | {
    kind: "issued";
    session: {
      accessToken: string;
      refreshToken: string;
      remainingLifetimeSeconds: number;
      identity: Record<string, unknown>;
    };
  }
  | { kind: "rejected"; code: string }
  | { kind: "rate_limited"; retryAfterSeconds?: number }
  | { kind: "timeout" }
  | { kind: "unavailable" }
  | { kind: "cancelled" };

export async function ssoOauthAuthenticate(
  env: SsoEnv,
  params: SsoOAuthAuthenticateParams,
): Promise<SsoOauthAuthenticateOutcome> {
  return env.SSO_SERVICE.oauthAuthenticate({
    ...params,
    correlationId: crypto.randomUUID(),
  });
}
