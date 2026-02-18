/**
 * Adaptive Aptitude Test Type Definitions
 * 
 * This module defines all types and interfaces for the adaptive aptitude testing system.
 * The test adapts difficulty based on student responses to accurately measure aptitude level.
 * 
 * Requirements: 7.1, 7.2
 */

// =============================================================================
// BASIC TYPES
// =============================================================================

/**
 * Grade level for the test - determines question complexity and context
 */
export type GradeLevel = 'middle_school' | 'high_school' | 'higher_secondary';

/**
 * Test phases in the adaptive aptitude test flow
 * - diagnostic_screener: Initial 8 questions to classify student tier (L/M/H)
 * - adaptive_core: Exactly 36 questions with adaptive difficulty adjustment
 * - stability_confirmation: Final 6 questions to confirm final aptitude level
 */
export type TestPhase = 'diagnostic_screener' | 'adaptive_core' | 'stability_confirmation';

/**
 * Tier classification based on diagnostic screener performance
 * - L (Low): Starting difficulty 2
 * - M (Medium): Starting difficulty 3
 * - H (High): Starting difficulty 4
 */
export type Tier = 'L' | 'M' | 'H';

/**
 * Difficulty levels for questions (1-5 scale)
 * 1 = Easiest, 5 = Hardest
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Confidence tag for final results
 * - high: Stable performance, consistent accuracy
 * - medium: Minor fluctuations in performance
 * - low: Inconsistent performance (>2 direction changes)
 */
export type ConfidenceTag = 'high' | 'medium' | 'low';

/**
 * Question subtags for categorizing aptitude areas
 * Used to ensure balanced coverage across different reasoning types
 */
export type Subtag = 
  | 'numerical_reasoning'
  | 'logical_reasoning'
  | 'verbal_reasoning'
  | 'spatial_reasoning'
  | 'data_interpretation'
  | 'pattern_recognition';

// =============================================================================
// CORE INTERFACES
// =============================================================================

/**
 * Represents a single question in the adaptive aptitude test
 */
export interface Question {
  /** Unique identifier for the question */
  id: string;
  
  /** The question text/prompt */
  text: string;
  
  /** Multiple choice options (A, B, C, D) */
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  
  /** Correct answer key */
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  
  /** Difficulty level of the question */
  difficulty: DifficultyLevel;
  
  /** Category/subtag of the question */
  subtag: Subtag;
  
  /** Grade level the question is designed for */
  gradeLevel: GradeLevel;
  
  /** Which phase this question belongs to */
  phase: TestPhase;
  
  /** Optional explanation for the correct answer */
  explanation?: string;
  
  /** Timestamp when question was generated/cached */
  createdAt?: string;
}

/**
 * Represents a student's response to a question
 */
export interface Response {
  /** Unique identifier for the response */
  id: string;
  
  /** Reference to the session this response belongs to */
  sessionId: string;
  
  /** Reference to the question answered */
  questionId: string;
  
  /** The answer selected by the student */
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  
  /** Whether the answer was correct */
  isCorrect: boolean;
  
  /** Time taken to answer in milliseconds */
  responseTimeMs: number;
  
  /** Difficulty level at the time of answering */
  difficultyAtTime: DifficultyLevel;
  
  /** Subtag of the question answered */
  subtag: Subtag;
  
  /** Phase during which this response was recorded */
  phase: TestPhase;
  
  /** Sequence number within the test (1-based) */
  sequenceNumber: number;
  
  /** Timestamp of the response */
  answeredAt: string;
}

/**
 * Represents an active or completed test session
 */
export interface TestSession {
  /** Unique identifier for the session */
  id: string;
  
  /** Student taking the test */
  studentId: string;
  
  /** Grade level of the test */
  gradeLevel: GradeLevel;
  
  /** Current phase of the test */
  currentPhase: TestPhase;
  
  /** Tier classification (set after diagnostic screener) */
  tier: Tier | null;
  
  /** Current difficulty level */
  currentDifficulty: DifficultyLevel;
  
  /** Path of difficulty levels throughout the test */
  difficultyPath: DifficultyLevel[];
  
  /** Total questions answered so far */
  questionsAnswered: number;
  
  /** Number of correct answers */
  correctAnswers: number;
  
  /** Current question index within the phase */
  currentQuestionIndex: number;
  
  /** All responses in this session */
  responses: Response[];
  
  /** Questions for the current phase */
  currentPhaseQuestions: Question[];
  
