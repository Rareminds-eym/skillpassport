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
} from '../courseRecommendationService';
import { supabase } from '../../lib/supabaseClient';
import { updateProgress } from './geminiApiService.js';

/**
 * Add course recommendations to assessment results
 * Fetches platform courses that match the student's profile using RAG-based recommendations
 * NOW considers ALL past assessments to provide comprehensive recommendations
 * 
 * @param {Object} assessmentResults - Parsed results from current AI assessment
 * @param {string} studentId - Student ID to fetch all past assessments
 * @returns {Promise<Object>} - Results with platformCourses, coursesByType, and skillGapCourses added
 */
export const addCourseRecommendations = async (assessmentResults, studentId = null) => {
  try {
    console.log('=== Adding Course Recommendations ===');
    updateProgress('courses', 'Finding relevant courses...');

    let aggregatedProfile = assessmentResults;
    
    if (studentId) {
      try {
        const { data: pastAssessments, error } = await supabase
          .from('personal_assessment_results')
          .select('riasec_scores, aptitude_scores, skill_gap, career_fit, stream_id, grade_level')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && pastAssessments && pastAssessments.length > 0) {
          const allSkillGaps = [];
          pastAssessments.forEach(assessment => {
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
        console.warn('Failed to fetch past assessments:', fetchError.message);
      }
    }

    let coursesByType = { technical: [], soft: [] };
    let platformCourses = [];

    try {
      coursesByType = await getRecommendedCoursesByType(aggregatedProfile, 5);
      platformCourses = [...coursesByType.technical, ...coursesByType.soft];

      if (platformCourses.length === 0) {
        platformCourses = await getRecommendedCourses(aggregatedProfile);
      }
    } catch (error) {
      console.warn('Failed to get platform course recommendations:', error.message);
      try {
        platformCourses = await getRecommendedCourses(aggregatedProfile);
      } catch (fallbackError) {
        console.warn('Fallback also failed:', fallbackError.message);
      }
    }

    let skillGapCourses = {};
    try {
      const skillGaps = aggregatedProfile.skillGap?.priorityA || [];
      if (skillGaps.length > 0) {
        skillGapCourses = await getCoursesForMultipleSkillGaps(skillGaps);
      }
    } catch (error) {
      console.warn('Failed to get skill gap course mappings:', error.message);
    }

    return {
      ...assessmentResults,
      platformCourses,
      coursesByType,
      skillGapCourses
    };
  } catch (error) {
    console.error('Error adding course recommendations:', error);
    return {
      ...assessmentResults,
      platformCourses: [],
      coursesByType: { technical: [], soft: [] },
      skillGapCourses: {}
    };
  }
};