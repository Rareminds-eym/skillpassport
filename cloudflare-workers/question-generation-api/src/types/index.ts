/**
 * Question Generation API - Type Definitions
 */

// =============================================================================
// ENVIRONMENT
// =============================================================================

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  OPENROUTER_API_KEY?: string;
  VITE_OPENROUTER_API_KEY?: string;
  CLAUDE_API_KEY?: string;
  VITE_CLAUDE_API_KEY?: string;
}

// =============================================================================
// COMMON TYPES
// =============================================================================

export type GradeLevel = 'after10' | 'after12' | 'college' | 'middle_school' | 'high_school';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type DifficultyString = 'easy' | 'medium' | 'hard';

// =============================================================================
// CAREER ASSESSMENT TYPES
// =============================================================================

export interface AptitudeCategory {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface StreamContext {
  name: string;
  context: string;
  clericalExample: string;
}

export interface CareerQuestion {
  id: string;
  category: string;
  subject?: string;
  type: 'mcq';
  difficulty: DifficultyString;
  question: string;
  options: string[];
  correct_answer: string;
  skill_tag: string;
  estimated_time: number;
  originalIndex?: number;
  subtype?: string;
  moduleTitle?: string;
}

export interface CareerQuestionGenerationResult {
  questions: CareerQuestion[];
  cached?: boolean;
  generated?: boolean;
}

// =============================================================================
// ADAPTIVE ASSESSMENT TYPES
// =============================================================================

export type TestPhase = 'diagnostic_screener' | 'adaptive_core' | 'stability_confirmation';

export type Subtag = 
  | 'numerical_reasoning'
  | 'logical_reasoning'
  | 'verbal_reasoning'
  | 'spatial_reasoning'
  | 'data_interpretation'
  | 'pattern_recognition';

export interface AdaptiveQuestion {
  id: string;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: DifficultyLevel;
  subtag: Subtag;
  gradeLevel: 'middle_school' | 'high_school';
  phase: TestPhase;
  explanation?: string;
  createdAt?: string;
}

export interface AdaptiveQuestionSpec {
  difficulty: DifficultyLevel;
  subtag: Subtag;
}

export interface AdaptiveQuestionGenerationResult {
  questions: AdaptiveQuestion[];
  fromCache: boolean;
  generatedCount: number;
  cachedCount: number;
}

export interface RawAIQuestion {
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

// =============================================================================
// COURSE ASSESSMENT TYPES
// =============================================================================

export interface CourseQuestion {
  id: number;
  type: 'mcq';
  difficulty: DifficultyString;
  question: string;
  options: string[];
  correct_answer: string;
  skill_tag: string;
  estimated_time: number;
}

export interface CourseAssessmentResult {
  course: string;
  level: string;
  total_questions: number;
  questions: CourseQuestion[];
  cached?: boolean;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CacheRecord {
  question_id: string;
  text: string;
  options: Record<string, string>;
  correct_answer: string;
  difficulty: number;
  subtag: string;
  grade_level: string;
  phase: string;
  explanation?: string;
  usage_count?: number;
  last_used_at?: string;
  created_at?: string;
  is_active?: boolean;
}
