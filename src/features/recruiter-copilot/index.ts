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

// Default export for Header component (using educator Header)
export { default as Header } from '@/features/educator/ui/Header';

// API & Data Access
export * from './api';
export { companyService } from './api/companyService';
export { recruiterInsights } from './services/recruiterInsights';
