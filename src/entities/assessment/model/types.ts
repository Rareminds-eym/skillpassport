/**
 * Assessment Entity - Type Definitions
 * Core assessment interfaces and types for the application
 */

// ============================================================================
// Core Assessment Types
// ============================================================================

export type GradeLevel =
  | 'middle'           // Grades 6-8
  | 'highschool'       // Grades 9-10
  | 'higher_secondary' // Grades 11-12
  | 'after10'          // After 10th grade
  | 'after12'          // After 12th grade
  | 'college';         // UG/PG students

export type StreamCategory = 'science' | 'commerce' | 'arts';

export type QuestionType =
  | 'mcq'           // Multiple choice
  | 'likert'        // Rating scale
  | 'sjt'           // Situational judgment
  | 'multiselect'   // Multiple selection
  | 'text';         // Free text

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';

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

// ============================================================================
// Question and Section Types
// ============================================================================

export interface Question {
  id: string | number;
  text: string;
  type?: QuestionType;
  partType?: 'sjt';
  options?: string[];
  optionLabels?: string[];
  correct?: string;
  maxSelections?: number;
  subtag?: string;
}

export interface ResponseScaleOption {
  value: number;
  label: string;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  color: string;
  icon?: React.ReactNode;
  questions: Question[];
  instruction?: string;
  responseScale?: ResponseScaleOption[];
  isTimed?: boolean;
  timeLimit?: number;
  isAptitude?: boolean;
  isAdaptive?: boolean;
  individualTimeLimit?: number;
  individualQuestionCount?: number;
}

// ============================================================================
// Answer Types
// ============================================================================

export interface SJTAnswer {
  best: string;
  worst: string;
}

export type AnswerValue =
  | number
  | string
  | string[]
  | SJTAnswer
  | undefined;

export interface Answers {
  [questionId: string]: AnswerValue;
}

export interface SectionTimings {
  [sectionId: string]: number;
}

// ============================================================================
// Assessment Attempt Types
// ============================================================================

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

// ============================================================================
// Assessment Results Types
// ============================================================================

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
  N?: number; // Neuroticism;
}

export interface EmployabilityScores {
  communication?: number;
  teamwork?: number;
  problemSolving?: number;
  adaptability?: number;
  leadership?: number;
  [key: string]: number | undefined;
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
  courseRecommendations?: CourseRecommendation[];
  adaptiveAptitude?: AdaptiveAptitudeResult;
}

// ============================================================================
// Assessment Flow State Types
// ============================================================================

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

// ============================================================================
// Assessment Eligibility Types
// ============================================================================

export interface AssessmentEligibility {
  canTake: boolean;
  lastAttemptDate?: string;
  nextAvailableDate?: string;
  reason?: string;
}

// ============================================================================
// College Assessment Types
// ============================================================================

export interface CollegeAssessment {
  id: string;
  type: 'IA' | 'end_semester' | 'practical' | 'viva' | 'arrears';
  academic_year: string;
  department_id: string;
  program_id: string;
  semester: number;
  course_id: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  instructions?: string;
  syllabus_coverage: string[];
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed';
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentType {
  id: string;
  name: string;
  description?: string;
  weightage?: number;
}

export interface AssessmentMapping {
  assessmentType: string;
  assessment_type_id?: string;
  weightage?: number;
  outcome_id?: string;
  assessment_types?: ('IA' | 'end_semester' | 'practical' | 'viva' | 'arrears')[];
}

// ============================================================================
// Student Academic Data Types
// ============================================================================

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

export interface SubjectMark {
  id: string;
  subject_id: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  curriculum_subjects?: { name: string };
}

export interface AssessmentResult {
  id: string;
  assessment_name: string;
  score: number;
  max_score: number;
  percentage: number;
  grade?: string;
  completed_at: string;
}
