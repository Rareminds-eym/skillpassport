/**
 * AI Assessment Service - Main Entry Point
 * Barrel export + backward compatibility for split modules
 * 
 * @version 2.1.0 - Modularized architecture
 */

// Export all functions from split modules
export * from './geminiApiService.js';
export * from '../lib/assessmentDataPrep.js';
export * from '../lib/scoringEngine.js';
export * from './courseIntegrationService.js';

// Import main functions for legacy aliases
import { analyzeAssessmentWithOpenRouter } from './geminiApiService.js';
import { calculateKnowledgeWithGemini } from '../lib/scoringEngine.js';

// Legacy aliases for backward compatibility
export const analyzeAssessmentWithGemini = analyzeAssessmentWithOpenRouter;

// Default export for backward compatibility
const geminiAssessmentService = {
  analyzeAssessmentWithOpenRouter,
  analyzeAssessmentWithGemini: analyzeAssessmentWithOpenRouter,
  calculateKnowledgeWithGemini
};

export default geminiAssessmentService;
