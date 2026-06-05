/**
 * Assessment Services - Main Export
 * 
 * Centralized exports for all assessment-related services.
 * Services are organized by assessment type:
 * - Career Assessment (personal/career guidance)
 * - External Assessment (course-specific tests)
 * - Adaptive Assessment (IRT-based adaptive testing)
 * 
 * @module features/assessment/services
 */

// Re-export from existing services (these will be moved here eventually)
// For now, we re-export from the original locations for backward compatibility

// =============================================================================
// CAREER ASSESSMENT SERVICES
// =============================================================================

// Career Assessment Service (database operations)
export * as assessmentApiService from './assessmentApiService';

// Assessment Generation Service (AI-powered question generation)
// @ts-ignore - JS file without type declarations
export { generateAssessment, validateAssessment, saveGeneratedAssessment, loadGeneratedAssessment, cacheAssessment, getCachedAssessment } from './assessmentGenerationService';

// Career Assessment AI Service
// @ts-ignore - JS file without type declarations
export { loadCareerAssessmentQuestions, STREAM_KNOWLEDGE_PROMPTS, normalizeStreamId } from './careerAssessmentAIService';

// Gemini Assessment Service (AI analysis)
// @ts-ignore - JS file without type declarations
export { analyzeAssessmentWithGemini } from './geminiAssessmentService';

// =============================================================================
// EXTERNAL COURSE ASSESSMENT SERVICES
// =============================================================================

// External Assessment Service (course-specific skill tests)
// @ts-ignore - JS file without type declarations
export { checkAssessmentStatus, createAssessmentAttempt, updateAssessmentProgress, completeAssessment, saveAssessmentAttempt, getAssessmentHistory, getAssessmentByCourse } from './externalAssessmentService';

// =============================================================================
// ADAPTIVE APTITUDE ASSESSMENT SERVICES
// =============================================================================

// Adaptive Engine (core adaptive testing logic)
export { default as AdaptiveEngine } from './adaptiveEngine';
export type {
  TierClassificationResult,
  DifficultyAdjustmentResult,
  ConfidenceTagResult,
} from './adaptiveEngine';

// Adaptive Aptitude Service (adaptive test management)
export {
  initializeTest,
  getNextQuestion,
  submitAnswer,
} from './adaptiveAptitudeService';
export type {
  InitializeTestOptions,
  InitializeTestResult,
  SubmitAnswerOptions,
  NextQuestionResult,
} from './adaptiveAptitudeService';
export * from './adaptiveAptitudeApiService';
export * from './aptitudeScoreValidator';
export * from './assessmentEnrichmentService';
export * from './assessmentResultTransformer';
export * from './certificateAssessmentService';
export * from './examsService';
export * from './questionGeneratorService';
export * from './riasecScoreValidator';
