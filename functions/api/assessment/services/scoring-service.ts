/**
 * Career Match Scoring Service
 * Reusable scoring calculations for all grade levels
 *
 * Each grade level uses its own formula:
 * - Middle School: (Interest Fit × 0.50) + (Capability Fit × 0.35) + (Personality Fit × 0.15)
 * - TODO(grade-levels): High School, Higher Secondary, After10, After12 formulas to be extended
 */

export type GradeLevel = 'middle' | 'high' | 'higher' | 'after10' | 'after12' | 'college';

export interface StudentProfile {
  riasec_scores: Record<string, number>;
  riasec_code: string;
  strength_scores: Array<{ dimension: string; average: number; ratings: number[] }>;
  aptitude_overall?: number;
  accuracy_by_subtag?: Record<string, number>;
  learning_preferences?: Record<string, unknown>;
  // College / higher-grade signals (optional; absent for middle school)
  big_five_scores?: Record<string, number>;   // dimension -> 1..5 average
  work_values?: Record<string, number>;        // value -> 1..5 average
  knowledge_score?: number;                     // 0..100 scored domain knowledge
  stream?: string;
  degreeLevel?: string;                          // undergraduate | postgraduate | diploma (UG/PG)
}

export interface MatchScores {
  interestFit: number;
  capabilityFit: number;
  personalityFit: number;
  final: number;
}

/**
 * College / higher-secondary 5-component match result.
 * final = IF×0.35 + CF×0.25 + PF×0.20 + KF×0.12 + VF×0.08
 */
export interface CollegeMatchScores {
  interestFit: number;     // IF: RIASEC hexagon-distance alignment, full code (0-100)
  cognitiveFit: number;    // CF: aptitude + strengths (0-100)
  personalityFit: number;  // PF: Big Five alignment (0-100)
  knowledgeFit: number;    // KF: scored domain knowledge (0-100)
  valuesFit: number;       // VF: work-values alignment (0-100)
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

  // Use explicit undefined checks: position 0 ('r'/Realistic) is valid but falsy,
  // so `!hexagonPositions[code]` would wrongly treat R as missing and return 50.
  if (!primaryCode || hexagonPositions[primaryCode] === undefined) return 50;

  const studentPos = hexagonPositions[primaryCode];
  const jobCode = jobRIASEC[0].toLowerCase();

  if (hexagonPositions[jobCode] === undefined) return 50;

  const jobPos = hexagonPositions[jobCode];

  // Calculate hexagon distance
  const directDistance = Math.abs(studentPos - jobPos);
  const wrapDistance = 6 - directDistance;
  const hexagonDistance = Math.min(directDistance, wrapDistance);

