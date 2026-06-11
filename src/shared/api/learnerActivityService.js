/**
 * Learner Activity Service - Fetch activities related to a specific learner
 * This replaces the mock recentUpdates with real data from recruitment tables
 */

import { apiPost } from '@/shared/api/apiClient';

/**
 * Add a course enrollment activity to recent updates
 * @param {string} learnerEmail - Learner's email address
 * @param {Object} courseDetails - Course details (title, code, educator_name)
 */
export const addCourseEnrollmentActivity = async (learnerEmail, courseDetails) => {
  if (!learnerEmail || !courseDetails) {
    return { success: false, error: 'Learner email and course details required' };
  }

  try {
    const result = await apiPost('/learner-activity/actions', {
      action: 'add-course-enrollment-activity',
      learnerEmail,
      courseDetails,
    });

    return result;
  } catch (error) {
    console.error('Error adding course enrollment activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a new course notification to all learners
 * @param {Object} courseDetails - Course details (title, code, educator_name, course_id)
 */
export const notifyAlllearnersNewCourse = async (courseDetails) => {
  console.log('🔔 ========== NEW COURSE NOTIFICATION STARTED ==========');
  console.log('📚 Course Details:', courseDetails);

  if (!courseDetails) {
    console.error('❌ No course details provided');
    return { success: false, error: 'Course details required' };
  }

  try {
    const result = await apiPost('/learner-activity/actions', {
      action: 'notify-all-learners-new-course',
      courseDetails,
    });

    console.log(`✅ Notification complete: ${result.successCount || 0} succeeded`);
    console.log('🔔 ========== NEW COURSE NOTIFICATION ENDED ==========');

    return { success: true, data: result };
  } catch (error) {
    console.error('❌ CRITICAL ERROR in notifyAlllearnersNewCourse:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get recent activities for a specific learner by their email
 * @param {string} learnerEmail - Learner's email address
 * @param {number} limit - Number of activities to fetch (default: 10)
 */
export const getlearnerRecentActivity = async (learnerEmail, limit = 10) => {
  
  if (!learnerEmail) {
    return { data: [], error: 'Learner email required' };
  }

  try {
    const result = await apiPost('/learner-activity/actions', {
      action: 'get-learner-recent-activity',
      learnerEmail,
      limit,
    });

    return {
      data: result.activities || [],
      error: null,
    };
  } catch (error) {
    console.error('❌ Error fetching learner activities:', error);
    return { 
      data: [], 
      error: error.message || 'Failed to fetch activities' 
    };
  }
};

/**
 * Create a profile update activity (for future use)
 * This can be called when learner updates their profile
 */
export const logProfileUpdate = async (learnerEmail, section, action, details) => {
  
  // For now, just log to console
  // In the future, we can create a profile_updates table
  const activity = {
    learnerEmail,
    section, // 'education', 'skills', 'experience'
    action,  // 'added', 'updated', 'removed'
    details,
    timestamp: new Date().toISOString()
  };

  return { success: true, activity };
};
