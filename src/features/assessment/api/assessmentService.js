import { apiPost } from '@/shared/api/apiClient';
import { ssoClient } from '@/shared/api/ssoClient';
import { calculateStreamRecommendations } from '../lib/streamMatchingEngine';

const callAssessmentApi = async (action, params = {}) => {
  const response = await apiPost('/assessment/actions', { action, ...params });
  return response.data;
};

const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000, operationName = 'operation') => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for ${operationName} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt + 1}/${maxRetries + 1} failed for ${operationName}:`, error);
      if (error.code === 'PGRST116' || error.code === '23505' || error.code === '23503' ||
          error.message?.includes('JWT') || error.message?.includes('permission')) {
        console.error(`🚫 Non-retryable error for ${operationName}, aborting retries`);
        throw error;
      }
      if (attempt === maxRetries) {
        console.error(`💥 All retry attempts exhausted for ${operationName}`);
        throw error;
      }
    }
  }
  throw lastError;
};

export const validateStreamRecommendation = (results) => {
  if (results.gradeLevel !== 'after10') return results;

  try {
    console.log('🔍 Validating stream recommendation for After 10th learner...');

    const ruleBasedStream = calculateStreamRecommendations(
      { riasec: { scores: results.riasec?.scores || {} } },
      { subjectMarks: [], projects: [], experiences: [] }
    );

    const aiStream = results.streamRecommendation?.recommendedStream;
    const ruleStream = ruleBasedStream.recommendedStream;
    const ruleConfidence = ruleBasedStream.confidenceScore;

    if (!aiStream || aiStream === 'N/A' || aiStream === 'null' || aiStream === null) {
      console.warn('⚠️ streamRecommendation missing from AI response!');
      console.warn('   Generating from rule-based engine...');

      results.streamRecommendation = {
        ...ruleBasedStream,
        isAfter10: true,
        source: 'rule-based-fallback',
        reason: 'AI response did not include streamRecommendation',
        aiSuggestion: null
      };

      console.log('✅ Generated streamRecommendation:', results.streamRecommendation.recommendedStream);
      return results;
    }

    console.log('AI Recommendation:', aiStream);
    console.log('Rule-Based Recommendation:', ruleStream, `(${ruleConfidence}% confidence)`);

    if (aiStream !== ruleStream && ruleConfidence >= 75) {
      console.warn('⚠️ Stream recommendation mismatch detected!');
      console.warn('   AI suggested:', aiStream);
      console.warn('   Rule-based suggests:', ruleStream, `(${ruleConfidence}% confidence)`);

      if (ruleConfidence >= 80) {
        console.log('✅ Using rule-based recommendation due to high confidence');
        results.streamRecommendation = {
          ...results.streamRecommendation,
          ...ruleBasedStream,
          aiSuggestion: aiStream,
          source: 'rule-based-override',
          overrideReason: `Rule-based algorithm has ${ruleConfidence}% confidence vs AI suggestion`
        };
      } else {
        results.streamRecommendation = {
          ...results.streamRecommendation,
          ruleBasedAlternative: ruleStream,
          ruleBasedConfidence: ruleConfidence,
          source: 'ai-with-rule-based-alternative'
        };
      }
    } else {
      console.log('✅ AI and rule-based recommendations agree:', aiStream);
      results.streamRecommendation = {
        ...results.streamRecommendation,
        ruleBasedConfirmation: ruleStream,
        ruleBasedConfidence: ruleConfidence,
        source: 'ai-confirmed-by-rules'
      };
    }
  } catch (error) {
    console.error('❌ Error validating stream recommendation:', error);
  }

  return results;
};

const mapGradeLevelToDatabase = (gradeLevel) => {
  const mapping = { 'higher_secondary': 'highschool' };
  return mapping[gradeLevel] || gradeLevel;
};

export const fetchSections = async (gradeLevel = null) => {
  return callAssessmentApi('fetch-sections', { gradeLevel });
};

export const fetchStreams = async () => {
  return callAssessmentApi('fetch-streams');
};

export const fetchQuestionsBySection = async (sectionId, streamId = null) => {
  return callAssessmentApi('fetch-questions-by-section', { sectionId, streamId });
};

export const fetchAllQuestions = async (streamId, gradeLevel = null) => {
  const sections = await fetchSections(gradeLevel);
  const questionsBySection = {};

  for (const section of sections) {
    const isStreamSpecific = section.is_stream_specific;
    const questions = await fetchQuestionsBySection(
      section.id,
      isStreamSpecific ? streamId : null
    );
    questionsBySection[section.name] = {
      section,
      questions
    };
  }

  return questionsBySection;
};

export const createAttempt = async (learnerId, streamId, gradeLevel) => {
  return callAssessmentApi('create-attempt', { learnerId, streamId, gradeLevel });
};

export const updateAttemptProgress = async (attemptId, progress) => {
  if (!attemptId) {
    const error = new Error('Attempt ID is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  try {
    const data = await retryWithBackoff(async () => {
      return callAssessmentApi('update-attempt-progress', { attemptId, progress });
    }, 2, 500, 'fetch existing attempt data');

    const data2 = await retryWithBackoff(async () => {
      return callAssessmentApi('update-attempt-progress', { attemptId, progress });
    }, 3, 500, 'update attempt progress');

    console.log('✅ Progress updated successfully');
    return data2;
  } catch (error) {
    const enhancedError = new Error(`Failed to update progress: ${error.message}`);
    enhancedError.code = error.code || 'PROGRESS_UPDATE_FAILED';
    enhancedError.originalError = error;
    enhancedError.attemptId = attemptId;
    enhancedError.progress = progress;

    console.error('⚠️ Progress update failed:', enhancedError);
    console.error('⚠️ Assessment can continue, but progress may not be saved');

    throw enhancedError;
  }
};

export const saveAllResponses = async (attemptId, allResponses) => {
  try {
    const data = await callAssessmentApi('save-all-responses', { attemptId, allResponses });
    console.log('✅ All responses saved to database');
    return data;
  } catch (err) {
    console.error('Error in saveAllResponses:', err);
    throw err;
  }
};

export const updateAttemptAdaptiveSession = async (attemptId, adaptiveSessionId) => {
  try {
    console.log('🔗 [updateAttemptAdaptiveSession] Linking session to attempt via API:', {
      attemptId,
      adaptiveSessionId,
      timestamp: new Date().toISOString()
    });

    const token = ssoClient.getAccessToken();

    if (!token) {
      console.warn('⚠️ [updateAttemptAdaptiveSession] No auth token available');
      return null;
    }

    const response = await ssoClient.fetch('/api/adaptive-session/link-to-attempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

      },
      body: JSON.stringify({
        attemptId,
        sessionId: adaptiveSessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('⚠️ [updateAttemptAdaptiveSession] API call failed:', errorData);
      return null;
    }

    const result = await response.json();
    console.log('✅ [updateAttemptAdaptiveSession] Successfully linked session to attempt');
    console.log('✅ [updateAttemptAdaptiveSession] Result:', result);
    return result.attempt;
  } catch (err) {
    console.warn('⚠️ [updateAttemptAdaptiveSession] Error calling API:', err.message);
    console.warn('⚠️ [updateAttemptAdaptiveSession] Error details:', err);
    return null;
  }
};

export const saveResponse = async (attemptId, questionId, responseValue, isCorrect = null) => {
  if (!attemptId) {
    const error = new Error('Attempt ID is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  if (!questionId) {
    const error = new Error('Question ID is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  let sanitizedValue = responseValue;

  if (responseValue === null || responseValue === undefined) {
    sanitizedValue = '';
  } else if (Array.isArray(responseValue) && responseValue.length === 0) {
    sanitizedValue = [];
  }

  console.log('💾 Saving response:', {
    attemptId,
    questionId,
    originalValue: responseValue,
    sanitizedValue,
    valueType: typeof sanitizedValue,
    isCorrect
  });

  try {
    const data = await retryWithBackoff(async () => {
      return callAssessmentApi('save-response', { attemptId, questionId, responseValue: sanitizedValue, isCorrect });
    }, 3, 500, `save response for question ${questionId}`);

    console.log('✅ Response saved successfully');
    return data;
  } catch (error) {
    const enhancedError = new Error(`Failed to save response: ${error.message}`);
    enhancedError.code = error.code || 'RESPONSE_SAVE_FAILED';
    enhancedError.originalError = error;
    enhancedError.attemptId = attemptId;
    enhancedError.questionId = questionId;
    enhancedError.responseValue = sanitizedValue;
    throw enhancedError;
  }
};

export const getAttemptResponses = async (attemptId) => {
  return callAssessmentApi('get-attempt-responses', { attemptId });
};

const validateRIASECScores = (riasecScores) => {
  if (!riasecScores || typeof riasecScores !== 'object') {
    return { isValid: true, warning: null };
  }

  const scores = Object.values(riasecScores);
  if (scores.length === 0) {
    return { isValid: true, warning: null };
  }

  const uniqueScores = new Set(scores);
  if (uniqueScores.size === 1) {
    const equalValue = scores[0];
    return {
      isValid: false,
      warning: `All RIASEC scores are equal (${equalValue}). This may indicate an extraction or calculation error.`
    };
  }

  return { isValid: true, warning: null };
};

const validateAptitudeScores = (aptitudeScores) => {
  if (!aptitudeScores || typeof aptitudeScores !== 'object') {
    return { isValid: true, warning: null };
  }

  const categories = Object.values(aptitudeScores);
  if (categories.length === 0) {
    return { isValid: true, warning: null };
  }

  const allZero = categories.every(category => {
    return category && category.correct === 0;
  });

  if (allZero) {
    return {
      isValid: false,
      warning: 'All aptitude scores show 0 correct answers. This may indicate an extraction or scoring error.'
    };
  }

  return { isValid: true, warning: null };
};

export const completeAttempt = async (attemptId, learnerId, streamId, gradeLevel, geminiResults, sectionTimings) => {
  console.log('=== completeAttempt Debug ===');
  console.log('Grade Level:', gradeLevel);
  console.log('Learner ID:', learnerId);
  console.log('Stream ID:', streamId);
  console.log('Has geminiResults:', !!geminiResults);

  const isSimplifiedAssessment = gradeLevel === 'middle' || gradeLevel === 'highschool';

  const requiredFields = isSimplifiedAssessment
    ? ['riasec', 'characterStrengths', 'learningStyle', 'careerFit']
    : ['riasec', 'aptitude', 'bigFive', 'workValues', 'employability', 'knowledge', 'careerFit', 'skillGap', 'roadmap'];

  const missingFields = requiredFields.filter(field => !geminiResults[field]);

  if (missingFields.length > 0) {
    console.error('❌ CRITICAL: AI returned incomplete data!');
    console.error('❌ Missing required fields:', missingFields);
    throw new Error(
      `AI analysis incomplete. Missing ${missingFields.length} required fields: ${missingFields.join(', ')}. ` +
      `Please try again or contact support if the issue persists.`
    );
  }

  const nestedValidation = isSimplifiedAssessment
    ? [
        { path: 'careerFit.clusters', value: geminiResults.careerFit?.clusters },
        { path: 'roadmap.projects', value: geminiResults.roadmap?.projects }
      ]
    : [
        { path: 'workValues.scores', value: geminiResults.workValues?.scores },
        { path: 'employability.skillScores', value: geminiResults.employability?.skillScores },
        { path: 'employability.overallReadiness', value: geminiResults.employability?.overallReadiness },
        { path: 'careerFit.clusters', value: geminiResults.careerFit?.clusters },
        { path: 'skillGap.priorityA', value: geminiResults.skillGap?.priorityA },
        { path: 'roadmap.projects', value: geminiResults.roadmap?.projects }
      ];

  const missingNested = nestedValidation.filter(v => !v.value).map(v => v.path);

  if (missingNested.length > 0) {
    console.error('❌ CRITICAL: AI returned incomplete nested data!');
    console.error('❌ Missing nested fields:', missingNested);
    throw new Error(
      `AI analysis incomplete. Missing nested fields: ${missingNested.join(', ')}. ` +
      `Please try again or contact support if the issue persists.`
    );
  }

  const riasecScoresRaw = geminiResults?.riasec?.scores || null;

  let riasecScores = riasecScoresRaw;

  if (riasecScoresRaw && Object.values(riasecScoresRaw).every(v => v === 0)) {
    console.warn('⚠️ [completeAttempt] RIASEC scores are all zeros, checking backup fields...');

    if (geminiResults?.riasec?._preservedScores && !Object.values(geminiResults.riasec._preservedScores).every(v => v === 0)) {
      riasecScores = geminiResults.riasec._preservedScores;
      console.log('✅ Using _preservedScores:', riasecScores);
    } else if (geminiResults?.riasec?._scoreBackup && !Object.values(geminiResults.riasec._scoreBackup).every(v => v === 0)) {
      riasecScores = geminiResults.riasec._scoreBackup;
      console.log('✅ Using _scoreBackup:', riasecScores);
    } else if (geminiResults?.riasec?._originalScores && !Object.values(geminiResults.riasec._originalScores).every(v => v === 0)) {
      riasecScores = geminiResults.riasec._originalScores;
      console.log('✅ Using _originalScores:', riasecScores);
    } else {
      console.error('❌ All RIASEC score fields are zeros!');
    }
  }

  const riasecValidation = validateRIASECScores(riasecScores);
  if (!riasecValidation.isValid) {
    console.warn('⚠️ RIASEC VALIDATION WARNING:', riasecValidation.warning);
  }

  const aptitudeValidation = validateAptitudeScores(geminiResults?.aptitude?.scores);
  if (!aptitudeValidation.isValid) {
    console.warn('⚠️ APTITUDE VALIDATION WARNING:', aptitudeValidation.warning);
  }

  geminiResults.riasec = {
    ...geminiResults.riasec,
    scores: riasecScores,
  };

  console.log('📝 === Calling backend complete-attempt ===');

  const results = await callAssessmentApi('complete-attempt', {
    attemptId,
    learnerId,
    streamId,
    gradeLevel,
    geminiResults,
    sectionTimings,
  });

  console.log('✅✅✅ Results saved successfully via backend!');
  return results;
};

export const getlearnerAttempts = async (learnerId) => {
  return callAssessmentApi('get-learner-attempts', { learnerId });
};

export const getAttemptWithResults = async (attemptId) => {
  return callAssessmentApi('get-attempt-with-results', { attemptId });
};

export const getLatestResult = async (learnerIdOrUserId) => {
  if (!learnerIdOrUserId) {
    console.warn('getLatestResult: No learner ID provided');
    return null;
  }

  return callAssessmentApi('get-latest-result', { learnerId: learnerIdOrUserId });
};

export const canTakeAssessment = async (learnerId, gradeLevel = null) => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  if (isDevelopment) {
    console.log('🔧 Development mode: Assessment 6-month restriction bypassed');
    return { canTake: true, lastAttemptDate: null, nextAvailableDate: null, devBypass: true };
  }

  return callAssessmentApi('can-take-assessment', { learnerId });
};

export const getInProgressAttempt = async (learnerIdOrUserId) => {
  if (!learnerIdOrUserId) {
    console.warn('getInProgressAttempt: No learner ID provided');
    return null;
  }

  const validateAttemptStructure = (attempt) => {
    if (!attempt) return false;

    const requiredFields = [
      'id', 'learner_id', 'stream_id', 'grade_level', 'status',
      'created_at', 'current_section_index', 'current_question_index'
    ];

    for (const field of requiredFields) {
      if (attempt[field] === undefined || attempt[field] === null) {
        console.error(`❌ Validation failed: Missing required field '${field}'`);
        return false;
      }
    }

    if (typeof attempt.id !== 'string') {
      console.error('❌ Validation failed: id must be a string (UUID)');
      return false;
    }

    if (typeof attempt.learner_id !== 'string') {
      console.error('❌ Validation failed: learner_id must be a string (UUID)');
      return false;
    }

    if (typeof attempt.stream_id !== 'string') {
      console.error('❌ Validation failed: stream_id must be a string (UUID)');
      return false;
    }

    if (typeof attempt.grade_level !== 'string') {
      console.error('❌ Validation failed: grade_level must be a string');
      return false;
    }

    if (attempt.status !== 'in_progress') {
      console.error(`❌ Validation failed: status must be 'in_progress', got '${attempt.status}'`);
      return false;
    }

    if (typeof attempt.current_section_index !== 'number') {
      console.error('❌ Validation failed: current_section_index must be a number');
      return false;
    }

    if (typeof attempt.current_question_index !== 'number') {
      console.error('❌ Validation failed: current_question_index must be a number');
      return false;
    }

    console.log('✅ Attempt structure validation passed');
    return true;
  };

  const hasProgress = (attempt) => {
    if (!attempt) return false;

    if (attempt.responses && attempt.responses.length > 0) {
      return true;
    }

    if (attempt.all_responses && typeof attempt.all_responses === 'object') {
      const keys = Object.keys(attempt.all_responses);
      const answerKeys = keys.filter(k =>
        !k.startsWith('_') && k !== 'adaptive_aptitude_results'
      );
      if (answerKeys.length > 0) {
        return true;
      }
    }

    if (attempt.adaptive_aptitude_session_id) {
      return true;
    }

    return false;
  };

  const fetchAdaptiveProgress = async (sessionId) => {
    if (!sessionId) return null;

    try {
      const response = await callAssessmentApi('get-adaptive-session-status', { sessionId });

      if (!response) {
        console.warn('Could not fetch adaptive session progress');
        return null;
      }

      return {
        questionsAnswered: response.questions_answered || 0,
        currentQuestionIndex: response.current_question_index || 0,
        status: response.status,
        currentPhase: response.current_phase
      };
    } catch (err) {
      console.warn('Error fetching adaptive progress:', err);
      return null;
    }
  };

  const attemptData = await callAssessmentApi('get-in-progress-attempt', { learnerId: learnerIdOrUserId });

  if (attemptData) {
    console.log('✅ Found in-progress attempt:', attemptData.id);

    if (!validateAttemptStructure(attemptData)) {
      console.error('❌ Attempt failed validation, returning null');
      return null;
    }

    if (hasProgress(attemptData)) {
      console.log('✅ Attempt has progress, returning it');

      if (attemptData.adaptive_aptitude_session_id) {
        const adaptiveProgress = await fetchAdaptiveProgress(attemptData.adaptive_aptitude_session_id);
        if (adaptiveProgress) {
          attemptData.adaptiveProgress = adaptiveProgress;
          console.log('📊 Adaptive progress:', adaptiveProgress);
        }
      }

      return attemptData;
    } else {
      console.log('🗑️ Found empty in-progress attempt, abandoning:', attemptData.id);
      try {
        await abandonAttempt(attemptData.id);
      } catch (abandonErr) {
        console.warn('Could not abandon empty attempt:', abandonErr);
      }
      return null;
    }
  }

  return null;
};

export const abandonAttempt = async (attemptId) => {
  const response = await callAssessmentApi('update-attempt-progress', {
    attemptId,
    progress: { status: 'abandoned' }
  });
  return response;
};

export const calculateAptitudeScores = (answers, questions) => {
  console.log('🧮 Calculating aptitude scores...');
  console.log('📝 Answers count:', answers?.length);
  console.log('❓ Questions count:', questions?.length);

  if (!answers || !questions || answers.length === 0 || questions.length === 0) {
    console.warn('⚠️ Missing answers or questions for aptitude scoring');
    return {
      verbal: { correct: 0, total: 0, percentage: 0 },
      numerical: { correct: 0, total: 0, percentage: 0 },
      abstract: { correct: 0, total: 0, percentage: 0 },
      spatial: { correct: 0, total: 0, percentage: 0 },
      clerical: { correct: 0, total: 0, percentage: 0 }
    };
  }

  const questionMap = new Map();
  questions.forEach(q => {
    questionMap.set(q.id, {
      correct_answer: q.correct_answer,
      subtype: q.category || q.dimension || 'verbal'
    });
  });

  const categoryMap = {
    'mathematics': 'numerical', 'math': 'numerical', 'numerical_reasoning': 'numerical',
    'numerical': 'numerical', 'verbal_reasoning': 'verbal', 'verbal': 'verbal',
    'logical_reasoning': 'abstract', 'logical': 'abstract', 'abstract': 'abstract',
    'spatial_reasoning': 'spatial', 'spatial': 'spatial', 'clerical_speed': 'clerical',
    'clerical': 'clerical', 'data_interpretation': 'numerical', 'english': 'verbal',
    'science': 'abstract', 'social_studies': 'verbal', 'history': 'verbal',
    'geography': 'spatial', 'civics': 'verbal', 'economics': 'numerical',
    'general_knowledge': 'verbal', 'reasoning': 'abstract', 'aptitude': 'numerical'
  };

  const scoresByCategory = {
    verbal: { correct: 0, total: 0, details: [] },
    numerical: { correct: 0, total: 0, details: [] },
    abstract: { correct: 0, total: 0, details: [] },
    spatial: { correct: 0, total: 0, details: [] },
    clerical: { correct: 0, total: 0, details: [] }
  };

  answers.forEach(answer => {
    const questionDetails = questionMap.get(answer.question_id);
    if (questionDetails) {
      const rawCategory = questionDetails.subtype.toLowerCase();
      const category = categoryMap[rawCategory] || 'verbal';

      scoresByCategory[category].total++;

      const isCorrect = answer.selected_answer === questionDetails.correct_answer;
      if (isCorrect) {
        scoresByCategory[category].correct++;
      }

      scoresByCategory[category].details.push({
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        correct_answer: questionDetails.correct_answer,
        is_correct: isCorrect
      });
    }
  });

  Object.keys(scoresByCategory).forEach(category => {
    const scores = scoresByCategory[category];
    scores.percentage = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
  });

  console.log(`✅ Aptitude scores by category:`, scoresByCategory);

  return {
    verbal: { correct: scoresByCategory.verbal.correct, total: scoresByCategory.verbal.total, percentage: scoresByCategory.verbal.percentage },
    numerical: { correct: scoresByCategory.numerical.correct, total: scoresByCategory.numerical.total, percentage: scoresByCategory.numerical.percentage },
    abstract: { correct: scoresByCategory.abstract.correct, total: scoresByCategory.abstract.total, percentage: scoresByCategory.abstract.percentage },
    spatial: { correct: scoresByCategory.spatial.correct, total: scoresByCategory.spatial.total, percentage: scoresByCategory.spatial.percentage },
    clerical: { correct: scoresByCategory.clerical.correct, total: scoresByCategory.clerical.total, percentage: scoresByCategory.clerical.percentage }
  };
};

export const calculateKnowledgeScores = (answers, questions) => {
  console.log('🧮 Calculating knowledge scores...');
  console.log('📝 Answers count:', answers?.length);
  console.log('❓ Questions count:', questions?.length);

  if (!answers || !questions || answers.length === 0 || questions.length === 0) {
    console.warn('⚠️ Missing answers or questions for knowledge scoring');
    return { correct: 0, total: 0, percentage: 0 };
  }

  const questionMap = new Map();
  questions.forEach(q => {
    questionMap.set(q.id, q.correct_answer);
  });

  let correct = 0;
  let total = 0;

  answers.forEach(answer => {
    const correctAnswer = questionMap.get(answer.question_id);
    if (correctAnswer !== undefined) {
      total++;
      if (answer.selected_answer === correctAnswer) {
        correct++;
      }
    }
  });

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  console.log(`✅ Knowledge: ${correct}/${total} correct (${percentage}%)`);

  return {
    correct,
    total,
    percentage,
    details: answers.map(answer => ({
      question_id: answer.question_id,
      selected_answer: answer.selected_answer,
      correct_answer: questionMap.get(answer.question_id),
      is_correct: answer.selected_answer === questionMap.get(answer.question_id)
    }))
  };
};

export const completeAttemptWithoutAI = async (attemptId, learnerId, streamId, gradeLevel, sectionTimings) => {
  console.log('=== completeAttemptWithoutAI ===');
  console.log('Grade Level:', gradeLevel);
  console.log('Learner ID:', learnerId);
  console.log('Stream ID:', streamId);
  console.log('Attempt ID:', attemptId);

  if (!attemptId) {
    const error = new Error('Attempt ID is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  if (!learnerId) {
    const error = new Error('Learner ID is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  let adaptiveSessionId = null;
  try {
    adaptiveSessionId = await retryWithBackoff(async () => {
      const response = await callAssessmentApi('get-attempt-data', { attemptId });

      if (response?.adaptive_aptitude_session_id) {
        console.log('✅ Found adaptive session ID in column:', response.adaptive_aptitude_session_id);
        return response.adaptive_aptitude_session_id;
      }

      const adaptiveResults = response?.all_responses?.adaptive_aptitude_results;
      const sessionId = adaptiveResults?.sessionId || adaptiveResults?.session_id || null;

      if (sessionId) {
        console.log('✅ Found adaptive aptitude session ID in all_responses:', sessionId);
      } else {
        console.log('📊 No adaptive aptitude session found in attempt');
      }

      return sessionId;
    }, 2, 500, 'fetch adaptive session ID');
  } catch (err) {
    console.warn('⚠️ Could not fetch adaptive session ID (non-critical):', err.message);
  }

  const geminiResults = {
    riasec: null, aptitude: null, bigFive: null, workValues: null,
    employability: null, knowledge: null, careerFit: null, skillGap: null,
    roadmap: null, profileSnapshot: null, timingAnalysis: null, finalNote: null,
    overallSummary: null, skillGapCourses: null, platformCourses: null, coursesByType: null,
  };

  try {
    const results = await callAssessmentApi('complete-attempt', {
      attemptId,
      learnerId,
      streamId,
      gradeLevel,
      geminiResults,
      sectionTimings,
    });

    console.log('✅ Minimal result saved successfully:', results.id);
    return results;
  } catch (error) {
    console.error('💥 CRITICAL: Failed to create result record:', error);
    const enhancedError = new Error(`Failed to save assessment results: ${error.message}`);
    enhancedError.code = 'RESULT_INSERT_FAILED';
    enhancedError.originalError = error;
    enhancedError.attemptId = attemptId;
    throw enhancedError;
  }
};

export const saveAptitudeScores = async (attemptId, scores) => {
  try {
    console.log('💾 Saving aptitude scores to attempt:', attemptId);
    const data = await callAssessmentApi('update-attempt-progress', {
      attemptId,
      progress: { aptitudeScores: scores },
    });
    console.log('✅ Aptitude scores saved successfully');
    return data;
  } catch (error) {
    console.error('❌ Failed to save aptitude scores:', error);
    throw error;
  }
};

export const saveKnowledgeScores = async (attemptId, scores) => {
  try {
    console.log('💾 Saving knowledge scores to attempt:', attemptId);
    const data = await callAssessmentApi('update-attempt-progress', {
      attemptId,
      progress: { knowledgeScores: scores },
    });
    console.log('✅ Knowledge scores saved successfully');
    return data;
  } catch (error) {
    console.error('❌ Failed to save knowledge scores:', error);
    throw error;
  }
};

export default {
  fetchSections,
  fetchStreams,
  fetchQuestionsBySection,
  fetchAllQuestions,
  createAttempt,
  updateAttemptProgress,
  saveResponse,
  saveAllResponses,
  getAttemptResponses,
  completeAttempt,
  completeAttemptWithoutAI,
  getlearnerAttempts,
  getAttemptWithResults,
  getLatestResult,
  getInProgressAttempt,
  abandonAttempt,
  canTakeAssessment,
  calculateAptitudeScores,
  calculateKnowledgeScores,
  saveAptitudeScores,
  saveKnowledgeScores
};
