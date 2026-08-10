/**
 * Composite Dashboard Hook
 * 
 * This hook orchestrates all data fetching for the college student dashboard.
 * It fetches data in parallel using React Query hooks and performs calculations
 * to provide a comprehensive dashboard state.
 * 
 * **Task 16.1**: Create useCollegeDashboard composite hook (renamed from useLearnerDashboard to avoid collision)
 * **Task 25.1**: Performance optimizations - added useMemo for expensive calculations
 * **Validates Requirements**: 12.1-12.13, 13.1-13.10, 16.1-16.6, 16.10
 * 
 * @module features/learner-profile/model/useCollegeDashboard
 */

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useLearnerProfile,
  useLearnerCourses,
  useLearnerSkills,
  useOpportunities,
  useAchievements,
  useCurrentLearningPath,
  learnerQueryKeys,
  type Achievement,
} from '@/shared/api/learnerApi';
import { calculateEnrollabilityScore, type LearnerWithCourses } from '@/shared/lib/calculations/enrollability';
import { aggregateLearningMetrics, type Certificate } from '@/shared/lib/calculations/learningMetrics';
import { calculateSkillHealth } from '@/shared/lib/calculations/skillHealth';
import { matchOpportunitiesWithAI } from '@/shared/lib/calculations/aiMatching';
import type {
  LearnerProfile,
  CourseProgress,
  SkillDataExtended,
  LearningPath,
  EnrollabilityScore,
  AggregatedLearningMetrics,
  SkillHealthBreakdown,
} from '@/entities/learner/model/types';
import type { Opportunity, AIMatchedJob } from '@/entities/opportunity/model/types';

/**
 * Comprehensive dashboard state returned by useCollegeDashboard hook
 */
export interface CollegeDashboardState {
  // Raw Data
  profile: LearnerProfile | undefined;
  courses: CourseProgress[] | undefined;
  skills: SkillDataExtended[] | undefined;
  opportunities: Opportunity[] | undefined;
  achievements: Achievement[] | undefined;
  learningPath: LearningPath | null | undefined;

  // Calculated Metrics
  enrollabilityScore: EnrollabilityScore | undefined;
  learningMetrics: AggregatedLearningMetrics | undefined;
  skillHealth: SkillHealthBreakdown | undefined;
  matchedJobs: AIMatchedJob[] | undefined;

  // Loading States
  isLoading: boolean;
  profileLoading: boolean;
  coursesLoading: boolean;
  skillsLoading: boolean;
  opportunitiesLoading: boolean;
  achievementsLoading: boolean;
  learningPathLoading: boolean;

  // Error States
  error: Error | null;
  profileError: Error | null;
  coursesError: Error | null;
  skillsError: Error | null;
  opportunitiesError: Error | null;
  achievementsError: Error | null;
  learningPathError: Error | null;

  // Actions
  refresh: () => void;
}

