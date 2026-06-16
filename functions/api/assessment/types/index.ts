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

/**
 * Options for analyzing completed assessment
 */
export interface AnalyzeRequest {
  attemptId: string;
  gradeLevel?: string;
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
 * Adaptive session data for resume context
 */
export interface AdaptiveSessionInfo {
  sessionId: string;
  currentQuestionIndex: number;
  questionsAnswered: number;
  status: string;
  phase: string;
  difficulty: number;
  currentPhaseQuestions: unknown[];
  allResponses: unknown[];
}

/**
 * Adaptive progress (legacy format for ResumePromptScreen)
 */
export interface AdaptiveProgress {
  questionsAnswered: number;
}

/**
 * Result of checking in-progress status
 *
 * Supports both regular assessment and adaptive aptitude test resume
 * If isAdaptiveInProgress is true, use adaptiveSession data for resume
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
  sections?: AssessmentSection[] | null;
  // Adaptive test resume fields
  adaptiveSession?: AdaptiveSessionInfo | null;
  isAdaptiveInProgress?: boolean;
  totalQuestionsAdaptive?: number;
  // Legacy format for ResumePromptScreen compatibility
  adaptiveProgress?: AdaptiveProgress;
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
  partType?: 'sjt';
  scenario?: string;
  order: number;
  options?: unknown;
  maxSelections?: number;
  categoryMapping?: unknown;
  riasecType?: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
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

/**
 * RIASEC career interest scores
 */
export interface RIASECScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

/**
 * Character strength score with dimension and ratings
 */
export interface StrengthScore {
  dimension: string;
  ratings: number[];
  average: number;
}

/**
 * Adaptive aptitude data from linked session
 */
export interface AdaptiveAptitudeData {
  questionsAnswered: number;
  difficulty: number;
  aptitudeLevel: number | null;
  confidenceTag: string | null;
  tier: string | null;
  totalQuestions: number | null;
  totalCorrect: number | null;
  overallAccuracy: string | null;
  accuracyByDifficulty: Record<string, unknown> | null;
  accuracyBySubtag: Record<string, unknown> | null;
  pathClassification: string | null;
  averageResponseTimeMs: number | null;
}

/**
 * Assessment analysis result
 */
export interface AnalyzeResult {
  success: boolean;
  riasecScores: RIASECScores;
  strengthScores: StrengthScore[];
  learningPreferences: Record<string, unknown>;
  adaptiveData: AdaptiveAptitudeData | null;
  profileSnapshot: {
    grade_level: string;
    stream_id: string | null;
    started_at: string;
    completed_at: string;
    riasec_profile: string[];
    top_strengths: StrengthScore[];
    reflections: Array<{ question: string; answer: string }>;
  };
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

// ============================================================================
// CAREER TRACK GENERATION (RAG)
// ============================================================================

/**
 * Career evidence for a cluster (RIASEC, aptitude, personality factors)
 */
export interface CareerEvidence {
  interest: string;
  aptitude: string;
  personality: string;
}

/**
 * Career roles at different levels
 */
export interface CareerRoles {
  entry: string[];
  mid: string[];
}

/**
 * Single career cluster in exploration track
 */
export interface CareerCluster {
  title: string;
  matchScore: number;
  fit: 'High' | 'Medium' | 'Explore';
  derivation: string;
  description: string;
  examples: string[];
  whatYoullDo: string;
  whyItFits: string;
  evidence: CareerEvidence;
  roles: CareerRoles;
  domains: string[];
  futureOutlook: string;
}

/**
 * Exploration activity option
 */
export interface ExplorationOption {
  name: string;
  whyThisRole: string;
}

/**
 * Exploration activities grouped by fit level
 */
export interface SpecificOptions {
  highFit: ExplorationOption[];
  mediumFit: ExplorationOption[];
  exploreLater: ExplorationOption[];
}

/**
 * Career fit data with clusters and exploration options
 */
export interface CareerFitData {
  clusters: CareerCluster[];
  specificOptions: SpecificOptions;
}

/**
 * Career fit response for track generation
 */
export interface CareerFitResponse {
  success: boolean;
  grade_level: string;
  careerFit: CareerFitData;
  generation_timestamp: string;
}

/**
 * Student assessment data for track generation context
 */
export interface StudentAssessmentData {
  attempt_id: string;
  learner_id: string;
  grade_level: string;
  riasec_scores: Record<string, number>;
  riasec_code: string;
  strength_scores: Array<{ dimension: string; average: number; ratings: number[] }>;
  aptitude_scores?: Record<string, unknown>;
  aptitude_overall?: number;
  learning_preferences?: Record<string, unknown>;
  accuracy_by_subtag?: Record<string, number>;
  big_five_scores?: Record<string, number>;
  work_values?: Record<string, number>;
  knowledge_score?: number;
}

/**
 * Occupation match from semantic search
 */
export interface OccupationMatch {
  id: string;
  title: string;
  primary_riasec: string;
  description: string;
  similarity?: number;
}

/**
 * Common configuration for track generation
 */
export interface CommonConfig {
  occupationCount: number;
  models: string[];
  temperature: number;
}

/**
 * Grade-level specific configuration
 */
export interface GradeLevelConfig extends CommonConfig {
  systemPrompt: string;
}

// ============================================================================
// Cluster-generation prompt types (per grade level)
// ============================================================================

/** Minimal occupation shape the cluster prompts need (from the deterministic candidate list). */
export interface PromptOccupation {
  occupation_id: string;
  name: string;
  riasecCodes: string[];
  description?: string;  // Role description for LLM to understand importance & differences
}

/**
 * Extra narrative context for the cluster prompt. Not used for scoring — only to help the
 * model write accurate, evidence-citing narratives.
 */
export interface ClusterNarrativeContext {
  adaptive?: {
    overallAccuracy?: number | string | null;
    aptitudeLevel?: number | string | null;
    confidenceTag?: string | null;
    accuracyBySubtag?: Record<string, any> | null;
  } | null;
  reflections?: Array<{ question: string; answer: string }>;
  /** AI profile-synthesis narrative (college). Appended to the structured embedding query
   *  and provided to the cluster prompt for richer, consistent narratives. */
  profileNarrative?: string;
  /** Aptitude insights from difficulty-based performance (strengths/weaknesses). */
  aptitudeInsights?: {
    strengths: string[];
    weaknesses: string[];
    pattern: string;
  } | null;
  /** Knowledge insights from stream-specific assessment (topic strengths/weaknesses). */
  knowledgeInsights?: {
    strengths: string[];
    weaknesses: string[];
  } | null;
}

/** A per-grade prompt builder returns the system + user messages for the cluster LLM call. */
export interface ClusterPrompt {
  system: string;
  user: string;
}
