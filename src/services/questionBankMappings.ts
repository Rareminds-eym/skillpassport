import type { GradeLevel, Subtag, DifficultyLevel } from '../types/adaptiveAptitude';

/**
 * Maps database dimension codes to adaptive test subtags
 */
export const DIMENSION_TO_SUBTAG: Record<string, Subtag> = {
  QRA: 'numerical_reasoning',
  LRA: 'logical_reasoning',
  VRA: 'verbal_reasoning',
  SRA: 'spatial_reasoning',
  DIA: 'data_interpretation',
  PRA: 'pattern_recognition',
};

/**
 * Reverse mapping: subtag to dimension code
 */
export const SUBTAG_TO_DIMENSION: Record<Subtag, string> = {
  numerical_reasoning: 'QRA',
  logical_reasoning: 'LRA',
  verbal_reasoning: 'VRA',
  spatial_reasoning: 'SRA',
  data_interpretation: 'DIA',
  pattern_recognition: 'PRA',
};

/**
 * Maps grade strings from the database to GradeLevel types
 */
export const GRADE_TO_GRADE_LEVEL: Record<string, GradeLevel> = {
  '6': 'middle_school',
  '7': 'middle_school',
  '8': 'middle_school',
  '9': 'high_school',
  '10': 'high_school',
  '11': 'higher_secondary',
  '12': 'higher_secondary',
};

/**
 * Maps GradeLevel to the array of grade strings used in the database
 */
export const GRADE_LEVEL_TO_GRADES: Record<GradeLevel, string[]> = {
  middle_school: ['6', '7', '8'],
  high_school: ['9', '10'],
  higher_secondary: ['11', '12'],
};

/**
 * All known dimension codes
 */
export const ALL_DIMENSIONS = Object.keys(DIMENSION_TO_SUBTAG);

/**
 * Resolves a dimension code to a Subtag, falling back to 'logical_reasoning'
 */
export function dimensionToSubtag(dimension: string): Subtag {
  return DIMENSION_TO_SUBTAG[dimension] ?? 'logical_reasoning';
}

/**
 * Resolves a Subtag to a dimension code
 */
export function subtagToDimension(subtag: Subtag): string {
  return SUBTAG_TO_DIMENSION[subtag];
}

/**
 * Gets all grade strings for a given GradeLevel
 */
export function gradeLevelToGrades(gradeLevel: GradeLevel): string[] {
  return GRADE_LEVEL_TO_GRADES[gradeLevel];
}

/**
 * Fisher-Yates shuffle for randomizing question arrays
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Clamps a difficulty level to the valid range 1-5
 */
export function clampDifficulty(d: number): DifficultyLevel {
  return Math.max(1, Math.min(5, Math.round(d))) as DifficultyLevel;
}

/**
 * Reorders questions to prevent consecutive same-subtag questions.
 * Matches the pattern used by reorderToPreventConsecutiveSubtags in adaptive-utils.
 */
export function reorderForSubtagDiversity<T extends { subtag: string }>(questions: T[], maxConsecutive: number = 2): T[] {
  if (questions.length <= 1) return questions;

  const result: T[] = [];
  const remaining = [...questions];

  while (remaining.length > 0) {
    let lastSubtag: string | null = null;
    let consecutiveCount = 0;

    for (let i = result.length - 1; i >= 0 && i >= result.length - maxConsecutive; i--) {
      if (lastSubtag === null) {
        lastSubtag = result[i].subtag;
        consecutiveCount = 1;
      } else if (result[i].subtag === lastSubtag) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    let selectedIndex = 0;
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      const differentIndex = remaining.findIndex(q => q.subtag !== lastSubtag);
      if (differentIndex !== -1) {
        selectedIndex = differentIndex;
      }
    }

    result.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }

  return result;
}
