/**
 * EntitlementService
 * 
 * Service for managing user entitlements for add-on subscriptions including:
 * - Getting user entitlements
 * - Checking feature access (plan OR add-on entitlement)
 * - Activating add-ons and bundles
 * - Cancelling add-ons
 * - Managing auto-renewal
 * - Calculating total costs
 * 
 * @requirement REQ-3.2 - Entitlement Service
 */

import { supabase } from '../lib/supabaseClient';

class EntitlementService {
  /**
   * Get all entitlements for a user
   * 
   * @param {string} userId - The user's UUID
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getUserEntitlements(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const { data, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user entitlements:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getUserEntitlements:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has access to a feature
   * Access is granted if:
   * 1. User's subscription plan includes the feature (is_included = true), OR
   * 2. User has an active entitlement for that feature_key
   * 
   * @param {string} userId - The user's UUID
   * @param {string} featureKey - The feature_key to check
   * @returns {Promise<{success: boolean, data?: {hasAccess: boolean, accessSource: 'plan'|'addon'|'bundle'|null}, error?: string}>}
   */
  async hasFeatureAccess(userId, featureKey) {
    try {
      if (!userId || !featureKey) {
        return { success: false, error: 'User ID and feature key are required' };
      }

      console.log(`[EntitlementService] Checking access for user ${userId}, feature ${featureKey}`);

      // First, check if user has an active subscription plan that includes this feature
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      console.log(`[EntitlementService] Subscription query result:`, { subscription, subError });

      if (!subError && subscription?.plan_id) {
        // Check if the plan includes this feature
        const { data: planFeature, error: featureError } = await supabase
          .from('subscription_plan_features')
          .select('is_included')
          .eq('plan_id', subscription.plan_id)
          .eq('feature_key', featureKey)
          .single();

        console.log(`[EntitlementService] Plan feature check:`, { planFeature, featureError });

        if (!featureError && planFeature?.is_included) {
          console.log(`[EntitlementService] Access granted via plan for ${featureKey}`);
          return {
            success: true,
            data: { hasAccess: true, accessSource: 'plan' }
          };
        }
      }

      // Check for active add-on entitlement
      const { data: entitlement, error: entError } = await supabase
        .from('user_entitlements')
        .select('id, bundle_id, status, end_date')
        .eq('user_id', userId)
        .eq('feature_key', featureKey)
        .in('status', ['active', 'grace_period'])
        .gte('end_date', new Date().toISOString())
        .maybeSingle();

      console.log(`[EntitlementService] Entitlement check:`, { entitlement, entError });

      if (!entError && entitlement) {
        const accessSource = entitlement.bundle_id ? 'bundle' : 'addon';
        console.log(`[EntitlementService] Access granted via ${accessSource} for ${featureKey}`);
        return {
          success: true,
          data: { hasAccess: true, accessSource }
        };
      }

      console.log(`[EntitlementService] No access for ${featureKey}`);
      return {
        success: true,
        data: { hasAccess: false, accessSource: null }
      };
    } catch (error) {
      console.error('Error in hasFeatureAccess:', error);
      return { success: false, error: error.message };
    }
  }


