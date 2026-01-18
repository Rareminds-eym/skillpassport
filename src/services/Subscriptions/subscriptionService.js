/**
 * Subscription Service (READ-ONLY)
 * 
 * This service handles READ operations for subscriptions using direct Supabase queries.
 * All WRITE operations (create, update, cancel, pause, resume) should go through
 * paymentsApiService → Cloudflare Worker for security and consistency.
 * 
 * READ OPERATIONS (this file):
 * - getActiveSubscription()     - Get user's active subscription (individual OR organization license)
 * - getUserSubscriptions()      - Get all user subscriptions (billing history)
 * - getSubscriptionPayments()   - Get payments for a subscription
 * - getUserPayments()           - Get all user payments
 * - checkActiveSubscription()   - Check if user has active subscription
 * 
 * WRITE OPERATIONS (use paymentsApiService):
 * - paymentsApiService.verifyPayment()         - Create subscription after payment
 * - paymentsApiService.deactivateSubscription() - Cancel subscription
 * - paymentsApiService.pauseSubscription()     - Pause subscription
 * - paymentsApiService.resumeSubscription()    - Resume subscription
 */

import { supabase } from '../../lib/supabaseClient';
import { checkAuthentication } from '../authService';

/**
 * Get active subscription for authenticated user
 * Checks BOTH individual subscriptions AND organization license assignments
 * Includes cancelled subscriptions that haven't expired yet (user retains access until end date)
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getActiveSubscription = async () => {
  try {
    const authResult = await checkAuthentication();

    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to view subscription'
      };
    }

    const userId = authResult.user.id;
    const now = new Date().toISOString();

    // ============================================================================
    // STEP 1: Check for organization license assignment FIRST
    // This allows members assigned by admins to have subscription access
    // ============================================================================
    const { data: licenseAssignment, error: licenseError } = await supabase
      .from('license_assignments')
      .select(`
        id,
        status,
        expires_at,
        assigned_at,
        organization_subscription_id,
        organization_subscriptions!inner (
          id,
          status,
          start_date,
          end_date,
          organization_id,
          organization_type,
          subscription_plan_id,
          subscription_plans (
            id,
            name,
            plan_code
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!licenseError && licenseAssignment) {
      const orgSub = licenseAssignment.organization_subscriptions;
      
      // Check if organization subscription is active and not expired
      if (orgSub && orgSub.status === 'active') {
        const orgEndDate = new Date(orgSub.end_date);
        
        if (orgEndDate > new Date()) {
          // Check if license assignment has its own expiry
          const licenseExpiry = licenseAssignment.expires_at ? new Date(licenseAssignment.expires_at) : null;
          const effectiveEndDate = licenseExpiry && licenseExpiry < orgEndDate ? licenseExpiry : orgEndDate;
          
          if (effectiveEndDate > new Date()) {
            // Build a subscription-like object for compatibility
            const orgSubscriptionData = {
              id: orgSub.id,
              user_id: userId,
              plan_id: orgSub.subscription_plan_id,
              plan_type: orgSub.subscription_plans?.name || 'Organization Plan',
              plan_code: orgSub.subscription_plans?.plan_code,
              status: 'active',
              subscription_start_date: orgSub.start_date,
              subscription_end_date: effectiveEndDate.toISOString(),
              auto_renew: false, // Org licenses don't auto-renew individually
              is_organization_license: true,
              organization_id: orgSub.organization_id,
              organization_type: orgSub.organization_type,
              license_assignment_id: licenseAssignment.id,
            };

            console.log(`✅ User ${userId} has active organization license from org ${orgSub.organization_id}`);
            return {
              success: true,
              data: orgSubscriptionData,
              error: null
            };
          }
        }
      }
    }

    // ============================================================================
    // STEP 1.5: Check if user had a revoked license assignment (show as expired)
    // This ensures members see "expired" status immediately when license is revoked
    // ============================================================================
    const { data: revokedLicense } = await supabase
      .from('license_assignments')
      .select(`
        id,
        status,
        revoked_at,
        organization_subscriptions (
          subscription_plans (
            name,
            plan_code
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'revoked')
      .order('revoked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // ============================================================================
    // STEP 2: Check for individual subscription (original logic)
    // ============================================================================

    // Query for active, paused, or cancelled (but not expired) subscription
    // For cancelled subscriptions, we still show them if end_date hasn't passed
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'paused', 'cancelled'])
      .gte('subscription_end_date', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching subscription:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    // If no active/valid subscription, try to get the most recent one for display purposes
    if (!data) {
      // If user had a revoked organization license, show as expired
      if (revokedLicense) {
        const revokedOrgSub = revokedLicense.organization_subscriptions;
        console.log(`⚠️ User ${userId} had revoked organization license`);
        return {
          success: true,
          data: {
            id: revokedLicense.id,
            user_id: userId,
            status: 'expired',
            plan_type: revokedOrgSub?.subscription_plans?.name || 'Organization License',
            plan_code: revokedOrgSub?.subscription_plans?.plan_code,
            is_organization_license: true,
            was_revoked: true,
            revoked_at: revokedLicense.revoked_at,
          },
          error: null
        };
      }

      const { data: recentSub, error: recentError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentError) {
        console.error('❌ Error fetching recent subscription:', recentError);
      }

      return {
        success: true,
        data: recentSub || null,
        error: null
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching subscription:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all subscriptions for authenticated user (billing history)
 * @param {boolean} includeAll - Whether to include all fields or just billing history fields
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getUserSubscriptions = async (includeAll = false) => {
  try {
    const authResult = await checkAuthentication();

    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to view subscriptions'
      };
    }

    const userId = authResult.user.id;

    // Optimize query - select only needed fields for billing history
    const selectFields = includeAll
      ? '*'
      : 'id,created_at,subscription_start_date,subscription_end_date,plan_amount,status,plan_type,billing_cycle,razorpay_payment_id';

    const { data, error } = await supabase
      .from('subscriptions')
      .select(selectFields)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20); // Limit to recent 20 for performance

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching subscriptions:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get payment transactions for a specific subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getSubscriptionPayments = async (subscriptionId) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching payments:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching payments:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all payment transactions for authenticated user
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getUserPayments = async () => {
  try {
    const authResult = await checkAuthentication();

    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated'
      };
    }

    const userId = authResult.user.id;

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching user payments:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching user payments:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Check if user has active subscription
 * Includes cancelled subscriptions that haven't expired (user retains access until end date)
 * @returns {Promise<{ hasSubscription: boolean, subscription: Object | null }>}
 */
export const checkActiveSubscription = async () => {
  try {
    const result = await getActiveSubscription();

    if (!result.success) {
      return {
        hasSubscription: false,
        subscription: null
      };
    }

    // Check if subscription is active, paused, or cancelled but not expired
    const isValid = result.data && (
      ['active', 'paused'].includes(result.data.status) ||
      (result.data.status === 'cancelled' && new Date(result.data.subscription_end_date) >= new Date())
    );

    return {
      hasSubscription: isValid,
      subscription: result.data
    };
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
    return {
      hasSubscription: false,
      subscription: null
    };
  }
};
