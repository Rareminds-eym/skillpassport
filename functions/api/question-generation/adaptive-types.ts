/**
 * Type definitions for Adaptive Aptitude API
 */

export type GradeLevel = 'middle_school' | 'high_school' | 'higher_secondary' | 'college';
export type TestPhase = 'diagnostic_screener' | 'adaptive_core' | 'stability_confirmation';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type Subtag =
  | 'numerical_reasoning'
  | 'logical_reasoning'
  | 'verbal_reasoning'
  | 'spatial_reasoning'
  | 'data_interpretation'
  | 'pattern_recognition';

export interface Question {
  id: string;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: DifficultyLevel;
  subtag: Subtag;
  gradeLevel: GradeLevel;
  phase: TestPhase;
  explanation?: string;
  createdAt?: string;
}

export interface QuestionGenerationOptions {
  gradeLevel: GradeLevel;
  phase: TestPhase;
  difficulty?: DifficultyLevel;
  subtag?: Subtag;
  count?: number;
  excludeQuestionIds?: string[];
}

export interface QuestionGenerationResult {
  questions: Question[];
  fromCache: boolean;
  generatedCount: number;
  cachedCount: number;
  generatedBy?: 'ai' | 'fallback';
  modelUsed?: string;
}

export interface RawAIQuestion {
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}
