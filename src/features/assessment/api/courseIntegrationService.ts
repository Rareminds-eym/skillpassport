/**
 * Course Integration Service
 * Handles course recommendation logic
 * 
 * @version 2.1.0
 */

import {
  getCoursesForMultipleSkillGaps,
  getRecommendedCourses,
  getRecommendedCoursesByType
} from '@/features/courses';
import { supabase } from '@/shared/api/supabaseClient';
import { updateProgress } from './geminiApiService.js';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('course-integration');

interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  [key: string]: unknown;
}

interface AssessmentResults {
  riasec?: {
    scores?: Record<string, number>;
    [key: string]: unknown;
  };
  aptitude?: {
    scores?: Record<string, unknown>;
    [key: string]: unknown;
  };
  skillGap?: {
    priorityA?: SkillGap[];
    [key: string]: unknown;
  };
  careerFit?: unknown;
  [key: string]: unknown;
}

interface Course {
  course_id?: string;
  [key: string]: unknown;
}

interface CoursesByType {
  technical: Course[];
  soft: Course[];
}

interface EnrichedAssessmentResults extends AssessmentResults {
  platformCourses: Course[];
  coursesByType: CoursesByType;
  skillGapCourses: Record<string, Course[]>;
}

/**
 * Add course recommendations to assessment results
 * Fetches platform courses that match the learner's profile using RAG-based recommendations
 * NOW considers ALL past assessments to provide comprehensive recommendations
 * 
 * @param assessmentResults - Parsed results from current AI assessment
 * @param learnerId - Learner ID to fetch all past assessments
 * @returns Results with platformCourses, coursesByType, and skillGapCourses added
 */
export const addCourseRecommendations = async (
  assessmentResults: AssessmentResults,
  learnerId: string | null = null
): Promise<EnrichedAssessmentResults> => {
  try {
    logger.info('=== Adding Course Recommendations ===');
    updateProgress('courses', 'Finding relevant courses...');

    let aggregatedProfile: AssessmentResults = assessmentResults;
    
    if (learnerId) {
      try {
        const { data: pastAssessments, error } = await supabase
          .from('personal_assessment_results')
          .select('riasec_scores, aptitude_scores, skill_gap, career_fit, stream_id, grade_level')
          .eq('learner_id', learnerId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && pastAssessments && pastAssessments.length > 0) {
          const allSkillGaps: SkillGap[] = [];
          pastAssessments.forEach((assessment: any) => {
            if (assessment.skill_gap?.priorityA) {
              allSkillGaps.push(...assessment.skill_gap.priorityA);
            }
          });

          const uniqueSkills = Array.from(
            new Map(allSkillGaps.map(skill => [skill.skill, skill])).values()
          );

          aggregatedProfile = {
            ...assessmentResults,
            skillGap: {
              ...assessmentResults.skillGap,
              priorityA: uniqueSkills.slice(0, 10),
              allAssessments: pastAssessments.length
            }
          };
        }
      } catch (fetchError) {
        const error = fetchError as Error;
        logger.warn('Failed to fetch past assessments:', { error: error.message });
      }
    }

    let coursesByType: CoursesByType = { technical: [], soft: [] };
    let platformCourses: Course[] = [];

    try {
      coursesByType = await getRecommendedCoursesByType(aggregatedProfile, 5);
      platformCourses = [...coursesByType.technical, ...coursesByType.soft];

      if (platformCourses.length === 0) {
        platformCourses = await getRecommendedCourses(aggregatedProfile);
      }
    } catch (error) {
      const err = error as Error;
      logger.warn('Failed to get platform course recommendations:', { error: err.message });
      try {
        platformCourses = await getRecommendedCourses(aggregatedProfile);
      } catch (fallbackError) {
        const fallbackErr = fallbackError as Error;
        logger.warn('Fallback also failed:', { error: fallbackErr.message });
      }
    }

    let skillGapCourses: Record<string, Course[]> = {};
    try {
      const skillGaps = aggregatedProfile.skillGap?.priorityA || [];
      if (skillGaps.length > 0) {
        skillGapCourses = await getCoursesForMultipleSkillGaps(skillGaps);
      }
    } catch (error) {
      const err = error as Error;
      logger.warn('Failed to get skill gap course mappings:', { error: err.message });
    }

    return {
      ...assessmentResults,
      platformCourses,
      coursesByType,
      skillGapCourses
    };
  } catch (error) {
    logger.error('Error adding course recommendations:', error);
    return {
      ...assessmentResults,
      platformCourses: [],
      coursesByType: { technical: [], soft: [] },
      skillGapCourses: {}
    };
  }
};
