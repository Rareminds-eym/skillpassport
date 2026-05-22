import { supabase } from '@/shared/api';
import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organizationSubscription');

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  subscriptionPlanId: string;
  planName?: string;
  planCode?: string;
  purchasedBy: string;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  targetMemberType: 'educator' | 'learner' | 'both';
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  pricePerSeat: number;
  totalAmount: number;
  discountPercentage: number;
  finalAmount: number;
  razorpaySubscriptionId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface OrgSubscriptionPurchaseRequest {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  planId: string;
  seatCount: number;
  targetMemberType: 'educator' | 'learner' | 'both';
  billingCycle: 'monthly' | 'annual';
  autoRenew: boolean;
  paymentMethod: string;
}

export interface PricingBreakdown {
  basePrice: number;
  seatCount: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  pricePerSeat: number;
}

export interface RenewalOptions {
  seatCount?: number;
  autoRenew?: boolean;
  billingCycle?: 'monthly' | 'annual';
}

// ============================================================================
// Volume Discount Calculation
// ============================================================================

export function calculateVolumeDiscount(seatCount: number): number {
  if (seatCount >= 500) return 30;
  if (seatCount >= 100) return 20;
  if (seatCount >= 50) return 10;
  return 0;
}

export function calculateBulkPricing(
  basePricePerSeat: number,
  seatCount: number
): PricingBreakdown {
  const subtotal = basePricePerSeat * seatCount;
  const discountPercentage = calculateVolumeDiscount(seatCount);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * 0.18;
  const finalAmount = afterDiscount + taxAmount;

  return {
    basePrice: basePricePerSeat,
    seatCount,
    subtotal,
    discountPercentage,
    discountAmount,
    taxAmount,
    finalAmount,
    pricePerSeat: finalAmount / seatCount
  };
}

// ============================================================================
// Helpers
// ============================================================================