  const percentage = distanceWeights[hexagonDistance] || 20;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Full-code Interest Fit (no C-Index). Scores the student's interest profile against an
 * occupation's full RIASEC code using Holland hexagon distance.
 *
 * For each letter in the occupation's code, credit is the hexagon-distance weight between the
 * student's STRONGEST type and that letter; the student's own score on that letter is weighted
 * by the credit. Result = weighted average over the code's letters, 0-100. Differentiates
 * occupations by their full 3-letter code (unlike calculateInterestFit, which compares primary
 * letters only).
 *
 * Hexagon order: R(0) I(1) A(2) S(3) E(4) C(5). Credit: 0→1.0, 1→0.75, 2→0.40, 3→0.05.
 */
export function calculateInterestFitFullCode(
  studentRIASEC: Record<string, number>,
  jobCode: string
): number {
  const pos: Record<string, number> = { r: 0, i: 1, a: 2, s: 3, e: 4, c: 5 };
  const credit: Record<number, number> = { 0: 1.0, 1: 0.75, 2: 0.4, 3: 0.05 };

  const scoreByLetter: Record<string, number> = {};
  let topLetter = '';
  let topScore = -1;
  for (const [code, score] of Object.entries(studentRIASEC)) {
    const letter = code[0].toLowerCase();
    scoreByLetter[letter] = score;
    if (score > topScore) {
      topScore = score;
      topLetter = letter;
    }
  }
  if (!topLetter || pos[topLetter] === undefined) return 50;

  const letters = (jobCode || '')
    .toLowerCase()
    .split('')
    .filter((l) => pos[l] !== undefined)
    .slice(0, 3);
  if (letters.length === 0) return 50;

  let weighted = 0;
  let max = 0;
  for (const letter of letters) {
    const direct = Math.abs(pos[topLetter] - pos[letter]);
    const distance = Math.min(direct, 6 - direct);
    const c = credit[distance] ?? 0.05;
    weighted += (scoreByLetter[letter] ?? 0) * c;
    max += 100 * c;
  }
  if (max === 0) return 50;
  return Math.max(0, Math.min(100, (weighted / max) * 100));
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
 * Personality Fit from Big Five (college / higher grades). Maps the role's primary RIASEC
 * letter to the Big Five traits it rewards, scores the student's traits (1-5 → 0-100)
 * against those weights. Falls back to 50 when no Big Five data.
 */
export function calculateBigFivePersonalityFit(
  bigFive?: Record<string, number>,
  jobRIASEC?: string
): number {
  if (!bigFive || Object.keys(bigFive).length === 0) return 50;
  // normalise to 0-100 by abbrev (o,c,e,a,n)
  const s: Record<string, number> = {};
  for (const [k, v] of Object.entries(bigFive)) s[k[0].toLowerCase()] = ((v - 1) / 4) * 100;

  const req: Record<string, Record<string, number>> = {
    r: { c: 0.4, e: 0.2, o: 0.2, a: 0.2 },
    i: { o: 0.4, c: 0.3, e: 0.15, a: 0.15 },
    a: { o: 0.5, e: 0.3, a: 0.2 },
    s: { a: 0.4, e: 0.3, o: 0.15, c: 0.15 },
    e: { e: 0.4, c: 0.3, a: 0.15, o: 0.15 },
    c: { c: 0.5, a: 0.25, o: 0.1, e: 0.15 },
  };
  const w = req[(jobRIASEC?.[0] || 'i').toLowerCase()] || req.i;
  let fit = 0, tot = 0;
  for (const [dim, weight] of Object.entries(w)) { fit += (s[dim] ?? 50) * weight; tot += weight; }
  return tot ? Math.max(0, Math.min(100, fit / tot)) : 50;
}

/** Knowledge Fit — the scored domain-knowledge percentage (0-100). */
export function calculateKnowledgeFit(knowledgeScore?: number): number {
  if (knowledgeScore == null) return 50;
  return Math.max(0, Math.min(100, knowledgeScore));
}

/**
 * Values Fit — aligns the student's top work values to the reward profile of the role's
 * primary RIASEC letter. Falls back to 50 when no work-values data.
 */
export function calculateValuesFit(
  workValues?: Record<string, number>,
  jobRIASEC?: string
): number {
  if (!workValues || Object.keys(workValues).length === 0) return 50;
  const weights: Record<string, Record<string, number>> = {
    r: { Security: 0.25, Financial: 0.25, Autonomy: 0.2, Impact: 0.15, Leadership: 0.15 },
    i: { Autonomy: 0.3, Impact: 0.25, Achievement: 0.25, Creativity: 0.1, Financial: 0.1 },
    a: { Creativity: 0.35, Impact: 0.25, Autonomy: 0.2, Achievement: 0.1, Financial: 0.1 },
    s: { Impact: 0.4, Security: 0.25, Autonomy: 0.15, Achievement: 0.1, Financial: 0.1 },
    e: { Financial: 0.3, Leadership: 0.3, Status: 0.25, Impact: 0.1, Autonomy: 0.05 },
    c: { Security: 0.35, Financial: 0.3, Autonomy: 0.15, Achievement: 0.1, Impact: 0.1 },
  };
  const w = weights[(jobRIASEC?.[0] || 'i').toLowerCase()] || weights.i;
  const top = Object.entries(workValues).sort(([, a], [, b]) => b - a).slice(0, 3);
  let score = 0;
  for (const [value, raw] of top) score += (((raw - 1) / 4) * 100) * (w[value] || 0.1);
  return Math.max(0, Math.min(100, score));
}

/**
 * College / Higher-Secondary 5-component match score.
 * final = IF×0.35 + CF×0.25 + PF×0.20 + KF×0.12 + VF×0.08
 *
 * Interest Fit is computed from the full RIASEC code via hexagon distance (no C-Index).
 */
export function calculateCollegeMatchScore(
  student: StudentProfile,
  jobRIASEC: string
): CollegeMatchScores {
  const interestFit = calculateInterestFitFullCode(student.riasec_scores, jobRIASEC);
  const cognitiveFit = calculateCapabilityFit(
    student.strength_scores, student.aptitude_overall, student.accuracy_by_subtag, jobRIASEC
  );
  const personalityFit = calculateBigFivePersonalityFit(student.big_five_scores, jobRIASEC);
  const knowledgeFit = calculateKnowledgeFit(student.knowledge_score);
  const valuesFit = calculateValuesFit(student.work_values, jobRIASEC);

  // College 5-component weights (sum to 1.0): IF 0.35, CF 0.25, PF 0.20, KF 0.12, VF 0.08
  const final = Math.round(
    interestFit * 0.35 +
    cognitiveFit * 0.25 +
    personalityFit * 0.20 +
    knowledgeFit * 0.12 +
    valuesFit * 0.08
  );
  return {
    interestFit: Math.round(interestFit),
    cognitiveFit: Math.round(cognitiveFit),
    personalityFit: Math.round(personalityFit),
    knowledgeFit: Math.round(knowledgeFit),
    valuesFit: Math.round(valuesFit),
    final: Math.max(0, Math.min(100, final)),
  };
}

/**
 * Middle-school (3-component) match score: IF + CF + PF(learning preferences).
 * Middle School: (Interest Fit × 0.50) + (Capability Fit × 0.35) + (Personality Fit × 0.15)
 * (College uses the 5-component calculateCollegeMatchScore instead.)
 */
export function calculateMiddleSchoolMatchScore(
  student: StudentProfile,
  jobRIASEC: string,
  gradeLevel: GradeLevel = 'middle'
): MatchScores {
  // Interest Fit is computed from the full RIASEC code via hexagon distance (no C-Index).
  const interestFit = calculateInterestFitFullCode(student.riasec_scores, jobRIASEC);
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
  // Partial: college is intentionally absent — it uses the 5-component
  // calculateCollegeMatchScore(), not this 3-component path. Missing keys fall back to middle.
  const weights: Partial<Record<GradeLevel, { interestFit: number; capabilityFit: number; personalityFit: number }>> = {
    // Middle School: RIASEC is the strongest signal at this age (Knowledge/Values not collected),
    // so Interest Fit carries the most weight.
    middle: { interestFit: 0.5, capabilityFit: 0.35, personalityFit: 0.15 },
    high: { interestFit: 0.4, capabilityFit: 0.35, personalityFit: 0.25 },
    higher: { interestFit: 0.4, capabilityFit: 0.35, personalityFit: 0.25 },
    after10: { interestFit: 0.4, capabilityFit: 0.35, personalityFit: 0.25 },
    after12: { interestFit: 0.4, capabilityFit: 0.35, personalityFit: 0.25 },
  };

  return weights[gradeLevel] || weights.middle;
}
