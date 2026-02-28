/**
 * Assessment Validation Utilities
 * 
 * Validates and corrects assessment results to ensure data quality
 * 
 * @module features/assessment/assessment-result/utils/assessmentValidation
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RIASEC VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates and corrects RIASEC topThree to ensure it's sorted by score
 * 
 * Issue: AI sometimes returns topThree in wrong order (e.g., CEA when CES is correct)
 * Solution: Re-sort based on actual scores
 * 
 * @param {Object} riasec - RIASEC results object with scores and topThree
 * @param {Object} geminiResults - Optional gemini_results object for fallback _originalScores
 * @returns {Object} - Corrected RIASEC object
 */
export const validateRiasecTopThree = (riasec, geminiResults = null) => {
  if (!riasec?.scores) return riasec;

  // 🔧 CRITICAL FIX: Use _originalScores if main scores are all zeros
  // Check BOTH riasec._originalScores AND gemini_results.riasec._originalScores
  let scores = riasec.scores;
  const allZeros = Object.values(scores).every(score => score === 0);
  
  if (allZeros) {
    const originalScores = riasec._originalScores || 
                          geminiResults?.riasec?._originalScores || 
                          {};
    const hasOriginalScores = Object.keys(originalScores).length > 0 &&
      Object.values(originalScores).some(score => score > 0);
    
    if (hasOriginalScores) {
      console.log('🔧 validateRiasecTopThree: Using _originalScores instead of zeros');
      console.log('   Found at:', riasec._originalScores ? 'riasec._originalScores' : 'gemini_results.riasec._originalScores');
      scores = originalScores;
    }
  }
  
  // Sort all RIASEC types by score in descending order
  const sortedTypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([type]) => type);

  // Handle edge case: if all scores are 0, return empty arrays
  const hasAnyScore = Object.values(scores).some(score => score > 0);
  if (!hasAnyScore) {
    console.warn('⚠️ All RIASEC scores are 0 - returning empty topThree');
    return {
      ...riasec,
      topThree: [],
      code: '',
      _wasCorrect: false,
      _originalCode: riasec.code || '',
      _allZeros: true
    };
  }

  // Get top 3, but only include types with non-zero scores
  const nonZeroTypes = sortedTypes.filter(type => scores[type] > 0);
  const correctTopThree = nonZeroTypes.slice(0, 3);
  const correctCode = correctTopThree.join('');

  // Check if current topThree matches the correct order
  const currentTopThree = riasec.topThree || [];
  const currentCode = riasec.code || currentTopThree.join('');

  const isCorrect = correctCode === currentCode;

  if (!isCorrect) {
    console.warn('⚠️ RIASEC topThree correction needed:');
    console.warn(`   Current: ${currentCode} (${currentTopThree.join(', ')})`);
    console.warn(`   Correct: ${correctCode} (${correctTopThree.join(', ')})`);
    console.warn('   Scores:', scores);
  }

  return {
    ...riasec,
    topThree: correctTopThree,
    code: correctCode,
    _wasCorrect: isCorrect,
    _originalCode: currentCode
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// APTITUDE PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detects if aptitude answers show suspicious patterns indicating invalid responses
 * 
 * Patterns detected:
 * 1. All same answer (e.g., all "B")
 * 2. Sequential pattern (A, B, C, D, A, B, C, D...)
 * 3. Too fast completion (< 2 seconds per question average)
 * 
 * @param {Object} aptitudeAnswers - Aptitude answers by category
 * @param {Object} sectionTimings - Time spent on each section
 * @returns {Object} - Pattern detection results
 */
export const detectAptitudePatterns = (aptitudeAnswers, sectionTimings = {}) => {
  const results = {
    isValid: true,
    patterns: [],
    warnings: [],
    categories: {}
  };

  if (!aptitudeAnswers) return results;

  // Flatten all aptitude answers
  const allAnswers = [];
  const categoryAnswers = {};

  // Process each category
  ['verbal', 'numerical', 'abstract', 'spatial', 'clerical'].forEach(category => {
    const answers = aptitudeAnswers[category] || [];
    categoryAnswers[category] = answers.map(a => a.studentAnswer || a.answer || a);
    allAnswers.push(...categoryAnswers[category]);
  });

  if (allAnswers.length === 0) return results;

  // Pattern 1: All same answer
  const uniqueAnswers = [...new Set(allAnswers.filter(a => a !== null && a !== undefined))];
  if (uniqueAnswers.length === 1 && allAnswers.length >= 10) {
    results.isValid = false;
    results.patterns.push({
      type: 'all_same',
      description: `All ${allAnswers.length} aptitude answers are "${uniqueAnswers[0]}"`,
      severity: 'critical'
    });
    results.warnings.push(
      'Aptitude responses appear invalid - all answers are the same. ' +
      'This suggests the student clicked through without engaging with the questions.'
    );
  }

  // Pattern 2: Check each category for same answer
  Object.entries(categoryAnswers).forEach(([category, answers]) => {
    if (answers.length >= 5) {
      const uniqueInCategory = [...new Set(answers.filter(a => a !== null && a !== undefined))];
      const allSame = uniqueInCategory.length === 1;
      const percentSame = answers.filter(a => a === answers[0]).length / answers.length;

      results.categories[category] = {
        totalAnswers: answers.length,
        uniqueAnswers: uniqueInCategory.length,
        allSame,
        percentSame: Math.round(percentSame * 100),
        isValid: !allSame
      };

      if (allSame) {
        results.patterns.push({
          type: 'category_same',
          category,
          description: `All ${category} answers are "${uniqueInCategory[0]}"`,
          severity: 'high'
        });
      }
    }
  });

  // Pattern 3: Sequential pattern detection (A, B, C, D, A, B, C, D...)
  const sequentialPattern = detectSequentialPattern(allAnswers);
  if (sequentialPattern.isSequential) {
    results.patterns.push({
      type: 'sequential',
      description: sequentialPattern.description,
      severity: 'high'
    });
    if (!results.warnings.some(w => w.includes('invalid'))) {
      results.warnings.push(
        'Aptitude responses show a sequential pattern, suggesting random clicking.'
      );
    }
  }

  // Pattern 4: Too fast completion
  const aptitudeTime = sectionTimings.aptitude?.seconds || sectionTimings.aptitude || 0;
  const avgTimePerQuestion = aptitudeTime / Math.max(allAnswers.length, 1);
  
  if (aptitudeTime > 0 && avgTimePerQuestion < 2 && allAnswers.length >= 10) {
    results.patterns.push({
      type: 'too_fast',
      description: `Average ${avgTimePerQuestion.toFixed(1)}s per question (expected 15-30s)`,
      severity: 'medium'
    });
    results.warnings.push(
      `Aptitude section completed very quickly (${Math.round(aptitudeTime)}s for ${allAnswers.length} questions). ` +
      'Results may not reflect actual ability.'
    );
  }

  // Update overall validity
  if (results.patterns.some(p => p.severity === 'critical')) {
    results.isValid = false;
  }

  return results;
};

/**
 * Detect sequential patterns like A, B, C, D, A, B, C, D...
 */
const detectSequentialPattern = (answers) => {
  if (answers.length < 8) return { isSequential: false };

  // Check for common sequential patterns
  const patterns = [
    ['A', 'B', 'C', 'D'],
    ['D', 'C', 'B', 'A'],
    ['A', 'B', 'A', 'B'],
    ['1', '2', '3', '4'],
  ];

  for (const pattern of patterns) {
    let matches = 0;
    for (let i = 0; i < answers.length; i++) {
      if (answers[i] === pattern[i % pattern.length]) {
        matches++;
      }
    }
    const matchRate = matches / answers.length;
    if (matchRate > 0.8) {
      return {
        isSequential: true,
        description: `Answers follow pattern: ${pattern.join(', ')}... (${Math.round(matchRate * 100)}% match)`
      };
    }
  }

  return { isSequential: false };
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates and corrects assessment results
 * 
 * @param {Object} results - Full assessment results from AI
 * @param {Object} rawAnswers - Raw answers from the assessment
 * @param {Object} sectionTimings - Time spent on each section
 * @returns {Object} - Validated and corrected results with warnings
 */
export const validateAssessmentResults = (results, rawAnswers = {}, sectionTimings = {}) => {
  if (!results) return { results: null, warnings: [], isValid: false };

  const warnings = [];
  let correctedResults = { ...results };

  // 🔧 CRITICAL FIX: Preserve adaptive aptitude results if they exist
  // These might be in results or in rawAnswers
  if (!correctedResults.adaptiveAptitudeResults && !correctedResults.adaptive_aptitude_results) {
    if (rawAnswers.adaptive_aptitude_results) {
      correctedResults.adaptiveAptitudeResults = rawAnswers.adaptive_aptitude_results;
      correctedResults.adaptive_aptitude_results = rawAnswers.adaptive_aptitude_results;
    } else if (rawAnswers.adaptiveAptitudeResults) {
      correctedResults.adaptiveAptitudeResults = rawAnswers.adaptiveAptitudeResults;
      correctedResults.adaptive_aptitude_results = rawAnswers.adaptiveAptitudeResults;
    }
  }

  // 1. Validate and correct RIASEC topThree
  if (results.riasec) {
    const validatedRiasec = validateRiasecTopThree(results.riasec, results.gemini_results);
    correctedResults.riasec = validatedRiasec;
    
    if (!validatedRiasec._wasCorrect) {
      warnings.push({
        type: 'riasec_correction',
        message: `RIASEC code corrected from ${validatedRiasec._originalCode} to ${validatedRiasec.code}`,
        severity: 'info'
      });
    }
  }

  // 2. Detect aptitude patterns
  const aptitudePatterns = detectAptitudePatterns(rawAnswers.aptitude, sectionTimings);
  
  if (!aptitudePatterns.isValid) {
    warnings.push({
      type: 'aptitude_invalid',
      message: aptitudePatterns.warnings.join(' '),
      severity: 'critical',
      patterns: aptitudePatterns.patterns
    });

    // Add warning to results for display
    correctedResults._aptitudeWarning = {
      isValid: false,
      message: 'Aptitude scores may not reflect actual ability due to response patterns.',
      recommendation: 'Consider retaking the assessment with genuine effort on aptitude questions.',
      patterns: aptitudePatterns.patterns
    };
  }

  // 3. Validate stream recommendation for after10 students
  if (results.streamRecommendation?.isAfter10) {
    const streamRec = results.streamRecommendation;
    
    // Check if recommendation is based on invalid aptitude data
    if (!aptitudePatterns.isValid) {
      warnings.push({
        type: 'stream_recommendation_uncertain',
        message: 'Stream recommendation may be less accurate due to invalid aptitude data.',
        severity: 'warning'
      });

      // Add note to stream recommendation
      correctedResults.streamRecommendation = {
        ...streamRec,
        _aptitudeDataWarning: 'Aptitude data appears invalid. The "without Maths" or "with Maths" recommendation may not be accurate.',
        confidenceScore: Math.min(streamRec.confidenceScore || 70, 70) // Cap confidence at 70%
      };
    }
  }

  return {
    results: correctedResults,
    warnings,
    isValid: warnings.filter(w => w.severity === 'critical').length === 0,
    aptitudeValidation: aptitudePatterns
  };
};

export default {
  validateRiasecTopThree,
  detectAptitudePatterns,
  validateAssessmentResults
};
