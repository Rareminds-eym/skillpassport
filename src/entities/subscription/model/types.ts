/**
 * Subscription Entity - Type Definitions
 * Core subscription interfaces and types for the application
 */

// ============================================================================
// Core Subscription Types
// ============================================================================

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period';

export type BillingCycle = 'monthly' | 'annual' | 'lifetime';

export type OrganizationType = 'school' | 'college' | 'university' | 'company';

export type MemberType = 'educator' | 'learner' | 'both';

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_type: string;
  plan_code?: string;
  status: SubscriptionStatus;
  subscription_start_date: string;
  subscription_end_date: string;
  auto_renew: boolean;
  plan_amount?: number;
  billing_cycle?: BillingCycle;
  razorpay_payment_id?: string;
  is_organization_license?: boolean;
  organization_id?: string;
  organization_type?: string;
  license_assignment_id?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Subscription Plan Types
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  plan_code: string;
  description?: string;
  features?: string[];
  monthly_price?: number;
  annual_price?: number;
  is_active?: boolean;
  created_at?: string;
}

// ============================================================================
// Organization Subscription Types
// ============================================================================

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  organization_type: OrganizationType;
  subscription_plan_id: string;
  plan_name?: string;
  purchased_by: string;
  total_seats: number;
  assigned_seats: number;
  available_seats: number;
  target_member_type: MemberType;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  price_per_seat: number;
  total_amount: number;
  discount_percentage: number;
  final_amount: number;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface OrgSubscriptionPurchaseRequest {
  organization_id: string;
  organization_type: OrganizationType;
  plan_id: string;
  seat_count: number;
  target_member_type: MemberType;
  billing_cycle: BillingCycle;
  auto_renew: boolean;
  payment_method: string;
}

export interface PricingBreakdown {
  base_price: number;
  seat_count: number;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  price_per_seat: number;
}

export interface RenewalOptions {
  seat_count?: number;
  auto_renew?: boolean;
  billing_cycle?: BillingCycle;
}

// ============================================================================
// License Management Types
// ============================================================================

export interface LicensePool {
  id: string;
  organization_subscription_id: string;
  name: string;
  description?: string;
  total_seats: number;
  used_seats: number;
  member_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LicenseAssignment {
  id: string;
  user_id: string;
  organization_subscription_id: string;
  license_pool_id?: string;
  status: 'active' | 'revoked' | 'expired';
  assigned_at: string;
  expires_at?: string;
  revoked_at?: string;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  created_at?: string;
}

// ============================================================================
// Add-On Types
// ============================================================================

export interface AddOn {
  id: string;
  feature_key: string;
  feature_name: string;
  addon_description?: string;
  monthly_price?: number;
  annual_price?: number;
  is_active?: boolean;
}

// ============================================================================
// Entitlement Types
// ============================================================================

export interface UserEntitlement {
  id: string;
  user_id: string;
  feature_key: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date?: string;
  created_at?: string;
}

// ============================================================================
// Subscription Statistics Types
// ============================================================================

export interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  cancelled_subscriptions: number;
  total_revenue: number;
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  churn_rate: number;
}

// ============================================================================
// Subscription Filter Types
// ============================================================================

export interface SubscriptionFilters {
  user_id?: string;
  organization_id?: string;
  status?: SubscriptionStatus[];
  plan_id?: string;
  billing_cycle?: BillingCycle[];
  date_range?: {
    start: string;
    end: string;
  };
}
