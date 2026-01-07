/**
 * useAddOnCatalog Hook
 * 
 * Custom hook for fetching and managing add-on catalog data.
 * Provides filtered add-ons and bundles based on user role.
 * 
 * Features:
 * - Fetches add-ons filtered by user role
 * - Fetches bundles filtered by user role
 * - Marks owned add-ons in response
 * - Calculates bundle savings
 * - Caches results with React Query
 * 
 * @requirement REQ-4.3 - Add-On Catalog Hook
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import addOnCatalogService from '../services/addOnCatalogService';

// Query keys
const ADDON_CATALOG_KEY = 'addon-catalog';
const BUNDLES_KEY = 'bundles';
const BUNDLE_SAVINGS_KEY = 'bundle-savings';

// Cache times
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook for fetching add-on catalog
 * 
 * @param {Object} options - Hook options
 * @param {string} options.role - Filter by user role (optional, defaults to current user's role)
 * @param {string} options.category - Filter by category (optional)
 * @returns {Object} Add-on catalog data and helpers
 */
export function useAddOnCatalog(options = {}) {
  const { user } = useSupabaseAuth();
  const { activeEntitlements } = useSubscriptionContext();
  const queryClient = useQueryClient();

  // Determine user role from profile or options
  const userRole = options.role || user?.user_metadata?.role || null;
  const category = options.category || null;

  // Fetch add-ons
  const {
    data: addOnsData,
    isLoading: isLoadingAddOns,
    error: addOnsError,
    refetch: refetchAddOns
  } = useQuery({
    queryKey: [ADDON_CATALOG_KEY, userRole, category],
    queryFn: async () => {
      const result = await addOnCatalogService.getAddOns({
        role: userRole,
        category
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Fetch bundles
  const {
    data: bundlesData,
    isLoading: isLoadingBundles,
    error: bundlesError,
    refetch: refetchBundles
  } = useQuery({
    queryKey: [BUNDLES_KEY, userRole],
    queryFn: async () => {
      const result = await addOnCatalogService.getBundles(userRole);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Mark owned add-ons (including cancelled but not expired)
  const addOnsWithOwnership = useMemo(() => {
    if (!addOnsData) return [];
    
    const now = new Date();
    const ownedFeatureKeys = new Set(
      (activeEntitlements || [])
        .filter(ent => {
          // Active or grace period entitlements
          if (ent.status === 'active' || ent.status === 'grace_period') return true;
          // Cancelled entitlements that haven't expired yet
          if (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now) return true;
          return false;
        })
        .map(ent => ent.feature_key)
    );

    return addOnsData.map(addOn => ({
      ...addOn,
      isOwned: ownedFeatureKeys.has(addOn.feature_key),
      ownershipStatus: ownedFeatureKeys.has(addOn.feature_key) ? 'owned' : 'available'
    }));
  }, [addOnsData, activeEntitlements]);

  // Mark owned bundles (owned if all features are owned, including cancelled but not expired)
  const bundlesWithOwnership = useMemo(() => {
    if (!bundlesData) return [];
    
    const now = new Date();
    const ownedFeatureKeys = new Set(
      (activeEntitlements || [])
        .filter(ent => {
          // Active or grace period entitlements
          if (ent.status === 'active' || ent.status === 'grace_period') return true;
          // Cancelled entitlements that haven't expired yet
          if (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now) return true;
          return false;
        })
        .map(ent => ent.feature_key)
    );

    return bundlesData.map(bundle => {
      const bundleFeatureKeys = bundle.bundle_features?.map(bf => bf.feature_key) || [];
      const ownedCount = bundleFeatureKeys.filter(key => ownedFeatureKeys.has(key)).length;
      const isFullyOwned = bundleFeatureKeys.length > 0 && ownedCount === bundleFeatureKeys.length;
      const isPartiallyOwned = ownedCount > 0 && ownedCount < bundleFeatureKeys.length;

      return {
        ...bundle,
        isOwned: isFullyOwned,
        isPartiallyOwned,
        ownedCount,
        totalFeatures: bundleFeatureKeys.length,
        ownershipStatus: isFullyOwned ? 'owned' : isPartiallyOwned ? 'partial' : 'available'
      };
    });
  }, [bundlesData, activeEntitlements]);

  // Group add-ons by category
  const addOnsByCategory = useMemo(() => {
    const grouped = {};
    
    addOnsWithOwnership.forEach(addOn => {
      const cat = addOn.category || 'other';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(addOn);
    });

    return grouped;
  }, [addOnsWithOwnership]);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(addOnsWithOwnership.map(a => a.category).filter(Boolean))];
  }, [addOnsWithOwnership]);

  // Calculate bundle savings
  const calculateBundleSavings = useCallback(async (bundleId) => {
    const cacheKey = [BUNDLE_SAVINGS_KEY, bundleId];
    
    // Check cache first
    const cached = queryClient.getQueryData(cacheKey);
    if (cached) return cached;

    const result = await addOnCatalogService.calculateBundleSavings(bundleId);
    
    if (result.success) {
      // Cache the result
      queryClient.setQueryData(cacheKey, result.data);
      return result.data;
    }
    
    return null;
  }, [queryClient]);

  // Refresh all catalog data
  const refreshCatalog = useCallback(() => {
    refetchAddOns();
    refetchBundles();
  }, [refetchAddOns, refetchBundles]);

  // Get add-on by feature key
  const getAddOnByKey = useCallback((featureKey) => {
    return addOnsWithOwnership.find(a => a.feature_key === featureKey) || null;
  }, [addOnsWithOwnership]);

  // Get bundle by ID
  const getBundleById = useCallback((bundleId) => {
    return bundlesWithOwnership.find(b => b.id === bundleId) || null;
  }, [bundlesWithOwnership]);

  // Filter add-ons by search term
  const searchAddOns = useCallback((searchTerm) => {
    if (!searchTerm) return addOnsWithOwnership;
    
    const term = searchTerm.toLowerCase();
    return addOnsWithOwnership.filter(addOn => 
      addOn.feature_name?.toLowerCase().includes(term) ||
      addOn.addon_description?.toLowerCase().includes(term) ||
      addOn.category?.toLowerCase().includes(term)
    );
  }, [addOnsWithOwnership]);

  return {
    // Add-ons
    addOns: addOnsWithOwnership,
    addOnsByCategory,
    categories,
    isLoadingAddOns,
    addOnsError,
    
    // Bundles
    bundles: bundlesWithOwnership,
    isLoadingBundles,
    bundlesError,
    
    // Combined loading state
    isLoading: isLoadingAddOns || isLoadingBundles,
    
    // Helpers
    getAddOnByKey,
    getBundleById,
    calculateBundleSavings,
    searchAddOns,
    refreshCatalog,
    
    // Stats
    totalAddOns: addOnsWithOwnership.length,
    ownedAddOns: addOnsWithOwnership.filter(a => a.isOwned).length,
    totalBundles: bundlesWithOwnership.length
  };
}

/**
 * Hook for fetching a single add-on by feature key
 * 
 * @param {string} featureKey - The feature_key to fetch
 * @returns {Object} Add-on data and loading state
 */
export function useAddOn(featureKey) {
  const { activeEntitlements } = useSubscriptionContext();

  const {
    data: addOn,
    isLoading,
    error
  } = useQuery({
    queryKey: [ADDON_CATALOG_KEY, 'single', featureKey],
    queryFn: async () => {
      if (!featureKey) return null;
      
      const result = await addOnCatalogService.getAddOnByFeatureKey(featureKey);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    enabled: !!featureKey,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Check if owned (including cancelled but not expired)
  const isOwned = useMemo(() => {
    if (!addOn || !activeEntitlements) return false;
    
    const now = new Date();
    return activeEntitlements.some(
      ent => ent.feature_key === featureKey && 
             (ent.status === 'active' || 
              ent.status === 'grace_period' ||
              (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now))
    );
  }, [addOn, activeEntitlements, featureKey]);

  return {
    addOn: addOn ? { ...addOn, isOwned } : null,
    isLoading,
    error,
    isOwned
  };
}

/**
 * Hook for fetching a single bundle by ID
 * 
 * @param {string} bundleId - The bundle UUID to fetch
 * @returns {Object} Bundle data and loading state
 */
export function useBundle(bundleId) {
  const { activeEntitlements } = useSubscriptionContext();

  const {
    data: bundle,
    isLoading,
    error
  } = useQuery({
    queryKey: [BUNDLES_KEY, 'single', bundleId],
    queryFn: async () => {
      if (!bundleId) return null;
      
      const result = await addOnCatalogService.getBundles();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data?.find(b => b.id === bundleId) || null;
    },
    enabled: !!bundleId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Calculate ownership status (including cancelled but not expired)
  const ownershipInfo = useMemo(() => {
    if (!bundle || !activeEntitlements) {
      return { isOwned: false, isPartiallyOwned: false, ownedCount: 0 };
    }

    const now = new Date();
    const ownedFeatureKeys = new Set(
      activeEntitlements
        .filter(ent => 
          ent.status === 'active' || 
          ent.status === 'grace_period' ||
          (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now)
        )
        .map(ent => ent.feature_key)
    );

    const bundleFeatureKeys = bundle.bundle_features?.map(bf => bf.feature_key) || [];
    const ownedCount = bundleFeatureKeys.filter(key => ownedFeatureKeys.has(key)).length;

    return {
      isOwned: bundleFeatureKeys.length > 0 && ownedCount === bundleFeatureKeys.length,
      isPartiallyOwned: ownedCount > 0 && ownedCount < bundleFeatureKeys.length,
      ownedCount,
      totalFeatures: bundleFeatureKeys.length
    };
  }, [bundle, activeEntitlements]);

  return {
    bundle: bundle ? { ...bundle, ...ownershipInfo } : null,
    isLoading,
    error,
    ...ownershipInfo
  };
}

export default useAddOnCatalog;
