/**
 * useSubscription Hook
 * 
 * Provides subscription data and management functions.
 * 
 * READ operations use subscriptionService (direct Supabase)
 * WRITE operations use paymentsApiService (via Cloudflare Worker)
 */

import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getActiveSubscription } from '../../services/Subscriptions/subscriptionService';
import paymentsApiService from '../../services/paymentsApiService';

// Plan features mapping
const PLAN_FEATURES = {
  basic: [
    'Access to basic skill assessments',
    'Limited profile visibility',
    'Basic analytics',
    'Email support'
  ],
  pro: [
    'All Basic features',
    'Advanced skill assessments',
    'Priority profile visibility',
    'Detailed analytics',
    'Priority support',
    'Personalized recommendations'
  ],
  enterprise: [
    'All Professional features',
    'Custom skill assessments',
    'Premium profile visibility',
    'Advanced analytics',
    '24/7 Premium support',
    'Custom integrations',
    'Dedicated account manager'
  ]
};

// Plan type to ID mapping
const PLAN_TYPE_MAP = {
  'basic': 'basic',
  'professional': 'pro',
  'enterprise': 'enterprise',
  'standard': 'basic',
  'premium': 'pro'
};

/**
 * Format subscription data for UI
 */
const formatSubscriptionData = (data) => {
  if (!data) return null;

  const planType = data.plan_type?.toLowerCase() || 'basic';
  const planId = PLAN_TYPE_MAP[planType] || 'basic';

  return {
    id: data.id,
    plan: planId,
    status: data.status,
    startDate: data.subscription_start_date,
    endDate: data.subscription_end_date,
    features: PLAN_FEATURES[planId] || [],
    autoRenew: data.auto_renew !== false,
    nextBillingDate: data.subscription_end_date,
    paymentStatus: data.status === 'active' ? 'success' : 'pending',
    planName: data.plan_type,
    planPrice: data.plan_amount,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    billingCycle: data.billing_cycle,
    razorpaySubscriptionId: data.razorpay_subscription_id,
    razorpayPaymentId: data.razorpay_payment_id,
    cancelledAt: data.cancelled_at,
    cancellationReason: data.cancellation_reason,
    pausedAt: data.paused_at,
    pausedUntil: data.paused_until,
  };
};

export const useSubscription = () => {
  const { user } = useSupabaseAuth();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getActiveSubscription();

      if (result.success && result.data) {
        setSubscriptionData(formatSubscriptionData(result.data));
      } else {
        setSubscriptionData(null);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch subscription details');
      console.error('❌ Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Get auth token helper
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  /**
   * Cancel subscription via Worker
   * @param {string} reason - Cancellation reason
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const cancelSubscription = useCallback(async (reason = 'other') => {
    if (!subscriptionData?.id) {
      return { success: false, error: 'No active subscription' };
    }

    try {
      setActionLoading(true);
      const token = await getToken();

      const result = await paymentsApiService.deactivateSubscription(
        subscriptionData.id,
        reason,
        token
      );

      if (result.success) {
        // Refresh subscription data
        await fetchSubscription();
        return { success: true };
      }

      return { success: false, error: result.error || 'Failed to cancel subscription' };
    } catch (err) {
      console.error('❌ Cancel subscription error:', err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [subscriptionData, fetchSubscription]);

  /**
   * Pause subscription via Worker
   * @param {number} months - Number of months to pause (1-3)
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const pauseSubscription = useCallback(async (months = 1) => {
    if (!subscriptionData?.id) {
      return { success: false, error: 'No active subscription' };
    }

    if (subscriptionData.status !== 'active') {
      return { success: false, error: 'Can only pause active subscriptions' };
    }

    try {
      setActionLoading(true);
      const token = await getToken();

      const result = await paymentsApiService.pauseSubscription(
        subscriptionData.id,
        months,
        token
      );

      if (result.success) {
        // Refresh subscription data
        await fetchSubscription();
        return { success: true, pausedUntil: result.paused_until };
      }

      return { success: false, error: result.error || 'Failed to pause subscription' };
    } catch (err) {
      console.error('❌ Pause subscription error:', err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [subscriptionData, fetchSubscription]);

  /**
   * Resume paused subscription via Worker
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const resumeSubscription = useCallback(async () => {
    if (!subscriptionData?.id) {
      return { success: false, error: 'No subscription found' };
    }

    if (subscriptionData.status !== 'paused') {
      return { success: false, error: 'Subscription is not paused' };
    }

    try {
      setActionLoading(true);
      const token = await getToken();

      const result = await paymentsApiService.resumeSubscription(
        subscriptionData.id,
        token
      );

      if (result.success) {
        // Refresh subscription data
        await fetchSubscription();
        return { success: true };
      }

      return { success: false, error: result.error || 'Failed to resume subscription' };
    } catch (err) {
      console.error('❌ Resume subscription error:', err);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [subscriptionData, fetchSubscription]);

  /**
   * Refresh subscription data
   */
  const refresh = useCallback(() => {
    return fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscriptionData,
    loading,
    error,
    actionLoading,
    // Actions
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    refresh,
    // Computed
    hasActiveSubscription: subscriptionData?.status === 'active',
    isPaused: subscriptionData?.status === 'paused',
    isCancelled: subscriptionData?.status === 'cancelled',
  };
};

export default useSubscription;
