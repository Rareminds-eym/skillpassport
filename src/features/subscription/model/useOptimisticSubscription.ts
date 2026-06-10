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
import { ssoClient } from '@/shared/api/ssoClient';
import { extractErrorMessage } from '../api/paymentsApiService';

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
    async (planCode: string = PLAN_IDS.FREEMIUM) => {
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
        // Step 3: Make actual API call (auth handled automatically by ssoClient.fetch)
        const response = await ssoClient.fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            email, 
            amount: 0, 
            planId: planCode,
            planName: 'freemium'
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(extractErrorMessage(errorData) || 'Failed to create subscription');
        }

        const envelope = await response.json();

        // apiSuccess wraps data at { success, data: { ... } }.
        // For freemium, the handler returns apiSuccess({ isFreemium: true, data: { ...subscription } }),
        // so the subscription lives at envelope.data.data.
        const body = envelope.data;
        const subscriptionData = body && body.data ? body.data : body;

        // Step 4: Replace optimistic with actual data
        setOptimisticSub(null);
        queryClient.setQueryData(['subscription', userId], (old: any) => ({
          ...old,
          subscription: subscriptionData,
          planCode: subscriptionData?.planCode,
          status: subscriptionData?.status,
        }));

        // Invalidate to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ['subscription', userId] });

        if (onSuccess) {
          onSuccess(subscriptionData);
        }

        return subscriptionData;
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
