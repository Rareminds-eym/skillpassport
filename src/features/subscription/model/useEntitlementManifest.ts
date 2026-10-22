/**
 * Hook: useEntitlementManifest
 * 
 * Fetches the tenant's complete capability and credit manifest from /api/entitlement-manifest.
 * Single source of truth for all frontend feature gating.
 * 
 * Pattern: Entitlement Engine (Stigg / Schematic / Stripe Entitlements)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';

export interface FeatureEntitlement {
  enabled: boolean;
  feature_type: 'boolean' | 'numeric_limit' | 'metered';
  category: string;
  display_name: string;
  limit?: number | null;
  current_usage?: number;
  allocated?: number;
  consumed?: number;
  remaining?: number;
}

export interface EntitlementManifest {
  tenant_id: string;
  is_subscribed: boolean;
  subscription_id: string | null;
  subscription_status: string;
  plan_id: string;
  plan_code: string;
  plan_name: string;
  plan_family: 'recruiter' | 'individual' | 'institution';
  hierarchy_order: number;
  is_sales_only: boolean;
  features: Record<string, FeatureEntitlement>;
  synced_at: string;
}

interface UseEntitlementManifestOptions {
  family?: 'recruiter' | 'individual' | 'institution';
  staleTimeMs?: number;
}

// Module-level cache to prevent repeated fetches across component mounts
let manifestCache: {
  key: string;
  data: EntitlementManifest;
  timestamp: number;
} | null = null;

export function useEntitlementManifest(options: UseEntitlementManifestOptions = {}) {
  const { family = 'recruiter', staleTimeMs = 2 * 60 * 1000 } = options;

  const cacheKey = `manifest:${family}`;
  const initialData = manifestCache && manifestCache.key === cacheKey && (Date.now() - manifestCache.timestamp < staleTimeMs)
    ? manifestCache.data
    : null;

  const [manifest, setManifest] = useState<EntitlementManifest | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchManifest = useCallback(async (force = false) => {
    if (!force && manifestCache && manifestCache.key === cacheKey && (Date.now() - manifestCache.timestamp < staleTimeMs)) {
      setManifest(manifestCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `/api/entitlement-manifest?family=${encodeURIComponent(family)}`;
      const response = await ssoClient.fetch(url);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const errMsg = errBody?.error?.message || errBody?.message || `Failed to fetch entitlement manifest (${response.status})`;
        console.error('[useEntitlementManifest] API error:', response.status, errMsg);
        throw new Error(errMsg);
      }

      const envelope = await response.json();
      const data: EntitlementManifest = envelope.data || envelope;

      manifestCache = {
        key: cacheKey,
        data,
        timestamp: Date.now(),
      };

      if (isMountedRef.current) {
        setManifest(data);
        setError(null);
      }
    } catch (err: any) {
      console.error('[useEntitlementManifest] Error loading manifest:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load entitlements');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [family, cacheKey, staleTimeMs]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchManifest();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchManifest]);

  const refetch = useCallback(() => fetchManifest(true), [fetchManifest]);

  return {
    manifest,
    loading,
    error,
    refetch,
  };
}
