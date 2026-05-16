/**
 * Optimistic UI Updates for Subscription Operations
 * 
 * Provides utilities for implementing optimistic updates during subscription
 * creation and modification to improve perceived performance.
 */

import { PLAN_IDS } from '@/shared/config/subscriptionPlans';

export interface OptimisticSubscription {
  id: string;
  userId: string;
  planCode: string;
  status: 'active' | 'pending';
  startDate: string;
  endDate: string | null;
  isOptimistic: boolean;
}

/**
 * Create an optimistic subscription object for immediate UI updates
 */
export function createOptimisticSubscription(
  userId: string,
  planCode: string = PLAN_IDS.PAY_AS_YOU_GO
): OptimisticSubscription {
  return {
    id: `optimistic-${Date.now()}`,
    userId,
    planCode,
    status: 'pending',
    startDate: new Date().toISOString(),
    endDate: null,
    isOptimistic: true,
  };
}

/**
 * Merge optimistic subscription with actual subscription data
 */
export function mergeSubscriptionData(
  optimistic: OptimisticSubscription | null,
  actual: any
): any {
  if (!optimistic) return actual;
  if (actual && !actual.isOptimistic) return actual;
  return optimistic;
}

/**
 * Check if subscription is optimistic (pending confirmation)
 */
export function isOptimisticSubscription(subscription: any): boolean {
  return subscription?.isOptimistic === true || subscription?.status === 'pending';
}

/**
 * Create optimistic update handler for subscription creation
 */
export function createOptimisticSubscriptionHandler(
  userId: string,
  onOptimisticUpdate: (subscription: OptimisticSubscription) => void,
  onSuccess: (subscription: any) => void,
  onError: (error: Error) => void
) {
  return async (planCode: string = PLAN_IDS.PAY_AS_YOU_GO) => {
    // Step 1: Create optimistic subscription
    const optimisticSub = createOptimisticSubscription(userId, planCode);
    onOptimisticUpdate(optimisticSub);

    try {
      // Step 2: Make actual API call
      const response = await fetch('/api/payments/create-freemium-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: '' }), // Email will be fetched from user context
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      
      // Step 3: Replace optimistic with actual data
      onSuccess(data.subscription);
    } catch (error) {
      // Step 4: Rollback optimistic update on error
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };
}

/**
 * Debounce function for optimistic updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
