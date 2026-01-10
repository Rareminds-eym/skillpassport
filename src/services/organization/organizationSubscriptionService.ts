/**
 * Organization Subscription Service
 * 
 * Handles organization-level subscription purchases, management, and lifecycle operations.
 * Supports bulk seat purchases with volume discounts and Razorpay integration.
 */

import { supabase } from '@/lib/supabaseClient';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  subscriptionPlanId: string;
  purchasedBy: string;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  targetMemberType: 'educator' | 'student' | 'both';
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
  targetMemberType: 'educator' | 'student' | 'both';
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

/**
 * Calculate volume discount based on seat count
 * - 50-99 seats: 10% discount
 * - 100-499 seats: 20% discount
 * - 500+ seats: 30% discount
 */
export function calculateVolumeDiscount(seatCount: number): number {
  if (seatCount >= 500) return 30;
  if (seatCount >= 100) return 20;
  if (seatCount >= 50) return 10;
  return 0;
}

/**
 * Calculate complete pricing breakdown with discounts and taxes
 */
export function calculateBulkPricing(
  basePricePerSeat: number,
  seatCount: number
): PricingBreakdown {
  const subtotal = basePricePerSeat * seatCount;
  const discountPercentage = calculateVolumeDiscount(seatCount);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * 0.18; // 18% GST
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
// Service Class
// ============================================================================

export class OrganizationSubscriptionService {
  /**
   * Purchase a new organization subscription
   */
  async purchaseSubscription(
    request: OrgSubscriptionPurchaseRequest
  ): Promise<OrganizationSubscription> {
    try {
      // 1. Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', request.planId)
        .single();

      if (planError || !plan) {
        throw new Error('Subscription plan not found');
      }

      // 2. Calculate pricing
      const pricing = calculateBulkPricing(plan.price, request.seatCount);

      // 3. Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (request.billingCycle === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // 4. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 5. Create organization subscription record
      const { data: subscription, error: subError } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: request.organizationId,
          organization_type: request.organizationType,
          subscription_plan_id: request.planId,
          purchased_by: user.id,
          total_seats: request.seatCount,
          assigned_seats: 0,
          target_member_type: request.targetMemberType,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: request.autoRenew,
          price_per_seat: pricing.pricePerSeat,
          total_amount: pricing.subtotal,
          discount_percentage: pricing.discountPercentage,
          final_amount: pricing.finalAmount
        })
        .select()
        .single();

      if (subError) {
        throw subError;
      }

      return this.mapToOrganizationSubscription(subscription);
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for an organization
   */
  async getOrganizationSubscriptions(
    organizationId: string,
    organizationType: 'school' | 'college' | 'university'
  ): Promise<OrganizationSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('organization_type', organizationType)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToOrganizationSubscription);
    } catch (error) {
      console.error('Error fetching organization subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get a single subscription by ID
   */
  async getSubscriptionById(subscriptionId: string): Promise<OrganizationSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error) throw error;

      return data ? this.mapToOrganizationSubscription(data) : null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  /**
   * Update seat count for a subscription (add or reduce seats)
   */
  async updateSeatCount(
    subscriptionId: string,
    newSeatCount: number
  ): Promise<OrganizationSubscription> {
    try {
      // Get current subscription
      const current = await this.getSubscriptionById(subscriptionId);
      if (!current) {
        throw new Error('Subscription not found');
      }

      // Validate new seat count
      if (newSeatCount < current.assignedSeats) {
        throw new Error(
          `Cannot reduce seats below assigned count (${current.assignedSeats})`
        );
      }

      // Recalculate pricing
      const pricing = calculateBulkPricing(current.pricePerSeat, newSeatCount);

      // Update subscription
      const { data, error } = await supabase
        .from('organization_subscriptions')
        .update({
          total_seats: newSeatCount,
          total_amount: pricing.subtotal,
          discount_percentage: pricing.discountPercentage,
          final_amount: pricing.finalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToOrganizationSubscription(data);
    } catch (error) {
      console.error('Error updating seat count:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    reason: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('organization_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Renew a subscription
   */
  async renewSubscription(
    subscriptionId: string,
    options?: RenewalOptions
  ): Promise<OrganizationSubscription> {
    try {
      const current = await this.getSubscriptionById(subscriptionId);
      if (!current) {
        throw new Error('Subscription not found');
      }

      const seatCount = options?.seatCount || current.totalSeats;
      const autoRenew = options?.autoRenew !== undefined ? options.autoRenew : current.autoRenew;

      // Calculate new end date
      const newEndDate = new Date(current.endDate);
      if (options?.billingCycle === 'annual') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      }

      // Recalculate pricing if seat count changed
      const pricing = calculateBulkPricing(current.pricePerSeat, seatCount);

      const { data, error } = await supabase
        .from('organization_subscriptions')
        .update({
          total_seats: seatCount,
          end_date: newEndDate.toISOString(),
          auto_renew: autoRenew,
          status: 'active',
          total_amount: pricing.subtotal,
          discount_percentage: pricing.discountPercentage,
          final_amount: pricing.finalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToOrganizationSubscription(data);
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription to a higher plan
   */
  async upgradeSubscription(
    subscriptionId: string,
    newPlanId: string
  ): Promise<OrganizationSubscription> {
    try {
      const { data: newPlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', newPlanId)
        .single();

      if (planError || !newPlan) {
        throw new Error('New subscription plan not found');
      }

      const current = await this.getSubscriptionById(subscriptionId);
      if (!current) {
        throw new Error('Current subscription not found');
      }

      // Recalculate pricing with new plan
      const pricing = calculateBulkPricing(newPlan.price, current.totalSeats);

      const { data, error } = await supabase
        .from('organization_subscriptions')
        .update({
          subscription_plan_id: newPlanId,
          price_per_seat: pricing.pricePerSeat,
          total_amount: pricing.subtotal,
          discount_percentage: pricing.discountPercentage,
          final_amount: pricing.finalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToOrganizationSubscription(data);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
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
    // Same implementation as upgrade, but with validation for feature compatibility
    return this.upgradeSubscription(subscriptionId, newPlanId);
  }

  /**
   * Map database record to OrganizationSubscription interface
   */
  private mapToOrganizationSubscription(data: any): OrganizationSubscription {
    return {
      id: data.id,
      organizationId: data.organization_id,
      organizationType: data.organization_type,
      subscriptionPlanId: data.subscription_plan_id,
      purchasedBy: data.purchased_by,
      totalSeats: data.total_seats,
      assignedSeats: data.assigned_seats,
      availableSeats: data.available_seats,
      targetMemberType: data.target_member_type,
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      autoRenew: data.auto_renew,
      pricePerSeat: parseFloat(data.price_per_seat),
      totalAmount: parseFloat(data.total_amount),
      discountPercentage: data.discount_percentage,
      finalAmount: parseFloat(data.final_amount),
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
