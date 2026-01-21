import { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateIndustryDemand,
  getFallbackIndustryDemand,
  IndustryDemandData,
} from '../services/aiCareerPathService';

/**
 * Cache structure for storing industry demand data
 */
interface CacheEntry {
  data: IndustryDemandData;
  timestamp: number;
  clusterTitle: string;
}

interface IndustryDemandCache {
  [roleKey: string]: CacheEntry;
}

/**
 * Module-level cache for session-based caching
 */
const sessionCache: IndustryDemandCache = {};

/**
 * Generate a cache key from role name and cluster title
 */
function getCacheKey(roleName: string, clusterTitle: string): string {
  return `demand::${roleName.toLowerCase().trim()}::${clusterTitle.toLowerCase().trim()}`;
}

/**
 * Check if a cache entry exists and is valid
 */
export function checkCache(roleName: string, clusterTitle: string): IndustryDemandData | null {
  const key = getCacheKey(roleName, clusterTitle);
  const entry = sessionCache[key];

  if (entry && entry.data) {
    console.log(`[IndustryDemand] Cache hit for ${roleName}:`, entry.data);
    return entry.data;
  }

  console.log(`[IndustryDemand] Cache miss for ${roleName}`);
  return null;
}

/**
 * Store industry demand in cache
 */
function setCache(roleName: string, clusterTitle: string, data: IndustryDemandData): void {
  const key = getCacheKey(roleName, clusterTitle);
  sessionCache[key] = {
    data,
    timestamp: Date.now(),
    clusterTitle,
  };
  console.log(`[IndustryDemand] Cached data for ${roleName}:`, data);
}

/**
 * Clear the session cache (useful for testing)
 */
export function clearIndustryDemandCache(): void {
  Object.keys(sessionCache).forEach((key) => delete sessionCache[key]);
}

/**
 * Hook return type
 */
interface UseIndustryDemandReturn {
  demandData: IndustryDemandData | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for fetching and caching industry demand data
 *
 * @param roleName - The job role name (e.g., "Software Engineer")
 * @param clusterTitle - The career cluster title (e.g., "Technology")
 * @returns Object containing demand data, loading state, and error (internal only)
 */
export function useIndustryDemand(
  roleName: string | null,
  clusterTitle: string
): UseIndustryDemandReturn {
  const [demandData, setDemandData] = useState<IndustryDemandData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the current request to handle race conditions
  const currentRequestRef = useRef<string | null>(null);

  const fetchIndustryDemand = useCallback(async (role: string, cluster: string) => {
    const requestKey = getCacheKey(role, cluster);
    currentRequestRef.current = requestKey;

    // Check cache first
    const cached = checkCache(role, cluster);
    if (cached) {
      setDemandData(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateIndustryDemand(role, cluster);

      // Only update state if this is still the current request
      if (currentRequestRef.current === requestKey) {
        setDemandData(result);
        setCache(role, cluster, result);
        setLoading(false);
      }
    } catch (err) {
      // Only update state if this is still the current request
      if (currentRequestRef.current === requestKey) {
        console.error('Error fetching industry demand:', err);
        setError(err instanceof Error ? err : new Error('Failed to generate industry demand'));

        // Return fallback without exposing error to user
        const fallback = getFallbackIndustryDemand(role);
        setDemandData(fallback);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Reset state when role is null or empty
    if (!roleName || roleName.trim() === '') {
      setDemandData(null);
      setLoading(false);
      setError(null);
      currentRequestRef.current = null;
      return;
    }

    fetchIndustryDemand(roleName, clusterTitle);
  }, [roleName, clusterTitle, fetchIndustryDemand]);

  return {
    demandData,
    loading,
    error,
  };
}

export default useIndustryDemand;
