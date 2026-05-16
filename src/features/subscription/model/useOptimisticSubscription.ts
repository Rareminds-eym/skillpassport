/**
 * useOptimisticSubscription Hook
 * 
 * Provides optimistic UI updates for subscription operations.
 * Updates the UI immediately while the API call is in progress,
 * then reconciles with the actual server response.
 */

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createOptimisticSubscription, type OptimisticSubscription } from '../lib/optimisticUpdates';
import { PLAN_IDS } from '@/shared/config/subscriptionPlans';

interface UseOptimisticSubscriptionOptions {
  userId: string;
  email: string;
  onSuccess?: (subscription: any) => void;
  onError?: (error: Error) => void;
}

export function useOptimisticSubscription({
  userId,
  email,
  onSuccess,
  onError,
}: UseOptimisticSubscriptionOptions) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [optimisticSub, setOptimisticSub] = useState<OptimisticSubscription | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCreatingRef = useRef(false);

  /**
   * Create a freemium subscription with optimistic updates
   */
  const createFreemiumSubscription = useCallback(
    async (planCode: string = PLAN_IDS.PAY_AS_YOU_GO) => {
      // Atomic check to prevent duplicate requests
      if (isCreatingRef.current) {
        console.warn('[useOptimisticSubscription] Already creating subscription');
        return;
      }
      isCreatingRef.current = true;

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsCreating(true);

      // Step 1: Create optimistic subscription immediately
      const optimistic = createOptimisticSubscription(userId, planCode);
      setOptimisticSub(optimistic);

      // Step 2: Optimistically update the query cache
      queryClient.setQueryData(['subscription', userId], (old: any) => ({
        ...old,
        subscription: optimistic,
        planCode: optimistic.planCode,
        status: optimistic.status,
      }));

      try {
        // Step 3: Make actual API call
        const response = await fetch('/api/payments/create-freemium-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create subscription');
        }

        const data = await response.json();

        // Step 4: Replace optimistic with actual data
        setOptimisticSub(null);
        queryClient.setQueryData(['subscription', userId], (old: any) => ({
          ...old,
          subscription: data.subscription,
          planCode: data.subscription.planCode,
          status: data.subscription.status,
        }));

        // Invalidate to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ['subscription', userId] });

        if (onSuccess) {
          onSuccess(data.subscription);
        }

        return data.subscription;
      } catch (error) {
        // Step 5: Rollback optimistic update on error
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[useOptimisticSubscription] Request aborted');
          return;
        }

        console.error('[useOptimisticSubscription] Error:', error);
        setOptimisticSub(null);

        // Rollback query cache
        queryClient.setQueryData(['subscription', userId], (old: any) => ({
          ...old,
          subscription: null,
        }));

        if (onError) {
          onError(error instanceof Error ? error : new Error('Unknown error'));
        }

        throw error;
      } finally {
        setIsCreating(false);
        isCreatingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [userId, email, isCreating, queryClient, onSuccess, onError]
  );

  /**
   * Cancel any pending subscription creation
   */
  const cancelCreation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsCreating(false);
    isCreatingRef.current = false;
    setOptimisticSub(null);
  }, []);

  return {
    createFreemiumSubscription,
    cancelCreation,
    isCreating,
    optimisticSubscription: optimisticSub,
  };
}
