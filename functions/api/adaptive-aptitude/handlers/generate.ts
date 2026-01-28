/**
 * Question generation handlers
 */

import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { GradeLevel, DifficultyLevel, Subtag, QuestionGenerationResult } from '../types';
import { generateDiagnosticScreener } from './diagnostic';
import { generateAdaptiveCore } from './adaptive';
import { generateStabilityConfirmation } from './stability';
import { generateSingle } from './single';

export async function generateDiagnosticScreenerQuestions(
  env: PagesEnv,
  gradeLevel: GradeLevel,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  return generateDiagnosticScreener(env, gradeLevel, excludeQuestionIds, excludeQuestionTexts);
}

export async function generateAdaptiveCoreQuestions(
  env: PagesEnv,
  gradeLevel: GradeLevel,
  startingDifficulty: DifficultyLevel,
  count: number = 10,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  return generateAdaptiveCore(env, gradeLevel, startingDifficulty, count, excludeQuestionIds, excludeQuestionTexts);
}

export async function generateStabilityConfirmationQuestions(
  env: PagesEnv,
  gradeLevel: GradeLevel,
  provisionalBand: DifficultyLevel,
  count: number = 4,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  return generateStabilityConfirmation(
    env,
    gradeLevel,
    provisionalBand,
    count,
    excludeQuestionIds,
    excludeQuestionTexts
  );
}

export async function generateSingleQuestion(
  env: PagesEnv,
  gradeLevel: GradeLevel,
  phase: string,
  difficulty: DifficultyLevel,
  subtag: Subtag,
  excludeQuestionIds: string[] = []
): Promise<QuestionGenerationResult> {
  return generateSingle(env, gradeLevel, phase, difficulty, subtag, excludeQuestionIds);
}
