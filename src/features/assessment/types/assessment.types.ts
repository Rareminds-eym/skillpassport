/**
 * Assessment System Type Definitions
 * Centralized types for the entire assessment feature
 * 
 * @module features/assessment/types
 */

// Import shared types from main assessment types
import type {
  GradeLevel,
  AttemptStatus,
  SectionTimings,
  AssessmentResponses,
  CategoryMapping,
  QuestionType,
  AnswerValue,
  Question,
  ResponseScaleOption,
  AssessmentSection,
  SJTAnswer,
  Answers,
  StreamCategory,
  StreamOption,
  CategoryOption
} from '../../../types/assessment';

// =============================================================================
// RE-EXPORT ADAPTIVE APTITUDE TYPES
// =============================================================================
// Comprehensive types for IRT-based adaptive testing
export type {
  GradeLevel as AdaptiveGradeLevel,
  TestPhase,
  Tier,
  DifficultyLevel,
  ConfidenceTag,
  Subtag,
  Question as AdaptiveTestQuestion,
  Response as AdaptiveResponse,
  TestSession,
  TestResults,
  PhaseConstraints,
  StopConditionResult,
  AnswerResult,
  AdaptiveTestConfig,
} from '../../../types/adaptiveAptitude';

export {
  DEFAULT_ADAPTIVE_TEST_CONFIG,
  ALL_SUBTAGS,
  ALL_DIFFICULTY_LEVELS,
  TEST_PHASES_ORDER,
} from '../../../types/adaptiveAptitude';

// Re-export imported types
export type { 
  GradeLevel, 
  AttemptStatus, 
  SectionTimings, 
  AssessmentResponses, 
  CategoryMapping,
  QuestionType,
  AnswerValue,
  Question,
  ResponseScaleOption,
  AssessmentSection,
  SJTAnswer,
  Answers,
  StreamCategory,
  StreamOption,
  CategoryOption
};

// ============================================
// Grade Level Types
// ============================================

export interface GradeRange {
  min: number;
  max: number;
}

// ============================================
// Stream & Category Types
// ============================================

// StreamCategory, StreamOption, CategoryOption are imported from main assessment.ts

// ============================================
// Question Types
// ============================================

// QuestionType, Question, ResponseScaleOption are imported from main assessment.ts

// ============================================
// Section Types
// ============================================

// AssessmentSection is imported from main assessment.ts

// ============================================
// Answer Types
// ============================================

// SJTAnswer, AnswerValue, Answers are imported from main assessment.ts

// ============================================
// Assessment Attempt Types
// ============================================

export interface AssessmentAttempt {
  id: string;
  student_id: string;
  stream_id: string | null;
  grade_level: GradeLevel;
  status: AttemptStatus;
  current_section_index: number;
  current_question_index: number;
  section_timings?: SectionTimings;
  started_at: string;
  completed_at?: string;
  adaptive_aptitude_session_id?: string;
  restoredResponses?: Answers;
}

// ============================================
// AI Analysis Result Types
// ============================================

export interface RIASECScores {
  R?: number; // Realistic
  I?: number; // Investigative
  A?: number; // Artistic
  S?: number; // Social
  E?: number; // Enterprising
  C?: number; // Conventional
}

export interface AptitudeScore {
  score: number;
  percentage: number;
  adaptiveAccuracy?: number;
}

export interface AptitudeScores {
  numerical?: AptitudeScore;
  verbal?: AptitudeScore;
  abstract?: AptitudeScore;
  spatial?: AptitudeScore;
  clerical?: AptitudeScore;
  [key: string]: AptitudeScore | undefined;
}

export interface BigFiveScores {
  O?: number; // Openness
  C?: number; // Conscientiousness
  E?: number; // Extraversion
  A?: number; // Agreeableness
  N?: number; // Neuroticism
}

export interface CareerClusterEvidence {
  interest?: string;
  aptitude?: string;
  personality?: string;
  values?: string;
  employability?: string;
  adaptiveAptitude?: string;
}

export interface CareerCluster {
  title: string;
  description: string;
  matchScore: number;
  fit?: 'High' | 'Medium' | 'Explore';
  whyItFits?: string;
  whatYoullDo?: string;
  evidence?: CareerClusterEvidence;
  roles?: {
    entry?: string[];
    mid?: string[];
  };
  domains?: string[];
}

export interface CareerFitResult {
  primaryFit: CareerCluster;
  secondaryFit?: CareerCluster;
  tertiaryFit?: CareerCluster;
}