  /** Provisional aptitude band (updated during adaptive core) */
  provisionalBand: DifficultyLevel | null;
  
  /** Session status */
  status: 'in_progress' | 'completed' | 'abandoned';
  
  /** When the session started */
  startedAt: string;
  
  /** When the session was last updated */
  updatedAt: string;
  
  /** When the session was completed (if applicable) */
  completedAt: string | null;
}

/**
 * Final results of a completed adaptive aptitude test
 */
export interface TestResults {
  /** Unique identifier for the results */
  id: string;
  
  /** Reference to the session */
  sessionId: string;
  
  /** Student who took the test */
  studentId: string;
  
  /** Final aptitude level (1-5) */
  aptitudeLevel: DifficultyLevel;
  
  /** Confidence in the result */
  confidenceTag: ConfidenceTag;
  
  /** Tier from diagnostic screener */
  tier: Tier;
  
  /** Total questions answered */
  totalQuestions: number;
  
  /** Total correct answers */
  totalCorrect: number;
  
  /** Overall accuracy percentage */
  overallAccuracy: number;
  
  /** Accuracy breakdown by difficulty level */
  accuracyByDifficulty: Record<DifficultyLevel, { correct: number; total: number; accuracy: number }>;
  
  /** Accuracy breakdown by subtag */
  accuracyBySubtag: Record<Subtag, { correct: number; total: number; accuracy: number }>;
  
  /** Complete difficulty path through the test */
  difficultyPath: DifficultyLevel[];
  
  /** Path classification for analytics */
  pathClassification: 'ascending' | 'descending' | 'stable' | 'fluctuating';
  
  /** Average response time in milliseconds */
  averageResponseTimeMs: number;
  
  /** Grade level of the test */
  gradeLevel: GradeLevel;
  
  /** When the test was completed */
  completedAt: string;
}

// =============================================================================
// SUPPORTING INTERFACES
// =============================================================================

/**
 * Constraints for each test phase
 */
export interface PhaseConstraints {
  /** Phase this constraint applies to */
  phase: TestPhase;
  
  /** Minimum number of questions in this phase */
  minQuestions: number;
  
  /** Maximum number of questions in this phase */
  maxQuestions: number;
  
  /** Required difficulty distribution (for diagnostic screener) */
  difficultyDistribution?: {
    easy: number;    // Difficulty 1-2
    medium: number;  // Difficulty 3
    hard: number;    // Difficulty 4-5
  };
  
  /** Minimum number of different subtags required */
  minSubtags?: number;
  
  /** Maximum consecutive questions with same subtag */
  maxConsecutiveSameSubtag: number;
  
  /** Maximum consecutive difficulty jumps in same direction */
  maxConsecutiveSameDirectionJumps?: number;
}

/**
 * Result of checking stop conditions during adaptive core
 */
export interface StopConditionResult {
  /** Whether the test should stop */
  shouldStop: boolean;
  
  /** Reason for stopping (if applicable) */
  reason: 'minimum_reached' | 'stability_achieved' | 'maximum_reached' | null;
  
  /** Whether minimum questions (16) have been completed */
  minimumQuestionsCompleted: boolean;
  
  /** Whether last 5-6 items show consistency */
  lastItemsConsistent: boolean;
  
  /** Whether difficulty fluctuation is within ±1 */
  difficultyStable: boolean;
  
  /** Number of direction changes in difficulty path */
  directionChanges: number;
  
  /** Suggested final aptitude level if stopping */
  suggestedAptitudeLevel: DifficultyLevel | null;
  
  /** Suggested confidence tag if stopping */
  suggestedConfidenceTag: ConfidenceTag | null;
}

/**
 * Result of processing an answer submission
 */
export interface AnswerResult {
  /** Whether the answer was correct */
  isCorrect: boolean;
  
  /** Previous difficulty level */
  previousDifficulty: DifficultyLevel;
  
  /** New difficulty level after adjustment */
  newDifficulty: DifficultyLevel;
  
  /** Direction of difficulty change */
  difficultyChange: 'increased' | 'decreased' | 'unchanged';
  
  /** Whether this completes the current phase */
  phaseComplete: boolean;
  
  /** Next phase (if phase is complete) */
  nextPhase: TestPhase | null;
  
  /** Whether the entire test is complete */
  testComplete: boolean;
  
  /** Stop condition result (for adaptive core phase) */
  stopCondition: StopConditionResult | null;
  
