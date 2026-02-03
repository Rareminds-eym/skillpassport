/**
 * Type definitions for the Assessment Analysis API
 */

export interface StudentContext {
  rawGrade?: string;
  programName?: string;
  programCode?: string;
  degreeLevel?: 'postgraduate' | 'undergraduate' | 'diploma' | null;
}

export interface AssessmentData {
  stream: string;
  gradeLevel: 'middle' | 'highschool' | 'higher_secondary' | 'after12' | 'after10';
  riasecAnswers: Record<string, RiasecAnswer>;
  aptitudeAnswers: AptitudeAnswers;
  aptitudeScores: AptitudeScores;
  bigFiveAnswers: Record<string, BigFiveAnswer>;
  workValuesAnswers: Record<string, WorkValueAnswer>;
  employabilityAnswers: EmployabilityAnswers;
  knowledgeAnswers: Record<string, KnowledgeAnswer>;
  totalKnowledgeQuestions: number;
  totalAptitudeQuestions: number;
  sectionTimings: SectionTimings;
  adaptiveAptitudeResults?: AdaptiveAptitudeResults;
  studentContext?: StudentContext;
}

export interface RiasecAnswer {
  question: string;
  answer: number | string | string[];
  categoryMapping?: Record<string, string>;
  type?: string;
}

export interface AptitudeAnswers {
  verbal: AptitudeAnswer[];
  numerical: AptitudeAnswer[];
  abstract: AptitudeAnswer[];
  spatial: AptitudeAnswer[];
  clerical: AptitudeAnswer[];
}

export interface AptitudeAnswer {
  questionId: string;
  question: string;
  studentAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  subtype?: string;
  rating?: number;
  taskType?: string;
  type?: string;
}

export interface AptitudeScores {
  verbal: AptitudeScore;
  numerical: AptitudeScore;
  abstract: AptitudeScore;
  spatial: AptitudeScore;
  clerical: AptitudeScore;
}

export interface AptitudeScore {
  correct?: number;
  total: number;
  percentage?: number;
  averageRating?: number;
}

export interface BigFiveAnswer {
  question: string;
  answer: number;
}

export interface WorkValueAnswer {
  question: string;
  answer: number;
}

export interface EmployabilityAnswers {
  selfRating: Record<string, SelfRatingAnswer[]>;
  sjt: SJTAnswer[];
}

export interface SelfRatingAnswer {
  question: string;
  answer: number;
  domain: string;
}

export interface SJTAnswer {
  scenario: string;
  question: string;
  studentBestChoice: string;
  studentWorstChoice: string | null;
  correctBest: string;
  correctWorst: string;
  bestCorrect: boolean;
  worstCorrect: boolean;
  score: number;
}

export interface KnowledgeAnswer {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options?: string[];
}

export interface SectionTimings {
  riasec?: TimingData;
  aptitude?: TimingData;
  bigfive?: TimingData;
  values?: TimingData;
  employability?: TimingData;
  knowledge?: TimingData;
  totalTime?: number;
  totalFormatted?: string;
}

export interface TimingData {
  seconds: number;
  formatted: string;
  questionsCount: number;
  avgSecondsPerQuestion: number;
  timeLimit?: number;
}

export interface AdaptiveAptitudeResults {
  aptitudeLevel: number;
  confidenceTag: string;
  tier: string;
  overallAccuracy: number;
  accuracyBySubtag: Record<string, number>;
  pathClassification: string;
}

export interface AnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

export type GradeLevel = 'middle' | 'highschool' | 'higher_secondary' | 'after12' | 'after10' | 'college';
