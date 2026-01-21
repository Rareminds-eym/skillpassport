import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { getActiveSubscription } from '../../services/Subscriptions/subscriptionService';

// In-memory cache for subscription data
const subscriptionCache = {
  data: null,
  timestamp: null,
  userId: null,
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Optimized subscription hook with caching
 * Reduces unnecessary API calls and provides smooth loading states
 */
export const useSubscriptionOptimized = () => {
  const { user } = useSupabaseAuth();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const formatSubscriptionData = useCallback((data) => {
    const planTypeMap = {
      basic: 'basic',
      professional: 'pro',
      enterprise: 'enterprise',
    };

    const planFeatures = {
      basic: [
        'Access to basic skill assessments',
        'Limited profile visibility',
        'Basic analytics',
        'Email support',
      ],
      pro: [
        'All Basic features',
        'Advanced skill assessments',
        'Priority profile visibility',
        'Detailed analytics',
        'Priority support',
        'Personalized recommendations',
      ],
      enterprise: [
        'All Professional features',
        'Custom skill assessments',
        'Premium profile visibility',
        'Advanced analytics',
        '24/7 Premium support',
        'Custom integrations',
        'Dedicated account manager',
      ],
    };

    const planType = data.plan_type?.toLowerCase() || 'basic';
    const planId = planTypeMap[planType] || 'basic';

    return {
      plan: planId,
      status: data.status,
      startDate: data.subscription_start_date,
      endDate: data.subscription_end_date,
      features: planFeatures[planId] || [],
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
      cancelledAt: data.cancelled_at,
    };
  }, []);

  const fetchSubscription = useCallback(
    async (forceRefresh = false) => {
      if (!user) {
        setSubscriptionData(null);
        setLoading(false);
        return;
      }

      // Check cache first (unless force refresh)
      const now = Date.now();
      const isCacheValid =
        !forceRefresh &&
        subscriptionCache.data !== null &&
        subscriptionCache.userId === user.id &&
        subscriptionCache.timestamp &&
        now - subscriptionCache.timestamp < CACHE_DURATION;

      if (isCacheValid) {
        setSubscriptionData(subscriptionCache.data);
        setLoading(false);
        return;
      }

      // Prevent duplicate fetches
      if (fetchingRef.current) {
        return;
      }

      fetchingRef.current = true;

      try {
        const result = await getActiveSubscription();

        if (!isMountedRef.current) return;

        if (result.success && result.data) {
          const formattedData = formatSubscriptionData(result.data);

          // Update cache
          subscriptionCache.data = formattedData;
          subscriptionCache.userId = user.id;
          subscriptionCache.timestamp = Date.now();

          setSubscriptionData(formattedData);
        } else {
          subscriptionCache.data = null;
          subscriptionCache.userId = user.id;
          subscriptionCache.timestamp = Date.now();
          setSubscriptionData(null);
        }
        setError(null);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError('Failed to fetch subscription details');
        console.error('❌ Subscription fetch error:', err);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }
    },
    [user, formatSubscriptionData]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchSubscription();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchSubscription]);

  const refreshSubscription = useCallback(() => {
    setLoading(true);
    return fetchSubscription(true);
  }, [fetchSubscription]);

  const clearCache = useCallback(() => {
    subscriptionCache.data = null;
    subscriptionCache.timestamp = null;
    subscriptionCache.userId = null;
  }, []);

  return {
    subscriptionData,
    loading,
    error,
    refreshSubscription,
    clearCache,
    hasActiveSubscription: subscriptionData?.status === 'active',
  };
};

// Clear cache when user logs out
export const clearSubscriptionCache = () => {
  subscriptionCache.data = null;
  subscriptionCache.timestamp = null;
  subscriptionCache.userId = null;
};
