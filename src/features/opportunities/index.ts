// Public API for opportunities feature
export { JobRecommendations, SimpleOpportunitiesTest } from './ui';

// API & Data Access
export * from './api';

export * from './model';

// Lib utilities
export * from './lib';
export { getPipelineCandidatesByStage } from './api/pipelineService';
export { removeCandidateFromShortlist } from './api/shortlistService';
export { trackSearchUsage } from './api/savedSearchesService';
export { default as applicationTrackingService } from './api/applicationTrackingService';
export { getRequisitions } from './api/pipelineService';
export { addCandidateToShortlist } from './api/shortlistService';
export { opportunitiesService } from './api/opportunitiesService';
export { default as useAIJobMatching } from './model/useAIJobMatching';
export { getPipelineCandidatesWithFilters } from './api/pipelineService';
export { getShortlists } from './api/shortlistService';
export { addCandidateToPipeline } from './api/pipelineService';
export { logExportActivity } from './api/shortlistService';
export { default as useOpportunities } from './model/useOpportunities';
export { updateShortlist } from './api/shortlistService';
export { deleteShortlist } from './api/shortlistService';
export { createInterview } from './api/interviewService';
export { getShortlistCandidates } from './api/shortlistService';
export { createSavedSearch } from './api/savedSearchesService';
export { sendReminder } from './api/interviewService';
export { moveCandidateToStage } from './api/pipelineService';
export { getAllPipelineCandidatesByStage } from './api/pipelineService';
export { createShortlist } from './api/shortlistService';
export { default as SavedJobsService } from './api/savedJobsService';
export { default as AppliedJobsService } from './api/appliedJobsService';
