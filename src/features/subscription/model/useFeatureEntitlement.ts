/**
 * Hook: useFeatureEntitlement
 * 
 * Ergonomic hook for checking access to a specific capability.
 * Replaces all client-side plan code comparisons:
 * 
 * BEFORE:
 *   const isAllowed = PLAN_HIERARCHY.indexOf(plan) >= PLAN_HIERARCHY.indexOf('pro');
 * 
 * AFTER:
 *   const { enabled, remaining } = useFeatureEntitlement('advanced_skill_filters');
 */

import { useEntitlementManifest } from './useEntitlementManifest';

export interface UseFeatureEntitlementResult {
  enabled: boolean;
  featureKey: string;
  displayName: string;
  featureType: 'boolean' | 'numeric_limit' | 'metered' | 'unknown';
  limit: number | null;
  currentUsage: number;
  remaining: number | null;
  allocated: number | null;
  consumed: number | null;
  isMetered: boolean;
  isNumericLimit: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFeatureEntitlement(featureKey: string): UseFeatureEntitlementResult {
  const { manifest, loading, error, refetch } = useEntitlementManifest();

  const feature = manifest?.features?.[featureKey];

  if (!feature) {
    return {
      enabled: false,
      featureKey,
      displayName: featureKey,
      featureType: 'unknown',
      limit: null,
      currentUsage: 0,
      remaining: null,
      allocated: null,
      consumed: null,
      isMetered: false,
      isNumericLimit: false,
      loading,
      error,
      refetch,
    };
  }

  const isMetered = feature.feature_type === 'metered';
  const isNumericLimit = feature.feature_type === 'numeric_limit';

  // For numeric limits: enabled if below limit
  let enabled = feature.enabled;
  if (isNumericLimit && feature.limit !== null && feature.limit !== undefined) {
    enabled = enabled && (feature.current_usage ?? 0) < feature.limit;
  }
  // For metered credits: enabled if remaining credits > 0
  if (isMetered) {
    enabled = enabled && (feature.remaining ?? 0) > 0;
  }

  return {
    enabled,
    featureKey,
    displayName: feature.display_name || featureKey,
    featureType: feature.feature_type,
    limit: feature.limit ?? null,
    currentUsage: feature.current_usage ?? 0,
    remaining: feature.remaining ?? null,
    allocated: feature.allocated ?? null,
    consumed: feature.consumed ?? null,
    isMetered,
    isNumericLimit,
    loading,
    error,
    refetch,
  };
}
