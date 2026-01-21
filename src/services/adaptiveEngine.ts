/**
 * Adaptive Engine Service
 *
 * Core logic for the adaptive aptitude testing system.
 * Handles tier classification, difficulty adjustment, and stop condition checking.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.3, 3.4
 */

import {
  Tier,
  DifficultyLevel,
  ConfidenceTag,
  Response,
  StopConditionResult,
  DEFAULT_ADAPTIVE_TEST_CONFIG,
} from '../types/adaptiveAptitude';

/**
 * Result of tier classification from diagnostic screener
 */
export interface TierClassificationResult {
  /** Classified tier (L, M, or H) */
  tier: Tier;
  /** Starting difficulty for adaptive core phase */
  startingDifficulty: DifficultyLevel;
  /** Number of correct answers in screener */
  correctCount: number;
  /** Total questions in screener */
  totalCount: number;
  /** Accuracy percentage */
  accuracy: number;
}

/**
 * Result of difficulty adjustment after an answer
 */
export interface DifficultyAdjustmentResult {
  /** Previous difficulty level */
  previousDifficulty: DifficultyLevel;
  /** New difficulty level after adjustment */
  newDifficulty: DifficultyLevel;
  /** Direction of change */
  change: 'increased' | 'decreased' | 'unchanged';
}

/**
 * Result of confidence tag determination
 */
export interface ConfidenceTagResult {
  /** The determined confidence tag */
  confidenceTag: ConfidenceTag;
  /** Number of direction changes in the difficulty path */
  directionChanges: number;
  /** Whether performance was stable */
  isStable: boolean;
  /** Reason for the confidence level */
  reason: string;
}

/**
 * Classifies a student into a tier (L/M/H) based on their diagnostic screener responses.
 *
 * Classification logic:
 * - Low (L): 0-2 correct out of 6 (0-33% accuracy)
 * - Medium (M): 3-4 correct out of 6 (34-66% accuracy)
 * - High (H): 5-6 correct out of 6 (67-100% accuracy)
 *
 * Requirements: 2.1
 *
 * @param screenerResponses - Array of responses from the diagnostic screener phase
 * @returns TierClassificationResult with tier, starting difficulty, and stats
 */
