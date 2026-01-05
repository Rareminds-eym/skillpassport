/**
 * useFeatureGate Hook
 * 
 * Custom hook for checking feature access based on subscription plan and add-on entitlements.
 * Provides a unified interface for feature gating across the application.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import addOnCatalogService from '../services/addOnCatalogService';
import entitlementService from '../services/entitlementService';

// Cache for feature access checks
const accessCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of accessCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      accessCache.delete(key);
    }
  }
};

accessCache.clear();

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

  const checkAccess = useCallback(async () => {
    if (!featureKey) {
      setIsLoading(false);
      setHasAccess(false);
      return;
    }

    if (checkInProgress.current) {
      return;
    }
    checkInProgress.current = true;

    try {
      clearExpiredCache();

      const cacheKey = `${userId || 'anonymous'}-${featureKey}`;
      const cached = accessCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setHasAccess(cached.hasAccess);
        setAccessSource(cached.accessSource);
        setRequiredAddOn(cached.requiredAddOn);
        setIsLoading(false);
        checkInProgress.current = false;
        return;
      }

      setIsLoading(true);

      if (hasAddOnAccessSync && hasAddOnAccessSync(featureKey)) {
        const entitlement = activeEntitlements?.find(e => e.feature_key === featureKey);
        const source = entitlement?.bundle_id ? 'bundle' : 'addon';
        
        setHasAccess(true);
        setAccessSource(source);
        setRequiredAddOn(null);
        
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

      let fetchedAddOn = null;
      try {
        const addOnResult = await addOnCatalogService.getAddOnByFeatureKey(featureKey);
        if (addOnResult.success && addOnResult.data) {
          fetchedAddOn = addOnResult.data;
        }
      } catch (addOnErr) {
        // Silently handle add-on fetch errors
      }

      if (userId) {
        const result = await entitlementService.hasFeatureAccess(userId, featureKey);
        
        if (result.success) {
          const { hasAccess: access, accessSource: source } = result.data;
          
          setHasAccess(access);
          setAccessSource(source);
          
          if (!access) {
            setRequiredAddOn(fetchedAddOn);
          } else {
            setRequiredAddOn(null);
            fetchedAddOn = null;
          }
          
          accessCache.set(cacheKey, {
            hasAccess: access,
            accessSource: source,
            requiredAddOn: access ? null : fetchedAddOn,
            timestamp: Date.now()
          });
        } else {
          setError(result.error);
          setHasAccess(false);
          setAccessSource(null);
          setRequiredAddOn(fetchedAddOn);
        }
      } else {
        setHasAccess(false);
        setAccessSource(null);
        setRequiredAddOn(fetchedAddOn);
        
        accessCache.set(cacheKey, {
          hasAccess: false,
          accessSource: null,
          requiredAddOn: fetchedAddOn,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      setError(err.message);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
      checkInProgress.current = false;
    }
  }, [featureKey, userId, hasAddOnAccessSync, activeEntitlements]);

  useEffect(() => {
    checkInProgress.current = false;
    checkAccess();
  }, [checkAccess]);

  const entitlementsRef = useRef(activeEntitlements);
  useEffect(() => {
    if (entitlementsRef.current !== activeEntitlements && activeEntitlements !== undefined) {
      const cacheKey = `${userId || 'anonymous'}-${featureKey}`;
      accessCache.delete(cacheKey);
      checkInProgress.current = false;
      entitlementsRef.current = activeEntitlements;
      checkAccess();
    }
  }, [activeEntitlements, userId, featureKey, checkAccess]);

  useEffect(() => {
    if (userId) {
      const cacheKey = `anonymous-${featureKey}`;
      accessCache.delete(cacheKey);
      checkInProgress.current = false;
      checkAccess();
    }
  }, [userId, featureKey]);

  const invalidateCache = useCallback(() => {
    const cacheKey = `${userId || 'anonymous'}-${featureKey}`;
    accessCache.delete(cacheKey);
    checkAccess();
  }, [userId, featureKey, checkAccess]);

  const showUpgradePrompt = useCallback(() => {
    if (requiredAddOn) {
      const event = new CustomEvent('showUpgradePrompt', {
        detail: { featureKey, addOn: requiredAddOn }
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
    canUpgrade: !hasAccess && !!requiredAddOn,
    upgradePrice: requiredAddOn ? {
      monthly: requiredAddOn.addon_price_monthly,
      annual: requiredAddOn.addon_price_annual
    } : null
  }), [hasAccess, isLoading, accessSource, requiredAddOn, error, showUpgradePrompt, invalidateCache]);
}

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
        if (hasAddOnAccessSync && hasAddOnAccessSync(featureKey)) {
          const entitlement = activeEntitlements?.find(e => e.feature_key === featureKey);
          newResults[featureKey] = {
            hasAccess: true,
            accessSource: entitlement?.bundle_id ? 'bundle' : 'addon'
          };
          continue;
        }

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

export function clearFeatureAccessCache() {
  accessCache.clear();
}

export default useFeatureGate;
