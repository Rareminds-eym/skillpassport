/**
 * Type definitions for Payments API
 */

export interface Env {
  // Supabase
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  
  // Razorpay
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  RAZORPAY_MODE?: string;
  RAZORPAY_KEY_ID_TEST?: string;
  RAZORPAY_KEY_SECRET_TEST?: string;
  VITE_RAZORPAY_KEY_ID?: string;
  
  // Service bindings (not used in Functions)
  EMAIL_SERVICE?: any;
  STORAGE_SERVICE?: any;
  STORAGE_API_URL?: string;
  EMAIL_API_URL?: string;
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
  isUpgrade?: boolean;
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

export interface SubscriptionAccessResponse {
  success: boolean;
  hasAccess: boolean;
  accessReason: 'active' | 'paused' | 'grace_period' | 'expired' | 'cancelled' | 'no_subscription';
  subscription: any | null;
  showWarning: boolean;
  warningType?: 'expiring_soon' | 'grace_period' | 'paused';
  warningMessage?: string;
  daysUntilExpiry?: number;
  expiresAt?: string;
}
