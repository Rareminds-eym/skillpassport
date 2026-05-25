/**
 * Assessment API Types
 *
 * Type definitions for personal assessment attempt and response handling
 */

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Options for starting a new assessment
 */
export interface StartAssessmentOptions {
  gradeLevel: string;
  streamId?: string | null;
}

/**
 * Options for saving a response
 */
export interface SaveResponseOptions {
  attemptId: string;
  questionId: string;
  answer: unknown;
}

/**
 * Options for updating progress
 */
export interface UpdateProgressOptions {
  attemptId: string;
  sectionIndex?: number;
  questionIndex?: number;
  sectionTimings?: Record<string, number>;
  timerRemaining?: number | null;
  elapsedTime?: number;
  answers?: Record<string, unknown>;
}

/**
 * Options for submitting assessment
 */
export interface SubmitAssessmentOptions {
  attemptId: string;
  answers?: Record<string, unknown>;
}

/**
 * Options for abandoning attempt
 */
export interface AbandonAttemptOptions {
  attemptId: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Result of starting assessment
 */
export interface StartAssessmentResult {
  success: boolean;
  attemptId: string;
  attempt: AssessmentAttempt;
  sections: AssessmentSection[];
}

/**
 * Result of checking in-progress status
 */
export interface CheckInProgressResult {
  success: boolean;
  hasInProgress: boolean;
  attemptId: string | null;
  answers: Record<string, unknown>;
  all_responses?: Record<string, unknown>;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  gradeLevel: string | null;
  streamId: string | null;
  stream_id?: string | null;
  sectionTimings: Record<string, number>;
  timerRemaining: number | null;
  elapsedTime: number;
  started_at: string | null;
}

/**
 * Generic success response
 */
export interface SuccessResponse {
  success: boolean;
  message?: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}

// ============================================================================
// DOMAIN MODELS
// ============================================================================

/**
 * Assessment attempt record
 */
export interface AssessmentAttempt {
  id: string;
  learner_id: string;
  grade_level: string;
  stream_id: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  all_responses: Record<string, unknown>;
  timer_remaining: number | null;
  elapsed_time: number;
  current_section_index: number;
  current_question_index: number;
  section_timings?: Record<string, number>;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
}

/**
 * Assessment section with questions
 */
export interface AssessmentSection {
  id: string;
  name: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  instruction?: string;
  responseScale?: ResponseScale[];
  isTimed?: boolean;
  timeLimitSeconds?: number | null;
  questions: AssessmentQuestion[];
}

/**
 * Assessment question
 */
export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'rating' | 'multiselect' | 'text' | 'sjt' | 'likert';
  order: number;
  options?: unknown;
  maxSelections?: number;
  categoryMapping?: unknown;
  metadata?: unknown;
  correctAnswer?: string;
  explanation?: string;
}

/**
 * Response scale for rating questions
 */
export interface ResponseScale {
  value: number;
  label: string;
}

/**
 * Assessment response
 */
export interface AssessmentResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  response_value: unknown;
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}
