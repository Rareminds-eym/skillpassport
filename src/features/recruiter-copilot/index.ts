/**
 * Recruiter Copilot Feature
 * Main export file for recruiter AI functionality
 */

export { default as RecruiterCopilot } from './ui/RecruiterCopilot';
export { recruiterIntelligenceEngine } from './api/recruiterIntelligenceEngine';
export { recruiterWelcomeConfig, recruiterChatConfig } from './lib/config/recruiterConfig';
export {
  CandidateInsightCard,
  JobAnalyticsCard,
  TalentPoolCard
} from './ui/RecruiterCards';
export { dataHealthCheck } from './lib/dataHealthCheck';
export { advancedIntentClassifier } from './api/advancedIntentClassifier';
export { buildRecruiterContext } from './lib/contextBuilder';
export * from './model';

// Default export for Header component (using educator Header)

// API & Data Access
export * from './api';
export { companyService } from './api/companyService';
export { recruiterInsights } from './api/recruiterInsights';
