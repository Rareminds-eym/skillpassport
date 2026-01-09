/**
 * Assessment System Type Definitions
 * Centralized types for the entire assessment feature
 */

// ============================================
// Grade Level Types
// ============================================

export type GradeLevel = 
  | 'middle'           // Grades 6-8
  | 'highschool'       // Grades 9-10
  | 'higher_secondary' // Grades 11-12
  | 'after10'          // After 10th grade
  | 'after12'          // After 12th grade
  | 'college';         // UG/PG students

export interface GradeRange {
  min: number;
  max: number;
}

// ============================================
// Stream & Category Types
// ============================================

export type StreamCategory = 'science' | 'commerce' | 'arts';

export interface StreamOption {
  id: string;
  label: string;
  riasec?: string[];
  aptitudeStrengths?: string[];
}

export interface CategoryOption {
  id: StreamCategory;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

// ============================================
// Question Types
// ============================================

export type QuestionType = 
  | 'mcq'           // Multiple choice
  | 'likert'        // Rating scale
  | 'sjt'           // Situational judgment
  | 'multiselect'   // Multiple selection
  | 'text';         // Free text

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

// ============================================
// Section Types
// ============================================

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

// ============================================
// Answer Types
// ============================================

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

// ============================================
// Assessment Attempt Types
// ============================================

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';

export interface AssessmentAttempt {
  id: string;
  student_id: string;
  stream_id: string;
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

export interface SectionTimings {
  [sectionId: string]: number;
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

export interface CareerCluster {
  title: string;
  description: string;
  matchScore: number;
  whyItFits?: string;
  whatYoullDo?: string;
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
