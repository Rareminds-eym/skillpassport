/**
 * Payment Worker Binding Helper
 *
 * Provides typed access to the payment-worker via Cloudflare Service Binding RPC.
 * Replaces the old serviceJwt.ts (HTTP fetch + JWT signing).
 *
 * Usage:
 *   const worker = getPaymentWorker(env);
 *   const order = await worker.createOrder({ amount: 99900 });
 */

// ─── RPC Interface Types ────────────────────────────────────────────────────────
// These mirror the types exported from payment-worker/src/entrypoint.ts.
// Defined locally to avoid cross-project import issues (no shared package needed).

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentResult {
  verified: boolean;
  message: string;
}

export interface VerifyWebhookResult {
  verified: boolean;
  message: string;
  payload?: unknown;
}

export interface RazorpayOrder {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
  key_id?: string; // Injected by payment worker for frontend checkout
}

export interface RazorpayPayment {
  id: string;
  entity: 'payment';
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  method: string;
  captured: boolean;
  email?: string;
  contact?: string;
  created_at: number;
}

export interface RazorpaySubscription {
  id: string;
  entity: 'subscription';
  status: string;
  current_start?: number;
  current_end?: number;
  ended_at?: number;
  quantity: number;
  notes: Record<string, string>;
  created_at: number;
}

/**
 * Typed interface for the PaymentService RPC binding.
 * Mirrors the PaymentService WorkerEntrypoint methods.
 */
export interface PaymentWorkerBinding {
  createOrder(params: CreateOrderParams): Promise<RazorpayOrder>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<VerifyPaymentResult>;
  getPayment(paymentId: string): Promise<RazorpayPayment>;
  cancelSubscription(subscriptionId: string): Promise<RazorpaySubscription>;
  verifyWebhookSignature(body: string, signature: string): Promise<VerifyWebhookResult>;
}

// ─── Environment Interface ──────────────────────────────────────────────────────

/**
 * Environment interface for Pages Functions that need the payment worker binding.
 */
export interface PaymentWorkerEnv {
  /** Service binding to the payment-worker (razorpay-api) */
  PAYMENT_WORKER: PaymentWorkerBinding;
  
  /** Supabase connection */
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  /** Allow additional env vars */
  [key: string]: unknown;
}

import { apiError } from '../../../lib/response';

// ─── Helper Functions ───────────────────────────────────────────────────────────

/**
 * Get the typed payment worker binding from the environment.
 *
 * @param env - Pages Functions environment object
 * @returns Typed PaymentWorkerBinding stub for RPC calls
 * @throws Error if PAYMENT_WORKER binding is not configured
 *
 * @example
 * ```ts
 * const worker = getPaymentWorker(env);
 * const order = await worker.createOrder({ amount: 99900 });
 * ```
 */
export function getPaymentWorker(env: PaymentWorkerEnv): PaymentWorkerBinding {
  if (!env.PAYMENT_WORKER) {
    throw new Error(
      'PAYMENT_WORKER binding is not configured. ' +
      'Add [[services]] to wrangler.toml or use --service PAYMENT_WORKER=razorpay-api in local dev.'
    );
  }

  return env.PAYMENT_WORKER;
}

/**
 * Parse an RPC error message to extract the error code prefix.
 * PaymentService methods throw errors with format: "CODE: message"
 *
 * @param error - Error thrown by a PaymentService RPC method
 * @returns HTTP status code based on the error prefix
 */
export function rpcErrorToHttpStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);

  if (message.startsWith('INVALID_INPUT:')) return 400;
  if (message.startsWith('UNAUTHORIZED:')) return 422;
  if (message.startsWith('RAZORPAY_API_ERROR:')) return 502;
  if (message.startsWith('INTERNAL_ERROR:')) return 500;

  // Binding not configured or unknown error
  if (message.includes('binding is not configured')) return 503;

  return 500;
}

/**
 * Build a JSON error response from an RPC error.
 *
 * @param error - Error thrown by a PaymentService RPC method or binding helper
 * @param request - Original request for CORS header resolution
 * @returns Response with appropriate status code and structured error body
 */
export function rpcErrorResponse(error: unknown, request?: Request): Response {
  const message = error instanceof Error ? error.message : String(error);
  const status = rpcErrorToHttpStatus(error);

  // Extract code from "CODE: message" format
  const colonIndex = message.indexOf(':');
  const code = colonIndex > 0 ? message.slice(0, colonIndex).trim() : 'INTERNAL_ERROR';
  const detail = colonIndex > 0 ? message.slice(colonIndex + 1).trim() : message;

  return apiError(status, code, detail, request);
}
