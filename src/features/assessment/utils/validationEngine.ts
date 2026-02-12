/**
 * Assessment Validation Engine
 * 
 * Industrial-grade validation for assessment data integrity.
 * Detects suspicious patterns, automation, and data quality issues.
 * 
 * @module features/assessment/utils/validationEngine
 */

import { supabase } from '@/lib/supabaseClient';

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  score: number; // 0-100, higher = more suspicious
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  details?: Record<string, any>;
}

export interface ValidationError {
  code: string;
  message: string;
  blocking: boolean;
}

export interface ResponsePattern {
  questionId: string;
  answer: any;
  responseTimeMs: number;
  timestamp: Date;
}

// ============================================================================
// Timing Validation
// ============================================================================

const MIN_RESPONSE_TIME_MS = 2000; // 2 seconds minimum per question
const MAX_RESPONSE_TIME_MS = 600000; // 10 minutes maximum per question
const SUSPICIOUS_FAST_THRESHOLD = 3000; // 3 seconds - flag for review

/**
 * Validate response timing patterns
 */
export function validateTiming(
  responses: ResponsePattern[],
  sectionType: string
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  let suspiciousScore = 0;

  if (responses.length === 0) {
    return { isValid: true, warnings: [], errors: [], score: 0 };
  }

  // Calculate average response time
  const totalTime = responses.reduce((sum, r) => sum + r.responseTimeMs, 0);
  const avgTime = totalTime / responses.length;

  // Check for impossibly fast responses
  const fastResponses = responses.filter(r => r.responseTimeMs < MIN_RESPONSE_TIME_MS);
  const suspiciousFastResponses = responses.filter(r => 
    r.responseTimeMs >= MIN_RESPONSE_TIME_MS && r.responseTimeMs < SUSPICIOUS_FAST_THRESHOLD
  );
  const fastPercentage = (fastResponses.length / responses.length) * 100;
  const suspiciousFastPercentage = (suspiciousFastResponses.length / responses.length) * 100;

  if (fastPercentage > 50) {
    warnings.push({
      code: 'TOO_FAST',
      message: `${fastPercentage.toFixed(1)}% of responses were too fast (< 2s)`,
      severity: 'high',
      details: {
        fastCount: fastResponses.length,
        totalCount: responses.length,
        avgResponseTime: avgTime,
        threshold: MIN_RESPONSE_TIME_MS
      }
    });
    suspiciousScore += 30;
  } else if (fastPercentage > 20 || suspiciousFastPercentage > 40) {
    warnings.push({
      code: 'FAST_RESPONSES',
      message: `${(fastPercentage + suspiciousFastPercentage).toFixed(1)}% of responses were suspiciously fast`,
      severity: 'medium',
      details: { fastCount: fastResponses.length, suspiciousFastCount: suspiciousFastResponses.length, totalCount: responses.length }
    });
    suspiciousScore += 15;
  }

  // Check for responses that took too long (possible abandonment)
  const slowResponses = responses.filter(r => r.responseTimeMs > MAX_RESPONSE_TIME_MS);
  if (slowResponses.length > 0) {
    warnings.push({
      code: 'VERY_SLOW_RESPONSES',
      message: `${slowResponses.length} responses took over 10 minutes`,
      severity: 'low',
      details: { slowCount: slowResponses.length }
    });
  }

  // Check for uniform timing (automation indicator)
  const timeVariance = calculateVariance(responses.map(r => r.responseTimeMs));
  if (timeVariance < 1000 && responses.length > 5) {
    warnings.push({
      code: 'UNIFORM_TIMING',
      message: 'Response times are suspiciously uniform (possible automation)',
      severity: 'high',
      details: { variance: timeVariance, sampleSize: responses.length }
    });
    suspiciousScore += 40;
  }

  // Section-specific timing checks
  if (sectionType === 'riasec' || sectionType === 'bigfive') {
    // Personality questions should take time to read
    if (avgTime < 3000) {
      warnings.push({
        code: 'PERSONALITY_TOO_FAST',
        message: 'Personality questions answered too quickly for meaningful reading',
        severity: 'medium',
        details: { avgTime, expectedMin: 3000 }
      });
      suspiciousScore += 10;
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    score: Math.min(100, suspiciousScore)
  };
}

// ============================================================================
// Pattern Analysis
// ============================================================================

/**
 * Detect uniform/suspicious response patterns
 */
export function validateResponsePatterns(
  answers: Record<string, any>,
  sectionType: string
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  let suspiciousScore = 0;

  const answerValues = Object.values(answers);
  if (answerValues.length === 0) {
    return { isValid: true, warnings: [], errors: [], score: 0 };
  }

  // Check for straight-lining (all same answer)
  const uniqueAnswers = new Set(answerValues.map(a => JSON.stringify(a)));
  if (uniqueAnswers.size === 1) {
    warnings.push({
      code: 'STRAIGHT_LINING',
      message: 'All answers are identical (straight-lining detected)',
      severity: 'high',
      details: { answer: answerValues[0], count: answerValues.length }
    });
    suspiciousScore += 50;
  }

  // Check for alternating patterns (A-B-A-B)
  if (detectAlternatingPattern(answerValues)) {
    warnings.push({
      code: 'ALTERNATING_PATTERN',
      message: 'Alternating response pattern detected (possible automation)',
      severity: 'high'
    });
    suspiciousScore += 45;
  }

  // Check for midpoint bias (always selecting neutral option)
  if (sectionType === 'riasec' || sectionType === 'bigfive' || sectionType === 'values') {
    const midpoints = answerValues.filter(a => a === 3 || a === 'neutral');
    const midpointPercentage = (midpoints.length / answerValues.length) * 100;
    
    if (midpointPercentage > 70) {
      warnings.push({
        code: 'MIDPOINT_BIAS',
        message: `${midpointPercentage.toFixed(1)}% of answers are neutral (lack of engagement)`,
        severity: 'medium',
        details: { midpointPercentage }
      });
      suspiciousScore += 20;
    }
  }

  // Check for sequential patterns (1-2-3-4-5-1-2-3...)
  if (detectSequentialPattern(answerValues)) {
    warnings.push({
      code: 'SEQUENTIAL_PATTERN',
      message: 'Sequential response pattern detected',
      severity: 'medium'
    });
    suspiciousScore += 25;
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    score: Math.min(100, suspiciousScore)
  };
}

// ============================================================================
// Anti-Automation Detection
// ============================================================================

export interface AntiCheatSignals {
  mouseMovements: number;
  tabSwitches: number;
  copyPasteEvents: number;
  timeAwayMs: number;
  totalTimeMs: number;
}

/**
 * Validate anti-cheat signals
 */
export function validateAntiCheatSignals(
  signals: AntiCheatSignals
): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  let suspiciousScore = 0;

  // No mouse movement = automation
  if (signals.mouseMovements < 10 && signals.totalTimeMs > 60000) {
    warnings.push({
      code: 'NO_MOUSE_MOVEMENT',
      message: 'No significant mouse activity detected',
      severity: 'high',
      details: { movements: signals.mouseMovements }
    });
    suspiciousScore += 35;
  }

  // Excessive tab switching = looking up answers
  if (signals.tabSwitches > 5) {
    warnings.push({
      code: 'EXCESSIVE_TAB_SWITCHING',
      message: `${signals.tabSwitches} tab switches detected`,
      severity: 'medium',
      details: { tabSwitches: signals.tabSwitches }
    });
    suspiciousScore += 15 * Math.min(signals.tabSwitches - 5, 5);
  }

  // Too much time away from page
  const awayPercentage = (signals.timeAwayMs / signals.totalTimeMs) * 100;
  if (awayPercentage > 30) {
    warnings.push({
      code: 'TIME_AWAY',
      message: `${awayPercentage.toFixed(1)}% of time spent away from assessment`,
      severity: 'medium',
      details: { awayPercentage, timeAwayMs: signals.timeAwayMs }
    });
    suspiciousScore += 20;
  }

  // Copy-paste events (unlikely in assessment)
  if (signals.copyPasteEvents > 0) {
    warnings.push({
      code: 'COPY_PASTE',
      message: `${signals.copyPasteEvents} copy/paste events detected`,
      severity: 'low',
      details: { events: signals.copyPasteEvents }
    });
    suspiciousScore += 5;
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    score: Math.min(100, suspiciousScore)
  };
}

