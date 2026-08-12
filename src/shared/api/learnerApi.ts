/**
 * Learner API Client Hooks
 * 
 * React Query hooks for fetching learner dashboard data.
 * Implements parallel data fetching strategy with proper cache times
 * and error handling.
 * 
 * **Task 3.3**: Create API client hooks in `src/shared/api/learnerApi.ts`
 * **Validates Requirements**: 12.1-12.6, 16.7-16.9
 * 
 * @module shared/api/learnerApi
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiGet } from './apiClient';
import type {
    LearnerProfile,
    CourseProgress,
    SkillDataExtended,
    LearningPath,
} from '../../entities/learner/model/types';
import type { Opportunity } from '../../entities/opportunity/model/types';

/**
 * Achievement data type (individual achievement/badge/certificate)
 */
export interface Achievement {
    id: string;
    type: 'badge' | 'certificate' | 'milestone';
    title: string;
    description?: string;
    earnedAt: Date;
    icon?: string;
}

/**
 * Achievements data structure returned by the /learner/achievements endpoint
 * Contains aggregated achievement statistics and collections
 */
export interface AchievementsData {
    currentStreak?: number;
    longestStreak?: number;
    badges?: Achievement[];
    totalBadgesAvailable?: number;
    certificates?: Achievement[];
    lastActivity?: Date | string;
}

/**
 * useLearnerProfile Hook
 * 
 * Fetches learner profile data including college info, scores, and verification status.
 * 
 * **Cache Configuration:**
 * - staleTime: 10 minutes (600000ms)
 * - gcTime: 15 minutes (900000ms)
 * - refetchOnWindowFocus: true
 * 
 * **Endpoint:** GET `/api/learner/profile`
 * 
 * **Returns:** LearnerProfile type
 * 
 * **Validates:** Requirements 12.1, 16.8
 */
export function useLearnerProfile(): UseQueryResult<LearnerProfile, Error> {
    return useQuery({
        queryKey: ['learner', 'profile'],
        queryFn: async () => {
            const response = await apiGet<LearnerProfile>('/learner/profile');
            return response;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
            // Don't retry on 401 (handled by ssoClient)
            if (error instanceof Error && error.message.includes('401')) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

/**
 * useLearnerCourses Hook
 * 
 * Fetches learner courses data with progress tracking.
 * 
 * **Cache Configuration:**
 * - staleTime: 5 minutes (300000ms)
 * - gcTime: 10 minutes (600000ms)
 * - refetchOnWindowFocus: true
 * 
 * **Endpoint:** GET `/api/learner/courses`
 * 
 * **Returns:** CourseProgress[] type
 * 
 * **Validates:** Requirements 12.2, 16.7
 */
export function useLearnerCourses(): UseQueryResult<CourseProgress[], Error> {
    return useQuery({
        queryKey: ['learner', 'courses'],
        queryFn: async () => {
            const response = await apiGet<CourseProgress[]>('/learner/courses');
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
            if (error instanceof Error && error.message.includes('401')) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

/**
 * useLearnerSkills Hook
 * 
 * Fetches learner skills data with proficiency levels and health status.
 * 
 * **Cache Configuration:**
 * - staleTime: 5 minutes (300000ms)
 * - gcTime: 10 minutes (600000ms)
 * - refetchOnWindowFocus: true
 * 
 * **Endpoint:** GET `/api/learner/skills`
 * 
 * **Returns:** SkillData[] type
 * 
 * **Validates:** Requirements 12.3, 16.7
 */
export function useLearnerSkills(): UseQueryResult<SkillDataExtended[], Error> {
    return useQuery({
        queryKey: ['learner', 'skills'],
        queryFn: async () => {
            const response = await apiGet<SkillDataExtended[]>('/learner/skills');
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
            if (error instanceof Error && error.message.includes('401')) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

/**
 * useOpportunities Hook
 * 
 * Fetches job opportunities available to the learner.
 * 
 * **Cache Configuration:**
 * - staleTime: 5 minutes (300000ms)
 * - gcTime: 10 minutes (600000ms)
 * - refetchOnWindowFocus: true
 * 
 * **Endpoint:** GET `/api/opportunities`
 * 
 * **Returns:** Opportunity[] type
 * 
 * **Validates:** Requirements 12.4, 16.7
 */
export function useOpportunities(): UseQueryResult<Opportunity[], Error> {
    return useQuery({
        queryKey: ['opportunities'],
        queryFn: async () => {
            const response = await apiGet<Opportunity[]>('/opportunities');
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
            if (error instanceof Error && error.message.includes('401')) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

/**
 * useAchievements Hook
 * 
 * Fetches learner achievements including badges, certificates, and milestones.
 * 
 * **Cache Configuration:**
 * - staleTime: 5 minutes (300000ms)
 * - gcTime: 10 minutes (600000ms)
 * - refetchOnWindowFocus: true
 * 
 * **Endpoint:** GET `/api/learner/achievements`
 * 
 * **Returns:** AchievementsData with aggregated stats and collections
 * 
 * **Validates:** Requirements 12.5, 16.7
 */
export function useAchievements(): UseQueryResult<AchievementsData, Error> {
    return useQuery({
        queryKey: ['learner', 'achievements'],
        queryFn: async () => {
            const response = await apiGet<AchievementsData>('/learner/achievements');
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
            if (error instanceof Error && error.message.includes('401')) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

/**
 * useCurrentLearningPath Hook
 * 
 * Fetches the learner's current active learning path with progress.
 * Returns null if no active learning path.
 * 
 * **Cache Configuration:**
 * - staleTime: 5 minutes (300000ms)
 * - gcTime: 10 minutes (600000ms)
 * - refetchOnWindowFocus: true
 * 
 * **Endpoint:** GET `/api/learner/learning-path`
 * 
 * **Returns:** LearningPath | null type
 * 
 * **Validates:** Requirements 12.6, 16.7
 */
export function useCurrentLearningPath(): UseQueryResult<LearningPath | null, Error> {
    return useQuery({
        queryKey: ['learner', 'learning-path'],
        queryFn: async () => {
            try {
                const response = await apiGet<LearningPath | null>('/learner/learning-path');
                return response;
            } catch (error) {
                // If no learning path exists (404), return null instead of throwing
                if (error instanceof Error && error.message.includes('404')) {
                    return null;
                }
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
            // Don't retry on 401 or 404
            if (error instanceof Error && (error.message.includes('401') || error.message.includes('404'))) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

/**
 * Query Keys
 * 
 * Exported query key constants for use with query invalidation and refetching.
 */
export const learnerQueryKeys = {
    profile: ['learner', 'profile'] as const,
    courses: ['learner', 'courses'] as const,
    skills: ['learner', 'skills'] as const,
    opportunities: ['opportunities'] as const,
    achievements: ['learner', 'achievements'] as const,
    learningPath: ['learner', 'learning-path'] as const,
} as const;
