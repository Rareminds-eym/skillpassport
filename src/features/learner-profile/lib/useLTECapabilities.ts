import { useState, useCallback, useRef, useMemo } from 'react';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useLTECapabilities');

export interface Capability {
  id: string;
  name: string;
  code: string;
  description: string;
}

// In-memory cache for capabilities (per role_id)
const capabilityCache = new Map<string, Capability[]>();

export const useLTECapabilities = (roleId: string | null) => {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef(capabilityCache);

  const fetchCapabilities = useCallback(async () => {
    if (!roleId) return;

    // Check cache first
    if (cacheRef.current.has(roleId)) {
      setCapabilities(cacheRef.current.get(roleId) || []);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to fetch from LTE API with roleId
      const lteUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:8788'
        : `${window.location.protocol}//${window.location.host}`;

      const response = await fetch(`${lteUrl}/api/v1/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId })
      });

      if (!response.ok) {
        logger.warn(`LTE API returned ${response.status}, skipping capabilities fetch`);
        setCapabilities([]);
        return;
      }

      const { capabilities: caps = [] } = await response.json();

      // Transform to minimal fields
      const transformed = caps.map((cap: any) => ({
        id: cap.id,
        name: cap.name,
        code: cap.code,
        description: cap.description
      }));

      // Cache the results
      cacheRef.current.set(roleId, transformed);
      setCapabilities(transformed);
    } catch (err: any) {
      logger.warn('Failed to fetch capabilities from LTE', err);
      setCapabilities([]);
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  // Memoized capability map for efficient lookup
  const capabilityMap = useMemo(() => {
    const map = new Map<string, Capability>();
    capabilities.forEach(cap => map.set(cap.id, cap));
    return map;
  }, [capabilities]);

  return {
    capabilities,
    capabilityMap,
    loading,
    error,
    fetch: fetchCapabilities
  };
};
