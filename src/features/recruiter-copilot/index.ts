/**
 * Recruiter Copilot Feature
 * Main export file for recruiter AI functionality
 */

export { default as RecruiterCopilot } from './components/RecruiterCopilot';
export { recruiterIntelligenceEngine } from './services/recruiterIntelligenceEngine';
export { recruiterWelcomeConfig, recruiterChatConfig } from './config/recruiterConfig';
export { 
  CandidateInsightCard,
  JobAnalyticsCard,
  TalentPoolCard
} from './components/RecruiterCards';
export { dataHealthCheck } from './utils/dataHealthCheck';
export { advancedIntentClassifier } from './services/advancedIntentClassifier';
export * from './types';