  /**
   * Activate an add-on for a user
   * Creates a new entitlement record
   * 
   * @param {string} userId - The user's UUID
   * @param {string} featureKey - The feature_key to activate
   * @param {'monthly'|'annual'} billingPeriod - The billing period
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async activateAddOn(userId, featureKey, billingPeriod) {
    try {
      if (!userId || !featureKey || !billingPeriod) {
        return { success: false, error: 'User ID, feature key, and billing period are required' };
      }

      if (!['monthly', 'annual'].includes(billingPeriod)) {
        return { success: false, error: 'Billing period must be "monthly" or "annual"' };
      }

      // Get the add-on details to get the price
      const { data: addOn, error: addOnError } = await supabase
        .from('subscription_plan_features')
        .select('feature_key, addon_price_monthly, addon_price_annual')
        .eq('feature_key', featureKey)
        .eq('is_addon', true)
        .single();

      if (addOnError || !addOn) {
        return { success: false, error: 'ADD_ON_NOT_FOUND' };
      }

      // Calculate end date based on billing period
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (billingPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Get the price based on billing period
      const price = billingPeriod === 'monthly' 
        ? addOn.addon_price_monthly 
        : addOn.addon_price_annual;

      // Create the entitlement
      const { data: entitlement, error: insertError } = await supabase
        .from('user_entitlements')
        .insert({
          user_id: userId,
          feature_key: featureKey,
          status: 'active',
          billing_period: billingPeriod,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: true,
          price_at_purchase: price
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating entitlement:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, data: entitlement };
    } catch (error) {
      console.error('Error in activateAddOn:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Activate a bundle for a user
   * Creates entitlements for all features in the bundle
   * 
   * @param {string} userId - The user's UUID
   * @param {string} bundleId - The bundle UUID
   * @param {'monthly'|'annual'} billingPeriod - The billing period
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async activateBundle(userId, bundleId, billingPeriod) {
    try {
      if (!userId || !bundleId || !billingPeriod) {
        return { success: false, error: 'User ID, bundle ID, and billing period are required' };
      }

      if (!['monthly', 'annual'].includes(billingPeriod)) {
        return { success: false, error: 'Billing period must be "monthly" or "annual"' };
      }

      // Get the bundle with its features
      const { data: bundle, error: bundleError } = await supabase
        .from('bundles')
        .select('*, bundle_features(feature_key)')
        .eq('id', bundleId)
        .eq('is_active', true)
        .single();

      if (bundleError || !bundle) {
        return { success: false, error: 'BUNDLE_NOT_FOUND' };
      }

      const featureKeys = bundle.bundle_features?.map(bf => bf.feature_key) || [];
      
      if (featureKeys.length === 0) {
        return { success: false, error: 'Bundle has no features' };
      }

      // Calculate end date based on billing period
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (billingPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Get the bundle price based on billing period
      const bundlePrice = billingPeriod === 'monthly' 
        ? bundle.monthly_price 
        : bundle.annual_price;

      // Calculate price per feature (distribute bundle price across features)
      const pricePerFeature = bundlePrice / featureKeys.length;

      // Create entitlements for all features in the bundle
      const entitlements = featureKeys.map(featureKey => ({
        user_id: userId,
        feature_key: featureKey,
        bundle_id: bundleId,
        status: 'active',
        billing_period: billingPeriod,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: true,
        price_at_purchase: pricePerFeature
      }));

      const { data: createdEntitlements, error: insertError } = await supabase
        .from('user_entitlements')
        .insert(entitlements)
        .select();

      if (insertError) {
        console.error('Error creating bundle entitlements:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, data: createdEntitlements };
    } catch (error) {
      console.error('Error in activateBundle:', error);
      return { success: false, error: error.message };
    }
  }


  /**
   * Cancel an add-on entitlement
   * Sets status to 'cancelled' and records cancellation time
   * Access is maintained until end_date
   * 
   * @param {string} entitlementId - The entitlement UUID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async cancelAddOn(entitlementId) {
    try {
      if (!entitlementId) {
        return { success: false, error: 'Entitlement ID is required' };
      }

      const { data: entitlement, error } = await supabase
        .from('user_entitlements')
        .update({
          status: 'cancelled',
          auto_renew: false,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', entitlementId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'ENTITLEMENT_NOT_FOUND' };
        }
        console.error('Error cancelling entitlement:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: entitlement };
    } catch (error) {
      console.error('Error in cancelAddOn:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle auto-renewal for an entitlement
   * 
   * @param {string} entitlementId - The entitlement UUID
   * @param {boolean} autoRenew - Whether to enable auto-renewal
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async toggleAutoRenew(entitlementId, autoRenew) {
    try {
      if (!entitlementId) {
        return { success: false, error: 'Entitlement ID is required' };
      }

      if (typeof autoRenew !== 'boolean') {
        return { success: false, error: 'Auto-renew must be a boolean value' };
      }

      const { data: entitlement, error } = await supabase
        .from('user_entitlements')
        .update({
          auto_renew: autoRenew,
          updated_at: new Date().toISOString()
        })
        .eq('id', entitlementId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'ENTITLEMENT_NOT_FOUND' };
        }
        console.error('Error toggling auto-renew:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: entitlement };
    } catch (error) {
      console.error('Error in toggleAutoRenew:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate total cost of all active entitlements for a user
   * Returns both monthly and annual equivalent costs
   * 
   * @param {string} userId - The user's UUID
   * @returns {Promise<{success: boolean, data?: {monthly: number, annual: number}, error?: string}>}
   */
  async calculateTotalCost(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Get all active entitlements for the user
      const { data: entitlements, error } = await supabase
        .from('user_entitlements')
        .select('price_at_purchase, billing_period')
        .eq('user_id', userId)
        .in('status', ['active', 'grace_period']);

      if (error) {
        console.error('Error fetching entitlements for cost calculation:', error);
        return { success: false, error: error.message };
      }

      let monthlyTotal = 0;
      let annualTotal = 0;

      (entitlements || []).forEach(ent => {
        const price = parseFloat(ent.price_at_purchase) || 0;
        
        if (ent.billing_period === 'monthly') {
          monthlyTotal += price;
          annualTotal += price * 12;
        } else if (ent.billing_period === 'annual') {
          monthlyTotal += price / 12;
          annualTotal += price;
        }
      });

      return {
        success: true,
        data: {
          monthly: Math.round(monthlyTotal * 100) / 100,
          annual: Math.round(annualTotal * 100) / 100
        }
      };
    } catch (error) {
      console.error('Error in calculateTotalCost:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply grace period to an entitlement (for failed renewals)
   * Extends access by 7 days with 'grace_period' status
   * 
   * @param {string} entitlementId - The entitlement UUID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async applyGracePeriod(entitlementId) {
    try {
      if (!entitlementId) {
        return { success: false, error: 'Entitlement ID is required' };
      }

      // Get current entitlement
      const { data: current, error: fetchError } = await supabase
        .from('user_entitlements')
        .select('end_date')
        .eq('id', entitlementId)
        .single();

      if (fetchError || !current) {
        return { success: false, error: 'ENTITLEMENT_NOT_FOUND' };
      }

      // Extend end_date by 7 days
      const newEndDate = new Date(current.end_date);
      newEndDate.setDate(newEndDate.getDate() + 7);

      const { data: entitlement, error } = await supabase
        .from('user_entitlements')
        .update({
          status: 'grace_period',
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', entitlementId)
        .select()
        .single();

      if (error) {
        console.error('Error applying grace period:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: entitlement };
    } catch (error) {
      console.error('Error in applyGracePeriod:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get entitlements expiring within a specified number of days
   * Useful for sending renewal reminders
   * 
   * @param {number} daysUntilExpiry - Number of days until expiry
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getExpiringEntitlements(daysUntilExpiry) {
    try {
      if (typeof daysUntilExpiry !== 'number' || daysUntilExpiry < 0) {
        return { success: false, error: 'Days until expiry must be a positive number' };
      }

      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + daysUntilExpiry);

      const { data, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .in('status', ['active', 'grace_period'])
        .gte('end_date', now.toISOString())
        .lte('end_date', futureDate.toISOString())
        .order('end_date', { ascending: true });

      if (error) {
        console.error('Error fetching expiring entitlements:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getExpiringEntitlements:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has access to a feature (simplified boolean return)
   * Used by FeatureGate component
   * 
   * @param {string} userId - The user's UUID
   * @param {string} featureKey - The feature_key to check
   * @returns {Promise<boolean>} - Whether user has access
   */
  async checkFeatureAccess(userId, featureKey) {
    const result = await this.hasFeatureAccess(userId, featureKey);
    return result.success && result.data?.hasAccess === true;
  }

  /**
   * Get add-on details by feature key
   * Used by FeatureGate component to display pricing
   * 
   * @param {string} featureKey - The feature_key to look up
   * @returns {Promise<Object|null>} - Add-on details or null
   */
  async getAddonByFeatureKey(featureKey) {
    try {
      const { data, error } = await supabase
        .from('subscription_plan_features')
        .select('id, feature_key, feature_name, category, addon_price_monthly, addon_price_annual, addon_description, icon_url')
        .eq('feature_key', featureKey)
        .eq('is_addon', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching addon by feature key:', error);
        return null;
      }

      if (!data) return null;

      // Transform to expected format
      return {
        id: data.id,
        feature_key: data.feature_key,
        name: data.feature_name,
        description: data.addon_description,
        category: data.category,
        price_monthly: parseFloat(data.addon_price_monthly) || 199,
        price_annual: parseFloat(data.addon_price_annual) || 1990,
        icon_url: data.icon_url,
      };
    } catch (error) {
      console.error('Error in getAddonByFeatureKey:', error);
      return null;
    }
  }

  /**
   * Get all available add-ons
   * 
   * @param {Object} filters - Optional filters
   * @param {string} filters.category - Filter by category
   * @param {string} filters.role - Filter by target role
   * @returns {Promise<Array>} - List of add-ons
   */
  async getAvailableAddons(filters = {}) {
    try {
      let query = supabase
        .from('subscription_plan_features')
        .select('id, feature_key, feature_name, category, addon_price_monthly, addon_price_annual, addon_description, target_roles, icon_url, sort_order_addon')
        .eq('is_addon', true)
        .order('sort_order_addon', { ascending: true });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.role) {
        query = query.contains('target_roles', [filters.role]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching available addons:', error);
        return [];
      }

      // Transform to expected format and deduplicate by feature_key
      const uniqueAddons = new Map();
      (data || []).forEach(addon => {
        if (!uniqueAddons.has(addon.feature_key)) {
          uniqueAddons.set(addon.feature_key, {
            id: addon.id,
            feature_key: addon.feature_key,
            name: addon.feature_name,
            description: addon.addon_description,
            category: addon.category,
            price_monthly: parseFloat(addon.addon_price_monthly) || 0,
            price_annual: parseFloat(addon.addon_price_annual) || 0,
            target_roles: addon.target_roles || [],
            icon_url: addon.icon_url,
          });
        }
      });

      return Array.from(uniqueAddons.values());
    } catch (error) {
      console.error('Error in getAvailableAddons:', error);
      return [];
    }
  }
}

// Export singleton instance
export const entitlementService = new EntitlementService();
export default entitlementService;

// Also export the class for testing purposes
export { EntitlementService };

