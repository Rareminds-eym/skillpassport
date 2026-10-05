/**
 * DEPRECATED: This file is no longer used
 * All adaptive question generation has been moved to adaptive-bank.ts
 * 
 * This file is kept for backwards compatibility only
 */

// Re-export everything from adaptive-bank
export {
  generateDiagnosticScreenerQuestions,
  generateAdaptiveCoreQuestions,
  generateStabilityConfirmationQuestions,
  generateSingleQuestion
} from './adaptive-bank';
