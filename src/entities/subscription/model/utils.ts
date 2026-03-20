/**
 * Subscription Entity - Utility Functions
 */

import type {
import { formatSubscriptionDate } from '..\..\..\shared\lib\format';
import { formatPrice } from '..\..\..\shared\lib\format';
  Subscription,
  SubscriptionStatus,
  BillingCycle,
  OrganizationType,
  MemberType,
  OrganizationSubscription,
  SubscriptionStats,
  PricingBreakdown
} from './types';

// ============================================================================
// Subscription Status Utilities
// ============================================================================

export function getSubscriptionStatusDisplayName(status: SubscriptionStatus): string {
  const displayNames: Record<SubscriptionStatus, string> = {
    active: 'Active',
    paused: 'Paused',
    cancelled: 'Cancelled',
    expired: 'Expired',
    grace_period: 'Grace Period'
  };
  return displayNames[status] || status;
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    active: 'green',
    paused: 'yellow',
    cancelled: 'red',
    expired: 'gray',
    grace_period: 'orange'
  };
  return colors[status] || 'gray';
}

// ============================================================================
// Billing Cycle Utilities
// ============================================================================

export function getBillingCycleDisplayName(cycle: BillingCycle): string {
  const displayNames: Record<BillingCycle, string> = {
    monthly: 'Monthly',
    annual: 'Annual'
  };
  return displayNames[cycle] || cycle;
}

export function getBillingCycleMonths(cycle: BillingCycle): number {
  return cycle === 'monthly' ? 1 : 12;
}

// ============================================================================
// Organization Type Utilities
// ============================================================================

export function getOrganizationTypeDisplayName(type: OrganizationType): string {
  const displayNames: Record<OrganizationType, string> = {
    school: 'School',
    college: 'College',
    university: 'University',
    company: 'Company'
  };
  return displayNames[type] || type;
}

// ============================================================================
// Member Type Utilities
// ============================================================================

export function getMemberTypeDisplayName(type: MemberType): string {
  const displayNames: Record<MemberType, string> = {
    educator: 'Educator',
    student: 'Student',
    both: 'Both Educators & Students'
  };
  return displayNames[type] || type;
}

// ============================================================================
// Subscription Validity Utilities
// ============================================================================

export function isSubscriptionActive(subscription: Subscription): boolean {
  return subscription.status === 'active';
}

export function isSubscriptionExpired(subscription: Subscription): boolean {
  if (subscription.status === 'expired') return true;
  return new Date(subscription.subscription_end_date) < new Date();
}

export function getDaysUntilExpiry(subscription: Subscription): number | null {
  const now = new Date().getTime();
  const endDate = new Date(subscription.subscription_end_date).getTime();
  const diff = endDate - now;
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(subscription: Subscription, daysThreshold: number = 30): boolean {
  const daysUntil = getDaysUntilExpiry(subscription);
  return daysUntil !== null && daysUntil > 0 && daysUntil <= daysThreshold;
}

export function formatExpiryDate(subscription: Subscription): string {
  if (isSubscriptionExpired(subscription)) {
    return 'Expired';
  }
  
  const daysUntil = getDaysUntilExpiry(subscription);
  if (daysUntil === null) return 'No expiry';
  
  if (daysUntil <= 0) return 'Expired';
  if (daysUntil === 1) return 'Expires tomorrow';
  if (daysUntil <= 7) return `Expires in ${daysUntil} days`;
  if (daysUntil <= 30) return `Expires in ${Math.ceil(daysUntil / 7)} weeks`;
  
  return new Date(subscription.subscription_end_date).toLocaleDateString();
}

// ============================================================================
// Organization Subscription Utilities
// ============================================================================

export function getAvailableSeats(subscription: OrganizationSubscription): number {
  return subscription.total_seats - subscription.assigned_seats;
}

export function getSeatUtilizationPercentage(subscription: OrganizationSubscription): number {
  if (subscription.total_seats === 0) return 0;
  return Math.round((subscription.assigned_seats / subscription.total_seats) * 100);
}

export function hasAvailableSeats(subscription: OrganizationSubscription): boolean {
  return getAvailableSeats(subscription) > 0;
}

export function canAssignSeats(
  subscription: OrganizationSubscription,
  count: number
): boolean {
  return getAvailableSeats(subscription) >= count;
}

// ============================================================================
// Pricing Utilities
// ============================================================================

export function calculatePricing(
  basePrice: number,
  seatCount: number,
  discountPercentage: number = 0,
  taxPercentage: number = 0
): PricingBreakdown {
  const subtotal = basePrice * seatCount;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * taxPercentage) / 100;
  const finalAmount = afterDiscount + taxAmount;
  const pricePerSeat = finalAmount / seatCount;

  return {
    base_price: basePrice,
    seat_count: seatCount,
    subtotal,
    discount_percentage: discountPercentage,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    final_amount: finalAmount,
    price_per_seat: pricePerSeat
  };
}
}

