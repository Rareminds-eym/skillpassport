/**
 * RPC type definitions for Cloudflare service bindings
 * Minimal typed surface for SSO_SERVICE used by heal-user + get-active-subscription
 */

export interface SsoWorkerRpc {
  getSubscriptionPaymentFulfillment(input: Pick<import('./sso-client').SubscriptionPaymentInput,
    'user_id' | 'plan_id' | 'organization_id' | 'razorpay_order_id' | 'razorpay_payment_id' | 'amount' | 'currency'>): Promise<import('./sso-client').SubscriptionPaymentResult | null>;
  fulfillSubscriptionPayment(input: import('./sso-client').SubscriptionPaymentInput): Promise<import('./sso-client').SubscriptionPaymentResult>;
  getCurrentSubscriptionExecution(accessToken: string, subscriptionId: string, productId: string): Promise<unknown>;
  getSubscriptionActionContext(accessToken: string, subscriptionId: string, productId: string): Promise<unknown>;
  getSubscriptionAudit(accessToken: string, subscriptionId: string, productId: string, cursor: string | null): Promise<unknown>;
  prepareSubscriptionRetakeSettlement(accessToken: string, productId: string, request: { subscriptionId: string; settlementId: string; referenceId: string }): Promise<unknown>;
  executeSubscriptionCommerce(accessToken: string, productId: string, operationId: string, request: unknown): Promise<unknown>;
  registerSubscriptionCommerceEntryContract(accessToken: string, productId: string, contract: unknown): Promise<unknown>;
  listSubscriptionExecutions(accessToken: string, productId: string, cursor: string | null): Promise<unknown>;
  listPublishedCatalogForAdministration(accessToken: string, productId: string,
    features: readonly { key: string; type: string; options?: readonly string[] }[], cursor: string | null): Promise<unknown>;
  listPublishedSubscriptionPlans(accessToken: string, productId: string,
    features: readonly { key: string; type: string; options?: readonly string[] }[], cursor: string | null): Promise<unknown>;
  prepareSubscriptionCreditExecution(accessToken: string, productId: string, request: unknown,
    features: readonly { key: string; type: string; options?: readonly string[] }[]): Promise<unknown>;
  executeSubscriptionLifecycle(accessToken: string, productId: string, operationId: string, request: unknown): Promise<unknown>;
  // User lookups
  getUserByEmail(email: string): Promise<{ id: string; email: string; is_email_verified: boolean } | null>;
  getSubscriptionCatalogInventory(): Promise<unknown>;
  getSubscriptionPlanAuthoringContext(planId: string): Promise<unknown>;
  getSubscriptionCreditAuthoringContext(planId: string): Promise<unknown>;
  stageSubscriptionPlanRevisionBundle(accessToken: string, bundle: unknown, productId: string,
    features: readonly { key: string; type: string }[]): Promise<unknown>;
  prepareSubscriptionPlanPublication(accessToken: string, planId: string, revisionId: string,
    productId: string, features: readonly { id: string; key: string; type: string; options?: readonly string[] }[]): Promise<unknown>;
  publishSubscriptionPlanRevision(accessToken: string, planId: string, revisionId: string,
    expectedPreviousRevisionId: string | null, productId: string,
    features: readonly { id: string; key: string; type: string; options?: readonly string[] }[]): Promise<unknown>;
  installSubscriptionCatalog(accessToken: string, productId: string, request: unknown,
    features: readonly { id: string; key: string; type: string; options?: readonly string[] }[]): Promise<unknown>;
  makeSubscriptionCatalogAvailable(accessToken: string, productId: string, request: unknown,
    features: readonly { id: string; key: string; type: string; options?: readonly string[] }[]): Promise<unknown>;
  retireLegacySubscriptionCatalog(accessToken: string, productId: string, request: unknown): Promise<unknown>;
  adoptHybridCatalogOffer(accessToken: string, productId: string, request: unknown,
    features: readonly { id: string; key: string; type: string; options?: readonly string[] }[]): Promise<unknown>;
  getUserById(userId: string): Promise<{ id: string; email: string; is_email_verified: boolean; is_blocked: boolean; user_metadata: Record<string, unknown> | null; created_at: string; last_login_at: string | null } | null>;
  getOrganizationById(orgId: string): Promise<{ id: string; name: string; slug: string | null; metadata: Record<string, unknown> | null; created_at: string } | null>;
  getUserMemberships(userId: string): Promise<{ memberships: { id: string; org_id: string; role: string; roles?: string[]; status: string }[] }>;
  // Subscriptions
  getUserSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  syncSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  syncPlans(): Promise<{ plans: Record<string, unknown>[] }>;
  listRoles(): Promise<{ roles: { id: string; name: string; description: string | null }[] }>;
  // Generic fallback for other RPCs
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface PaymentWorkerRpc {
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface EmailWorkerRpc {
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface EmbeddingWorkerRpc {
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface RealtimeEventsQueue {
  send(message: unknown): Promise<void>;
  sendBatch(messages: unknown[]): Promise<void>;
}
