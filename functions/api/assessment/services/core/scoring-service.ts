/**
 * Career Match Scoring Service
 * Reusable scoring calculations for all grade levels
 *
 * Each grade level uses its own formula:
 * - Middle School: (Interest Fit × 0.50) + (Capability Fit × 0.35) + (Personality Fit × 0.15)
 * - TODO(grade-levels): High School, Higher Secondary, After10, After12 formulas to be extended
 */

export type { GradeLevel, StudentProfile, MatchScores, CollegeMatchScores } from '../../types';


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
 * Knowledge Fit from a role's required knowledge areas compared with learner's strengths/weaknesses.
 * Uses token-based overlap: "Financial analysis" partially matches "Financial Management" (both have "financial").
 * If student is strong in an area the role demands, score increases (+10).
 * If student is weak in an area the role demands, score decreases (-15).
 * Uses overall knowledge_score as base, adjusted by topic alignment.
 */
function knowledgeFitFromDemand(
  knowledgeScore: number | undefined,
  knowledgeStrengths: string[] | undefined,
  knowledgeWeaknesses: string[] | undefined,
  demandAreas: string[] | undefined,
  occupationName?: string // For logging
): number {
  // Base score from overall knowledge assessment
  const baseScore = knowledgeScore ?? 50;
  if (!demandAreas || demandAreas.length === 0) return baseScore; // No demand specified — use base

  const strengths = knowledgeStrengths || [];
  const weaknesses = knowledgeWeaknesses || [];

  // Count alignment using token overlap: +10 per strength match, -15 per weakness match
  let adjustment = 0;
  const strengthMatches: string[] = [];
  const weaknessMatches: string[] = [];

  for (const demandArea of demandAreas) {
    const demandTokens = normalizeKey(demandArea);
    if (demandTokens.length === 0) continue;

    // Check strengths for token overlap
    let hasStrengthMatch = false;
    for (const strength of strengths) {
      const strengthTokens = normalizeKey(strength);
      if (tokenOverlap(demandTokens, strengthTokens) > 0) {
        adjustment += 10;
        strengthMatches.push(demandArea);
        hasStrengthMatch = true;
        break;
      }
    }

    // Check weaknesses for token overlap (only if not already matched in strengths)
    if (!hasStrengthMatch) {
      for (const weakness of weaknesses) {
        const weaknessTokens = normalizeKey(weakness);
        if (tokenOverlap(demandTokens, weaknessTokens) > 0) {
          adjustment -= 15;
          weaknessMatches.push(demandArea);
          break;
        }
      }
    }
  }

  const adjusted = baseScore + adjustment;
  if (occupationName) {
    console.log(`  [KF] ${occupationName}: base=${baseScore} + strengthMatches=${strengthMatches.join(',')||'none'}(+${strengthMatches.length*10}) - weaknessMatches=${weaknessMatches.join(',')||'none'}(-${weaknessMatches.length*15}) = ${Math.max(0, Math.min(100, adjusted))}`);
  }
  return Math.max(0, Math.min(100, adjusted));
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
    interestFit: Math.round(Math.max(0, Math.min(100, interestFit))),
    cognitiveFit: Math.round(Math.max(0, Math.min(100, cognitiveFit))),
    personalityFit: Math.round(Math.max(0, Math.min(100, personalityFit))),
    knowledgeFit: Math.round(Math.max(0, Math.min(100, knowledgeFit))),
    valuesFit: Math.round(Math.max(0, Math.min(100, valuesFit))),
    final: Math.max(0, Math.min(100, final)),
  };
}

/**
 * Per-role demand profile — the role's actual requirements from Phase 1 LLM.
 */
export interface RoleDemandProfile {
  bigFive?: Record<string, number>;      // O/C/E/A/N -> ideal level 1..5
  workValues?: Record<string, number>;   // work value -> reward weight 0..1
  knowledgeAreas?: string[];             // role's key knowledge areas
}

/**
 * Derive cognitive weights from a career's RIASEC profile.
 * RIASEC codes map to cognitive demands:
 * - I (Investigative) → Logical(1.0), Numerical(0.5)
 * - R (Realistic) → Spatial(1.0), Numerical(0.5)
 * - A (Artistic) → Verbal(0.8), Spatial(0.5)
 * - S (Social) → Verbal(1.0)
 * - E (Enterprising) → Verbal(0.7), Numerical(0.5)
 * - C (Conventional) → Numerical(1.0), Speed(0.7)
 */