export function calculateAnnualSavings(monthlyPrice: number, annualPrice: number): number {
  const annualCostIfMonthly = monthlyPrice * 12;
  return annualCostIfMonthly - annualPrice;
}

export function calculateSavingsPercentage(monthlyPrice: number, annualPrice: number): number {
  const savings = calculateAnnualSavings(monthlyPrice, annualPrice);
  const annualCostIfMonthly = monthlyPrice * 12;
  return Math.round((savings / annualCostIfMonthly) * 100);
}

// ============================================================================
// Subscription Filtering Utilities
// ============================================================================

export function filterSubscriptionsByStatus(
  subscriptions: Subscription[],
  statuses: SubscriptionStatus[]
): Subscription[] {
  if (statuses.length === 0) return subscriptions;
  return subscriptions.filter(s => statuses.includes(s.status));
}

export function filterActiveSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter(s => isSubscriptionActive(s));
}

export function filterExpiredSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter(s => isSubscriptionExpired(s));
}

export function filterExpiringSubscriptions(
  subscriptions: Subscription[],
  daysThreshold: number = 30
): Subscription[] {
  return subscriptions.filter(s => isExpiringSoon(s, daysThreshold));
}

// ============================================================================
// Subscription Sorting Utilities
// ============================================================================

export function sortSubscriptionsByEndDate(
  subscriptions: Subscription[],
  order: 'asc' | 'desc' = 'asc'
): Subscription[] {
  return [...subscriptions].sort((a, b) => {
    const dateA = new Date(a.subscription_end_date).getTime();
    const dateB = new Date(b.subscription_end_date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function sortSubscriptionsByStartDate(
  subscriptions: Subscription[],
  order: 'asc' | 'desc' = 'desc'
): Subscription[] {
  return [...subscriptions].sort((a, b) => {
    const dateA = new Date(a.subscription_start_date).getTime();
    const dateB = new Date(b.subscription_start_date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

// ============================================================================
// Subscription Statistics Utilities
// ============================================================================

export function calculateSubscriptionStats(
  subscriptions: Subscription[]
): SubscriptionStats {
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired').length;
  const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled').length;

  let totalRevenue = 0;
  let monthlyRecurringRevenue = 0;
  let annualRecurringRevenue = 0;

  subscriptions.forEach(sub => {
    if (sub.plan_amount && sub.status === 'active') {
      totalRevenue += sub.plan_amount;
      
      if (sub.billing_cycle === 'monthly') {
        monthlyRecurringRevenue += sub.plan_amount;
        annualRecurringRevenue += sub.plan_amount * 12;
      } else if (sub.billing_cycle === 'annual') {
        annualRecurringRevenue += sub.plan_amount;
        monthlyRecurringRevenue += sub.plan_amount / 12;
      }
    }
  });

  const churnRate = subscriptions.length > 0
    ? (cancelledSubscriptions / subscriptions.length) * 100
    : 0;

  return {
    total_subscriptions: subscriptions.length,
    active_subscriptions: activeSubscriptions,
    expired_subscriptions: expiredSubscriptions,
    cancelled_subscriptions: cancelledSubscriptions,
    total_revenue: totalRevenue,
    monthly_recurring_revenue: monthlyRecurringRevenue,
    annual_recurring_revenue: annualRecurringRevenue,
    churn_rate: Math.round(churnRate * 10) / 10
  };
}

// ============================================================================
// Date Utilities
// ============================================================================

export function calculateEndDate(startDate: string, billingCycle: BillingCycle): string {
  const start = new Date(startDate);
  const months = getBillingCycleMonths(billingCycle);
  
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  
  return end.toISOString();
}


export function getSubscriptionDuration(subscription: Subscription): number {
  const start = new Date(subscription.subscription_start_date).getTime();
  const end = new Date(subscription.subscription_end_date).getTime();
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}
