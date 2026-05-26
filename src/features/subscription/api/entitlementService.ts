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
 * IMPORTANT: This service routes through the authenticated Cloudflare Pages
 * Function API (/api/payments/*) instead of direct Supabase calls.
 * 
 * @requirement REQ-3.2 - Entitlement Service
 */

import { apiGet, apiPost } from '@/shared/api/apiClient';

class EntitlementService {
  /**
   * Get all entitlements for a user
   * 
   * @param {string} userId - The user's UUID (kept for compatibility, though API uses SSO token)
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getUserEntitlements(userId) {
    try {
      const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
        '/payments/get-user-entitlements'
      );
      
      return { success: result.success ?? true, data: result.data ?? [], error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Check if user has access to a feature
   * Access is granted if:
   * 1. User's subscription plan includes the feature (is_included = true), OR
   * 2. User has an active entitlement for that feature_key
   * 
   * @param {string} userId - The user's UUID (kept for compatibility)
   * @param {string} featureKey - The feature_key to check
   * @returns {Promise<{success: boolean, data?: {hasAccess: boolean, accessSource: 'plan'|'addon'|'bundle'|null}, error?: string}>}
   */
  async hasFeatureAccess(userId, featureKey) {
    try {
      if (!featureKey) {
        return { success: false, error: 'Feature key is required' };
      }

      const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
        `/payments/has-feature-access?featureKey=${encodeURIComponent(featureKey)}`
      );
      
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Activate an add-on for a user
   * NOTE: Direct activation bypasses payments. Use the paymentsApiService for proper checkout.
   * This is kept for backwards compatibility but shouldn't be used directly in production.
   */
  async activateAddOn(userId, featureKey, billingPeriod) {
    return { success: false, error: 'Direct add-on activation is deprecated. Use payments checkout flow.' };
  }

  /**
   * Activate a bundle for a user
   * NOTE: Direct activation bypasses payments. Use the paymentsApiService for proper checkout.
   */
  async activateBundle(userId, bundleId, billingPeriod) {
    return { success: false, error: 'Direct bundle activation is deprecated. Use payments checkout flow.' };
  }

  /**
   * Cancel an add-on entitlement
   * 
   * @param {string} entitlementId - The entitlement UUID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async cancelAddOn(entitlementId) {
    try {
      if (!entitlementId) {
        return { success: false, error: 'Entitlement ID is required' };
      }

      const result = await apiPost<{ success: boolean; data: any; error: string | null }>(
        '/payments/cancel-addon',
        { entitlementId }
      );
      
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
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

      const result = await apiPost<{ success: boolean; data: any; error: string | null }>(
        '/payments/toggle-addon-autorenew',
        { entitlementId, autoRenew }
      );
      
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
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
      // Calculate from frontend by fetching entitlements
      const entitlementsRes = await this.getUserEntitlements(userId);
      
      if (!entitlementsRes.success || !entitlementsRes.data) {
        return { success: false, error: entitlementsRes.error || 'Failed to fetch entitlements' };
      }

      const entitlements = entitlementsRes.data.filter(e => 
        ['active', 'grace_period'].includes(e.status)
      );

      let monthlyTotal = 0;
      let annualTotal = 0;

      entitlements.forEach(ent => {
        const price = parseFloat(ent.price_at_purchase) ?? 0;
        
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
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Apply grace period to an entitlement
   * Deprecated for frontend use.
   */
  async applyGracePeriod(entitlementId) {
    return { success: false, error: 'Manual grace period application is not supported from frontend' };
  }

  /**
   * Get entitlements expiring within a specified number of days
   * Note: Filtered on frontend from getUserEntitlements
   */
  async getExpiringEntitlements(daysUntilExpiry) {
    try {
      const entitlementsRes = await this.getUserEntitlements(null);
      if (!entitlementsRes.success) return entitlementsRes;

      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + daysUntilExpiry);

      const expiring = entitlementsRes.data.filter(e => {
        if (!['active', 'grace_period'].includes(e.status)) return false;
        const endDate = new Date(e.end_date);
        return endDate >= now && endDate <= futureDate;
      });

      return { success: true, data: expiring };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
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
      const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
        `/payments/get-addon-by-feature-key?featureKey=${encodeURIComponent(featureKey)}`
      );
      
      if (!result.success || !result.data) return null;
      return result.data;
    } catch (error) {
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
  async getAvailableAddons(filters: any = {}) {
    try {
      let url = '/payments/get-available-addons';
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.role) params.append('role', filters.role);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const result = await apiGet<{ success: boolean; data: any; error: string | null }>(url);
      
      if (!result.success || !result.data) return [];
      return result.data;
    } catch (error) {
      return [];
    }
  }
}

// Export singleton instance
export const entitlementService = new EntitlementService();
export default entitlementService;

// Also export the class for testing purposes
export { EntitlementService };
