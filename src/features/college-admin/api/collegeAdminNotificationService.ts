/**
 * College Admin Notification Service
 * Handles notifications for college admins about training approvals
 * All data operations go through the backend API at /api/college-admin/notifications
 */

import { apiPost } from '@/shared/api/apiClient';
import { getWSClient } from '@/shared/api/wsRealtimeClient';

/**
 * Get all notifications for a college admin
 * @param {string} collegeId - College's UUID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of notifications
 */
export async function getCollegeAdminNotifications(collegeId, options = {}) {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-notifications',
    college_id: collegeId,
    unread_only: options?.unreadOnly
  });

  return result.data || [];
}

/**
 * Get unread notification count
 * @param {string} collegeId - College's UUID
 * @returns {Promise<number>} Count of unread notifications
 */
export async function getUnreadCount(collegeId) {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-unread-count',
    college_id: collegeId,
    admin_type: 'college_admin'
  });

  return result.data || 0;
}

/**
 * Get pending trainings for college admin
 * @param {string} collegeId - College's UUID
 * @returns {Promise<Array>} List of pending trainings
 */
export async function getPendingTrainings(collegeId) {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-pending-trainings',
    college_id: collegeId
  });

  return result.data;
}

/**
 * Get pending experiences for college admin
 * @param {string} collegeId - College's UUID
 * @returns {Promise<Array>} List of pending experiences
 */
export async function getPendingExperiences(collegeId) {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-pending-experiences',
    college_id: collegeId
  });

  return result.data;
}

/**
 * Get pending projects for college admin
 * @param {string} collegeId - College's UUID
 * @returns {Promise<Array>} List of pending projects
 */
export async function getPendingProjects(collegeId) {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-pending-projects',
    college_id: collegeId
  });

  return result.data;
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<boolean>} Success status
 */
export async function markAsRead(notificationId) {
  const result = await apiPost('/college-admin/notifications', {
    action: 'mark-notification-read',
    notification_id: notificationId
  });

  return result.data;
}

/**
 * Approve training
 * @param {string} trainingId - Training ID
 * @param {string} approverId - Approver's user ID
 * @param {string} notes - Optional approval notes
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function approveTraining(trainingId, approverId, notes = '') {
  const result = await apiPost('/college-admin/notifications', {
    action: 'approve-training',
    training_id: trainingId,
    approver_id: approverId,
    notes
  });

  return result.data;
}

/**
 * Reject training
 * @param {string} trainingId - Training ID
 * @param {string} rejectorId - Rejector's user ID
 * @param {string} notes - Rejection reason
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function rejectTraining(trainingId, rejectorId, notes = '') {
  const result = await apiPost('/college-admin/notifications', {
    action: 'reject-training',
    training_id: trainingId,
    rejector_id: rejectorId,
    notes
  });

  return result.data;
}

/**
 * Approve experience
 * @param {string} experienceId - Experience ID
 * @param {string} approverId - Approver's user ID
 * @param {string} notes - Optional approval notes
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function approveExperience(experienceId, approverId, notes = '') {
  const result = await apiPost('/college-admin/notifications', {
    action: 'approve-experience',
    experience_id: experienceId,
    approver_id: approverId,
    notes
  });

  return result.data;
}

/**
 * Reject experience
 * @param {string} experienceId - Experience ID
 * @param {string} rejectorId - Rejector's user ID
 * @param {string} notes - Rejection reason
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function rejectExperience(experienceId, rejectorId, notes = '') {
  const result = await apiPost('/college-admin/notifications', {
    action: 'reject-experience',
    experience_id: experienceId,
    rejector_id: rejectorId,
    notes
  });

  return result.data;
}

/**
 * Approve project
 * @param {string} projectId - Project ID
 * @param {string} approverId - Approver's user ID
 * @param {string} notes - Optional approval notes
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function approveProject(projectId, approverId, notes = '') {
  const result = await apiPost('/college-admin/notifications', {
    action: 'approve-project',
    project_id: projectId,
    approver_id: approverId,
    notes
  });

  return result.data;
}

/**
 * Reject project
 * @param {string} projectId - Project ID
 * @param {string} rejectorId - Rejector's user ID
 * @param {string} notes - Rejection reason
 * @returns {Promise<Object>} Result object with success status and message
 */
export async function rejectProject(projectId, rejectorId, notes = '') {
  const result = await apiPost('/college-admin/notifications', {
    action: 'reject-project',
    project_id: projectId,
    rejector_id: rejectorId,
    notes
  });

  return result.data;
}

/**
 * Subscribe to real-time notifications (unified system)
 * Uses WebSocket client via getWSClient()
 * @param {string} collegeId - College's UUID
 * @param {Function} callback - Callback function for new notifications
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNotifications(collegeId, callback) {
  const wsClient = getWSClient();
  
  const unsub = wsClient.subscribe(
    'training_notifications',
    { event: 'INSERT', filter: `college_id=eq.${collegeId}` },
    (event) => {
      if (event.type === 'change') {
        callback(event.payload);
      }
    }
  );

  return unsub;
}

// Namespace export for compatibility
export const CollegeAdminNotificationService = {
  getCollegeAdminNotifications,
  getUnreadCount,
  getPendingTrainings,
  getPendingExperiences,
  getPendingProjects,
  markAsRead,
  approveTraining,
  rejectTraining,
  approveExperience,
  rejectExperience,
  approveProject,
  rejectProject,
  subscribeToNotifications,
};
