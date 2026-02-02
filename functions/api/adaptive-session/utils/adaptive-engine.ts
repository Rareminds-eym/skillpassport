/**
 * Adaptive Engine Service
 * 
 * Core logic for the adaptive aptitude testing system.
 * Handles tier classification, difficulty adjustment, and stop condition checking.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.3, 3.4
 */

import type {
  Tier,
  DifficultyLevel,
  ConfidenceTag,
  Response,
  StopConditionResult,
  DEFAULT_ADAPTIVE_TEST_CONFIG,
} from '../types';

// Import the config value
const config: typeof DEFAULT_ADAPTIVE_TEST_CONFIG = {
  phases: {
    diagnostic_screener: {
      phase: 'diagnostic_screener',
      minQuestions: 8,
      maxQuestions: 8,
      difficultyDistribution: {
        easy: 0,
        medium: 8,
        hard: 0,
      },
      minSubtags: 4,
      maxConsecutiveSameSubtag: 2,
    },
    adaptive_core: {
      phase: 'adaptive_core',
      minQuestions: 30,
      maxQuestions: 36,
      maxConsecutiveSameSubtag: 3,
      maxConsecutiveSameDirectionJumps: 3,
    },
    stability_confirmation: {
      phase: 'stability_confirmation',
      minQuestions: 6,
      maxQuestions: 6,
      maxConsecutiveSameSubtag: 2,
    },
  },
  tierStartingDifficulty: {
    L: 2,
    M: 3,
    H: 4,
  },
  minimumQuestionsForStop: 40,
  consistencyWindowSize: 8,
  maxDirectionChangesForHighConfidence: 2,
  maxDirectionChangesForMediumConfidence: 4,
};

/**
 * Result of tier classification from diagnostic screener
 */
export interface TierClassificationResult {
  tier: Tier;
  startingDifficulty: DifficultyLevel;
  correctCount: number;
  totalCount: number;
  accuracy: number;
}

/**
 * Result of difficulty adjustment after an answer
 */
export interface DifficultyAdjustmentResult {
  previousDifficulty: DifficultyLevel;
  newDifficulty: DifficultyLevel;
  change: 'increased' | 'decreased' | 'unchanged';
}

/**
 * Result of confidence tag determination
 */
export interface ConfidenceTagResult {
  confidenceTag: ConfidenceTag;
  directionChanges: number;
  isStable: boolean;
  reason: string;
}

/**
 * Classifies a student into a tier (L/M/H) based on their diagnostic screener responses.
 */
export function classifyTier(screenerResponses: Response[]): TierClassificationResult {
  const diagnosticResponses = screenerResponses.filter(
    (r) => r.phase === 'diagnostic_screener'
  );
  
  const totalCount = diagnosticResponses.length;
  const correctCount = diagnosticResponses.filter((r) => r.isCorrect).length;
  const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  
  let tier: Tier;
  
  if (correctCount <= 3) {
    tier = 'L';
  } else if (correctCount <= 5) {
    tier = 'M';
  } else {
    tier = 'H';
  }
  
  const startingDifficulty = getStartingDifficultyFromTier(tier);
  
  return {
    tier,
    startingDifficulty,
    correctCount,
    totalCount,
    accuracy,
  };
}

/**
 * Maps a tier classification to the corresponding starting difficulty level.
 */
export function getStartingDifficultyFromTier(tier: Tier): DifficultyLevel {
  return config.tierStartingDifficulty[tier];
}

/**
 * Adjusts difficulty based on whether the answer was correct.
 */
export function adjustDifficulty(
  currentDifficulty: DifficultyLevel,
  isCorrect: boolean
): DifficultyAdjustmentResult {
  let newDifficulty: DifficultyLevel;
  let change: 'increased' | 'decreased' | 'unchanged';
  
  if (isCorrect) {
    if (currentDifficulty >= 5) {
      newDifficulty = 5;
      change = 'unchanged';
    } else {
      newDifficulty = (currentDifficulty + 1) as DifficultyLevel;
      change = 'increased';
    }
  } else {
    if (currentDifficulty <= 1) {
      newDifficulty = 1;
      change = 'unchanged';
    } else {
      newDifficulty = (currentDifficulty - 1) as DifficultyLevel;
      change = 'decreased';
    }
  }
  
  return {
    previousDifficulty: currentDifficulty,
    newDifficulty,
    change,
  };
}

/**
 * Counts the number of direction changes in a difficulty path.
 */
export function countDirectionChanges(difficultyPath: DifficultyLevel[]): number {
  if (difficultyPath.length < 3) {
    return 0;
  }
  
  let directionChanges = 0;
  let previousDirection: 'up' | 'down' | 'same' | null = null;
  
  for (let i = 1; i < difficultyPath.length; i++) {
    const diff = difficultyPath[i] - difficultyPath[i - 1];
    let currentDirection: 'up' | 'down' | 'same';
    
    if (diff > 0) {
      currentDirection = 'up';
    } else if (diff < 0) {
      currentDirection = 'down';
    } else {
      currentDirection = 'same';
    }
    
    if (currentDirection !== 'same') {
      if (previousDirection !== null && currentDirection !== previousDirection) {
        directionChanges++;
      }
      previousDirection = currentDirection;
    }
  }
  
  return directionChanges;
}

/**
 * Checks if the last N items in the difficulty path are consistent (within ±1 fluctuation).
 */