function deriveCognitiveWeightsFromRIASEC(jobRIASEC: string): Record<string, number> {
  const weights: Record<string, number> = {
    logical: 0,
    numerical: 0,
    verbal: 0,
    spatial: 0,
    speed: 0,
    pattern: 0,
  };

  const riasecMapping: Record<string, Record<string, number>> = {
    i: { logical: 1.0, numerical: 0.5 },
    r: { spatial: 1.0, numerical: 0.5 },
    a: { verbal: 0.8, spatial: 0.5 },
    s: { verbal: 1.0 },
    e: { verbal: 0.7, numerical: 0.5 },
    c: { numerical: 1.0, speed: 0.7 },
  };

  // Process each letter in the RIASEC code
  for (const letter of (jobRIASEC || '').toLowerCase().split('')) {
    const mapping = riasecMapping[letter];
    if (mapping) {
      for (const [cognitive, weight] of Object.entries(mapping)) {
        weights[cognitive] = (weights[cognitive] || 0) + weight;
      }
    }
  }

  return weights;
}

/** Cognitive Fit from a role's RIASEC-derived cognitive demands (vs student's adaptive subtag accuracies).
 * Weights are derived from the career's RIASEC profile, not hardcoded.
 * Returns 50 (neutral) if no demand calculated or no matches found.
 */
function cognitiveFitFromDemand(
  accuracyBySubtag: Record<string, number> | undefined,
  jobRIASEC: string
): number {
  const demand = deriveCognitiveWeightsFromRIASEC(jobRIASEC);
  if (!demand || Object.keys(demand).length === 0) return 50;

  let num = 0, den = 0;
  for (const [dk, w] of Object.entries(demand)) {
    if (!(w > 0)) continue;
    let studentScore: number | undefined;
    if (accuracyBySubtag) {
      for (const [st, sc] of Object.entries(accuracyBySubtag)) {
        if (st.toLowerCase().includes(dk.toLowerCase())) { studentScore = sc; break; }
      }
    }
    if (studentScore == null) continue; // no match — only count abilities we actually measured
    num += studentScore * w;
    den += w;
  }
  return den ? Math.max(0, Math.min(100, num / den)) : 50; // No matches → neutral
}

/** Personality Fit from a role's ideal Big Five levels (closeness of student traits to the ideal).
 * Returns 50 (neutral) if no demand specified or no matches found.
 */
function personalityFitFromDemand(
  bigFive: Record<string, number> | undefined,
  ideal: Record<string, number>
): number {
  if (!bigFive || Object.keys(bigFive).length === 0) return 50;
  if (!ideal || Object.keys(ideal).length === 0) return 50; // No demands → neutral

  const norm = (v: number) => ((v - 1) / 4) * 100;
  const s: Record<string, number> = {};
  for (const [k, v] of Object.entries(bigFive)) s[k[0].toLowerCase()] = norm(v);
  let sum = 0, n = 0;
  for (const [k, v] of Object.entries(ideal)) {
    const dim = k[0].toLowerCase();
    if (s[dim] == null) continue;
    sum += 100 - Math.abs(s[dim] - norm(v));
    n++;
  }
  return n ? Math.max(0, Math.min(100, sum / n)) : 50; // No matches → neutral
}

/**
 * Values Fit: Does the role deliver what the student values?
 * Only scores the student's TOP 3 work values (what they actually care about)
 * against what the role actually rewards.
 *
 * Formula: Sum(student_top_value × role_reward) / Sum(student_top_values) × 100
 * Example: Student values Financial(4.5), Autonomy(4.2). Role rewards Financial(0.8), Autonomy(0.5).
 *   = (4.5×0.8 + 4.2×0.5) / (4.5+4.2) × 100 = (3.6+2.1) / 8.7 × 100 = 65
 */
