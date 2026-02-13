/**
 * College Assessment Data Types
 * 
 * World-class, industrial-grade type definitions for comprehensive
 * college student assessment data storage.
 * 
 * @module features/assessment/career-test/types/assessmentSnapshot
 * @version 2.0
 */

// ============================================================================
// CORE METADATA TYPES
// ============================================================================

export interface AssessmentMetadata {
  device_fingerprint: string;
  ip_address?: string;
  started_at: string;
  completed_at?: string;
  total_duration_seconds: number;
  session_timings: Record<string, SectionTiming>;
  user_agent?: string;
  screen_resolution?: string;
  timezone?: string;
  // For incremental saves
  current_section_index?: number;
  current_question_index?: number;
  last_updated_at?: string;
}

export interface SectionTiming {
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface AnswerValue {
  value: string | number | string[];
  selected_at: string;
  time_spent_seconds: number;
  is_correct?: boolean;
  confidence?: number | null;
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

export interface QuestionSnapshot {
  question_id: string;
  sequence: number;
  question_text: string;
  options?: QuestionOption[];
  category?: string;
  trait?: string;
  skill_tested?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  ai_generated?: boolean;
  ai_generated_at?: string;
  reverse_scored?: boolean;
  scale_type: string;
  answer: AnswerValue;
}

// ============================================================================
// SCORING TYPES
// ============================================================================

export interface RIASECScoring {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
  primary_code: string;
}

export interface BigFiveScoring {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface ValuesScoring {
  intrinsic: number;
  extrinsic: number;
  social: number;
  prestige: number;
}

export interface AptitudeSkillBreakdown {
  [skillName: string]: number;
}

export interface AptitudeScoring {
  total_questions: number;
  answered: number;
  correct: number;
  accuracy_percentage: number;
  estimated_ability_theta?: number;
  skill_breakdown: AptitudeSkillBreakdown;
}

export interface EmployabilityScoring {
  communication: number;
  teamwork: number;
  problem_solving: number;
  leadership: number;
  adaptability: number;
}

export interface KnowledgeScoring {
  total_questions: number;
  answered: number;
  correct: number;
  accuracy_percentage: number;
}

export interface AdaptiveAptitudeSummary {
  phases_completed: string[];
  final_phase: string;
  reliability: number;
}

// ============================================================================
// RESPONSE SCALE TYPES
// ============================================================================

export interface ResponseScale {
  min: number;
  max: number;
  labels: string[];
}

// ============================================================================
// SECTION TYPES
// ============================================================================

export interface BaseSection {
  section_id: string;
  title: string;
  type: string;
  started_at: string;
  completed_at?: string;
  duration_seconds: number;
  questions: QuestionSnapshot[];
}

export interface LikertSection extends BaseSection {
  type: 'likert';
  scale: ResponseScale;
}

export interface AccuracySection extends BaseSection {
  type: 'accuracy';
  scale: ResponseScale;
}

export interface ImportanceSection extends BaseSection {
  type: 'importance';
  scale: ResponseScale;
}

export interface SelfAssessmentSection extends BaseSection {
  type: 'self_assessment';
  scale: ResponseScale;
}

export interface MCQSection extends BaseSection {
  type: 'mcq';
  stream_id: string;
  stream_name: string;
  difficulty: string;
  ai_generated: boolean;
}

export interface AdaptiveReferenceSection {
  section_id: 'adaptive_aptitude';
  title: 'Adaptive Aptitude Test';
  type: 'adaptive_mcq';
  session_id: string;
  reference_only: true;
  questions_count: number;
  correct_answers: number;
  estimated_ability: number;
  session_reference: {
    table: 'adaptive_aptitude_sessions';
    session_id: string;
  };
  summary: AdaptiveAptitudeSummary;
}

export type SectionData = 
  | (LikertSection & { scoring?: RIASECScoring })
  | (AccuracySection & { scoring?: BigFiveScoring })
  | (ImportanceSection & { scoring?: ValuesScoring })
  | (MCQSection & { scoring?: AptitudeScoring })
  | (SelfAssessmentSection & { scoring?: EmployabilityScoring })
  | (MCQSection & { scoring?: KnowledgeScoring })
  | AdaptiveReferenceSection;

// ============================================================================
// AI RESULTS TYPES
// ============================================================================

export interface AIAnalysisResults {
  career_matches: string[];
  fit_scores: Record<string, number>;
  recommended_pathways: string[];
  development_areas: string[];
  generated_at?: string;
  model_version?: string;
}

// ============================================================================
// MAIN SNAPSHOT TYPE
// ============================================================================

export interface AssessmentSnapshot {
  schema_version: '2.0';
  attempt_id: string;
  student_id: string;
  grade_level: 'college';
  metadata: AssessmentMetadata;
  sections: {
    riasec?: LikertSection & { scoring?: RIASECScoring };
    bigfive?: AccuracySection & { scoring?: BigFiveScoring };
    values?: ImportanceSection & { scoring?: ValuesScoring };
    aptitude?: MCQSection & { scoring?: AptitudeScoring };
    employability?: SelfAssessmentSection & { scoring?: EmployabilityScoring };
    knowledge?: MCQSection & { scoring?: KnowledgeScoring };
    adaptive_aptitude?: AdaptiveReferenceSection;
  };
  summary: {
    total_sections: number;
    completed_sections: number;
    overall_completion_percentage: number;
    ai_analysis_requested: boolean;
    ai_results?: AIAnalysisResults;
    is_in_progress?: boolean;
  };
}

// ============================================================================
// UTILITY TYPES FOR BUILDING SNAPSHOT
// ============================================================================

export interface QuestionContext {
  questionId: string;
  question: any;
  sectionId: string;
  sequence: number;
  answer: any;
  answeredAt: string;
  timeSpentSeconds: number;
}

export interface SectionBuildContext {
  sectionId: string;
  title: string;
  type: string;
  startedAt: string;
  completedAt?: string;
  questions: QuestionContext[];
  streamId?: string;
  streamName?: string;
}

export type SectionType = 
  | 'riasec' 
  | 'bigfive' 
  | 'values' 
  | 'aptitude' 
  | 'employability' 
  | 'knowledge' 
  | 'adaptive_aptitude';

// ============================================================================
// VALIDATION TYPE GUARDS
// ============================================================================

export const isMCQSection = (section: SectionData): section is MCQSection => {
  return section.type === 'mcq';
};

export const isLikertSection = (section: SectionData): section is LikertSection => {
  return section.type === 'likert';
};

export const isAdaptiveSection = (section: SectionData): section is AdaptiveReferenceSection => {
  return section.type === 'adaptive_mcq';
};