// ============================================================================
// Complete Assessment Validation
// ============================================================================

export interface AssessmentValidationInput {
  attemptId: string;
  responses: ResponsePattern[];
  answers: Record<string, any>;
  sectionType: string;
  antiCheatSignals?: AntiCheatSignals;
}

/**
 * Run complete validation suite on an assessment attempt
 */
export async function validateAssessmentAttempt(
  input: AssessmentValidationInput
): Promise<ValidationResult> {
  // Run all validation checks
  const timingResult = validateTiming(input.responses, input.sectionType);
  const patternResult = validateResponsePatterns(input.answers, input.sectionType);
  
  let antiCheatResult: ValidationResult = { 
    isValid: true, 
    warnings: [], 
    errors: [], 
    score: 0 
  };
  
  if (input.antiCheatSignals) {
    antiCheatResult = validateAntiCheatSignals(input.antiCheatSignals);
  }

  // Combine results
  const allWarnings = [
    ...timingResult.warnings,
    ...patternResult.warnings,
    ...antiCheatResult.warnings
  ];

  const allErrors = [
    ...timingResult.errors,
    ...patternResult.errors,
    ...antiCheatResult.errors
  ];

  const totalScore = timingResult.score + patternResult.score + antiCheatResult.score;

  // Log validation results for monitoring
  if (totalScore > 30) {
    console.warn('⚠️ Assessment validation warnings:', {
      attemptId: input.attemptId,
      score: totalScore,
      warningCount: allWarnings.length,
      topIssues: allWarnings.slice(0, 3).map(w => w.code)
    });

    // Store validation results for analytics
    await storeValidationResults(input.attemptId, allWarnings, totalScore);
  }

  return {
    isValid: allErrors.length === 0 && totalScore < 70,
    warnings: allWarnings,
    errors: allErrors,
    score: Math.min(100, totalScore)
  };
}

