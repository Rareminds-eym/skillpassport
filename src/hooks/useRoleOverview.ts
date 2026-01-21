import { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateRoleOverview,
  getFallbackRoleOverview,
  RoleOverviewData,
  IndustryDemandData,
  CareerStage,
  RoadmapPhase,
  RecommendedCourse,
  FreeResource,
  ActionItem,
  SuggestedProject,
} from '../services/aiCareerPathService';

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
    console.log(`[RoleOverview] Cache hit for ${roleName} (real API data)`);
    return entry.data;
  }

  if (entry && entry.isFallback) {
    console.log(`[RoleOverview] Cache contains fallback data for ${roleName}, will retry API`);
    return null; // Don't return fallback data from cache, try API again
  }

  console.log(`[RoleOverview] Cache miss for ${roleName}`);
  return null;
}

/**
 * Store role overview in cache
 */
function setCache(
  roleName: string,
  clusterTitle: string,
  data: RoleOverviewData,
  isFallback: boolean = false
): void {
  const key = getCacheKey(roleName, clusterTitle);
  sessionCache[key] = {
    data,
    timestamp: Date.now(),
    clusterTitle,
    isFallback,
  };
  console.log(
    `[RoleOverview] Cached ${isFallback ? 'fallback' : 'API'} data for ${roleName}:`,
    data
  );
}

/**
 * Clear the session cache
 */
export function clearRoleOverviewCache(): void {
  Object.keys(sessionCache).forEach((key) => delete sessionCache[key]);
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
 * @returns Object containing responsibilities, demand data, career progression, learning roadmap, courses, resources, loading state, and error
 */
export function useRoleOverview(
  roleName: string | null,
  clusterTitle: string
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

  const fetchRoleOverview = useCallback(async (role: string, cluster: string) => {
    const requestKey = getCacheKey(role, cluster);
    currentRequestRef.current = requestKey;

    // Check cache first
    const cached = checkCache(role, cluster);
    if (cached) {
      setResponsibilities(cached.responsibilities);
      setDemandData(cached.industryDemand);
      setCareerProgression(cached.careerProgression);
      setLearningRoadmap(cached.learningRoadmap);
      setRecommendedCourses(cached.recommendedCourses);
      setFreeResources(cached.freeResources);
      setActionItems(cached.actionItems);
      setSuggestedProjects(cached.suggestedProjects || []);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[RoleOverview Hook] Fetching overview for: ${role}`);
      const result = await generateRoleOverview(role, cluster);

      if (currentRequestRef.current === requestKey) {
        console.log(`[RoleOverview Hook] Successfully received data for: ${role}`);
        setResponsibilities(result.responsibilities);
        setDemandData(result.industryDemand);
        setCareerProgression(result.careerProgression);
        setLearningRoadmap(result.learningRoadmap);
        setRecommendedCourses(result.recommendedCourses);
        setFreeResources(result.freeResources);
        setActionItems(result.actionItems);
        setSuggestedProjects(result.suggestedProjects || []);
        setCache(role, cluster, result, false); // Cache as real API data
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (currentRequestRef.current === requestKey) {
        console.error('[RoleOverview Hook] Error fetching role overview:', err);
        setError(err instanceof Error ? err : new Error('Failed to generate role overview'));

        // Return fallback without exposing error to user
        console.log(`[RoleOverview Hook] Using fallback data for: ${role}`);
        const fallback = getFallbackRoleOverview(role);
        setResponsibilities(fallback.responsibilities);
        setDemandData(fallback.industryDemand);
        setCareerProgression(fallback.careerProgression);
        setLearningRoadmap(fallback.learningRoadmap);
        setRecommendedCourses(fallback.recommendedCourses);
        setFreeResources(fallback.freeResources);
        setActionItems(fallback.actionItems);
        setSuggestedProjects(fallback.suggestedProjects || []);
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

    fetchRoleOverview(roleName, clusterTitle);
  }, [roleName, clusterTitle, fetchRoleOverview]);

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
