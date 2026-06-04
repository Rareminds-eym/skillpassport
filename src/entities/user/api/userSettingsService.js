/**
 * User Settings Service
 * Handles notification and privacy settings using the user_settings table
 */

import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('user-settings');

/**
 * Get or create user settings
 * @param {string} userId - User ID from auth.users
 * @returns {Promise<Object>} User settings
 */
export const getUserSettings = async (userId) => {
  try {
    const response = await apiPost('/user/actions', { action: 'get-user-settings', userId });
    return { success: true, data: response?.data };
  } catch (err) {
    logger.error('getUserSettings exception', err);
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
    await getUserSettings(userId);
    const response = await apiPost('/user/actions', {
      action: 'update-user-settings',
      userId,
      settings: { notification_preferences: preferences },
    });
    return { success: true, data: response?.data };
  } catch (err) {
    logger.error('updateNotificationPreferences exception', err);
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
    await getUserSettings(userId);
    const response = await apiPost('/user/actions', {
      action: 'update-user-settings',
      userId,
      settings: { privacy_settings: settings },
    });
    return { success: true, data: response?.data };
  } catch (err) {
    logger.error('updatePrivacySettings exception', err);
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
    const response = await apiPost('/user/actions', { action: 'get-notification-preferences-by-email', email });
    if (!response?.data?.notification_preferences) {
      logger.warn('Learner not found for email', { email });
      return { success: false, error: 'Learner not found' };
    }
    return { success: true, data: response.data.notification_preferences };
  } catch (err) {
    logger.error('getNotificationPreferencesByEmail exception', err);
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
    const response = await apiPost('/user/actions', { action: 'get-notification-preferences-by-email', email });
    if (!response?.data?.privacy_settings) {
      logger.warn('Learner not found for email', { email });
      return { success: false, error: 'Learner not found' };
    }
    return { success: true, data: response.data.privacy_settings };
  } catch (err) {
    logger.error('getPrivacySettingsByEmail exception', err);
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
