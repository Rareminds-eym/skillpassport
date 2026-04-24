/**
 * Type definitions for Payments API
 */

export interface PaymentsEnv {
  // Supabase
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Razorpay worker (Layer 1)
  RAZORPAY_WORKER_URL: string;
  RAZORPAY_SERVICE_SECRET: string;

  // Storage
  STORAGE_API_URL?: string;

  // Cron protection
  CRON_SECRET?: string;

  ENVIRONMENT?: string;
}

// ── Razorpay worker response shapes ──────────────────────────────────────────

export interface WorkerOrderResponse {
  success: true;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  };
  key_id: string;
}

export interface WorkerVerifyResponse {
  success: true;
  verified: boolean;
  message: string;
}

// ── Subscription plan shapes ──────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  plan_code: string;
  name: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  price_per_person?: number;
  is_active: boolean;
  features?: Record<string, unknown>;
  created_at: string;
}

export interface PlanFeature {
  id: string;
  plan_code: string;
  feature_key: string;
  feature_name: string;
  included: boolean;
  limit?: number;
  addon_price_monthly?: number;
  addon_price_yearly?: number;
}

// ── Subscription shapes ───────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  user_id: string;
  plan_id?: string;
  plan_type: string;
  plan_amount: number;
  billing_cycle: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  subscription_start_date: string;
  subscription_end_date: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  auto_renew: boolean;
  paused_at?: string;
  paused_until?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

// ── Add-on / entitlement shapes ───────────────────────────────────────────────

export interface AddonCatalogItem {
  feature_key: string;
  feature_name: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  category?: string;
}

export interface Bundle {
  id: string;
  name: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  is_active: boolean;
}

export interface BundleFeature {
  bundle_id: string;
  feature_key: string;
}

export interface UserEntitlement {
  id: string;
  user_id: string;
  feature_key: string;
  bundle_id?: string;
  status: 'active' | 'cancelled' | 'expired';
  billing_period: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  price_at_purchase: number;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AddonPendingOrder {
  id: string;
  user_id: string;
  order_id: string;
  feature_key?: string;
  bundle_id?: string;
  billing_period: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}
