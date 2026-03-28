/**
 * Aptitude Score Validator
 * Validates and corrects aptitude scores from AI results
 * 
 * Issue: AI sometimes returns incorrect question counts and scores
 * Solution: Recalculate scores from actual answers and questions
 */

/**
 * Validate and correct aptitude scores
 * @param {Object} aptitudeData - Aptitude data from gemini_results
 * @param {Object} allResponses - All student responses
 * @param {Array} questions - Array of aptitude questions
 * @returns {Object} Corrected aptitude data
 */
export const validateAptitudeScores = (aptitudeData, allResponses, questions) => {
  if (!aptitudeData || !allResponses || !questions || questions.length === 0) {
    console.warn('⚠️ Missing data for aptitude score validation');
    return aptitudeData;
  }

  console.log('🔍 Validating aptitude scores...');
  console.log('📊 Current scores:', aptitudeData.scores);
  console.log('❓ Questions available:', questions.length);

  // Extract aptitude answers from all responses
  const aptitudeAnswers = Object.entries(allResponses)
    .filter(([key]) => key.startsWith('aptitude_'))
    .map(([key, value]) => ({
      question_id: key.replace('aptitude_', ''),
      selected_answer: value
    }));

  console.log('📝 Aptitude answers found:', aptitudeAnswers.length);

  // Create question map
  const questionMap = new Map();
  questions.forEach(q => {
    questionMap.set(q.id, {
      correct_answer: q.correct_answer || q.correct,
      category: (q.subtype || q.category || 'verbal').toLowerCase()
    });
  });

  // Category mapping
  const categoryMap = {
    'verbal': 'verbal',
    'verbal_reasoning': 'verbal',
    'numerical': 'numerical',
    'numerical_reasoning': 'numerical',
    'numerical_ability': 'numerical',
    'abstract': 'abstract',
    'abstract_reasoning': 'abstract',
    'logical': 'abstract',
    'logical_reasoning': 'abstract',
    'spatial': 'spatial',
    'spatial_reasoning': 'spatial',
    'clerical': 'clerical',
    'clerical_speed': 'clerical'
  };

  // Initialize corrected scores
  const correctedScores = {
    verbal: { correct: 0, total: 0, percentage: 0 },
    numerical: { correct: 0, total: 0, percentage: 0 },
    abstract: { correct: 0, total: 0, percentage: 0 },
    spatial: { correct: 0, total: 0, percentage: 0 },
    clerical: { correct: 0, total: 0, percentage: 0 }
  };

  // Calculate scores from actual answers
  aptitudeAnswers.forEach(answer => {
    const question = questionMap.get(answer.question_id);
    if (question) {
      const rawCategory = question.category;
      const category = categoryMap[rawCategory] || 'verbal';
      
      correctedScores[category].total++;
      
      // Match answer with correct answer
      const isCorrect = matchAnswer(answer.selected_answer, question.correct_answer);
      if (isCorrect) {
        correctedScores[category].correct++;
      }
    }
  });

  // Calculate percentages
  Object.keys(correctedScores).forEach(category => {
    const scores = correctedScores[category];
    scores.percentage = scores.total > 0 
      ? Math.round((scores.correct / scores.total) * 100) 
      : 0;
  });

  // Calculate overall score
  const totalCorrect = Object.values(correctedScores).reduce((sum, s) => sum + s.correct, 0);
  const totalQuestions = Object.values(correctedScores).reduce((sum, s) => sum + s.total, 0);
  const overallScore = totalQuestions > 0 
    ? Math.round((totalCorrect / totalQuestions) * 100) 
    : 0;

  console.log('✅ Corrected scores:', correctedScores);
  console.log(`📊 Overall: ${totalCorrect}/${totalQuestions} = ${overallScore}%`);

  // Check if correction was needed
  const needsCorrection = Object.keys(correctedScores).some(category => {
    const current = aptitudeData.scores?.[category];
    const corrected = correctedScores[category];
    return current?.total !== corrected.total || 
           current?.correct !== corrected.correct;
  });

  if (needsCorrection) {
    console.log('⚠️ Aptitude scores were incorrect - applying corrections');
    
    // Return corrected data
    return {
      ...aptitudeData,
      scores: correctedScores,
      overallScore: overallScore,
      _corrected: true,
      _originalScores: aptitudeData.scores
    };
  }

  console.log('✅ Aptitude scores are correct - no changes needed');
  return aptitudeData;
};

/**
 * Match student answer with correct answer
 * Handles different answer formats (Option A, A, full text, etc.)
 */
const matchAnswer = (studentAnswer, correctAnswer) => {
  if (!studentAnswer || !correctAnswer) return false;

  // Normalize answers
  const normalize = (str) => {
    if (typeof str !== 'string') return String(str).toLowerCase().trim();
    return str.toLowerCase().trim();
  };

  const student = normalize(studentAnswer);
  const correct = normalize(correctAnswer);

  // Direct match
  if (student === correct) return true;

  // Option format matching (e.g., "Option A" vs "A")
  if (correct.startsWith('option ')) {
    const optionLetter = correct.replace('option ', '');
    if (student === optionLetter) return true;
    // Also check if student answer starts with the option letter
    if (student.startsWith(optionLetter)) return true;
  }

  if (student.startsWith('option ')) {
    const optionLetter = student.replace('option ', '');
    if (optionLetter === correct) return true;
    // Also check if correct answer starts with the option letter
    if (correct.startsWith(optionLetter)) return true;
  }

  // Extract option letters (A, B, C, D) from both answers
  const extractOptionLetter = (str) => {
    const match = str.match(/^([a-d])[:\.\)\s]|option\s+([a-d])/i);
    return match ? (match[1] || match[2]).toLowerCase() : null;
  };

  const studentOption = extractOptionLetter(student);
  const correctOption = extractOptionLetter(correct);

  if (studentOption && correctOption && studentOption === correctOption) {
    return true;
  }

  // Check if one is a substring of the other (for full text answers)
  if (student.length > 10 && correct.length > 10) {
    if (student.includes(correct) || correct.includes(student)) {
      return true;
    }
  }

  return false;
};

/**
 * Get aptitude score summary for display
 */
export const getAptitudeScoreSummary = (aptitudeData) => {
  if (!aptitudeData?.scores) return null;

  const scores = aptitudeData.scores;
  const categories = ['verbal', 'numerical', 'abstract', 'spatial', 'clerical'];
  
  const summary = categories.map(category => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    correct: scores[category]?.correct || 0,
    total: scores[category]?.total || 0,
    percentage: scores[category]?.percentage || 0
  }));

  const totalCorrect = summary.reduce((sum, s) => sum + s.correct, 0);
  const totalQuestions = summary.reduce((sum, s) => sum + s.total, 0);
  const overallPercentage = totalQuestions > 0 
    ? Math.round((totalCorrect / totalQuestions) * 100) 
    : 0;

  return {
    categories: summary,
    overall: {
      correct: totalCorrect,
      total: totalQuestions,
      percentage: overallPercentage
    },
    wasCorrected: aptitudeData._corrected || false
  };
};
