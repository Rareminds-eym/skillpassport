/// <reference types="@cloudflare/workers-types" />

/**
 * RPC Type Definitions for Service Bindings
 *
 * This file defines the complete RPC interfaces for all Cloudflare Workers
 * that the SkillPassport application communicates with via service bindings.
 *
 * These types ensure type safety across Worker-to-Worker RPC calls.
 *
 * AUTO-GENERATION NOTE: These interfaces mirror the actual classes in each
 * Worker's source. If you update a Worker's RPC method signature, update
 * the corresponding interface here. Use `wrangler types` for binding-level
 * types; this file adds RPC method-level typing beyond what `wrangler types` provides.
 */

// ─── SSO Worker RPC Interface ─────────────────────────────────────────
// Source: sso-worker/src/index.ts (SsoWorker class)

export interface SsoWorkerRpc {
  // Auth
  getMe(accessToken: string): Promise<Record<string, unknown>>;
  getJWKS(): Promise<{ keys: any[] }>;
  login(params: { email?: string; password?: string; ip?: string; ua?: string }): Promise<any>;
  refreshSession(refreshToken: string, ip?: string, ua?: string): Promise<{ access_token: string; refresh_token: string }>;
  validateSession(refreshToken: string): Promise<{ valid: boolean; roles: string[] }>;
  forgotPassword(params: { email?: string; redirect_url?: string }, ip?: string, ua?: string): Promise<{ message?: string }>;
  resetPassword(params: { token?: string; password?: string }, ip?: string, ua?: string): Promise<{ reset?: boolean }>;
  logoutSession(refreshToken: string, ip?: string, ua?: string): Promise<{ success: boolean }>;

  // User lookup
  getUserByEmail(email: string): Promise<{ id: string; email: string; is_email_verified: boolean } | null>;

  // Subscription management
  createSubscription(data: {
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
  }): Promise<Record<string, unknown>>;
  createFreemiumSubscription(data: { user_id: string; email: string; full_name?: string }): Promise<Record<string, unknown>>;
  getUserSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  getOrgSubscription(orgId: string): Promise<{ subscriptions: Record<string, unknown>[] }>;
  updateSubscriptionStatus(subscriptionId: string, data: { status: string; cancellation_reason?: string; cancellation_feedback?: string; cancelled_by?: string; paused_until?: string; receipt_url?: string }): Promise<Record<string, unknown>>;
  getSalesSubscriptions(searchParamsStr: string): Promise<any>;
  cancelSubscription(subscriptionId: string, data?: { reason?: string; feedback?: string; cancelled_by?: string }): Promise<Record<string, unknown>>;
  updateSubscriptionField(subscriptionId: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;

  // Transactions
  recordTransaction(data: {
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
    receipt?: string;
    receipt_url?: string;
    notes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  getUserTransactions(userId: string, subscriptionId?: string): Promise<Record<string, unknown>[]>;

  // Sync operations
  syncSubscription(userId: string): Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
  syncPlans(): Promise<{ plans: Record<string, unknown>[] }>;
  syncReconcile(userIds: string[]): Promise<{ subscriptions: Record<string, unknown>[] }>;
  listRoles(): Promise<{ roles: { id: string; name: string; description: string | null }[] }>;

  // Addon / Bundle
  recordAddonPurchase(data: {
    user_id: string;
    feature_key: string;
    billing_period: string;
    price_at_purchase: number;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Record<string, unknown>>;
  recordBundlePurchase(data: {
    user_id: string;
    bundle_id: string;
    billing_period: string;
    price_at_purchase: number;
    discount_applied?: number;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Record<string, unknown>>;
  listAddonCatalog(): Promise<any>;
  getAddonByFeatureKey(featureKey: string): Promise<any>;
  listBundles(): Promise<any>;

  // Membership
  getUserMemberships(userId: string): Promise<{ memberships: { id: string; org_id: string; role: string; status: string }[] }>;
  createMembership(data: { user_id: string; org_id: string; status: string }): Promise<{ id: string; status: string }>;
  updateMembershipStatus(data: { membership_id: string; status: string }): Promise<{ success: boolean }>;
  assignMembershipRole(data: { membership_id: string; role_id: string }): Promise<{ success: boolean }>;
}

// ─── Payment Worker RPC Interface ─────────────────────────────────────

export interface PaymentWorkerRpc {
  createOrder(payload: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  }>;

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<{ verified: boolean }>;

  getPayment(paymentId: string): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    captured: boolean;
    order_id?: string;
  }>;

  createSubscription(payload: {
    plan_id: string;
    customer_id: string;
    quantity?: number;
    notes?: Record<string, string>;
  }): Promise<any>;

  cancelSubscription(subscriptionId: string): Promise<{ cancelled: boolean }>;

  createRefund(paymentId: string, amount?: number): Promise<any>;
}

// ─── Realtime Worker RPC Interface ────────────────────────────────────
// NOTE: Realtime Worker is now accessed directly via Durable Object binding
// (REALTIME_HUB) from Pages Functions. No RPC interface needed.

// ─── Embedding Worker RPC Interface ───────────────────────────────────

export interface EmbeddingWorkerRpc {
  getEmbedding(input: unknown, taskTypeStr?: string): Promise<number[]>;

  batchEmbeddings(inputs: unknown[], taskTypeStr?: string): Promise<number[][]>;
}

// ─── Email Worker RPC Interface ───────────────────────────────────────

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  metadata?: Record<string, unknown>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  customMessageId?: string;
  recipient?: string | string[];
  timestamp?: string;
  error?: string;
  errorCode?: string;
  errorType?: string;
  shouldRetry?: boolean;
}

export interface SendOtpRequest {
  mobileNumber: string;
  countryCode?: string;
  flowType?: 'SMS' | 'WHATSAPP' | 'RCS';
}

export interface OtpResponse {
  success: boolean;
  verificationId?: string;
  timeout?: string;
  message?: string;
  error?: string;
  retryAfter?: number;
}

export interface VerifyOtpRequest {
  mobileNumber: string;
  verificationId: string;
  code: string;
  countryCode?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  message?: string;
  error?: string;
  retryAfter?: number;
}

export interface EmailWorkerRpc {
  sendEmail(payload: SendEmailPayload): Promise<EmailResponse>;
  sendOTP(request: SendOtpRequest): Promise<OtpResponse>;
  verifyOTP(request: VerifyOtpRequest): Promise<VerifyOtpResponse>;
}

// ─── Queue Bindings (Type-safe) ───────────────────────────────────────

export interface RealtimeEventsQueue extends Queue<{
  type: 'message' | 'presence' | 'notification';
  channel: string;
  userId?: string;
  data: any;
  timestamp: string;
}> { }

export interface SsoReverseSyncQueue extends Queue<{
  type: 'user.created' | 'user.updated' | 'organization.created' | 'membership.created';
  userId?: string;
  orgId?: string;
  data: any;
  timestamp: string;
}> { }