/**
 * useCollegeDashboard Hook
 * 
 * Composite hook that fetches all dashboard data in parallel and performs calculations.
 * 
 * **Features:**
 * - Parallel data fetching using React Query hooks
 * - Automatic calculation of enrollability score, learning metrics, skill health, and AI job matching
 * - Individual loading and error states for each data source
 * - Graceful error handling (preserve loaded data on partial failure)
 * - Manual refresh function to refetch all data
 * 
 * **Data Sources:**
 * 1. useLearnerProfile() - Profile data (10min cache)
 * 2. useLearnerCourses() - Courses data (5min cache)
 * 3. useLearnerSkills() - Skills data (5min cache)
 * 4. useOpportunities() - Opportunities data (5min cache)
 * 5. useAchievements() - Achievements data (5min cache)
 * 6. useCurrentLearningPath() - Learning path data (5min cache)
 * 
 * **Calculations:**
 * 1. Enrollability Score - calculateEnrollabilityScore()
 * 2. Learning Metrics - aggregateLearningMetrics()
 * 3. Skill Health - calculateSkillHealth()
 * 4. AI Job Matching - matchOpportunitiesWithAI()
 * 
 * **Loading Behavior:**
 * - isLoading is true when ANY data source is loading
 * - Individual loading states available for granular UI control
 * 
 * **Error Handling:**
 * - Individual errors tracked per data source
 * - error is first non-null error encountered
 * - Loaded data is preserved even if one API fails
 * - Calculations only run when all required data is available
 * 
 * **Refresh Function:**
 * - Refetches all data sources in parallel
 * - Useful for pull-to-refresh or manual reload scenarios
 * 
 * @returns CollegeDashboardState with all data, metrics, loading states, and actions
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   const {
 *     profile,
 *     courses,
 *     enrollabilityScore,
 *     learningMetrics,
 *     skillHealth,
 *     matchedJobs,
 *     isLoading,
 *     error,
 *     refresh
 *   } = useCollegeDashboard();
 * 
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} onRetry={refresh} />;
 * 
 *   return (
 *     <div>
 *       <ProfileCard profile={profile} score={enrollabilityScore} />
 *       <LearningMetricsWidget metrics={learningMetrics} />
 *       <SkillHealthWidget breakdown={skillHealth} />
 *       <OpportunitiesWidget jobs={matchedJobs} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useCollegeDashboard(): CollegeDashboardState {
  const queryClient = useQueryClient();

  // Fetch all data in parallel using React Query hooks
  const profileQuery = useLearnerProfile();
  const coursesQuery = useLearnerCourses();
  const skillsQuery = useLearnerSkills();
  const opportunitiesQuery = useOpportunities();
  const achievementsQuery = useAchievements();
  const learningPathQuery = useCurrentLearningPath();

  // Extract data from queries
  const profile = profileQuery.data;
  const courses = coursesQuery.data;
  const skills = skillsQuery.data;
  const opportunities = opportunitiesQuery.data;
  const achievements = achievementsQuery.data;
  const learningPath = learningPathQuery.data;

  // Calculate enrollability score (memoized for performance - Requirement 16.5)
  // Requirements: profile data + courses data
  const enrollabilityScore: EnrollabilityScore | undefined = useMemo(() => {
    if (!profile || !courses) {
      return undefined;
    }

    // Create extended learner object with course counts
    const learnerWithCourses: LearnerWithCourses = {
      ...profile,
      coursesEnrolled: courses.length,
      coursesCompleted: courses.filter(c => c.status === 'completed').length,
    };

    return calculateEnrollabilityScore(learnerWithCourses);
  }, [profile, courses]);

  // Calculate learning metrics (memoized for performance - Requirement 16.5)
  // Requirements: courses data + achievements data
  const learningMetrics: AggregatedLearningMetrics | undefined = useMemo(() => {
    if (!courses || !achievements) {
      return undefined;
    }

    // Convert achievements to certificates for aggregateLearningMetrics
    // Filter only certificate-type achievements
    const certificates: Certificate[] = achievements
      .filter(a => a.type === 'certificate')
      .map(a => ({ id: a.id }));

    return aggregateLearningMetrics(courses, certificates);
  }, [courses, achievements]);

  // Calculate skill health breakdown (memoized for performance - Requirement 16.5)
  // Requirements: skills data
  const skillHealth: SkillHealthBreakdown | undefined = useMemo(() => {
    if (!skills) {
      return undefined;
    }

    return calculateSkillHealth(skills);
  }, [skills]);

  // Perform AI job matching (memoized for performance - Requirement 16.5)
  // Requirements: opportunities data + skills data
  const matchedJobs: AIMatchedJob[] | undefined = useMemo(() => {
    if (!opportunities || !skills) {
      return undefined;
    }

    return matchOpportunitiesWithAI(opportunities, skills);
  }, [opportunities, skills]);

  // Determine overall loading state
  const isLoading =
    profileQuery.isLoading ||
    coursesQuery.isLoading ||
    skillsQuery.isLoading ||
    opportunitiesQuery.isLoading ||
    achievementsQuery.isLoading ||
    learningPathQuery.isLoading;

  // Collect individual loading states
  const profileLoading = profileQuery.isLoading;
  const coursesLoading = coursesQuery.isLoading;
  const skillsLoading = skillsQuery.isLoading;
  const opportunitiesLoading = opportunitiesQuery.isLoading;
  const achievementsLoading = achievementsQuery.isLoading;
  const learningPathLoading = learningPathQuery.isLoading;

  // Determine overall error state (first non-null error)
  const error =
    profileQuery.error ||
    coursesQuery.error ||
    skillsQuery.error ||
    opportunitiesQuery.error ||
    achievementsQuery.error ||
    learningPathQuery.error ||
    null;

  // Collect individual error states
  const profileError = profileQuery.error;
  const coursesError = coursesQuery.error;
  const skillsError = skillsQuery.error;
  const opportunitiesError = opportunitiesQuery.error;
  const achievementsError = achievementsQuery.error;
  const learningPathError = learningPathQuery.error;

  // Refresh function to refetch all data
  const refresh = () => {
    // Invalidate all learner query keys to trigger refetch
    queryClient.invalidateQueries({ queryKey: learnerQueryKeys.profile });
    queryClient.invalidateQueries({ queryKey: learnerQueryKeys.courses });
    queryClient.invalidateQueries({ queryKey: learnerQueryKeys.skills });
    queryClient.invalidateQueries({ queryKey: learnerQueryKeys.opportunities });
    queryClient.invalidateQueries({ queryKey: learnerQueryKeys.achievements });
    queryClient.invalidateQueries({ queryKey: learnerQueryKeys.learningPath });
  };

  return {
    // Raw Data
    profile,
    courses,
    skills,
    opportunities,
    achievements,
    learningPath,

    // Calculated Metrics
    enrollabilityScore,
    learningMetrics,
    skillHealth,
    matchedJobs,

    // Loading States
    isLoading,
    profileLoading,
    coursesLoading,
    skillsLoading,
    opportunitiesLoading,
    achievementsLoading,
    learningPathLoading,

    // Error States
    error,
    profileError,
    coursesError,
    skillsError,
    opportunitiesError,
    achievementsError,
    learningPathError,

    // Actions
    refresh,
  };
}
