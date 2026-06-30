// ── UI Components ──
export {
  NotificationBell,
  TrainingDetailsModal,
  ExperienceDetailsModal,
  ProjectDetailsModal,
  CertificateDetailsModal,
  SkillDetailsModal,
  PendingTrainings,
  DocumentViewerModal
} from './ui';

// ── API Services ──
export { SchoolAdminNotificationService } from './api/schoolAdminNotificationService';
export { timetableSlotsService } from './api/timetableSlotsService';
export { curriculumService } from './api/curriculumService';
export * from './api';

// ── Types ──
// Export only what's needed for external consumers
export type {
  // Pending Item Types
  PendingItem,
  PendingTraining,
  PendingCertificate,
  PendingExperience,
  PendingProject,
  PendingSkill,
  PendingEducation,
  PendingAchievement,
  // Modal Component Props
  TrainingDetailsModalProps,
  CertificateDetailsModalProps,
  ExperienceDetailsModalProps,
  ProjectDetailsModalProps,
  SkillDetailsModalProps,
  // Other domain types
  AdmissionApplication,
  LearnerProfile,
  AttendanceRecord,
  AttendanceAlert,
  LearnerReport,
  NotificationData,
  OrganizationData
} from './model/types';
