import { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateRoleResponsibilities,
  getFallbackResponsibilities,
} from '../services/aiCareerPathService';

/**
 * Cache structure for storing role responsibilities
 */
interface CacheEntry {
  responsibilities: string[];
  timestamp: number;
  clusterTitle: string;
}

interface ResponsibilitiesCache {
  [roleKey: string]: CacheEntry;
}

/**
 * Module-level cache for session-based caching
 * This persists across component re-renders and unmounts within the same session
 */
const sessionCache: ResponsibilitiesCache = {};

/**
 * Generate a cache key from role name and cluster title
 */
function getCacheKey(roleName: string, clusterTitle: string): string {
  return `${roleName.toLowerCase().trim()}::${clusterTitle.toLowerCase().trim()}`;
}

/**
 * Check if a cache entry exists and is valid
 */
export function checkCache(roleName: string, clusterTitle: string): string[] | null {
  const key = getCacheKey(roleName, clusterTitle);
  const entry = sessionCache[key];

  if (entry && entry.responsibilities.length === 3) {
    return entry.responsibilities;
  }

  return null;
}

/**
 * Store responsibilities in cache
 */
function setCache(roleName: string, clusterTitle: string, responsibilities: string[]): void {
  const key = getCacheKey(roleName, clusterTitle);
  sessionCache[key] = {
    responsibilities,
    timestamp: Date.now(),
    clusterTitle,
  };
}

/**
 * Clear the session cache (useful for testing)
 */
export function clearResponsibilitiesCache(): void {
  Object.keys(sessionCache).forEach((key) => delete sessionCache[key]);
}

/**
 * Hook return type
 */
interface UseRoleResponsibilitiesReturn {
  responsibilities: string[];
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for fetching and caching role responsibilities
 *
 * @param roleName - The job role name (e.g., "Software Engineer")
 * @param clusterTitle - The career cluster title (e.g., "Technology")
 * @returns Object containing responsibilities array, loading state, and error (internal only)
 *
 * Features:
 * - Session-based caching: Same role/cluster combo returns cached result
 * - Automatic fallback: Returns generic responsibilities on error
 * - Loading state: Indicates when AI generation is in progress
 *
 * @example
 * const { responsibilities, loading } = useRoleResponsibilities('Software Engineer', 'Technology');
 */
export function useRoleResponsibilities(
  roleName: string | null,
  clusterTitle: string
): UseRoleResponsibilitiesReturn {
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the current request to handle race conditions
  const currentRequestRef = useRef<string | null>(null);

  const fetchResponsibilities = useCallback(async (role: string, cluster: string) => {
    const requestKey = getCacheKey(role, cluster);
    currentRequestRef.current = requestKey;

    // Check cache first
    const cached = checkCache(role, cluster);
    if (cached) {
      setResponsibilities(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateRoleResponsibilities(role, cluster);

      // Only update state if this is still the current request
      if (currentRequestRef.current === requestKey) {
        setResponsibilities(result);
        setCache(role, cluster, result);
        setLoading(false);
      }
    } catch (err) {
      // Only update state if this is still the current request
      if (currentRequestRef.current === requestKey) {
        console.error('Error fetching role responsibilities:', err);
        setError(err instanceof Error ? err : new Error('Failed to generate responsibilities'));

        // Return fallback without exposing error to user
        const fallback = getFallbackResponsibilities(role);
        setResponsibilities(fallback);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Reset state when role is null or empty
    if (!roleName || roleName.trim() === '') {
      setResponsibilities([]);
      setLoading(false);
      setError(null);
      currentRequestRef.current = null;
      return;
    }

    fetchResponsibilities(roleName, clusterTitle);
  }, [roleName, clusterTitle, fetchResponsibilities]);

  return {
    responsibilities,
    loading,
    error,
  };
}

export default useRoleResponsibilities;
