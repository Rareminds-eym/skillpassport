import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import type { 
  PendingItem,
  PendingTraining,
  PendingExperience,
  PendingProject,
  PendingCertificate,
  PendingEducation,
  PendingSkill,
  PendingAchievement
} from '../model/types';

const logger = getLogger('school-admin-notification');

const API_PATH = '/college-admin/school-admin';

// ── Type Definitions ──

// ── API Envelope ──
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ── Notification ──
export interface AdminNotification {
  id: string;
  school_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type?: string;
  [key: string]: unknown;
}

// ── Approval/Rejection Results ──
interface ApproveResult {
  success: boolean;
  message: string;
}

interface ApproveTrainingResult extends ApproveResult {
  training_id: string;
}

interface RejectTrainingResult extends ApproveResult {
  training_id: string;
  reason: string;
}

interface ApproveExperienceResult extends ApproveResult {
  experience_id: string;
}

interface ApproveProjectResult extends ApproveResult {
  project_id: string;
}

interface RejectProjectResult extends ApproveResult {
  project_id: string;
  reason: string;
}

interface ApproveCertificateResult extends ApproveResult {
  certificate_id: string;
}

interface RejectCertificateResult extends ApproveResult {
  certificate_id: string;
  reason: string;
}

interface ApproveEducationResult extends ApproveResult {
  education_id: string;
}

interface RejectEducationResult extends ApproveResult {
  education_id: string;
  reason: string;
}

interface ApproveSkillResult extends ApproveResult {
  skill_id: string;
}

interface RejectSkillResult extends ApproveResult {
  skill_id: string;
  reason: string;
}

interface ApproveAchievementResult extends ApproveResult {
  achievement_id: string;
}

interface RejectAchievementResult extends ApproveResult {
  achievement_id: string;
  reason: string;
}

interface RejectExperienceResult extends ApproveResult {
  experience_id: string;
  reason: string;
}

// ── Type Guards ──
function isAdminNotification(val: unknown): val is AdminNotification {
  return (
    typeof val === 'object' &&
    val !== null &&
    typeof (val as AdminNotification).id === 'string' &&
    typeof (val as AdminNotification).school_id === 'string' &&
    typeof (val as AdminNotification).message === 'string' &&
    typeof (val as AdminNotification).is_read === 'boolean' &&
    typeof (val as AdminNotification).created_at === 'string'
  );
}

