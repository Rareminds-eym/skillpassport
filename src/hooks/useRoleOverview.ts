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
  ActionItem
} from '../services/aiCareerPathService';

/**
 * Cache structure for storing role overview data
 */
interface CacheEntry {
  data: RoleOverviewData;
  timestamp: number;
  clusterTitle: string;
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
 * Check if a cache entry exists and is valid
 */
function checkCache(roleName: string, clusterTitle: string): RoleOverviewData | null {
  const key = getCacheKey(roleName, clusterTitle);
  const entry = sessionCache[key];
  
  if (entry && entry.data) {
    console.log(`[RoleOverview] Cache hit for ${roleName}`);
    return entry.data;
  }
  
  console.log(`[RoleOverview] Cache miss for ${roleName}`);
  return null;
}

/**
 * Store role overview in cache
 */
function setCache(roleName: string, clusterTitle: string, data: RoleOverviewData): void {
  const key = getCacheKey(roleName, clusterTitle);
  sessionCache[key] = {
    data,
    timestamp: Date.now(),
    clusterTitle,
  };
  console.log(`[RoleOverview] Cached data for ${roleName}:`, data);
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
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateRoleOverview(role, cluster);
      
      if (currentRequestRef.current === requestKey) {
        setResponsibilities(result.responsibilities);
        setDemandData(result.industryDemand);
        setCareerProgression(result.careerProgression);
        setLearningRoadmap(result.learningRoadmap);
        setRecommendedCourses(result.recommendedCourses);
        setFreeResources(result.freeResources);
        setActionItems(result.actionItems);
        setCache(role, cluster, result);
        setLoading(false);
      }
    } catch (err) {
      if (currentRequestRef.current === requestKey) {
        console.error('Error fetching role overview:', err);
        setError(err instanceof Error ? err : new Error('Failed to generate role overview'));
        
        // Return fallback without exposing error to user
        const fallback = getFallbackRoleOverview(role);
        setResponsibilities(fallback.responsibilities);
        setDemandData(fallback.industryDemand);
        setCareerProgression(fallback.careerProgression);
        setLearningRoadmap(fallback.learningRoadmap);
        setRecommendedCourses(fallback.recommendedCourses);
        setFreeResources(fallback.freeResources);
        setActionItems(fallback.actionItems);
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
    loading,
    error,
  };
}

export default useRoleOverview;
