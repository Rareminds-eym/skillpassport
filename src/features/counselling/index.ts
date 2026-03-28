// Counselling Feature Public API

export { CounsellingChat, ChatWindow, SessionList, TopicSelector } from './ui';
export { useCounsellingStore, useCounsellingChat } from './model';
export { counsellingService } from './api';
export { counsellingConfig } from './lib/config';

export type {
  CounsellingMessage,
  CounsellingSession,
  CounsellingTopicType,
  CounsellingRequest,
  CounsellingResponse,
  StudentContext,
  MessageRole,
  SessionStatus,
  CounsellingStore
} from './model/types';

export type { UseCounsellingChatOptions } from './model/useCounsellingChat';

// API & Data Access
export * from './api';
export type { IndustryDemandData } from './api/aiCareerPathService';
export type { SuggestedProject } from './api/aiCareerPathService';
export { getFallbackRoleOverview } from './api/aiCareerPathService';
export type { CareerPathResponse } from './api/aiCareerPathService';
export { default as careerApiService } from './api/careerApiService';
export type { FreeResource } from './api/aiCareerPathService';
export type { ActionItem } from './api/aiCareerPathService';
export type { CareerStage } from './api/aiCareerPathService';
export type { StudentProfile } from './api/aiCareerPathService';
export { getFallbackResponsibilities } from './api/aiCareerPathService';
export type { RoadmapPhase } from './api/aiCareerPathService';
export type { RoleOverviewData } from './api/aiCareerPathService';
export type { RecommendedCourse } from './api/aiCareerPathService';
export { getFallbackIndustryDemand } from './api/aiCareerPathService';
export { mentorNotesService } from './api/mentorNotesService';
