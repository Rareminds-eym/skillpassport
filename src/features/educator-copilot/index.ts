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
