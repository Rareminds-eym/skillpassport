/**
 * RPC Type Definitions for Service Bindings
 * 
 * This file defines the complete RPC interfaces for all Cloudflare Workers
 * that the SkillPassport application communicates with via service bindings.
 * 
 * These types ensure type safety across Worker-to-Worker RPC calls.
 */

// ─── SSO Worker RPC Interface ─────────────────────────────────────────

export interface SsoWorkerRpc {
    // Authentication methods
    resetPassword(payload: { token: string; password: string }, ip?: string, ua?: string): Promise<{ reset: boolean }>;
    forgotPassword(email: string): Promise<{ success: boolean }>;
    validateSession(refreshToken: string): Promise<{ valid: boolean; roles: string[] }>;

    // Subscription methods
    syncSubscription(userId: string): Promise<{ subscription: any; plan: any }>;
    syncPlans(): Promise<{ plans: any[] }>;
    createSubscription(payload: {
        user_id: string;
        plan_id: string;
        plan_type: string;
        plan_amount: number;
        subscription_start_date: string;
        subscription_end_date: string;
        auto_renew: boolean;
    }): Promise<any>;
    updateSubscriptionField(id: string, fields: Record<string, any>): Promise<any>;
    recordTransaction(payload: {
        user_id: string;
        subscription_id: string;
        transaction_id: string;
        payment_method: string;
        amount: number;
        currency: string;
        status: string;
        payment_gateway?: string;
    }): Promise<any>;

    // User methods
    checkEmailExists(email: string): Promise<{ exists: boolean }>;
    deleteUser(userId: string): Promise<void>;
    getUserById(userId: string): Promise<any>;

    // Organization methods
    getOrganization(orgId: string): Promise<any>;

    // Addon & Bundle methods
    listAddonCatalog(): Promise<any[]>;
    getAddonByFeatureKey(featureKey: string): Promise<any>;
    listBundles(): Promise<any[]>;
}

// ─── Payment Worker RPC Interface ─────────────────────────────────────

export interface PaymentWorkerRpc {
    // Order creation
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

    // Payment verification
    verifyPaymentSignature(
        orderId: string,
        paymentId: string,
        signature: string
    ): Promise<{ verified: boolean }>;

    // Payment details
    getPayment(paymentId: string): Promise<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        captured: boolean;
        order_id?: string;
    }>;

    // Subscription management (Razorpay)
    createSubscription(payload: {
        plan_id: string;
        customer_id: string;
        quantity?: number;
        notes?: Record<string, string>;
    }): Promise<any>;

    cancelSubscription(subscriptionId: string): Promise<{ cancelled: boolean }>;

    // Refund
    createRefund(paymentId: string, amount?: number): Promise<any>;
}

// ─── Realtime Worker RPC Interface ────────────────────────────────────

export interface RealtimeWorkerRpc {
    // Broadcast messages
    broadcast(payload: {
        channel: string;
        event: string;
        data: any;
    }): Promise<{ success: boolean }>;

    // Presence
    updatePresence(payload: {
        channel: string;
        userId: string;
        status: 'online' | 'offline' | 'away';
        metadata?: Record<string, any>;
    }): Promise<{ success: boolean }>;

    getPresence(channel: string): Promise<{
        users: Array<{
            userId: string;
            status: string;
            metadata?: Record<string, any>;
        }>;
    }>;
}

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
