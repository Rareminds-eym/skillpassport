/**
 * User Settings Service
 * Handles notification and privacy settings using the user_settings table
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Get or create user settings
 * @param {string} userId - User ID from auth.users
 * @returns {Promise<Object>} User settings
 */
export const getUserSettings = async (userId) => {
  try {
    // Try to get existing settings
    let { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user settings:', error);
      return { success: false, error: error.message };
    }

    // If no settings exist, create default ones
    if (!data) {
      const defaultSettings = {
        user_id: userId,
        notification_preferences: {
          emailNotifications: true,
          applicationUpdates: true,
          newOpportunities: true,
          recruitingMessages: true,
          weeklyDigest: false,
          monthlyReport: false,
        },
        privacy_settings: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showLocation: true,
          allowRecruiterContact: true,
          showInTalentPool: true,
        },
        ui_preferences: {},
        communication_preferences: {},
      };

      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (createError) {
        console.error('Error creating user settings:', createError);
        return { success: false, error: createError.message };
      }

      data = newSettings;
    }

    return { success: true, data };
  } catch (err) {
    console.error('getUserSettings exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update notification preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - Notification preferences
 * @returns {Promise<Object>} Result
 */
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    // First ensure settings exist
    await getUserSettings(userId);

    // Update notification preferences
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('updateNotificationPreferences exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update privacy settings
 * @param {string} userId - User ID
 * @param {Object} settings - Privacy settings
 * @returns {Promise<Object>} Result
 */
export const updatePrivacySettings = async (userId, settings) => {
  try {
    // First ensure settings exist
    await getUserSettings(userId);

    // Update privacy settings
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        privacy_settings: settings,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating privacy settings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('updatePrivacySettings exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Get notification preferences by user email (for notification service)
 * @param {string} email - User email
 * @returns {Promise<Object>} Notification preferences
 */
export const getNotificationPreferencesByEmail = async (email) => {
  try {
    // Get user_id from students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('email', email)
      .single();

    if (studentError || !student?.user_id) {
      console.warn('Student not found for email:', email);
      return { success: false, error: 'Student not found' };
    }

    // Get settings
    const result = await getUserSettings(student.user_id);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data.notification_preferences || {},
    };
  } catch (err) {
    console.error('getNotificationPreferencesByEmail exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Get privacy settings by user email
 * @param {string} email - User email
 * @returns {Promise<Object>} Privacy settings
 */
export const getPrivacySettingsByEmail = async (email) => {
  try {
    // Get user_id from students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('email', email)
      .single();

    if (studentError || !student?.user_id) {
      console.warn('Student not found for email:', email);
      return { success: false, error: 'Student not found' };
    }

    // Get settings
    const result = await getUserSettings(student.user_id);
    
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data.privacy_settings || {},
    };
  } catch (err) {
    console.error('getPrivacySettingsByEmail exception:', err);
    return { success: false, error: err.message };
  }
};

export default {
  getUserSettings,
  updateNotificationPreferences,
  updatePrivacySettings,
  getNotificationPreferencesByEmail,
  getPrivacySettingsByEmail,
};
