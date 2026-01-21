/**
 * Recommendation Storage
 * Handles saving and retrieving course recommendations from the database.
 */

import { supabase } from '../../lib/supabaseClient';
import { getRecommendedCourses } from './recommendationService';

/**
 * Save course recommendations to the database.
 * Creates records in student_course_recommendations table.
 *
 * @param {string} studentId - Student's user_id
 * @param {Array} recommendations - Array of recommended courses from getRecommendedCourses
 * @param {string} assessmentResultId - ID of the assessment result (optional)
 * @param {string} recommendationType - Type: 'assessment', 'skill_gap', 'career_path', 'manual'
 * @returns {Promise<Array>} - Array of saved recommendation records
 */
export const saveRecommendations = async (
  studentId,
  recommendations,
  assessmentResultId = null,
  recommendationType = 'assessment'
) => {
  if (!studentId || !recommendations || recommendations.length === 0) {
    console.warn('Missing required parameters for saving recommendations');
    return [];
  }

  try {
    // Prepare records for insertion
    const records = recommendations.map((rec) => ({
      student_id: studentId,
      course_id: rec.course_id,
      assessment_result_id: assessmentResultId,
      relevance_score: rec.relevance_score,
      match_reasons: rec.match_reasons || [],
      skill_gaps_addressed: rec.skill_gaps_addressed || [],
      recommendation_type: recommendationType,
      status: 'active',
      recommended_at: new Date().toISOString(),
    }));

    // Upsert to handle duplicates (update if exists)
    const { data, error } = await supabase
      .from('student_course_recommendations')
      .upsert(records, {
        onConflict: 'student_id,course_id,assessment_result_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Failed to save recommendations:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error saving recommendations:', error);
    throw error;
  }
};

/**
 * Get saved recommendations for a student from the database.
 *
 * @param {string} studentId - Student's user_id
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status ('active', 'enrolled', 'dismissed', 'completed')
 * @param {string} options.assessmentResultId - Filter by specific assessment result
 * @param {boolean} options.includeCourseDetails - Join with courses table for full details
 * @returns {Promise<Array>} - Array of recommendation records
 */
export const getSavedRecommendations = async (studentId, options = {}) => {
  if (!studentId) {
    console.warn('Student ID required to get saved recommendations');
    return [];
  }

  try {
    let query = supabase
      .from('student_course_recommendations')
      .select(
        `
        *,
        course:courses(
          course_id,
          title,
          code,
          description,
          duration,
          category,
          status
        )
      `
      )
      .eq('student_id', studentId)
      .order('relevance_score', { ascending: false });

    // Apply filters
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.assessmentResultId) {
      query = query.eq('assessment_result_id', options.assessmentResultId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get saved recommendations:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting saved recommendations:', error);
    return [];
  }
};

/**
 * Update recommendation status (e.g., when student enrolls or dismisses).
 *
 * @param {string} recommendationId - ID of the recommendation record
 * @param {string} status - New status: 'active', 'enrolled', 'dismissed', 'completed'
 * @param {string} dismissedReason - Reason for dismissal (optional)
 * @returns {Promise<Object>} - Updated recommendation record
 */
export const updateRecommendationStatus = async (
  recommendationId,
  status,
  dismissedReason = null
) => {
  if (!recommendationId || !status) {
    throw new Error('Recommendation ID and status are required');
  }

  const validStatuses = ['active', 'enrolled', 'dismissed', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'dismissed') {
      updateData.dismissed_at = new Date().toISOString();
      updateData.dismissed_reason = dismissedReason;
    }

    const { data, error } = await supabase
      .from('student_course_recommendations')
      .update(updateData)
      .eq('id', recommendationId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update recommendation status:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    throw error;
  }
};

/**
 * Get recommendations and save them to the database.
 * Combines getRecommendedCourses with saveRecommendations.
 *
 * @param {string} studentId - Student's user_id
 * @param {Object} assessmentResults - Assessment results from AI analysis
 * @param {string} assessmentResultId - ID of the assessment result record
 * @returns {Promise<Array>} - Array of recommended courses (also saved to DB)
 */
export const getAndSaveRecommendations = async (
  studentId,
  assessmentResults,
  assessmentResultId = null
) => {
  if (!studentId || !assessmentResults) {
    console.warn('Student ID and assessment results required');
    return [];
  }

  try {
    // Get recommendations
    const recommendations = await getRecommendedCourses(assessmentResults);

    if (recommendations.length === 0) {
      return [];
    }

    // Save to database
    await saveRecommendations(studentId, recommendations, assessmentResultId, 'assessment');

    return recommendations;
  } catch (error) {
    console.error('Error in getAndSaveRecommendations:', error);
    // Return recommendations even if save fails
    return await getRecommendedCourses(assessmentResults);
  }
};
