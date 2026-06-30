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

// API & Data Access
export * from './api';

// Types - Export all types including modal props for proper FSD layer isolation
export * from './model/types';
export type { 
  PendingItem,
  PendingTraining,
  PendingCertificate,
  PendingExperience,
  PendingProject,
  PendingSkill,
  PendingEducation,
  PendingAchievement,
  TrainingDetailsModalProps,
  CertificateDetailsModalProps,
  ExperienceDetailsModalProps,
  ProjectDetailsModalProps,
  SkillDetailsModalProps
} from './model/types';

// Services
export { timetableSlotsService } from './api/timetableSlotsService';
export { curriculumService } from './api/curriculumService';
export { SchoolAdminNotificationService } from './api/schoolAdminNotificationService';
