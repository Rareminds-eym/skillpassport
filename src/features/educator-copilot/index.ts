/**
 * Educator Copilot Feature
 * Main export file for educator AI functionality
 */

export { default as EducatorCopilot } from './components/EducatorCopilot';
export { educatorIntelligenceEngine } from './services/educatorIntelligenceEngine';
export { educatorWelcomeConfig, educatorChatConfig } from './config/educatorConfig';
export { 
  StudentInsightCard,
  ClassAnalyticsCard,
  InterventionCard,
  TrendCard
} from './components/EducatorCards';
export * from './types';

// API & Data Access
export * from './api';
export type { LessonPlanFormData } from './api/lessonPlansService';
export { getAssignmentsByStudentId } from './api/assignmentsService';
export { deleteResource } from './api/coursesService';
export { addLesson } from './api/coursesService';
export { submitAssignmentWithStagedFiles } from './api/assignmentsService';
export { addResource } from './api/coursesService';
export { updateAssignmentStatus } from './api/assignmentsService';
export { getAssignmentWithFiles } from './api/assignmentsService';
export type { LessonPlan } from './api/lessonPlanService';
export { deleteLesson } from './api/coursesService';
export { updateLesson } from './api/coursesService';
export { getCurrentEducator } from './api/educatorService';
export { getAssignmentStats } from './api/assignmentsService';

// Re-export from educator feature
export { useEducatorSchool } from '@/features/educator';

// Analytics
export { getGeographicDistribution, getTopHiringColleges, getQualityMetrics } from './api/analyticsService';
export type { FunnelRangePreset } from './api/analyticsService';