async function authenticatedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const origin = window.location.origin;
  return ssoClient.fetch(`${origin}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

// ============================================================================
// Service Class
// ============================================================================

export class OrganizationSubscriptionService {
  /**
   * Purchase a new organization subscription.
   * This initiates the Razorpay order flow via the backend API.
   * The actual subscription is created upon payment verification.
   */
  async purchaseSubscription(
    request: OrgSubscriptionPurchaseRequest
  ): Promise<{ orderId: string; key: string; amount: number }> {
    try {
      const { data: plan } = await supabase
        .from('plans_cache')
        .select('id, plan_code, name, pricing_matrix')
        .eq('id', request.planId)
        .single();

      if (!plan) throw new Error('Subscription plan not found');

      const pricing = calculateBulkPricing(
        (plan.pricing_matrix as any)?.[request.billingCycle] ?? 0,
        request.seatCount
      );

      const res = await authenticatedFetch('/api/payments/org-subscriptions/purchase', {
        method: 'POST',
        body: JSON.stringify({
          amount: Math.round(pricing.finalAmount * 100),
          org_id: request.organizationId,
          seat_count: request.seatCount,
          plan_id: plan.plan_code,
          plan_name: plan.name,
          currency: 'INR',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to create order');
      }

      return res.json();
    } catch (error) {
      logger.error('Error purchasing subscription', error as Error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for an organization (reads from subscription_cache)
   */
  async getOrganizationSubscriptions(
    organizationId: string,
    organizationType: 'school' | 'college' | 'university'
  ): Promise<OrganizationSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_cache')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('organization_type', organizationType)
        .eq('is_organization_subscription', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToOrganizationSubscription);
    } catch (error) {
      logger.error('Error fetching organization subscriptions', error as Error);
      throw error;
    }
  }

  /**
   * Get a single subscription by ID (reads from subscription_cache)
   */
  async getSubscriptionById(subscriptionId: string): Promise<OrganizationSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_cache')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error) throw error;

      return data ? this.mapToOrganizationSubscription(data) : null;
    } catch (error) {
      logger.error('Error fetching subscription', error as Error);
      throw error;
    }
  }

  /**
   * Update seat count for a subscription via backend API
   */
  async updateSeatCount(
    subscriptionId: string,
    newSeatCount: number
  ): Promise<OrganizationSubscription> {
    try {
      const current = await this.getSubscriptionById(subscriptionId);
      if (!current) throw new Error('Subscription not found');

      if (newSeatCount < current.assignedSeats) {
        throw new Error(
          `Cannot reduce seats below assigned count (${current.assignedSeats})`
        );
      }

      const res = await authenticatedFetch('/api/payments/update-subscription', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId,
          field: 'seat_count',
          value: newSeatCount,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to update seat count');
      }

      const updated = await this.getSubscriptionById(subscriptionId);
      if (!updated) throw new Error('Subscription not found after update');
      return updated;
    } catch (error) {
      logger.error('Error updating seat count', error as Error);
      throw error;
    }
  }

  /**
   * Cancel a subscription via backend API
   */
  async cancelSubscription(
    subscriptionId: string,
    reason: string
  ): Promise<void> {
    try {
      const res = await authenticatedFetch('/api/payments/cancel-subscription', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId,
          reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      logger.error('Error cancelling subscription', error as Error);
      throw error;
    }
  }

  /**
   * Renew a subscription via backend API
   */
  async renewSubscription(
    subscriptionId: string,
    options?: RenewalOptions
  ): Promise<OrganizationSubscription> {
    try {
      const res = await authenticatedFetch('/api/payments/renew-subscription', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId,
          ...options,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to renew subscription');
      }

      const updated = await this.getSubscriptionById(subscriptionId);
      if (!updated) throw new Error('Subscription not found after renewal');
      return updated;
    } catch (error) {
      logger.error('Error renewing subscription', error as Error);
      throw error;
    }
  }

  /**
   * Upgrade subscription to a higher plan via backend API
   */
  async upgradeSubscription(
    subscriptionId: string,
    newPlanId: string
  ): Promise<OrganizationSubscription> {
    try {
      const res = await authenticatedFetch('/api/payments/upgrade-subscription', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId,
          newPlanId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to upgrade subscription');
      }

      const updated = await this.getSubscriptionById(subscriptionId);
      if (!updated) throw new Error('Subscription not found after upgrade');
      return updated;
    } catch (error) {
      logger.error('Error upgrading subscription', error as Error);
      throw error;
    }
  }

  /**
   * Downgrade subscription to a lower plan
   */
  async downgradeSubscription(
    subscriptionId: string,
    newPlanId: string
  ): Promise<OrganizationSubscription> {
    return this.upgradeSubscription(subscriptionId, newPlanId);
  }

  /**
   * Map subscription_cache record to OrganizationSubscription interface
   */
  private mapToOrganizationSubscription(data: any): OrganizationSubscription {
    return {
      id: data.id,
      organizationId: data.organization_id,
      organizationType: data.organization_type,
      subscriptionPlanId: data.plan_id,
      planName: data.plan_name || 'Standard Plan',
      planCode: data.plan_code,
      purchasedBy: data.user_id,
      totalSeats: data.seat_count || 0,
      assignedSeats: data.assigned_seats || 0,
      availableSeats: (data.seat_count || 0) - (data.assigned_seats || 0),
      targetMemberType: data.target_member_type || 'both',
      status: data.status,
      startDate: data.subscription_start_date,
      endDate: data.subscription_end_date,
      autoRenew: data.auto_renew ?? false,
      pricePerSeat: parseFloat(data.price_per_seat || '0'),
      totalAmount: parseFloat(data.total_amount || data.plan_amount || '0'),
      discountPercentage: data.discount_percentage || 0,
      finalAmount: parseFloat(data.final_amount || data.plan_amount || '0'),
      razorpaySubscriptionId: data.razorpay_subscription_id,
      razorpayOrderId: data.razorpay_order_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      cancelledAt: data.cancelled_at,
      cancellationReason: data.cancellation_reason
    };
  }
}

// Export singleton instance
export const organizationSubscriptionService = new OrganizationSubscriptionService();
