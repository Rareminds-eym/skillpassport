/**
 * Analytics utilities for adaptive session API
 * Calculates accuracy metrics and path classification
 */

import type {
  Response,
  DifficultyLevel,
  Subtag,
  ALL_DIFFICULTY_LEVELS,
  ALL_SUBTAGS,
} from '../types';

/**
 * Calculates accuracy breakdown by difficulty level
 * 
 * Requirements: 8.1
 * 
 * @param responses - All responses from the session
 * @returns Record of accuracy by difficulty level
 */
export function calculateAccuracyByDifficulty(
  responses: Response[]
): Record<DifficultyLevel, { correct: number; total: number; accuracy: number }> {
  const result: Record<DifficultyLevel, { correct: number; total: number; accuracy: number }> = {
    1: { correct: 0, total: 0, accuracy: 0 },
    2: { correct: 0, total: 0, accuracy: 0 },
    3: { correct: 0, total: 0, accuracy: 0 },
    4: { correct: 0, total: 0, accuracy: 0 },
    5: { correct: 0, total: 0, accuracy: 0 },
  };

  for (const response of responses) {
    const difficulty = response.difficultyAtTime;
    result[difficulty].total++;
    if (response.isCorrect) {
      result[difficulty].correct++;
    }
  }

  // Calculate accuracy percentages
  const levels: DifficultyLevel[] = [1, 2, 3, 4, 5];
  for (const level of levels) {
    if (result[level].total > 0) {
      result[level].accuracy = (result[level].correct / result[level].total) * 100;
    }
  }

  return result;
}

/**
 * Calculates accuracy breakdown by subtag
 * 
 * Requirements: 8.2
 * 
 * @param responses - All responses from the session
 * @returns Record of accuracy by subtag
 */
export function calculateAccuracyBySubtag(
  responses: Response[]
): Record<Subtag, { correct: number; total: number; accuracy: number }> {
  const result: Record<Subtag, { correct: number; total: number; accuracy: number }> = {
    numerical_reasoning: { correct: 0, total: 0, accuracy: 0 },
    logical_reasoning: { correct: 0, total: 0, accuracy: 0 },
    verbal_reasoning: { correct: 0, total: 0, accuracy: 0 },
    spatial_reasoning: { correct: 0, total: 0, accuracy: 0 },
    data_interpretation: { correct: 0, total: 0, accuracy: 0 },
    pattern_recognition: { correct: 0, total: 0, accuracy: 0 },
  };

  for (const response of responses) {
    const subtag = response.subtag;
    result[subtag].total++;
    if (response.isCorrect) {
      result[subtag].correct++;
    }
  }

  // Calculate accuracy percentages
  const subtags: Subtag[] = [
    'numerical_reasoning',
    'logical_reasoning',
    'verbal_reasoning',
    'spatial_reasoning',
    'data_interpretation',
    'pattern_recognition',
  ];
  
  for (const subtag of subtags) {
    if (result[subtag].total > 0) {
      result[subtag].accuracy = (result[subtag].correct / result[subtag].total) * 100;
    }
  }

  return result;
}

/**
 * Classifies the difficulty path pattern
 * 
 * Requirements: 8.3
 * 
 * @param difficultyPath - Array of difficulty levels throughout the test
 * @returns Path classification
 */
export function classifyPath(
  difficultyPath: DifficultyLevel[]
): 'ascending' | 'descending' | 'stable' | 'fluctuating' {
  if (difficultyPath.length < 2) {
    return 'stable';
  }

  let ascendingCount = 0;
  let descendingCount = 0;
  let stableCount = 0;

  for (let i = 1; i < difficultyPath.length; i++) {
    const diff = difficultyPath[i] - difficultyPath[i - 1];
    if (diff > 0) {
      ascendingCount++;
    } else if (diff < 0) {
      descendingCount++;
    } else {
      stableCount++;
    }
  }

  const totalChanges = difficultyPath.length - 1;
  const ascendingRatio = ascendingCount / totalChanges;
  const descendingRatio = descendingCount / totalChanges;
  const stableRatio = stableCount / totalChanges;

  // Determine classification based on dominant pattern
  if (stableRatio >= 0.6) {
    return 'stable';
  } else if (ascendingRatio >= 0.6) {
    return 'ascending';
  } else if (descendingRatio >= 0.6) {
    return 'descending';
  } else {
    return 'fluctuating';
  }
}
