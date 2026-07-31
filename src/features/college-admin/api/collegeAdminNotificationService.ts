/**
 * College Admin Notification Service
 * Handles notifications for college admins about training approvals
 * All data operations go through the backend API at /api/college-admin/notifications
 */

import { apiPost } from '@/shared/api/apiClient';
import { getWSClient } from '@/shared/api/wsRealtimeClient';

// Type definitions
interface NotificationOptions {
  unreadOnly?: boolean;
}

interface ApiResponse<T = unknown> {
  data: T;
  error?: string;
  success?: boolean;
}

interface ApprovalResult {
  success: boolean;
  message: string;
}

export interface CollegeAdminNotification {
  id: string;
  college_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type?: string;
  [key: string]: unknown;
}

// ── Type Guards ──
function isCollegeAdminNotification(val: unknown): val is CollegeAdminNotification {
  if (typeof val !== 'object' || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.college_id === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.is_read === 'boolean' &&
    typeof obj.created_at === 'string'
  );
}

export async function getCollegeAdminNotifications(
  collegeId: string,
  options: NotificationOptions = {}
): Promise<unknown[]> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-notifications',
    college_id: collegeId,
    unread_only: options?.unreadOnly
  }) as ApiResponse<unknown[]>;

  return result.data || [];
}

export async function getUnreadCount(collegeId: string): Promise<number> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-unread-count',
    college_id: collegeId,
    admin_type: 'college_admin'
  }) as ApiResponse<number>;

  return result.data || 0;
}

export async function getPendingTrainings(collegeId: string): Promise<unknown[]> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-pending-trainings',
    college_id: collegeId
  }) as ApiResponse<unknown[]>;

  return result.data;
}

export async function getPendingExperiences(collegeId: string): Promise<unknown[]> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-pending-experiences',
    college_id: collegeId
  }) as ApiResponse<unknown[]>;

  return result.data;
}

export async function getPendingProjects(collegeId: string): Promise<unknown[]> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-pending-projects',
    college_id: collegeId
  }) as ApiResponse<unknown[]>;

  return result.data;
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'mark-notification-read',
    notification_id: notificationId
  }) as ApiResponse<boolean>;

  return result.data;
}

export async function approveTraining(
  trainingId: string,
  approverId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'approve-training',
    training_id: trainingId,
    approver_id: approverId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export async function rejectTraining(
  trainingId: string,
  rejectorId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'reject-training',
    training_id: trainingId,
    rejector_id: rejectorId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export async function approveExperience(
  experienceId: string,
  approverId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'approve-experience',
    experience_id: experienceId,
    approver_id: approverId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export async function rejectExperience(
  experienceId: string,
  rejectorId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'reject-experience',
    experience_id: experienceId,
    rejector_id: rejectorId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export async function approveProject(
  projectId: string,
  approverId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'approve-project',
    project_id: projectId,
    approver_id: approverId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export async function rejectProject(
  projectId: string,
  rejectorId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'reject-project',
    project_id: projectId,
    rejector_id: rejectorId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export async function getPendingCertificates(collegeId: string): Promise<unknown[]> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-pending-certificates',
    college_id: collegeId
  }) as ApiResponse<unknown[]>;

  return result.data;
}

export async function approveCertificate(
  certificateId: string,
  approverId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'approve-certificate',
    certificate_id: certificateId,
    approver_id: approverId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export async function rejectCertificate(
  certificateId: string,
  rejectorId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'reject-certificate',
    certificate_id: certificateId,
    rejector_id: rejectorId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export async function getPendingSkills(collegeId: string): Promise<unknown[]> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'get-pending-skills',
    college_id: collegeId
  }) as ApiResponse<unknown[]>;

  return result.data;
}

export async function approveSkill(
  skillId: string,
  approverId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'approve-skill',
    skill_id: skillId,
    approver_id: approverId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export async function rejectSkill(
  skillId: string,
  rejectorId: string,
  notes = ''
): Promise<ApprovalResult> {
  const result = await apiPost('/college-admin/notifications', {
    action: 'reject-skill',
    skill_id: skillId,
    rejector_id: rejectorId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

export function subscribeToNotifications(
  collegeId: string,
  callback: (notification: CollegeAdminNotification) => void
): () => void {
  const wsClient = getWSClient();
  
  const unsub = wsClient.subscribe(
    'training_notifications',
    { event: 'INSERT', filter: `college_id=eq.${collegeId}` },
    (event: unknown) => {
      if (
        typeof event === 'object' &&
        event !== null &&
        'type' in event &&
        event.type === 'change' &&
        'payload' in event &&
        isCollegeAdminNotification(event.payload)
      ) {
        callback(event.payload); // ✅ no cast needed, TypeScript knows the type
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
  getPendingCertificates,
  getPendingSkills,
  markAsRead,
  approveTraining,
  rejectTraining,
  approveExperience,
  rejectExperience,
  approveProject,
  rejectProject,
  approveCertificate,
  rejectCertificate,
  approveSkill,
  rejectSkill,
  subscribeToNotifications,
};
