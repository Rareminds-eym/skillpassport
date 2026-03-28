/**
 * AI Assessment Service - Main Entry Point
 * Barrel export + backward compatibility for split modules
 * 
 * @version 2.1.0 - Modularized architecture
 */

// Export all functions from split modules
export * from './assessment/geminiApiService.js';
export * from './assessment/assessmentDataPrep.js';
export * from './assessment/scoringEngine.js';
export * from './assessment/courseIntegration.js';

// Import main functions for legacy aliases
import { analyzeAssessmentWithOpenRouter } from './assessment/geminiApiService.js';
import { calculateKnowledgeWithGemini } from './assessment/scoringEngine.js';

// Legacy aliases for backward compatibility
export const analyzeAssessmentWithGemini = analyzeAssessmentWithOpenRouter;

// Default export for backward compatibility
export default {
  analyzeAssessmentWithOpenRouter,
  analyzeAssessmentWithGemini: analyzeAssessmentWithOpenRouter,
  calculateKnowledgeWithGemini
};