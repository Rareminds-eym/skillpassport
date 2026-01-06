/**
 * Type definitions for Payments API Worker
 */

export interface Env {
  // Supabase - support both naming conventions
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // Legacy VITE_ prefixed names (fallback)
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  // Razorpay
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  // Test mode credentials (optional)
  TEST_RAZORPAY_KEY_ID?: string;
  TEST_RAZORPAY_KEY_SECRET?: string;
  // Legacy VITE_ prefixed names (fallback)
  VITE_RAZORPAY_KEY_ID?: string;
  // Service binding to email-api worker
  EMAIL_SERVICE?: Fetcher;
  // Service binding to storage-api worker (for worker-to-worker communication)
  STORAGE_SERVICE?: Fetcher;
  // Storage API URL for receipt uploads (fallback for external calls)
  STORAGE_API_URL?: string;
}

export interface PaymentDetails {
  paymentId: string;
  orderId: string;
  amount: number;
  planName: string;
  billingCycle: string;
  subscriptionEndDate: string;
  receiptUrl?: string;
}

export interface ReceiptData {
  paymentId: string;
  orderId: string;
  amount: number;
  planName: string;
  billingCycle: string;
  subscriptionEndDate: string;
  userName: string;
  userEmail: string;
  paymentMethod: string;
  paymentDate: string;
}

export interface CreateOrderBody {
  amount?: number;
  currency?: string;
  planId?: string;
  planName?: string;
  userEmail?: string;
  userName?: string;
}

export interface VerifyPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId: string;
  planName: string;
  billingCycle?: string;
  amount: number;
  userEmail?: string;
  userName?: string;
}