export interface SkillGapItem {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  priority: 'high' | 'medium' | 'low';
}

export interface RoadmapStep {
  phase: string;
  duration: string;
  activities: string[];
}

export interface StreamRecommendation {
  isAfter10?: boolean;
  recommendedStream: string;
  alternativeStreams?: string[];
  reasoning?: {
    interests?: string;
    aptitude?: string;
    personality?: string;
  };
}

export interface CourseRecommendation {
  courseId: string;
  title: string;
  name?: string;
  courseName?: string;
  code?: string;
  category: string;
  relevanceScore?: number;
  matchScore?: number;
  matchLevel?: 'Excellent' | 'Good' | 'Fair' | 'Low';
  matchReasons?: string[];
  reasons?: string[];
}

export interface AdaptiveAptitudeResult {
  aptitudeLevel: string;
  confidenceTag: string;
  tier: number;
  overallAccuracy: number;
  accuracyBySubtag: {
    [subtag: string]: {
      accuracy: number;
      total: number;
      correct: number;
    };
  };
  pathClassification: string;
  totalQuestions: number;
  totalCorrect: number;
}

export interface EmployabilityScores {
  communication?: number;
  teamwork?: number;
  problemSolving?: number;
  adaptability?: number;
  leadership?: number;
  [key: string]: number | undefined;
}

// Main Assessment Results Interface
export interface AssessmentResults {
  riasec?: {
    scores: RIASECScores;
    topThree?: string[];
  };
  aptitude?: {
    scores: AptitudeScores;
    adaptiveLevel?: string;
    adaptiveConfidence?: string;
  };
  bigFive?: BigFiveScores;
  knowledge?: {
    score: number;
    percentage: number;
  };
  careerFit?: CareerFitResult;
  skillGap?: SkillGapItem[];
  roadmap?: RoadmapStep[];
  employability?: EmployabilityScores;
  streamRecommendation?: StreamRecommendation;
  platformCourses?: CourseRecommendation[];
  courseRecommendations?: CourseRecommendation[]; // Legacy field name
  adaptiveAptitude?: AdaptiveAptitudeResult;
}

// ============================================
// Student Info Types
// ============================================

export interface StudentInfo {
  name: string;
  regNo: string;
  rollNumberType: 'school' | 'institute' | 'university';
  college: string;
  school: string;
  stream: string;
  grade: string;
  branchField: string;
  courseName: string;
}

export interface StudentAcademicData {
  subjectMarks: SubjectMark[];
  projects: Project[];
  experiences: Experience[];
  education: Education[];
}

export interface SubjectMark {
  id: string;
  subject_id: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  curriculum_subjects?: { name: string };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  status: string;
  organization: string;
}

export interface Experience {
  id: string;
  organization: string;
  role: string;
  duration: string;
  verified: boolean;
}

export interface Education {
  id: string;
  degree: string;
  department: string;
  university: string;
  cgpa: number;
  level: string;
  status: string;
}

// ============================================
// Assessment Flow State Types
// ============================================

export type AssessmentFlowStatus =
  | 'idle'
  | 'checkingEligibility'
  | 'gradeSelection'
  | 'categorySelection'
  | 'streamSelection'
  | 'resumePrompt'
  | 'inProgress'
  | 'sectionIntro'
  | 'sectionComplete'
  | 'submitting'
  | 'completed'
  | 'restricted'
  | 'error';

export interface AssessmentFlowState {
  status: AssessmentFlowStatus;
  gradeLevel: GradeLevel | null;
  selectedCategory: StreamCategory | null;
  studentStream: string | null;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  answers: Answers;
  sectionTimings: SectionTimings;
  timeRemaining: number | null;
  elapsedTime: number;
  error: string | null;
  pendingAttempt: AssessmentAttempt | null;
}

// ============================================
// Adaptive Aptitude Types
// ============================================

export interface AdaptiveQuestion {
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  subtag?: string;
  difficulty?: number;
}

export interface AdaptiveProgress {
  questionsAnswered: number;
  currentQuestionIndex: number;
  estimatedTotalQuestions: number;
  completionPercentage: number;
}

export interface AdaptiveSession {
  id: string;
  currentDifficulty: number;
  phase: string;
}

// ============================================
// Eligibility Types
// ============================================

export interface AssessmentEligibility {
  canTake: boolean;
  lastAttemptDate?: string;
  nextAvailableDate?: string;
  reason?: string;
}
