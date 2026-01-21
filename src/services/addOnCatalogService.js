/**
 * AddOnCatalogService
 *
 * Service for managing add-on catalog operations including:
 * - Fetching available add-ons from subscription_plan_features where is_addon=true
 * - Getting add-on details by feature key
 * - Finding bundles for specific roles
 * - Calculating bundle savings
 *
 * @requirement REQ-3.1 - Add-On Catalog Service
 */

import { supabase } from '../lib/supabaseClient';

class AddOnCatalogService {
  /**
   * Get all add-ons with optional filtering
   * Queries subscription_plan_features where is_addon=true
   *
   * @param {Object} filters - Optional filters
   * @param {string} [filters.role] - Filter by target role
   * @param {string} [filters.category] - Filter by category
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getAddOns(filters = {}) {
    try {
      const { role, category } = filters;

      let query = supabase
        .from('subscription_plan_features')
        .select('*')
        .eq('is_addon', true)
        .order('sort_order_addon', { ascending: true });

      // Filter by category
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching add-ons:', error);
        return { success: false, error: error.message };
      }

      // Filter by role if provided (target_roles is a text array)
      let filteredData = data;
      if (role && data) {
        filteredData = data.filter((addOn) => {
          // If target_roles is null or empty, add-on is available to all roles
          if (!addOn.target_roles || addOn.target_roles.length === 0) {
            return true;
          }
          return addOn.target_roles.includes(role);
        });
      }

      return { success: true, data: filteredData };
    } catch (error) {
      console.error('Error in getAddOns:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single add-on by feature key
   *
   * @param {string} featureKey - The feature_key identifier
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getAddOnByFeatureKey(featureKey) {
    try {
      if (!featureKey) {
        return { success: false, error: 'Feature key is required' };
      }

      const { data, error } = await supabase
        .from('subscription_plan_features')
        .select('*')
        .eq('feature_key', featureKey)
        .eq('is_addon', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'ADD_ON_NOT_FOUND' };
        }
        console.error('Error fetching add-on by feature key:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getAddOnByFeatureKey:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get bundles filtered by role
   *
   * @param {string} [role] - Optional role to filter bundles
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getBundles(role) {
    try {
      const query = supabase
        .from('bundles')
        .select('*, bundle_features(feature_key)')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching bundles:', error);
        return { success: false, error: error.message };
      }

      // Filter by role if provided
      let filteredData = data;
      if (role && data) {
        filteredData = data.filter((bundle) => {
          // If target_roles is null or empty, bundle is available to all roles
          if (!bundle.target_roles || bundle.target_roles.length === 0) {
            return true;
          }
          return bundle.target_roles.includes(role);
        });
      }

      return { success: true, data: filteredData };
    } catch (error) {
      console.error('Error in getBundles:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate savings for a bundle compared to individual add-on purchases
   *
   * @param {string} bundleId - The bundle UUID
   * @returns {Promise<{success: boolean, data?: {totalIndividual: number, bundlePrice: number, savings: number}, error?: string}>}
   */
  async calculateBundleSavings(bundleId) {
    try {
      if (!bundleId) {
        return { success: false, error: 'Bundle ID is required' };
      }

      // Get the bundle with its features
      const { data: bundle, error: bundleError } = await supabase
        .from('bundles')
        .select('*, bundle_features(feature_key)')
        .eq('id', bundleId)
        .single();

      if (bundleError) {
        if (bundleError.code === 'PGRST116') {
          return { success: false, error: 'BUNDLE_NOT_FOUND' };
        }
        console.error('Error fetching bundle:', bundleError);
        return { success: false, error: bundleError.message };
      }

      // Get feature keys from the bundle
      const featureKeys = bundle.bundle_features?.map((bf) => bf.feature_key) || [];

      if (featureKeys.length === 0) {
        return {
          success: true,
          data: {
            totalIndividual: 0,
            bundlePrice: bundle.monthly_price,
            savings: 0,
          },
        };
      }

      // Get the add-on prices for all features in the bundle
      const { data: addOns, error: addOnsError } = await supabase
        .from('subscription_plan_features')
        .select('feature_key, addon_price_monthly')
        .eq('is_addon', true)
        .in('feature_key', featureKeys);

      if (addOnsError) {
        console.error('Error fetching add-on prices:', addOnsError);
        return { success: false, error: addOnsError.message };
      }

      // Calculate total individual price
      const totalIndividual = addOns.reduce((sum, addOn) => {
        return sum + (addOn.addon_price_monthly || 0);
      }, 0);

      const bundlePrice = bundle.monthly_price;
      const savings = totalIndividual - bundlePrice;

      return {
        success: true,
        data: {
          totalIndividual,
          bundlePrice,
          savings,
        },
      };
    } catch (error) {
      console.error('Error in calculateBundleSavings:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const addOnCatalogService = new AddOnCatalogService();
export default addOnCatalogService;

// Also export the class for testing purposes
export { AddOnCatalogService };
