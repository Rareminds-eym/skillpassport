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
// @ts-ignore - JS file without type declarations
export { default as assessmentService } from '../../../services/assessmentService';
// @ts-ignore - JS file without type declarations
export * from '../../../services/assessmentService';

// Assessment Generation Service (AI-powered question generation)
// @ts-ignore - JS file without type declarations
export { generateAssessment, validateAssessment, saveGeneratedAssessment, loadGeneratedAssessment, cacheAssessment, getCachedAssessment } from '../../../services/assessmentGenerationService';

// Career Assessment AI Service
// @ts-ignore - JS file without type declarations
export { loadCareerAssessmentQuestions, STREAM_KNOWLEDGE_PROMPTS, normalizeStreamId } from '../../../services/careerAssessmentAIService';

// Gemini Assessment Service (AI analysis)
// @ts-ignore - JS file without type declarations
export { analyzeAssessmentWithGemini } from '../../../services/geminiAssessmentService';

// =============================================================================
// EXTERNAL COURSE ASSESSMENT SERVICES
// =============================================================================

// External Assessment Service (course-specific skill tests)
// @ts-ignore - JS file without type declarations
export { checkAssessmentStatus, createAssessmentAttempt, updateAssessmentProgress, completeAssessment, saveAssessmentAttempt, getAssessmentHistory, getAssessmentByCourse } from '../../../services/externalAssessmentService';

// =============================================================================
// ADAPTIVE APTITUDE ASSESSMENT SERVICES
// =============================================================================

// Adaptive Engine (core adaptive testing logic)
export { AdaptiveEngine } from '../../../services/adaptiveEngine';
export type {
  TierClassificationResult,
  DifficultyAdjustmentResult,
  ConfidenceTagResult,
} from '../../../services/adaptiveEngine';

// Adaptive Aptitude Service (adaptive test management)
export {
  initializeTest,
  getNextQuestion,
  submitAnswer,
} from '../../../services/adaptiveAptitudeService';
export type {
  InitializeTestOptions,
  InitializeTestResult,
  SubmitAnswerOptions,
  NextQuestionResult,
} from '../../../services/adaptiveAptitudeService';
