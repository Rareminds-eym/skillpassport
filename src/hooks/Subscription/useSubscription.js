import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { getActiveSubscription } from '../../services/subscriptionService';

export const useSubscription = () => {
  const { user } = useSupabaseAuth();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const result = await getActiveSubscription();
        
        
        if (result.success && result.data) {
          
          // Map plan_type to plan ID
          const planTypeMap = {
            'basic': 'basic',
            'professional': 'pro',
            'enterprise': 'enterprise'
          };
          
          // Define features based on plan type
          const planFeatures = {
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
          
          const planType = result.data.plan_type?.toLowerCase() || 'basic';
          const planId = planTypeMap[planType] || 'basic';
          
          // Transform database data to match UI expectations
          const formattedData = {
            id: result.data.id, // Subscription ID for cancellation
            plan: planId,
            status: result.data.status,
            startDate: result.data.subscription_start_date,
            endDate: result.data.subscription_end_date,
            features: planFeatures[planId] || [],
            autoRenew: result.data.auto_renew !== false,
            nextBillingDate: result.data.subscription_end_date,
            paymentStatus: result.data.status === 'active' ? 'success' : 'pending',
            planName: result.data.plan_type,
            planPrice: result.data.plan_amount,
            fullName: result.data.full_name,
            email: result.data.email,
            phone: result.data.phone,
            billingCycle: result.data.billing_cycle,
            razorpaySubscriptionId: result.data.razorpay_subscription_id,
            cancelledAt: result.data.cancelled_at,
            cancellationReason: result.data.cancellation_reason
          };
          setSubscriptionData(formattedData);
        } else {
          setSubscriptionData(null);
        }
      } catch (err) {
        setError('Failed to fetch subscription details');
        console.error('❌ Subscription fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const renewSubscription = async () => {
    // Implement subscription renewal logic
  };

  const cancelSubscription = async () => {
    // Implement subscription cancellation logic
  };

  const toggleAutoRenew = async () => {
    // Implement auto-renew toggle logic
  };

  return {
    subscriptionData,
    loading,
    error,
    renewSubscription,
    cancelSubscription,
    toggleAutoRenew
  };
};