  /** Updated session state */
  updatedSession: TestSession;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Configuration for the adaptive aptitude test
 */
export interface AdaptiveTestConfig {
  /** Phase constraints */
  phases: {
    diagnostic_screener: PhaseConstraints;
    adaptive_core: PhaseConstraints;
    stability_confirmation: PhaseConstraints;
  };
  
  /** Tier to starting difficulty mapping */
  tierStartingDifficulty: Record<Tier, DifficultyLevel>;
  
  /** Minimum questions before stop condition check */
  minimumQuestionsForStop: number;
  
  /** Number of recent items to check for consistency */
  consistencyWindowSize: number;
  
  /** Maximum direction changes for high confidence */
  maxDirectionChangesForHighConfidence: number;
  
  /** Maximum direction changes for medium confidence */
  maxDirectionChangesForMediumConfidence: number;
}

/**
 * Default configuration for the adaptive aptitude test
 * 
 * Question Pattern (EXACTLY 50 QUESTIONS):
 * - Phase 1 (Diagnostic Screener): Q1-Q8 all at Level 3 (baseline) - 8 questions
 * - Phase 2 (Adaptive Core): Q9-Q44 truly adaptive based on performance - 36 questions (FIXED, not variable)
 * - Phase 3 (Stability Confirmation): Q45-Q50 at final level - 6 questions
 * Total: EXACTLY 50 questions (8 + 36 + 6)
 */
export const DEFAULT_ADAPTIVE_TEST_CONFIG: AdaptiveTestConfig = {
  phases: {
    diagnostic_screener: {
      phase: 'diagnostic_screener',
      minQuestions: 8,
      maxQuestions: 8,  // 8 questions for baseline (all at Level 3)
      difficultyDistribution: {
        easy: 0,    // All at level 3 for baseline
        medium: 8,  // 8 medium questions (Level 3)
        hard: 0,    // No hard questions in baseline
      },
      minSubtags: 4,
      maxConsecutiveSameSubtag: 2,
    },
    adaptive_core: {
      phase: 'adaptive_core',
      minQuestions: 36,
      maxQuestions: 36,  // Exactly 36 questions for adaptive core (not a range)
      maxConsecutiveSameSubtag: 3,
      maxConsecutiveSameDirectionJumps: 3,
    },
    stability_confirmation: {
      phase: 'stability_confirmation',
      minQuestions: 6,
      maxQuestions: 6,  // 6 questions for stability
      maxConsecutiveSameSubtag: 2,
    },
  },
  tierStartingDifficulty: {
    L: 2,
    M: 3,
    H: 4,
  },
  minimumQuestionsForStop: 40,  // Not used - always complete exactly 36 adaptive core questions
  consistencyWindowSize: 8,     // Used for analytics only
  maxDirectionChangesForHighConfidence: 2,
  maxDirectionChangesForMediumConfidence: 4,
};

/**
 * All possible subtags as an array (useful for iteration)
 */
export const ALL_SUBTAGS: Subtag[] = [
  'numerical_reasoning',
  'logical_reasoning',
  'verbal_reasoning',
  'spatial_reasoning',
  'data_interpretation',
  'pattern_recognition',
];

/**
 * All difficulty levels as an array (useful for iteration)
 */
export const ALL_DIFFICULTY_LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5];

/**
 * All test phases in order
 */
export const TEST_PHASES_ORDER: TestPhase[] = [
  'diagnostic_screener',
  'adaptive_core',
  'stability_confirmation',
];


// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Options for initializing a new test
 */
export interface InitializeTestOptions {
  studentId: string;
  gradeLevel: GradeLevel;
  studentCourse?: string | null;
}

/**
 * Result of test initialization
 */
export interface InitializeTestResult {
  session: TestSession;
  firstQuestion: Question;
}

/**
 * Options for submitting an answer
 */
export interface SubmitAnswerOptions {
  sessionId: string;
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  responseTimeMs: number;
}

/**
 * Result of getting the next question
 */
export interface NextQuestionResult {
  question: Question | null;
  isTestComplete: boolean;
  currentPhase: TestPhase;
  progress: {
    questionsAnswered: number;
    currentQuestionIndex: number;
    totalQuestionsInPhase: number;
  };
}

/**
 * Result of resuming a test
 */
export interface ResumeTestResult {
  session: TestSession;
  currentQuestion: Question | null;
  isTestComplete: boolean;
}
