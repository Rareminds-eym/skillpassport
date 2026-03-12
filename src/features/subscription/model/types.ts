/**
 * Subscription Feature Types
 */

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_type: string;
  plan_code?: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  subscription_start_date: string;
  subscription_end_date: string;
  auto_renew: boolean;
  plan_amount?: number;
  billing_cycle?: 'monthly' | 'annual';
  razorpay_payment_id?: string;
  is_organization_license?: boolean;
  organization_id?: string;
  organization_type?: string;
  license_assignment_id?: string;
  created_at?: string;
  updated_at?: string;
}

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

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  organization_type: 'school' | 'college' | 'company';
  subscription_plan_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  total_licenses: number;
  used_licenses: number;
  created_at?: string;
  updated_at?: string;
}

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

export interface AddOn {
  id: string;
  feature_key: string;
  feature_name: string;
  addon_description?: string;
  monthly_price?: number;
  annual_price?: number;
  is_active?: boolean;
}

export interface UserEntitlement {
  id: string;
  user_id: string;
  feature_key: string;
  status: 'active' | 'cancelled' | 'expired' | 'grace_period';
  start_date: string;
  end_date?: string;
  created_at?: string;
}
