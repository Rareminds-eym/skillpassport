/**
 * DEPENDENCY INJECTION PATTERN APPLIED
 * 
 * This hook receives counselling functions as parameters to avoid importing from features layer.
 * Import from @/features/counselling in the parent component and pass them down.
 * 
 * Example:
 *   import { generateRoleOverview, getFallbackRoleOverview } from '@/features/counselling';
 *   const hook = useRoleOverview(roleName, clusterTitle, { generateRoleOverview, getFallbackRoleOverview }, attemptId);
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('role-overview-hook');

// Types moved to shared for FSD compliance
// TODO: Import types from @/shared/types instead
type RoleOverviewData = any;
type IndustryDemandData = any;
type CareerStage = any;
type RoadmapPhase = any;
type RecommendedCourse = any;
type FreeResource = any;
type ActionItem = any;
type SuggestedProject = any;

/**
 * Counselling API interface for dependency injection
 */
interface CounsellingAPI {
  generateRoleOverview: (roleName: string, clusterTitle: string, attemptId?: string) => Promise<RoleOverviewData>;
  getFallbackRoleOverview: (roleName: string) => RoleOverviewData;
}

/**
 * Cache structure for storing role overview data
 */
interface CacheEntry {
  data: RoleOverviewData;
  timestamp: number;
  clusterTitle: string;
  isFallback: boolean; // Track if this is fallback data
}

interface RoleOverviewCache {
  [roleKey: string]: CacheEntry;
}

/**
 * Module-level cache for session-based caching
 */
const sessionCache: RoleOverviewCache = {};

/**
 * Generate a cache key from role name and cluster title
 */
function getCacheKey(roleName: string, clusterTitle: string): string {
  return `overview::${roleName.toLowerCase().trim()}::${clusterTitle.toLowerCase().trim()}`;
}

/**
 * Check if a cache entry exists and is valid (only return non-fallback data)
 */
function checkCache(roleName: string, clusterTitle: string): RoleOverviewData | null {
  const key = getCacheKey(roleName, clusterTitle);
  const entry = sessionCache[key];

  // Only return cached data if it's not fallback data
  if (entry && entry.data && !entry.isFallback) {
    return entry.data;
  }

  if (entry && entry.isFallback) {
    return null; // Don't return fallback data from cache, try API again
  }

  return null;
}

/**
 * Store role overview in cache
 */
function setCache(roleName: string, clusterTitle: string, data: RoleOverviewData, isFallback: boolean = false): void {
  const key = getCacheKey(roleName, clusterTitle);
  sessionCache[key] = {
    data,
    timestamp: Date.now(),
    clusterTitle,
    isFallback,
  };
}

/**
 * Clear the session cache
 */
export function clearRoleOverviewCache(): void {
  Object.keys(sessionCache).forEach(key => delete sessionCache[key]);
}

/**
 * Hook return type
 */
interface UseRoleOverviewReturn {
  responsibilities: string[];
  demandData: IndustryDemandData | null;
  careerProgression: CareerStage[];
  learningRoadmap: RoadmapPhase[];
  recommendedCourses: RecommendedCourse[];
  freeResources: FreeResource[];
  actionItems: ActionItem[];
  suggestedProjects: SuggestedProject[];
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for fetching role overview data (responsibilities + industry demand + career progression + learning roadmap + courses)
 * in a single API call for better performance
 * 
 * @param roleName - The job role name (e.g., "Software Engineer")
 * @param clusterTitle - The career cluster title (e.g., "Technology")
 * @param counsellingAPI - Injected counselling API functions
 * @param attemptId - Optional attempt ID for DB storage/retrieval
 * @returns Object containing responsibilities, demand data, career progression, learning roadmap, courses, resources, loading state, and error
 */
export function useRoleOverview(
  roleName: string | null,
  clusterTitle: string,
  counsellingAPI: CounsellingAPI,
  attemptId?: string
): UseRoleOverviewReturn {
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [demandData, setDemandData] = useState<IndustryDemandData | null>(null);
  const [careerProgression, setCareerProgression] = useState<CareerStage[]>([]);
  const [learningRoadmap, setLearningRoadmap] = useState<RoadmapPhase[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [freeResources, setFreeResources] = useState<FreeResource[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [suggestedProjects, setSuggestedProjects] = useState<SuggestedProject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const currentRequestRef = useRef<string | null>(null);

  const fetchRoleOverview = useCallback(async (role: string, cluster: string, attempt?: string) => {
    const requestKey = getCacheKey(role, cluster);
    currentRequestRef.current = requestKey;

    // Check cache first
    const cached = checkCache(role, cluster);
    if (cached) {
      setResponsibilities(cached.responsibilities ?? []);
      setDemandData(cached.industryDemand ?? null);
      setCareerProgression(cached.careerProgression ?? []);
      setLearningRoadmap(cached.learningRoadmap ?? []);
      setRecommendedCourses(cached.recommendedCourses ?? []);
      setFreeResources(cached.freeResources ?? []);
      setActionItems(cached.actionItems ?? []);
      setSuggestedProjects(cached.suggestedProjects ?? []);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await counsellingAPI.generateRoleOverview(role, cluster, attempt);

      if (currentRequestRef.current === requestKey) {
        setResponsibilities(result.responsibilities ?? []);
        setDemandData(result.industryDemand ?? null);
        setCareerProgression(result.careerProgression ?? []);
        setLearningRoadmap(result.learningRoadmap ?? []);
        setRecommendedCourses(result.recommendedCourses ?? []);
        setFreeResources(result.freeResources ?? []);
        setActionItems(result.actionItems ?? []);
        setSuggestedProjects(result.suggestedProjects ?? []);
        setCache(role, cluster, result, false); // Cache as real API data
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (currentRequestRef.current === requestKey) {
        logger.error('Failed to fetch role overview', err instanceof Error ? err : new Error(String(err)), { role });
        setError(err instanceof Error ? err : new Error('Failed to generate role overview'));

        // Return fallback without exposing error to user
        const fallback = counsellingAPI.getFallbackRoleOverview(role) || {};
        setResponsibilities(fallback.responsibilities ?? []);
        setDemandData(fallback.industryDemand ?? null);
        setCareerProgression(fallback.careerProgression ?? []);
        setLearningRoadmap(fallback.learningRoadmap ?? []);
        setRecommendedCourses(fallback.recommendedCourses ?? []);
        setFreeResources(fallback.freeResources ?? []);
        setActionItems(fallback.actionItems ?? []);
        setSuggestedProjects(fallback.suggestedProjects ?? []);
        // Don't cache fallback data - we want to retry API next time
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!roleName || roleName.trim() === '') {
      setResponsibilities([]);
      setDemandData(null);
      setCareerProgression([]);
      setLearningRoadmap([]);
      setRecommendedCourses([]);
      setFreeResources([]);
      setActionItems([]);
      setSuggestedProjects([]);
      setLoading(false);
      setError(null);
      currentRequestRef.current = null;
      return;
    }

    fetchRoleOverview(roleName, clusterTitle, attemptId);
    // NOTE: `counsellingAPI` is intentionally excluded — callers pass it as a new
    // object literal each render, so including it re-fired this effect on every
    // render, spawning duplicate generations whose results were discarded by the
    // stale-request guard (leaving responsibilities empty). fetchRoleOverview is
    // a stable useCallback that already closes over the API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleName, clusterTitle, attemptId, fetchRoleOverview]);

  return {
    responsibilities,
    demandData,
    careerProgression,
    learningRoadmap,
    recommendedCourses,
    freeResources,
    actionItems,
    suggestedProjects,
    loading,
    error,
  };
}

export default useRoleOverview;
