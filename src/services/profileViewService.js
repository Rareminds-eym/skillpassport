/**
 * Profile View Tracking Service
 * 
 * This service tracks when profiles are viewed and automatically
 * creates updates in the recent_updates table via database triggers.
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Track when a profile is viewed
 * 
 * @param {string} studentId - The UUID of the student whose profile is being viewed
 * @param {string} viewerType - Type of viewer: 'recruiter', 'student', or 'anonymous'
 * @param {string|null} viewerId - The UUID of the viewer (null for anonymous)
 * @returns {Promise<{success: boolean, error?: any}>}
 * 
 * @example
 * // Track a recruiter viewing a student profile
 * await trackProfileView(studentId, 'recruiter', currentUser.id);
 * 
 * // Track anonymous view
 * await trackProfileView(studentId, 'anonymous', null);
 */
export async function trackProfileView(studentId, viewerType = 'anonymous', viewerId = null) {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    console.log('👁️ Tracking profile view:', {
      studentId,
      viewerType,
      viewerId: viewerId || 'anonymous'
    });

    // Call the database function to track the view
    const { data, error } = await supabase.rpc('track_profile_view', {
      p_student_id: studentId,
      p_viewer_type: viewerType,
      p_viewer_id: viewerId
    });

    if (error) {
      console.error('❌ Error tracking profile view:', error);
      throw error;
    }

    console.log('✅ Profile view tracked successfully');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to track profile view:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add an opportunity match update for a student
 * 
 * @param {string} studentId - The UUID of the student
 * @param {string} opportunityTitle - The title of the opportunity
 * @param {string} companyName - The name of the company
 * @returns {Promise<{success: boolean, error?: any}>}
 * 
 * @example
 * await addOpportunityMatchUpdate(
 *   studentId,
 *   'Frontend Developer',
 *   'Google'
 * );
 */
export async function addOpportunityMatchUpdate(studentId, opportunityTitle, companyName) {
  try {
    if (!studentId || !opportunityTitle || !companyName) {
      throw new Error('All parameters are required');
    }

    console.log('🎯 Adding opportunity match update:', {
      studentId,
      opportunityTitle,
      companyName
    });

    const { data, error } = await supabase.rpc('add_opportunity_match_update', {
      p_student_id: studentId,
      p_opportunity_title: opportunityTitle,
      p_company_name: companyName
    });

    if (error) throw error;

    console.log('✅ Opportunity match update added');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to add opportunity match update:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a custom achievement update for a student
 * 
 * @param {string} studentId - The UUID of the student
 * @param {string} achievement - The achievement message
 * @returns {Promise<{success: boolean, error?: any}>}
 * 
 * @example
 * await addAchievementUpdate(
 *   studentId,
 *   'Completed 5 courses this month'
 * );
 */
export async function addAchievementUpdate(studentId, achievement) {
  try {
    if (!studentId || !achievement) {
      throw new Error('Student ID and achievement are required');
    }

    console.log('🏆 Adding achievement update:', {
      studentId,
      achievement
    });

    const { data, error } = await supabase.rpc('add_achievement_update', {
      p_student_id: studentId,
      p_achievement: achievement
    });

    if (error) throw error;

    console.log('✅ Achievement update added');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to add achievement update:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get profile view statistics for a student
 * 
 * @param {string} studentId - The UUID of the student
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<{success: boolean, count?: number, error?: any}>}
 * 
 * @example
 * const { count } = await getProfileViewStats(studentId, 7);
 * console.log(`Profile viewed ${count} times in the last 7 days`);
 */
export async function getProfileViewStats(studentId, days = 7) {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const { data, error, count } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .gte('viewed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('❌ Failed to get profile view stats:', error);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Get detailed profile view history
 * 
 * @param {string} studentId - The UUID of the student
 * @param {number} limit - Maximum number of records to return (default: 50)
 * @returns {Promise<{success: boolean, views?: array, error?: any}>}
 */
export async function getProfileViewHistory(studentId, limit = 50) {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const { data, error } = await supabase
      .from('profile_views')
      .select('*')
      .eq('student_id', studentId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, views: data || [] };
  } catch (error) {
    console.error('❌ Failed to get profile view history:', error);
    return { success: false, views: [], error: error.message };
  }
}

export default {
  trackProfileView,
  addOpportunityMatchUpdate,
  addAchievementUpdate,
  getProfileViewStats,
  getProfileViewHistory
};
