/**
 * RIASEC Score Validator
 * Validates and corrects RIASEC scores from AI results
 * 
 * Issue: AI sometimes returns scores that exceed maximum possible values
 * Solution: Recalculate scores from actual answers
 */

/**
 * RIASEC scoring rules:
 * - Rating 1-2: 0 points
 * - Rating 3: 1 point
 * - Rating 4: 2 points
 * - Rating 5: 3 points
 * - 8 questions per type
 * - Maximum per type: 24 points (8 × 3)
 */
const RIASEC_MAX_SCORE_PER_TYPE = 24;
const RIASEC_QUESTIONS_PER_TYPE = 8;

/**
 * Calculate points from rating value
 */
const getRatingPoints = (rating) => {
  if (rating <= 2) return 0;
  if (rating === 3) return 1;
  if (rating === 4) return 2;
  if (rating === 5) return 3;
  return 0;
};

/**
 * Validate and correct RIASEC scores
 * @param {Object} riasecData - RIASEC data from gemini_results
 * @param {Object} allResponses - All student responses
 * @returns {Object} Corrected RIASEC data
 */
export const validateRiasecScores = (riasecData, allResponses) => {
  if (!riasecData || !allResponses) {
    console.warn('⚠️ Missing data for RIASEC score validation');
    return riasecData;
  }

  console.log('🔍 Validating RIASEC scores...');
  console.log('📊 Current scores:', riasecData.scores);
  console.log('📊 Current maxScore:', riasecData.maxScore);

  // Check if any score exceeds maximum
  const scores = riasecData.scores || {};
  const hasInvalidScores = Object.values(scores).some(score => score > RIASEC_MAX_SCORE_PER_TYPE);

  if (!hasInvalidScores && riasecData.maxScore === RIASEC_MAX_SCORE_PER_TYPE) {
    console.log('✅ RIASEC scores are valid - no changes needed');
    return riasecData;
  }

  console.log('⚠️ RIASEC scores need correction');

  // Extract RIASEC answers from all responses
  console.log('🔍 All response keys:', Object.keys(allResponses));
  
  const riasecAnswers = Object.entries(allResponses)
    .filter(([key]) => key.startsWith('riasec_') || key.match(/^[riasce]\d+$/i))
    .map(([key, value]) => ({
      question_id: key,
      rating: typeof value === 'number' ? value : parseInt(value) || 0
    }));

  console.log('📝 RIASEC answers found:', riasecAnswers.length);
  console.log('📝 Sample RIASEC answers:', riasecAnswers.slice(0, 5));

  // Recalculate scores from answers
  const correctedScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  riasecAnswers.forEach(answer => {
    // Extract RIASEC type from question ID
    // Format: riasec_r1, riasec_r2, riasec_i1, riasec_i2, etc.
    const match = answer.question_id.match(/^riasec_([riasce])\d+$/i);
    if (match) {
      const type = match[1].toUpperCase();
      const points = getRatingPoints(answer.rating);
      correctedScores[type] += points;
      console.log(`  ${answer.question_id}: rating=${answer.rating}, points=${points}, type=${type}`);
    }
  });

  console.log('✅ Corrected scores:', correctedScores);

  // Check if correction was needed
  const needsCorrection = Object.keys(correctedScores).some(type => {
    return scores[type] !== correctedScores[type];
  });

  if (needsCorrection) {
    console.log('⚠️ RIASEC scores were incorrect - applying corrections');
    
    const correctedData = {
      ...riasecData,
      scores: correctedScores,
      maxScore: RIASEC_MAX_SCORE_PER_TYPE,
      _corrected: true,
      _originalScores: scores
    };
    
    console.log('✅ Returning corrected RIASEC data:', correctedData);
    return correctedData;
  }

  // Just fix maxScore if needed
  if (riasecData.maxScore !== RIASEC_MAX_SCORE_PER_TYPE) {
    console.log('⚠️ Fixing maxScore from', riasecData.maxScore, 'to', RIASEC_MAX_SCORE_PER_TYPE);
    return {
      ...riasecData,
      maxScore: RIASEC_MAX_SCORE_PER_TYPE,
      _corrected: true
    };
  }

  return riasecData;
};

/**
 * Get RIASEC score summary for display
 */
export const getRiasecScoreSummary = (riasecData) => {
  if (!riasecData?.scores) return null;

  const scores = riasecData.scores;
  const maxScore = riasecData.maxScore || RIASEC_MAX_SCORE_PER_TYPE;
  
  const summary = Object.entries(scores).map(([type, score]) => ({
    type,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100)
  }));

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const totalMax = Object.keys(scores).length * maxScore;
  const overallPercentage = Math.round((totalScore / totalMax) * 100);

  return {
    categories: summary,
    overall: {
      score: totalScore,
      maxScore: totalMax,
      percentage: overallPercentage
    },
    wasCorrected: riasecData._corrected || false
  };
};
