/**
 * useFeatureGate Hook
 * 
 * Custom hook for checking feature access based on subscription plan and add-on entitlements.
 * Provides a unified interface for feature gating across the application.
 * 
 * Features:
 * - Checks plan-based access first
 * - Falls back to add-on entitlement check
 * - Caches results with 5-minute TTL
 * - Returns access state, source, and upgrade prompt helpers
 * 
 * @requirement REQ-4.2 - Feature Gate Hook
 * @requirement REQ-6.1 - Feature gating based on entitlements
 * @requirement REQ-6.3 - Cache entitlement checks (max 5 minute cache)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import addOnCatalogService from '../services/addOnCatalogService';
import entitlementService from '../services/entitlementService';

// Cache for feature access checks
const accessCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear expired cache entries
 */
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of accessCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      accessCache.delete(key);
    }
  }
};

// DEBUG: Clear all cache on module load to ensure fresh checks
console.log('[FeatureGate] Clearing all access cache on module load');
accessCache.clear();

/**
 * Hook for checking feature access
 * 
 * @param {string} featureKey - The feature_key to check access for
 * @returns {Object} Feature access state and helpers
 */
export function useFeatureGate(featureKey) {
  const { 
    user, 
    hasAddOnAccessSync, 
    activeEntitlements,
    subscription 
  } = useSubscriptionContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessSource, setAccessSource] = useState(null);
  const [requiredAddOn, setRequiredAddOn] = useState(null);
  const [error, setError] = useState(null);
  
  const checkInProgress = useRef(false);
  const userId = user?.id;

  // Debug: Log initial state
  console.log(`[useFeatureGate] Hook initialized for ${featureKey}, userId: ${userId}, user object:`, user);

  // Check access from cache or fetch
  const checkAccess = useCallback(async () => {
    console.log(`[useFeatureGate] checkAccess called for ${featureKey}, userId: ${userId}`);
    
    if (!featureKey) {
      console.log(`[useFeatureGate] No featureKey provided, denying access`);
      setIsLoading(false);
      setHasAccess(false);
      return;
    }

    // Prevent concurrent checks
    if (checkInProgress.current) {
      console.log(`[useFeatureGate] Check already in progress for ${featureKey}, skipping`);
      return;
    }
    checkInProgress.current = true;

    try {
      // Clear expired cache entries periodically
      clearExpiredCache();

      // Check cache first
      const cacheKey = `${userId || 'anonymous'}-${featureKey}`;
      const cached = accessCache.get(cacheKey);
      
      console.log(`[useFeatureGate] Cache check for ${featureKey}:`, { cacheKey, cached, cacheSize: accessCache.size });
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[useFeatureGate] Using cached result for ${featureKey}:`, cached.hasAccess, 'requiredAddOn:', cached.requiredAddOn);
        setHasAccess(cached.hasAccess);
        setAccessSource(cached.accessSource);
        setRequiredAddOn(cached.requiredAddOn);
        setIsLoading(false);
        checkInProgress.current = false;
        return;
      }

      setIsLoading(true);

      // Quick sync check for entitlements (immediate UI response)
      console.log(`[useFeatureGate] Checking hasAddOnAccessSync for ${featureKey}:`, { 
        hasAddOnAccessSync: typeof hasAddOnAccessSync, 
        activeEntitlements 
      });
      
      if (hasAddOnAccessSync && hasAddOnAccessSync(featureKey)) {
        console.log(`[useFeatureGate] hasAddOnAccessSync returned true for ${featureKey}`);
        const entitlement = activeEntitlements?.find(e => e.feature_key === featureKey);
        const source = entitlement?.bundle_id ? 'bundle' : 'addon';
        
        setHasAccess(true);
        setAccessSource(source);
        setRequiredAddOn(null);
        
        // Cache the result
        accessCache.set(cacheKey, {
          hasAccess: true,
          accessSource: source,
          requiredAddOn: null,
          timestamp: Date.now()
        });
        
        setIsLoading(false);
        checkInProgress.current = false;
        return;
      }

      // Always fetch add-on details first for pricing display
      console.log(`[useFeatureGate] Fetching add-on details for ${featureKey}`);
      let fetchedAddOn = null;
      try {
        const addOnResult = await addOnCatalogService.getAddOnByFeatureKey(featureKey);
        console.log(`[useFeatureGate] Add-on details for ${featureKey}:`, addOnResult);
        if (addOnResult.success && addOnResult.data) {
          fetchedAddOn = addOnResult.data;
        }
      } catch (addOnErr) {
        console.warn(`[useFeatureGate] Failed to fetch add-on details for ${featureKey}:`, addOnErr);
      }

      // If user is authenticated, do full check
      if (userId) {
        console.log(`[useFeatureGate] Calling entitlementService.hasFeatureAccess for ${featureKey}, userId: ${userId}`);
        const result = await entitlementService.hasFeatureAccess(userId, featureKey);
        console.log(`[useFeatureGate] entitlementService result for ${featureKey}:`, result);
        
        if (result.success) {
          const { hasAccess: access, accessSource: source } = result.data;
          
          console.log(`[useFeatureGate] Setting access for ${featureKey}: hasAccess=${access}, source=${source}`);
          setHasAccess(access);
          setAccessSource(source);
          
          // Set add-on details only if no access (for upgrade prompt)
          if (!access) {
            setRequiredAddOn(fetchedAddOn);
          } else {
            setRequiredAddOn(null);
            fetchedAddOn = null; // Don't cache add-on if user has access
          }
          
          // Cache the result with the fetched add-on data
          accessCache.set(cacheKey, {
            hasAccess: access,
            accessSource: source,
            requiredAddOn: access ? null : fetchedAddOn,
            timestamp: Date.now()
          });
        } else {
          console.log(`[useFeatureGate] entitlementService returned error for ${featureKey}:`, result.error);
          setError(result.error);
          setHasAccess(false);
          setAccessSource(null);
          setRequiredAddOn(fetchedAddOn);
        }
      } else {
        // Not authenticated - no access
        console.log(`[useFeatureGate] No userId, denying access for ${featureKey}`);
        setHasAccess(false);
        setAccessSource(null);
        setRequiredAddOn(fetchedAddOn);
        
        // Cache for anonymous user
        accessCache.set(cacheKey, {
          hasAccess: false,
          accessSource: null,
          requiredAddOn: fetchedAddOn,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error(`[useFeatureGate] Error checking feature access for ${featureKey}:`, err);
      setError(err.message);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
      checkInProgress.current = false;
    }
  }, [featureKey, userId, hasAddOnAccessSync, activeEntitlements]);

  // Run access check on mount and when dependencies change
  useEffect(() => {
    console.log(`[useFeatureGate] useEffect triggered for ${featureKey}, userId: ${userId}`);
    // Reset checkInProgress when userId changes to allow re-check
    checkInProgress.current = false;
    checkAccess();
  }, [checkAccess]);

  // Also re-check when userId changes from undefined to a value
  useEffect(() => {
    if (userId) {
      console.log(`[useFeatureGate] userId became available for ${featureKey}: ${userId}`);
      // Clear cache for this feature to force re-check with new userId
      const cacheKey = `anonymous-${featureKey}`;
      accessCache.delete(cacheKey);
      checkInProgress.current = false;
      checkAccess();
    }
  }, [userId, featureKey]);

  // Invalidate cache for this feature
  const invalidateCache = useCallback(() => {
    const cacheKey = `${userId || 'anonymous'}-${featureKey}`;
    accessCache.delete(cacheKey);
    checkAccess();
  }, [userId, featureKey, checkAccess]);

  // Show upgrade prompt helper
  const showUpgradePrompt = useCallback(() => {
    // This can be customized to show a modal, redirect, etc.
    // For now, we'll dispatch a custom event that components can listen to
    if (requiredAddOn) {
      const event = new CustomEvent('showUpgradePrompt', {
        detail: {
          featureKey,
          addOn: requiredAddOn
        }
      });
      window.dispatchEvent(event);
    }
  }, [featureKey, requiredAddOn]);

  return useMemo(() => ({
    hasAccess,
    isLoading,
    accessSource,
    requiredAddOn,
    error,
    showUpgradePrompt,
    invalidateCache,
    // Helper for determining if upgrade is available
    canUpgrade: !hasAccess && !!requiredAddOn,
    // Price info for quick display
    upgradePrice: requiredAddOn ? {
      monthly: requiredAddOn.addon_price_monthly,
      annual: requiredAddOn.addon_price_annual
    } : null
  }), [
    hasAccess,
    isLoading,
    accessSource,
    requiredAddOn,
    error,
    showUpgradePrompt,
    invalidateCache
  ]);
}

/**
 * Hook for checking multiple features at once
 * 
 * @param {string[]} featureKeys - Array of feature_keys to check
 * @returns {Object} Map of feature access states
 */
export function useMultipleFeatureGates(featureKeys) {
  const [results, setResults] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { user, hasAddOnAccessSync, activeEntitlements } = useSubscriptionContext();
  const userId = user?.id;

  useEffect(() => {
    const checkAllFeatures = async () => {
      if (!featureKeys || featureKeys.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const newResults = {};

      for (const featureKey of featureKeys) {
        // Quick sync check first
        if (hasAddOnAccessSync && hasAddOnAccessSync(featureKey)) {
          const entitlement = activeEntitlements?.find(e => e.feature_key === featureKey);
          newResults[featureKey] = {
            hasAccess: true,
            accessSource: entitlement?.bundle_id ? 'bundle' : 'addon'
          };
          continue;
        }

        // Full check if user is authenticated
        if (userId) {
          const result = await entitlementService.hasFeatureAccess(userId, featureKey);
          if (result.success) {
            newResults[featureKey] = result.data;
          } else {
            newResults[featureKey] = { hasAccess: false, accessSource: null };
          }
        } else {
          newResults[featureKey] = { hasAccess: false, accessSource: null };
        }
      }

      setResults(newResults);
      setIsLoading(false);
    };

    checkAllFeatures();
  }, [featureKeys, userId, hasAddOnAccessSync, activeEntitlements]);

  return { results, isLoading };
}

/**
 * Clear all cached feature access data
 * Call this after purchases, cancellations, or auth changes
 */
export function clearFeatureAccessCache() {
  accessCache.clear();
}

export default useFeatureGate;
