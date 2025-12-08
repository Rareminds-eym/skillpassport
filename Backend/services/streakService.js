import supabase from './supabaseClient.js';

/**
 * Check if student has completed any activity today
 * @param {string} studentId - UUID of the student
 * @returns {Promise<boolean>} - True if student has activity today
 */
export async function checkStudentActivityToday(studentId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check student_course_progress table for any activity today
    const { data: progressData, error: progressError } = await supabase
      .from('student_course_progress')
      .select('id')
      .eq('student_id', studentId)
      .gte('last_accessed', today.toISOString())
      .lte('last_accessed', todayEnd.toISOString())
      .limit(1);

    if (progressError) {
      console.error('Error checking course progress:', progressError);
    }

    if (progressData && progressData.length > 0) {
      return true;
    }

    // You can add more activity checks here:
    // - Attendance records
    // - Assignment submissions
    // - Quiz attempts
    // etc.

    return false;
  } catch (error) {
    console.error('Error in checkStudentActivityToday:', error);
    return false;
  }
}

/**
 * Update student streak when they complete an activity
 * @param {string} studentId - UUID of the student
 * @returns {Promise<Object>} - Streak update result
 */
export async function updateStudentStreak(studentId) {
  try {
    const { data, error } = await supabase
      .rpc('update_student_streak', {
        p_student_id: studentId,
        p_activity_date: new Date().toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error updating streak:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (error) {
    console.error('Error in updateStudentStreak:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get list of students who need streak reminders
 * @returns {Promise<Array>} - Array of student objects
 */
export async function getStudentsNeedingReminder() {
  try {
    const { data, error } = await supabase
      .rpc('get_students_needing_reminder');

    if (error) {
      console.error('Error getting students needing reminder:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getStudentsNeedingReminder:', error);
    return [];
  }
}

/**
 * Log that a notification was sent
 * @param {string} studentId - UUID of the student
 * @param {number} templateNumber - Email template number (1-4)
 * @param {string} status - Status of the notification ('sent', 'failed')
 * @param {string} errorMessage - Error message if failed
 * @returns {Promise<Object>} - Log result
 */
export async function logNotificationSent(studentId, templateNumber, status = 'sent', errorMessage = null) {
  try {
    const { data, error } = await supabase
      .rpc('log_notification_sent', {
        p_student_id: studentId,
        p_template_number: templateNumber,
        p_notification_type: 'email',
        p_status: status,
        p_error_message: errorMessage
      });

    if (error) {
      console.error('Error logging notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, logId: data };
  } catch (error) {
    console.error('Error in logNotificationSent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reset daily streak flags (run at midnight)
 * @returns {Promise<Object>} - Reset result
 */
export async function resetDailyStreakFlags() {
  try {
    const { data, error } = await supabase
      .rpc('reset_daily_streak_flags');

    if (error) {
      console.error('Error resetting daily flags:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Reset daily flags for ${data} students`);
    return { success: true, count: data };
  } catch (error) {
    console.error('Error in resetDailyStreakFlags:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get student's streak information
 * @param {string} studentId - UUID of the student
 * @returns {Promise<Object>} - Streak information
 */
export async function getStudentStreak(studentId) {
  try {
    const { data, error } = await supabase
      .from('student_streaks')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, return default
        return {
          student_id: studentId,
          current_streak: 0,
          longest_streak: 0,
          streak_completed_today: false,
        };
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getStudentStreak:', error);
    return null;
  }
}

/**
 * Get notification history for a student
 * @param {string} studentId - UUID of the student
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} - Array of notification records
 */
export async function getStudentNotificationHistory(studentId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('streak_notification_log')
      .select('*')
      .eq('student_id', studentId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting notification history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getStudentNotificationHistory:', error);
    return [];
  }
}

/**
 * Process streak check and update for a specific student
 * @param {string} studentId - UUID of the student
 * @returns {Promise<Object>} - Processing result
 */
export async function processStudentStreak(studentId) {
  try {
    const hasActivity = await checkStudentActivityToday(studentId);

    if (hasActivity) {
      // Student has activity, update their streak
      const result = await updateStudentStreak(studentId);
      return {
        success: true,
        hasActivity: true,
        streakUpdated: result.success,
        ...result
      };
    } else {
      // No activity today
      return {
        success: true,
        hasActivity: false,
        streakUpdated: false,
        message: 'No activity today'
      };
    }
  } catch (error) {
    console.error('Error in processStudentStreak:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  checkStudentActivityToday,
  updateStudentStreak,
  getStudentsNeedingReminder,
  logNotificationSent,
  resetDailyStreakFlags,
  getStudentStreak,
  getStudentNotificationHistory,
  processStudentStreak,
};