/**
 * Store validation results for analytics and review
 */
async function storeValidationResults(
  attemptId: string,
  warnings: ValidationWarning[],
  score: number
): Promise<void> {
  try {
    await supabase.from('assessment_validation_logs').insert({
      attempt_id: attemptId,
      validation_score: score,
      warnings: warnings,
      validated_at: new Date().toISOString(),
      requires_review: score > 50
    });
  } catch (err) {
    // Non-blocking - just log the error
    console.error('Failed to store validation results:', err);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function detectAlternatingPattern(values: any[]): boolean {
  if (values.length < 4) return false;
  
  const strValues = values.map(v => JSON.stringify(v));
  const pattern1 = strValues[0];
  const pattern2 = strValues[1];
  
  if (pattern1 === pattern2) return false;
  
  for (let i = 2; i < strValues.length; i++) {
    const expected = i % 2 === 0 ? pattern1 : pattern2;
    if (strValues[i] !== expected) return false;
  }
  
  return true;
}

function detectSequentialPattern(values: any[]): boolean {
  if (values.length < 4) return false;
  
  // Check for simple incrementing pattern
  let sequentialCount = 0;
  for (let i = 1; i < values.length; i++) {
    const diff = Number(values[i]) - Number(values[i - 1]);
    if (diff === 1 || diff === -1) {
      sequentialCount++;
    }
  }
  
  return sequentialCount / (values.length - 1) > 0.7;
}

// ============================================================================
// Export for use in hooks and services
// ============================================================================

export const ValidationEngine = {
  validateTiming,
  validateResponsePatterns,
  validateAntiCheatSignals,
  validateAssessmentAttempt
};

export default ValidationEngine;
