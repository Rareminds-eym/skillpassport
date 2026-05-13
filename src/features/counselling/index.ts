// Counselling Feature Public API

export { CounsellingChat, ChatWindow, SessionList, TopicSelector } from './ui';
export { counsellingConfig } from './lib/config';

export type {
  CounsellingMessage,
  CounsellingSession,
  CounsellingTopicType,
  CounsellingRequest,
  CounsellingResponse,
  LearnerContext,
  MessageRole,
  SessionStatus,
  CounsellingStore
} from './model/types';

// API & Data Access
export * from './api';
export { getFallbackRoleOverview } from './api/aiCareerPathService';
export { default as careerApiService } from './api/careerApiService';
export { getFallbackResponsibilities } from './api/aiCareerPathService';
export { getFallbackIndustryDemand } from './api/aiCareerPathService';
export { mentorNotesService } from './api/mentorNotesService';