export function classifyTier(screenerResponses: Response[]): TierClassificationResult {
  // Filter to only diagnostic screener responses
  const diagnosticResponses = screenerResponses.filter((r) => r.phase === 'diagnostic_screener');

  const totalCount = diagnosticResponses.length;
  const correctCount = diagnosticResponses.filter((r) => r.isCorrect).length;
  const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

  // Classify tier based on correct count
  let tier: Tier;

  if (correctCount <= 2) {
    // 0-2 correct: Low tier
    tier = 'L';
  } else if (correctCount <= 4) {
    // 3-4 correct: Medium tier
    tier = 'M';
  } else {
    // 5-6 correct: High tier
    tier = 'H';
  }

  // Get starting difficulty from tier mapping
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
 *
 * Mapping:
 * - L (Low) → Difficulty 2
 * - M (Medium) → Difficulty 3
 * - H (High) → Difficulty 4
 *
 * Requirements: 2.2
 *
 * @param tier - The tier classification (L, M, or H)
 * @returns The starting difficulty level for the adaptive core phase
 */
export function getStartingDifficultyFromTier(tier: Tier): DifficultyLevel {
  return DEFAULT_ADAPTIVE_TEST_CONFIG.tierStartingDifficulty[tier];
}

/**
 * Adjusts difficulty based on whether the answer was correct.
 *
 * Logic:
 * - Correct answer → difficulty +1 (bounded at 5)
 * - Incorrect answer → difficulty -1 (bounded at 1)
 *
 * Requirements: 2.3, 2.4
 *
 * @param currentDifficulty - The current difficulty level
 * @param isCorrect - Whether the answer was correct
 * @returns DifficultyAdjustmentResult with previous, new difficulty and change direction
 */
export function adjustDifficulty(
  currentDifficulty: DifficultyLevel,
  isCorrect: boolean
): DifficultyAdjustmentResult {
  let newDifficulty: DifficultyLevel;
  let change: 'increased' | 'decreased' | 'unchanged';

  if (isCorrect) {
    // Correct answer: increase difficulty, bounded at 5
    if (currentDifficulty >= 5) {
      newDifficulty = 5;
      change = 'unchanged';
    } else {
      newDifficulty = (currentDifficulty + 1) as DifficultyLevel;
      change = 'increased';
    }
  } else {
    // Incorrect answer: decrease difficulty, bounded at 1
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
 * A direction change occurs when the path goes from increasing to decreasing or vice versa.
 *
 * @param difficultyPath - Array of difficulty levels in order
 * @returns Number of direction changes
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

    // Only count direction changes between up and down (ignore 'same')
    if (currentDirection !== 'same') {
      if (previousDirection !== null && currentDirection !== previousDirection) {
        directionChanges++;
      }
      // Update previous direction only if not 'same'
      previousDirection = currentDirection;
    }
  }

  return directionChanges;
}

/**
 * Checks if the last N items in the difficulty path are consistent (within ±1 fluctuation).
 *
 * @param difficultyPath - Array of difficulty levels
 * @param windowSize - Number of recent items to check (default: 5)
 * @returns Whether the last items are consistent
 */
export function checkLastItemsConsistency(
  difficultyPath: DifficultyLevel[],
  windowSize: number = DEFAULT_ADAPTIVE_TEST_CONFIG.consistencyWindowSize
): boolean {
  if (difficultyPath.length < windowSize) {
    return false;
  }

  const lastItems = difficultyPath.slice(-windowSize);
  const minDifficulty = Math.min(...lastItems);
  const maxDifficulty = Math.max(...lastItems);

  // Consistent if fluctuation is within ±1 (max - min <= 1)
  return maxDifficulty - minDifficulty <= 1;
}

/**
 * Checks stop conditions for the adaptive core phase.
 *
 * Stop conditions:
 * 1. Minimum 16 items completed
 * 2. Last 5-6 items show consistency
 * 3. Difficulty fluctuation ≤ ±1
 *
 * Requirements: 3.3
 *
 * @param totalQuestionsAnswered - Total questions answered across all phases
 * @param difficultyPath - Array of difficulty levels throughout the test
 * @param responses - All responses in the session
 * @returns StopConditionResult with stop decision and details
 */
export function checkStopConditions(
  totalQuestionsAnswered: number,
  difficultyPath: DifficultyLevel[],
  responses: Response[]
): StopConditionResult {
  const config = DEFAULT_ADAPTIVE_TEST_CONFIG;

  // Check minimum questions completed
  const minimumQuestionsCompleted = totalQuestionsAnswered >= config.minimumQuestionsForStop;

  // Check last items consistency
  const lastItemsConsistent = checkLastItemsConsistency(
    difficultyPath,
    config.consistencyWindowSize
  );

  // Check difficulty stability (fluctuation within ±1 in recent items)
  const recentPath = difficultyPath.slice(-config.consistencyWindowSize);
  const difficultyStable =
    recentPath.length >= config.consistencyWindowSize &&
    Math.max(...recentPath) - Math.min(...recentPath) <= 1;

  // Count direction changes
  const directionChanges = countDirectionChanges(difficultyPath);

  // Determine if we should stop
  let shouldStop = false;
  let reason: StopConditionResult['reason'] = null;

  // Check if maximum questions reached (adaptive core max + screener + stability)
  const maxQuestions =
    config.phases.diagnostic_screener.maxQuestions +
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

  // Calculate suggested aptitude level (mode of last 5 difficulties)
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
 *
 * @param values - Array of difficulty levels
 * @returns The most frequent difficulty level
 */
function calculateMode(values: DifficultyLevel[]): DifficultyLevel {
  const counts = new Map<DifficultyLevel, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  let maxCount = 0;
  let mode: DifficultyLevel = values[values.length - 1]; // Default to last value

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
 *
 * Confidence levels:
 * - High: Stable performance, consistent accuracy (≤1 direction changes)
 * - Medium: Minor fluctuations (2 direction changes)
 * - Low: Inconsistent performance (>2 direction changes)
 *
 * Requirements: 3.4
 *
 * @param difficultyPath - Array of difficulty levels throughout the test
 * @param _responses - All responses in the session (reserved for future accuracy analysis)
 * @returns ConfidenceTagResult with confidence tag and analysis
 */
export function determineConfidenceTag(
  difficultyPath: DifficultyLevel[],
  _responses: Response[]
): ConfidenceTagResult {
  const config = DEFAULT_ADAPTIVE_TEST_CONFIG;
  const directionChanges = countDirectionChanges(difficultyPath);

  // Check if performance is stable (last items within ±1)
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
  /**
   * Classifies a student into a tier based on diagnostic screener responses
   *
   * Requirements: 2.1
   */
  static classifyTier(screenerResponses: Response[]): TierClassificationResult {
    return classifyTier(screenerResponses);
  }

  /**
   * Gets the starting difficulty for a given tier
   *
   * Requirements: 2.2
   */
  static getStartingDifficultyFromTier(tier: Tier): DifficultyLevel {
    return getStartingDifficultyFromTier(tier);
  }

  /**
   * Adjusts difficulty based on answer correctness
   *
   * Requirements: 2.3, 2.4
   */
  static adjustDifficulty(
    currentDifficulty: DifficultyLevel,
    isCorrect: boolean
  ): DifficultyAdjustmentResult {
    return adjustDifficulty(currentDifficulty, isCorrect);
  }

  /**
   * Counts direction changes in a difficulty path
   */
  static countDirectionChanges(difficultyPath: DifficultyLevel[]): number {
    return countDirectionChanges(difficultyPath);
  }

  /**
   * Checks if last items in difficulty path are consistent
   */
  static checkLastItemsConsistency(
    difficultyPath: DifficultyLevel[],
    windowSize?: number
  ): boolean {
    return checkLastItemsConsistency(difficultyPath, windowSize);
  }

  /**
   * Checks stop conditions for the adaptive core phase
   *
   * Requirements: 3.3
   */
  static checkStopConditions(
    totalQuestionsAnswered: number,
    difficultyPath: DifficultyLevel[],
    responses: Response[]
  ): StopConditionResult {
    return checkStopConditions(totalQuestionsAnswered, difficultyPath, responses);
  }

  /**
   * Determines confidence tag based on performance consistency
   *
   * Requirements: 3.4
   */
  static determineConfidenceTag(
    difficultyPath: DifficultyLevel[],
    responses: Response[]
  ): ConfidenceTagResult {
    return determineConfidenceTag(difficultyPath, responses);
  }
}

export default AdaptiveEngine;
