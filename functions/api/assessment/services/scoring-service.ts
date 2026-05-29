/**
 * Career Match Scoring Service
 * Reusable scoring calculations for all grade levels
 *
 * Each grade level uses its own formula:
 * - Middle School: (Interest Fit × 0.40) + (Capability Fit × 0.35) + (Personality Fit × 0.25)
 * - TODO(grade-levels): High School, Higher Secondary, After10, After12 formulas to be extended
 */

export type GradeLevel = 'middle' | 'high' | 'higher' | 'after10' | 'after12';

export interface StudentProfile {
  riasec_scores: Record<string, number>;
  riasec_code: string;
  strength_scores: Array<{ dimension: string; average: number; ratings: number[] }>;
  aptitude_overall?: number;
  accuracy_by_subtag?: Record<string, number>;
  learning_preferences?: Record<string, unknown>;
}

export interface MatchScores {
  interestFit: number;
  capabilityFit: number;
  personalityFit: number;
  final: number;
}


/**
 * Calculate Interest Fit using RIASEC hexagon distance formula
 *
 * Hexagon layout: R(0) - I(1) - A(2) - S(3) - E(4) - C(5)
 * Distance weights:
 * - 0 steps (match): 100%
 * - 1 step (adjacent): 80%
 * - 2 steps (alternate): 60%
 * - 3 steps (opposite): 20%
 */
