/**
 * Subscription Entity - Validation Logic
 */

import type {
  Subscription,
  SubscriptionStatus,
  BillingCycle,
  OrganizationType,
  MemberType,
  OrganizationSubscription,
  OrgSubscriptionPurchaseRequest
} from '@/shared/types';

// ============================================================================
// Subscription Status Validation
// ============================================================================

const VALID_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'active',
  'paused',
  'cancelled',
  'expired',
  'grace_period'
];

export function isValidSubscriptionStatus(status: string): status is SubscriptionStatus {
  return VALID_SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatus);
}

// ============================================================================
// Billing Cycle Validation
// ============================================================================

const VALID_BILLING_CYCLES: BillingCycle[] = ['monthly', 'annual'];

export function isValidBillingCycle(cycle: string): cycle is BillingCycle {
  return VALID_BILLING_CYCLES.includes(cycle as BillingCycle);
}

// ============================================================================
// Organization Type Validation
// ============================================================================

const VALID_ORGANIZATION_TYPES: OrganizationType[] = ['school', 'college', 'university', 'company'];

export function isValidOrganizationType(type: string): type is OrganizationType {
  return VALID_ORGANIZATION_TYPES.includes(type as OrganizationType);
}

// ============================================================================
// Member Type Validation
// ============================================================================

const VALID_MEMBER_TYPES: MemberType[] = ['educator', 'student', 'both'];

export function isValidMemberType(type: string): type is MemberType {
  return VALID_MEMBER_TYPES.includes(type as MemberType);
}

// ============================================================================
// Subscription Validation
// ============================================================================

export function validateSubscription(subscription: Partial<Subscription>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!subscription.user_id) {
    errors.push('User ID is required');
  }

  if (!subscription.plan_id) {
    errors.push('Plan ID is required');
  }

  if (!subscription.subscription_start_date) {
    errors.push('Start date is required');
  } else {
    const startDate = new Date(subscription.subscription_start_date);
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date');
    }
  }

  if (!subscription.subscription_end_date) {
    errors.push('End date is required');
  } else {
    const endDate = new Date(subscription.subscription_end_date);
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date');
    } else if (subscription.subscription_start_date) {
      const startDate = new Date(subscription.subscription_start_date);
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
    }
  }

  if (subscription.status && !isValidSubscriptionStatus(subscription.status)) {
    errors.push('Invalid subscription status');
  }

  if (subscription.billing_cycle && !isValidBillingCycle(subscription.billing_cycle)) {
    errors.push('Invalid billing cycle');
  }

  if (subscription.plan_amount !== undefined && subscription.plan_amount < 0) {
    errors.push('Plan amount cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Organization Subscription Validation
// ============================================================================

export function validateOrganizationSubscription(
  subscription: Partial<OrganizationSubscription>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!subscription.organization_id) {
    errors.push('Organization ID is required');
  }

  if (!subscription.organization_type) {
    errors.push('Organization type is required');
  } else if (!isValidOrganizationType(subscription.organization_type)) {
    errors.push('Invalid organization type');
  }

  if (!subscription.subscription_plan_id) {
    errors.push('Subscription plan ID is required');
  }

  if (!subscription.purchased_by) {
    errors.push('Purchaser ID is required');
  }

  if (subscription.total_seats === undefined || subscription.total_seats < 1) {
    errors.push('Total seats must be at least 1');
  }

  if (!subscription.target_member_type) {
    errors.push('Target member type is required');
  } else if (!isValidMemberType(subscription.target_member_type)) {
    errors.push('Invalid target member type');
  }

  if (!subscription.start_date) {
    errors.push('Start date is required');
  }

  if (!subscription.end_date) {
    errors.push('End date is required');
  }

  if (subscription.price_per_seat !== undefined && subscription.price_per_seat < 0) {
    errors.push('Price per seat cannot be negative');
  }

  if (subscription.total_amount !== undefined && subscription.total_amount < 0) {
    errors.push('Total amount cannot be negative');
  }

  if (subscription.discount_percentage !== undefined) {
    if (subscription.discount_percentage < 0 || subscription.discount_percentage > 100) {
      errors.push('Discount percentage must be between 0 and 100');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Purchase Request Validation
// ============================================================================

export function validatePurchaseRequest(
  request: Partial<OrgSubscriptionPurchaseRequest>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.organization_id) {
    errors.push('Organization ID is required');
  }

  if (!request.organization_type) {
    errors.push('Organization type is required');
  } else if (!isValidOrganizationType(request.organization_type)) {
    errors.push('Invalid organization type');
  }

  if (!request.plan_id) {
    errors.push('Plan ID is required');
  }

  if (request.seat_count === undefined || request.seat_count < 1) {
    errors.push('Seat count must be at least 1');
  }

  if (!request.target_member_type) {
    errors.push('Target member type is required');
  } else if (!isValidMemberType(request.target_member_type)) {
    errors.push('Invalid target member type');
  }

  if (!request.billing_cycle) {
    errors.push('Billing cycle is required');
  } else if (!isValidBillingCycle(request.billing_cycle)) {
    errors.push('Invalid billing cycle');
  }

  if (!request.payment_method) {
    errors.push('Payment method is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Seat Count Validation
// ============================================================================

export function validateSeatCount(
  assignedSeats: number,
  totalSeats: number
): {
  valid: boolean;
  error?: string;
} {
  if (assignedSeats < 0) {
    return { valid: false, error: 'Assigned seats cannot be negative' };
  }

  if (assignedSeats > totalSeats) {
    return { valid: false, error: 'Assigned seats cannot exceed total seats' };
  }

  return { valid: true };
}

export function canAssignMoreSeats(
  assignedSeats: number,
  totalSeats: number,
  additionalSeats: number
): boolean {
  return assignedSeats + additionalSeats <= totalSeats;
}