function valuesFitFromDemand(
  workValues: Record<string, number> | undefined,
  reward: Record<string, number>,
  occupationName?: string
): number {
  if (!workValues || Object.keys(workValues).length === 0) return 50;
  if (!reward || Object.keys(reward).length === 0) return 50;

  // Get student's top 3 values (those they actually prioritize, not all 8)
  const topStudentValues = Object.entries(workValues)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (topStudentValues.length === 0) return 50;

  // Score each top student value against what the role delivers
  let numerator = 0;
  let denominator = 0;
  const scored: string[] = [];

  for (const [studentValue, studentScore] of topStudentValues) {
    denominator += studentScore; // Sum of student's top 3 values

    // Find matching reward value using token overlap
    const roleReward = findBestMatchScore(studentValue, reward);
    if (roleReward != null) {
      const contribution = studentScore * roleReward;
      numerator += contribution;
      scored.push(`${studentValue}(s=${studentScore},r=${roleReward},c=${contribution.toFixed(1)})`);
    } else {
      scored.push(`${studentValue}(s=${studentScore},r=0,c=0)`);
    }
  }

  const result = denominator > 0 ? Math.max(0, Math.min(100, (numerator / denominator) * 100)) : 50;
  if (occupationName) {
    console.log(`  [VF-DEBUG] ${occupationName}: top-3-values [${scored.join(' ')}] = ${numerator.toFixed(1)}/${denominator} × 100 = ${Math.round(result)}`);
  }
  return result;
}


/**
 * Normalize a key/value name for matching: lowercase, split camelCase, split on whitespace/separators, remove empty tokens.
 * Example: "Problem Solving" → ["problem", "solving"]
 * Example: "ProblemSolving" → ["problem", "solving"]
 * Example: "CareerReadiness" → ["career", "readiness"]
 * Example: "Financial Analysis" → ["financial", "analysis"]
 */
function normalizeKey(key: string): string[] {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase: CareerReadiness → Career Readiness
    .toLowerCase()
    .replace(/[_\-]+/g, ' ') // Convert underscores/hyphens to spaces
    .split(/[\s]+/) // Split on spaces
    .filter(token => token.length > 0);
}

/**
 * Calculate token overlap between two normalized key lists.
 * Returns the count of common tokens (case-insensitive exact match on tokens).
 * Example: ["financial", "management"] vs ["financial", "decision", "making"] → 1 (financial)
 */
function tokenOverlap(tokens1: string[], tokens2: string[]): number {
  const set1 = new Set(tokens1);
  return tokens2.filter(token => set1.has(token)).length;
}

/**
 * Find best match for a demand key in student's records using token overlap.
 * Returns the student's score for the best match, or undefined if no match found.
 * Example: demand key "Problem Solving" looks for student keys with overlap.
 */
function findBestMatchScore(
  demandKey: string,
  studentRecords: Record<string, number>
): number | undefined {
  const demandTokens = normalizeKey(demandKey);
  if (demandTokens.length === 0) return undefined;

  let bestScore: number | undefined;
  let bestOverlap = 0;

  for (const [studentKey, score] of Object.entries(studentRecords)) {
    const studentTokens = normalizeKey(studentKey);
    const overlap = tokenOverlap(demandTokens, studentTokens);

    // Prefer higher overlap; if tied, prefer exact match
    if (overlap > bestOverlap || (overlap === bestOverlap && overlap > 0 && demandKey.toLowerCase() === studentKey.toLowerCase())) {
      bestOverlap = overlap;
      bestScore = score;
    }
  }

  // Only return a match if there's at least one token overlap
  return bestOverlap > 0 ? bestScore : undefined;
}


/**
 * College 5-component match score.
 * Formula: IF×0.35 + CF×0.25 + PF×0.20 + KF×0.12 + VF×0.08
 */
export function calculateCollegeMatchScoreFromDemand(
  student: StudentProfile,
  jobRIASEC: string,
  demand: RoleDemandProfile | undefined
): CollegeMatchScores {
  const interestFit = calculateInterestFitFullCode(student.riasec_scores, jobRIASEC);
  const cognitiveFit = cognitiveFitFromDemand(student.accuracy_by_subtag, jobRIASEC);
  const personalityFit = personalityFitFromDemand(student.big_five_scores, demand?.bigFive || {});
  const knowledgeFit = knowledgeFitFromDemand(student.knowledge_score, student.knowledge_strengths, student.knowledge_weaknesses, demand?.knowledgeAreas);
  const valuesFit = valuesFitFromDemand(student.work_values, demand?.workValues || {});

  const final = Math.round(
    interestFit * 0.35 + cognitiveFit * 0.25 + personalityFit * 0.20 + knowledgeFit * 0.12 + valuesFit * 0.08
  );

  return {
    interestFit: Math.round(Math.max(0, Math.min(100, interestFit))),
    cognitiveFit: Math.round(Math.max(0, Math.min(100, cognitiveFit))),
    personalityFit: Math.round(Math.max(0, Math.min(100, personalityFit))),
    knowledgeFit: Math.round(Math.max(0, Math.min(100, knowledgeFit))),
    valuesFit: Math.round(Math.max(0, Math.min(100, valuesFit))),
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