export class SchoolAdminNotificationService {
  static async getSchoolAdminNotifications(schoolId: string, options: { unreadOnly?: boolean } = {}) {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'get-notifications',
        school_id: schoolId,
        unread_only: options.unreadOnly || false,
      }) as ApiEnvelope<AdminNotification[]>;
      return envelope?.data ?? [];
    } catch (error) {
      logger.error('Failed to fetch school admin notifications', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async getUnreadCount(schoolId: string) {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'get-unread-count',
        school_id: schoolId,
      }) as ApiEnvelope<number>;
      return envelope?.data ?? 0;
    } catch (error) {
      logger.error('Failed to fetch unread notification count', error instanceof Error ? error : new Error('Unknown error'));
      return 0;
    }
  }

  static async getPendingTrainings(schoolId: string): Promise<PendingTraining[]> {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'get-pending-trainings',
        school_id: schoolId,
      }) as ApiEnvelope<PendingTraining[]>;
      // apiPost returns the API envelope { success, data, error }; the array
      // payload lives under `.data`.
      return envelope?.data ?? [];
    } catch (error) {
      logger.error('Failed to fetch pending trainings', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async getPendingExperiences(schoolId: string): Promise<PendingExperience[]> {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'get-pending-experiences',
        school_id: schoolId,
      }) as ApiEnvelope<PendingExperience[]>;
      // apiPost returns the API envelope { success, data, error }; the array
      // payload lives under `.data`.
      return envelope?.data ?? [];
    } catch (error) {
      logger.error('Failed to fetch pending experiences', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      await apiPost(API_PATH, {
        action: 'mark-notification-read',
        notification_id: notificationId,
      });
      return true;
    } catch (error) {
      logger.error('Failed to mark notification as read', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }

  static async approveTraining(trainingId: string, approverId: string, notes = '') {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'approve-training',
        training_id: trainingId,
        approver_id: approverId,
        notes,
      }) as ApiEnvelope<ApproveTrainingResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to approve training', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectTraining(trainingId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      const envelope = await apiPost(API_PATH, {
        action: 'reject-training',
        training_id: trainingId,
        rejector_id: rejectorId,
        notes,
      }) as ApiEnvelope<RejectTrainingResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to reject training', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async approveExperience(experienceId: string, approverId: string, notes = '') {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'approve-experience',
        experience_id: experienceId,
        approver_id: approverId,
        notes,
      }) as ApiEnvelope<ApproveExperienceResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to approve experience', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectExperience(experienceId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      const envelope = await apiPost(API_PATH, {
        action: 'reject-experience',
        experience_id: experienceId,
        rejector_id: rejectorId,
        notes,
      }) as ApiEnvelope<RejectExperienceResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to reject experience', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async getPendingProjects(schoolId: string): Promise<PendingProject[]> {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'get-pending-projects',
        school_id: schoolId,
      }) as ApiEnvelope<PendingProject[]>;
      // apiPost returns the API envelope { success, data, error }; the array
      // payload lives under `.data`.
      return envelope?.data ?? [];
    } catch (error) {
      logger.error('Failed to fetch pending projects', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async approveProject(projectId: string, approverId: string, notes = '') {
    try {
      if (!projectId || projectId === 'undefined') {
        throw new Error('Invalid project ID');
      }
      if (!approverId || approverId === 'undefined') {
        throw new Error('Invalid approver ID - user not authenticated');
      }
      const envelope = await apiPost(API_PATH, {
        action: 'approve-project',
        project_id: projectId,
        approver_id: approverId,
        notes,
      }) as ApiEnvelope<ApproveProjectResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to approve project', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectProject(projectId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      if (!projectId || projectId === 'undefined') {
        throw new Error('Invalid project ID');
      }
      if (!rejectorId || rejectorId === 'undefined') {
        throw new Error('Invalid rejector ID - user not authenticated');
      }
      const envelope = await apiPost(API_PATH, {
        action: 'reject-project',
        project_id: projectId,
        rejector_id: rejectorId,
        notes,
      }) as ApiEnvelope<RejectProjectResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to reject project', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  // Certificates
  static async getPendingCertificates(schoolId: string): Promise<PendingCertificate[]> {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'get-pending-certificates',
        school_id: schoolId,
      }) as ApiEnvelope<PendingCertificate[]>;
      return envelope?.data ?? [];
    } catch (error) {
      logger.error('Failed to fetch pending certificates', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async approveCertificate(certificateId: string, approverId: string, notes = '') {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'approve-certificate',
        certificate_id: certificateId,
        approver_id: approverId,
        notes,
      }) as ApiEnvelope<ApproveCertificateResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to approve certificate', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectCertificate(certificateId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      const envelope = await apiPost(API_PATH, {
        action: 'reject-certificate',
        certificate_id: certificateId,
        rejector_id: rejectorId,
        notes,
      }) as ApiEnvelope<RejectCertificateResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to reject certificate', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  // Education
  static async getPendingEducation(schoolId: string): Promise<PendingEducation[]> {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'get-pending-education',
        school_id: schoolId,
      }) as ApiEnvelope<PendingEducation[]>;
      return envelope?.data ?? [];
    } catch (error) {
      logger.error('Failed to fetch pending education', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async approveEducation(educationId: string, approverId: string, notes = '') {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'approve-education',
        education_id: educationId,
        approver_id: approverId,
        notes,
      }) as ApiEnvelope<ApproveEducationResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to approve education', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectEducation(educationId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      const envelope = await apiPost(API_PATH, {
        action: 'reject-education',
        education_id: educationId,
        rejector_id: rejectorId,
        notes,
      }) as ApiEnvelope<RejectEducationResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to reject education', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  // Skills
  static async getPendingSkills(schoolId: string): Promise<PendingSkill[]> {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'get-pending-skills',
        school_id: schoolId,
      }) as ApiEnvelope<PendingSkill[]>;
      return envelope?.data ?? [];
    } catch (error) {
      logger.error('Failed to fetch pending skills', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async approveSkill(skillId: string, approverId: string, notes = '') {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'approve-skill',
        skill_id: skillId,
        approver_id: approverId,
        notes,
      }) as ApiEnvelope<ApproveSkillResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to approve skill', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectSkill(skillId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      const envelope = await apiPost(API_PATH, {
        action: 'reject-skill',
        skill_id: skillId,
        rejector_id: rejectorId,
        notes,
      }) as ApiEnvelope<RejectSkillResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to reject skill', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  // Achievements
  static async getPendingAchievements(schoolId: string): Promise<PendingAchievement[]> {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'get-pending-achievements',
        school_id: schoolId,
      }) as ApiEnvelope<PendingAchievement[]>;
      return envelope?.data ?? [];
    } catch (error) {
      logger.error('Failed to fetch pending achievements', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async approveAchievement(achievementId: string, approverId: string, notes = '') {
    try {
      const envelope = await apiPost(API_PATH, {
        action: 'approve-achievement',
        achievement_id: achievementId,
        approver_id: approverId,
        notes,
      }) as ApiEnvelope<ApproveAchievementResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to approve achievement', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectAchievement(achievementId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      const envelope = await apiPost(API_PATH, {
        action: 'reject-achievement',
        achievement_id: achievementId,
        rejector_id: rejectorId,
        notes,
      }) as ApiEnvelope<RejectAchievementResult>;
      return envelope.data;
    } catch (error) {
      logger.error('Failed to reject achievement', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static subscribeToNotifications(schoolId: string, callback: (notification: AdminNotification) => void) {
    const wsClient = getWSClient();
    
    const unsub = wsClient.subscribe(
      'training_notifications',
      { event: 'INSERT', filter: `school_id=eq.${schoolId}` },
      (event) => {
        if (event.type === 'change' && isAdminNotification(event.payload)) {
          callback(event.payload); // ✅ no cast needed, TypeScript knows the type
        }
      }
    );

    return unsub;
  }
}