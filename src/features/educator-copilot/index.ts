/**
 * Educator Copilot Feature
 * Main export file for educator AI functionality
 */

export { default as EducatorCopilot } from './ui/EducatorCopilot';
export { educatorIntelligenceEngine } from './api/educatorIntelligenceEngine';
export { educatorWelcomeConfig, educatorChatConfig } from './lib/config/educatorConfig';
export {
  StudentInsightCard,
  ClassAnalyticsCard,
  InterventionCard,
  TrendCard
} from './ui/EducatorCards';
export * from './model';

// API & Data Access
export * from './api';
export { getAssignmentsByStudentId } from './api/assignmentsService';
export { deleteResource } from './api/coursesService';
export { addLesson } from './api/coursesService';
export { submitAssignmentWithStagedFiles } from './api/assignmentsService';
export { addResource } from './api/coursesService';
export { updateAssignmentStatus } from './api/assignmentsService';
export { getAssignmentWithFiles } from './api/assignmentsService';
export { deleteLesson } from './api/coursesService';
export { updateLesson } from './api/coursesService';
export { getCurrentEducator } from './api/educatorService';
export { getAssignmentStats } from './api/assignmentsService';

// Re-export from educator feature

// Analytics
export { getQualityMetrics } from './api/analyticsService';
export { getGeographicDistribution, getTopHiringColleges } from './api/analyticsService';

export type { FunnelRangePreset } from './api/analyticsService';

export { dashboardApi } from './api/dashboardApi';

export type { RecentActivity } from './api/dashboardApi';

export type { Announcement } from './api/dashboardApi';

export { uploadInstructionFile } from './api/assignmentsService';

export { deleteInstructionFile } from './api/assignmentsService';

export type { DashboardKPIs } from './api/dashboardApi';

export { buildEducatorContext } from './lib/contextBuilder';

export type { SkillAnalytics } from './api/dashboardApi';

export { useLessonPlans, useCurriculum, useSubjectsAndClasses } from './model/useLessonPlans';