export function calculateInterestFit(
  studentRIASEC: Record<string, number>,
  jobRIASEC: string
): number {
  const hexagonPositions: Record<string, number> = {
    r: 0,
    i: 1,
    a: 2,
    s: 3,
    e: 4,
    c: 5,
  };

  const distanceWeights: Record<number, number> = {
    0: 100,
    1: 80,
    2: 60,
    3: 20,
  };

  // Get student's primary RIASEC type
  let primaryCode = '';
  let maxScore = 0;
  for (const [code, score] of Object.entries(studentRIASEC)) {
    if (score > maxScore) {
      maxScore = score;
      primaryCode = code[0].toLowerCase();
    }
  }

  if (!primaryCode || !hexagonPositions[primaryCode]) return 50;

  const studentPos = hexagonPositions[primaryCode];
  const jobCode = jobRIASEC[0].toLowerCase();

  if (!hexagonPositions[jobCode]) return 50;

  const jobPos = hexagonPositions[jobCode];

  // Calculate hexagon distance
  const directDistance = Math.abs(studentPos - jobPos);
  const wrapDistance = 6 - directDistance;
  const hexagonDistance = Math.min(directDistance, wrapDistance);

  const percentage = distanceWeights[hexagonDistance] || 20;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Calculate Capability Fit using character strengths + cognitive fit
 *
 * Formula: (Character Strength × 0.6) + (Cognitive Fit × 0.4)
 */
export function calculateCapabilityFit(
  strengthScores: Array<{ dimension: string; average: number; ratings: number[] }>,
  aptitudeOverall?: number,
  accuracyBySubtag?: Record<string, number>,
  jobRIASEC?: string
): number {
  if (!strengthScores || strengthScores.length === 0) return 50;

  // Character Strength Component (60%)
  const characterStrengthPercent = strengthScores.reduce(
    (sum, s) => sum + (s.average / 5) * 100,
    0
  ) / strengthScores.length;

  // Cognitive Fit Component (40%)
  let cognitivePercent = (aptitudeOverall || 0.5) * 100;

  if (accuracyBySubtag && jobRIASEC && Object.keys(accuracyBySubtag).length > 0) {
    cognitivePercent = calculateCognitiveProfileFit(accuracyBySubtag, jobRIASEC);
  }

  const combined = characterStrengthPercent * 0.6 + cognitivePercent * 0.4;
  return Math.max(0, Math.min(100, combined));
}

/**
 * Calculate Cognitive Fit based on O*NET cognitive ability requirements
 * Maps student's adaptive aptitude subtags to job cognitive demands
 */
function calculateCognitiveProfileFit(
  accuracyBySubtag: Record<string, number>,
  jobRIASEC: string
): number {
  // O*NET-based RIASEC to cognitive ability mapping
  const cognitiveRequirements: Record<string, Record<string, number>> = {
    r: { spatial: 0.5, mechanical: 0.4, manual: 0.3 },
    i: { abstract: 0.4, logical: 0.35, analytical: 0.35, verbal: 0.3 },
    a: { divergent: 0.4, visual: 0.35, creativity: 0.3 },
    s: { interpersonal: 0.35, verbal: 0.35, empathy: 0.3 },
    e: { verbal: 0.35, leadership: 0.3, numerical: 0.25 },
    c: { numerical: 0.4, attention: 0.35, organization: 0.3 },
  };

  const jobCode = jobRIASEC[0].toLowerCase();
  const requirements = cognitiveRequirements[jobCode];

  if (!requirements || Object.keys(requirements).length === 0) return 50;

  let totalWeightedFit = 0;
  let totalWeight = 0;

  for (const [requirement, weight] of Object.entries(requirements)) {
    let bestMatch = 0;
    for (const [subtag, score] of Object.entries(accuracyBySubtag)) {
      if (subtag.toLowerCase().includes(requirement.toLowerCase())) {
        bestMatch = Math.max(bestMatch, score);
      }
    }
    totalWeightedFit += bestMatch * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 50;
  const cognitivePercent = totalWeightedFit / totalWeight;
  return Math.max(0, Math.min(100, cognitivePercent));
}

/**
 * Calculate Personality Fit based on learning preferences diversity
 * Formula: Base 60% + 10% per unique preference (max 30%)
 */
export function calculatePersonalityFit(
  learningPreferences?: Record<string, unknown>
): number {
  if (!learningPreferences || Object.keys(learningPreferences).length === 0) return 50;

  const prefs = Object.keys(learningPreferences);
  const diversityBonus = Math.min(prefs.length * 10, 30);

  return Math.max(50, Math.min(100, 60 + diversityBonus));
}

/**
 * Calculate final match score using weighted formula based on grade level
 * Each grade level applies its own weights:
 * - Middle School: (Interest Fit × 0.40) + (Capability Fit × 0.35) + (Personality Fit × 0.25)
 * - TODO(grade-levels): Update weights for high, higher, after10, after12
 */
export function calculateMatchScores(
  student: StudentProfile,
  jobRIASEC: string,
  gradeLevel: GradeLevel = 'middle'
): MatchScores {
  const interestFit = calculateInterestFit(student.riasec_scores, jobRIASEC);
  const capabilityFit = calculateCapabilityFit(
    student.strength_scores,
    student.aptitude_overall,
    student.accuracy_by_subtag,
    jobRIASEC
  );
  const personalityFit = calculatePersonalityFit(student.learning_preferences);

  const weights = getWeightsForGradeLevel(gradeLevel);
  const final = Math.round(
    interestFit * weights.interestFit +
      capabilityFit * weights.capabilityFit +
      personalityFit * weights.personalityFit
  );

  return {
    interestFit: Math.round(interestFit),
    capabilityFit: Math.round(capabilityFit),
    personalityFit: Math.round(personalityFit),
    final: Math.max(0, Math.min(100, final)),
  };
}

/**
 * Get formula weights for specific grade level
 * TODO(grade-levels): Add weights for high, higher, after10, after12
 */
function getWeightsForGradeLevel(gradeLevel: GradeLevel) {
  const weights: Record<GradeLevel, { interestFit: number; capabilityFit: number; personalityFit: number }> = {
    middle: { interestFit: 0.4, capabilityFit: 0.35, personalityFit: 0.25 },
    high: { interestFit: 0.4, capabilityFit: 0.35, personalityFit: 0.25 },
    higher: { interestFit: 0.4, capabilityFit: 0.35, personalityFit: 0.25 },
    after10: { interestFit: 0.4, capabilityFit: 0.35, personalityFit: 0.25 },
    after12: { interestFit: 0.4, capabilityFit: 0.35, personalityFit: 0.25 },
  };

  return weights[gradeLevel] || weights.middle;
}