export function checkLastItemsConsistency(
  difficultyPath: DifficultyLevel[],
  windowSize: number = config.consistencyWindowSize
): boolean {
  if (difficultyPath.length < windowSize) {
    return false;
  }
  
  const lastItems = difficultyPath.slice(-windowSize);
  const minDifficulty = Math.min(...lastItems);
  const maxDifficulty = Math.max(...lastItems);
  
  return (maxDifficulty - minDifficulty) <= 1;
}

/**
 * Checks stop conditions for the adaptive core phase.
 */
export function checkStopConditions(
  totalQuestionsAnswered: number,
  difficultyPath: DifficultyLevel[],
  responses: Response[]
): StopConditionResult {
  const minimumQuestionsCompleted = totalQuestionsAnswered >= config.minimumQuestionsForStop;
  
  const lastItemsConsistent = checkLastItemsConsistency(
    difficultyPath,
    config.consistencyWindowSize
  );
  
  const recentPath = difficultyPath.slice(-config.consistencyWindowSize);
  const difficultyStable = recentPath.length >= config.consistencyWindowSize &&
    (Math.max(...recentPath) - Math.min(...recentPath)) <= 1;
  
  const directionChanges = countDirectionChanges(difficultyPath);
  
  let shouldStop = false;
  let reason: StopConditionResult['reason'] = null;
  
  const maxQuestions = config.phases.diagnostic_screener.maxQuestions +
    config.phases.adaptive_core.maxQuestions +
    config.phases.stability_confirmation.maxQuestions;
  
  if (totalQuestionsAnswered >= maxQuestions) {
    shouldStop = true;
    reason = 'maximum_reached';
  } else if (minimumQuestionsCompleted && lastItemsConsistent && difficultyStable) {
    shouldStop = true;
    reason = 'stability_achieved';
  } else if (minimumQuestionsCompleted && lastItemsConsistent) {
    shouldStop = true;
    reason = 'minimum_reached';
  }
  
  let suggestedAptitudeLevel: DifficultyLevel | null = null;
  let suggestedConfidenceTag: ConfidenceTag | null = null;
  
  if (shouldStop && difficultyPath.length >= config.consistencyWindowSize) {
    const lastDifficulties = difficultyPath.slice(-config.consistencyWindowSize);
    suggestedAptitudeLevel = calculateMode(lastDifficulties);
    suggestedConfidenceTag = determineConfidenceTag(difficultyPath, responses).confidenceTag;
  }
  
  return {
    shouldStop,
    reason,
    minimumQuestionsCompleted,
    lastItemsConsistent,
    difficultyStable,
    directionChanges,
    suggestedAptitudeLevel,
    suggestedConfidenceTag,
  };
}

/**
 * Calculates the mode (most frequent value) of an array of difficulty levels.
 */
function calculateMode(values: DifficultyLevel[]): DifficultyLevel {
  const counts = new Map<DifficultyLevel, number>();
  
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  
  let maxCount = 0;
  let mode: DifficultyLevel = values[values.length - 1];
  
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }
  
  return mode;
}

/**
 * Determines the confidence tag based on performance consistency.
 */
export function determineConfidenceTag(
  difficultyPath: DifficultyLevel[],
  _responses: Response[]
): ConfidenceTagResult {
  const directionChanges = countDirectionChanges(difficultyPath);
  
  const isStable = checkLastItemsConsistency(difficultyPath, config.consistencyWindowSize);
  
  let confidenceTag: ConfidenceTag;
  let reason: string;
  
  if (directionChanges <= config.maxDirectionChangesForHighConfidence && isStable) {
    confidenceTag = 'high';
    reason = 'Stable performance with consistent accuracy';
  } else if (directionChanges <= config.maxDirectionChangesForMediumConfidence) {
    confidenceTag = 'medium';
    reason = 'Minor fluctuations in performance';
  } else {
    confidenceTag = 'low';
    reason = `Inconsistent performance with ${directionChanges} direction changes`;
  }
  
  return {
    confidenceTag,
    directionChanges,
    isStable,
    reason,
  };
}

/**
 * AdaptiveEngine class providing all adaptive testing logic
 */
export class AdaptiveEngine {
  static classifyTier(screenerResponses: Response[]): TierClassificationResult {
    return classifyTier(screenerResponses);
  }
  
  static getStartingDifficultyFromTier(tier: Tier): DifficultyLevel {
    return getStartingDifficultyFromTier(tier);
  }
  
  static adjustDifficulty(
    currentDifficulty: DifficultyLevel,
    isCorrect: boolean
  ): DifficultyAdjustmentResult {
    return adjustDifficulty(currentDifficulty, isCorrect);
  }
  
  static countDirectionChanges(difficultyPath: DifficultyLevel[]): number {
    return countDirectionChanges(difficultyPath);
  }
  
  static checkLastItemsConsistency(
    difficultyPath: DifficultyLevel[],
    windowSize?: number
  ): boolean {
    return checkLastItemsConsistency(difficultyPath, windowSize);
  }
  
  static checkStopConditions(
    totalQuestionsAnswered: number,
    difficultyPath: DifficultyLevel[],
    responses: Response[]
  ): StopConditionResult {
    return checkStopConditions(totalQuestionsAnswered, difficultyPath, responses);
  }
  
  static determineConfidenceTag(
    difficultyPath: DifficultyLevel[],
    responses: Response[]
  ): ConfidenceTagResult {
    return determineConfidenceTag(difficultyPath, responses);
  }
}

export default AdaptiveEngine;
