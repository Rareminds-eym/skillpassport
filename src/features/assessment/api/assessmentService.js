import { ssoClient } from '@/shared/api/ssoClient';
import { apiGet } from '@/shared/api/apiClient';
import { retryClusterGeneration, completeAttempt as finalizeOwnReport } from './assessmentApiService';
/**
 * Assessment Service
 * Handles all database operations for the assessment system
 */

import { supabase } from '@/shared/api/supabaseClient';
import {getOwnAssessmentLearner} from './learnerContext';
import {fetchOwnAssessmentRecord, fetchOwnAssessmentPages, patchOwnAssessment, saveOwnAssessmentResponse, createOwnAssessmentAttempt} from './assessmentRecords';
import { calculateStreamRecommendations } from '../lib/streamMatchingEngine';

/**
 * Validate and enhance stream recommendation for After 10th learners
 * Uses rule-based engine to verify AI recommendation
 */
export const validateStreamRecommendation = (results) => {
  if (results.gradeLevel !== 'after10') return results;

  try {
    console.log('🔍 Validating stream recommendation for After 10th learner...');

    // Calculate rule-based recommendation
    const ruleBasedStream = calculateStreamRecommendations(
      { riasec: { scores: results.riasec?.scores || {} } },
      { subjectMarks: [], projects: [], experiences: [] }
    );

    const aiStream = results.streamRecommendation?.recommendedStream;
    const ruleStream = ruleBasedStream.recommendedStream;
    const ruleConfidence = ruleBasedStream.confidenceScore;

    // If streamRecommendation is missing or invalid, generate it from rule-based engine
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

    // If AI and rule-based differ significantly, use rule-based if confidence is high
    if (aiStream !== ruleStream && ruleConfidence >= 75) {
      console.warn('⚠️ Stream recommendation mismatch detected!');
      console.warn('   AI suggested:', aiStream);
      console.warn('   Rule-based suggests:', ruleStream, `(${ruleConfidence}% confidence)`);

      // Use rule-based if confidence is high
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
        // Add rule-based as alternative
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
    // Continue with AI recommendation if validation fails
  }

  return results;
};

/**
 * Map grade levels to their database equivalents
 * Some UI grade levels share the same database sections
 */
const mapGradeLevelToDatabase = (gradeLevel) => {
  const mapping = {
    'higher_secondary': 'highschool', // Grades 11-12 use high school sections
    // Add more mappings as needed
  };
  return mapping[gradeLevel] || gradeLevel;
};

/**
 * Fetch all assessment sections
 * @param {string} gradeLevel - Grade level filter: 'middle', 'highschool', 'higher_secondary', or 'after12'
 */
export const fetchSections = async (gradeLevel = null) => {
  let query = supabase
    .from('personal_assessment_sections')
    .select('*')
    .eq('is_active', true);

  // Filter by grade level if provided (with mapping)
  if (gradeLevel) {
    const dbGradeLevel = mapGradeLevelToDatabase(gradeLevel);
    query = query.eq('grade_level', dbGradeLevel);
  }

  const { data, error } = await query.order('order_number');

  if (error) throw error;
  return data;
};

/**
 * Fetch all available streams
 */
export const fetchStreams = async () => {
  const { data, error } = await supabase
    .from('personal_assessment_streams')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data;
};

/**
 * Fetch questions for a specific section
 * @param {string} sectionId - Section UUID
 * @param {string} streamId - Stream ID (only needed for knowledge section)
 */
export const fetchQuestionsBySection = async (sectionId, streamId = null, attemptId = null) => {
  const params = new URLSearchParams({ sectionId });
  if (streamId) params.set('streamId', streamId);
  if (attemptId) params.set('attemptId', attemptId);
  const response = await apiGet(`/assessment-catalog?${params}`);
  if (!Array.isArray(response.questions)) throw new Error('Assessment question delivery unavailable');
  return response.questions;
};

/**
 * Fetch all questions for an assessment (organized by section)
 * @param {string} streamId - Learner's selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 */
export const fetchAllQuestions = async (streamId, gradeLevel = null, attemptId = null) => {
  const sections = await fetchSections(gradeLevel);
  const questionsBySection = {};

  for (const section of sections) {
    const isStreamSpecific = section.is_stream_specific;
    const questions = await fetchQuestionsBySection(
      section.id,
      isStreamSpecific ? streamId : null,
      attemptId
    );
    questionsBySection[section.name] = {
      section,
      questions
    };
  }

  return questionsBySection;
};

/**
 * Create a new assessment attempt
 * @param {string} learnerId - Own learner row ID or SSO subject assertion; server derives ownership
 * @param {string|null} streamId - Selected stream, nullable for stream-independent assessments
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 */
export const createAttempt = async (learnerId, streamId, gradeLevel) =>
  createOwnAssessmentAttempt(learnerId, streamId, gradeLevel);

/**
 * Update attempt progress
 * @param {string} attemptId - Attempt UUID
 * @param {object} progress - Progress data including timerRemaining for timed sections and elapsedTime for non-timed
 */
/**
 * Update assessment attempt progress (industrial-grade error handling)
 * @param {string} attemptId - Attempt UUID
 * @param {object} progress - Progress data including timerRemaining for timed sections and elapsedTime for non-timed
 * @returns {Promise<object>} Updated attempt data
 */
export const updateAttemptProgress = async (attemptId, progress) => patchOwnAssessment(attemptId, progress);

/**
 * Save all responses to the attempt (for non-UUID questions)
 * This is used for RIASEC, BigFive, Values, Employability questions that have string IDs
 * @param {string} attemptId - Attempt UUID
 * @param {object} allResponses - All responses object { "riasec_r1": 4, "bigfive_o1": 3, ... }
 */
export const saveAllResponses = async (attemptId, allResponses) => patchOwnAssessment(attemptId, {allResponses});

/**
 * Update the adaptive aptitude session ID for an attempt
 * @param {string} attemptId - Attempt UUID
 * @param {string} adaptiveSessionId - Adaptive aptitude session UUID
 */
export const updateAttemptAdaptiveSession = async (attemptId, adaptiveSessionId) => {
  try {
    console.log('🔗 [updateAttemptAdaptiveSession] Linking session to attempt via API:', {
      attemptId,
      adaptiveSessionId,
      timestamp: new Date().toISOString()
    });

    // Get auth token
    const token = ssoClient.getAccessToken();

    if (!token) {
      console.warn('⚠️ [updateAttemptAdaptiveSession] No auth token available');
      return null;
    }

    // Call the API endpoint to link session (uses admin client to bypass RLS)
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

/**
 * Save a response to a question
 * @param {string} attemptId - Attempt UUID
 * @param {string} questionId - Question UUID
 * @param {any} responseValue - The response value (can be number, string, or object)
 * @param {boolean} isCorrect - Whether the answer is correct (for MCQ)
 */
/**
 * Save a response to a question (industrial-grade error handling)
 * @param {string} attemptId - Attempt UUID
 * @param {string} questionId - Question UUID
 * @param {any} responseValue - Response value
 * @param {boolean} isCorrect - Whether the answer is correct (for MCQ)
 * @returns {Promise<object>} Saved response data
 */
export const saveResponse = async (attemptId, questionId, responseValue, isCorrect = null) => {
  if (!attemptId || !questionId) {
    const error = new Error(!attemptId ? 'Attempt ID is required' : 'Question ID is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  // Preserve legacy empty answers. Correctness is server-owned; the old positional
  // argument remains only for caller compatibility and is never sent or stored.
  const sanitizedValue = responseValue == null ? '' : responseValue;
  return saveOwnAssessmentResponse(attemptId, questionId, sanitizedValue);
};

/**
 * Get all responses for an attempt
 * @param {string} attemptId - Attempt UUID
 */
export const getAttemptResponses = async (attemptId) => {
  if (!attemptId) throw new Error('Attempt ID is required');
  return fetchOwnAssessmentPages('responses', undefined, attemptId);
};

/**
 * Validate RIASEC scores for suspicious patterns
 * @param {Object} riasecScores - RIASEC scores object { R, I, A, S, E, C }
 * @returns {Object} - { isValid: boolean, warning: string|null }
 */
const validateRIASECScores = (riasecScores) => {
  if (!riasecScores || typeof riasecScores !== 'object') {
    return { isValid: true, warning: null };
  }

  const scores = Object.values(riasecScores);
  if (scores.length === 0) {
    return { isValid: true, warning: null };
  }

  // Check if all scores are equal
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

/**
 * Validate aptitude scores for suspicious patterns
 * @param {Object} aptitudeScores - Aptitude scores object with categories
 * @returns {Object} - { isValid: boolean, warning: string|null }
 */
const validateAptitudeScores = (aptitudeScores) => {
  if (!aptitudeScores || typeof aptitudeScores !== 'object') {
    return { isValid: true, warning: null };
  }

  // Check if all correct counts are zero
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

/**
 * Complete an assessment attempt and save results
 * 
 * IMPORTANT: This function saves results FIRST, then marks the attempt as completed.
 * This ensures that if the results insert fails, the attempt remains "in_progress"
 * and can be retried, rather than being orphaned as "completed" with no results.
 * 
 * @param {string} attemptId - Attempt UUID
 * @param {string} learnerId - Learner's user_id
 * @param {string} streamId - Selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 * @param {object} geminiResults - Full Gemini AI analysis results
 * @param {object} sectionTimings - Time spent on each section
 */
export const completeAttempt = async (attemptId, learnerId, streamId, gradeLevel, geminiResults, sectionTimings) => {
  const confirmation = await finalizeOwnReport(attemptId, learnerId, streamId, gradeLevel, geminiResults, sectionTimings);
  const resultId = confirmation?.data?.resultId;
  if (confirmation?.success !== true || typeof resultId !== 'string') throw new Error('Assessment finalization confirmation unavailable');
  const attempt = await fetchOwnAssessmentRecord('attempt', undefined, attemptId);
  const result = attempt.results?.find(row => row.id === resultId && row.attempt_id === attemptId);
  if (!result) throw new Error('Finalized assessment result unavailable');
  return result;
};

/**
 * Get learner's assessment history
 * @param {string} learnerId - Learner's user_id
 */
export const getlearnerAttempts = async (learnerId) => {
  if (!learnerId) throw new Error('Learner ID is required');
  const attempts = await fetchOwnAssessmentPages('history', learnerId);
  return attempts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

/**
 * Get a specific attempt with full results
 * @param {string} attemptId - Attempt UUID
 */
/**
 * Get the analysis result for an attempt via the backend Pages Function.
 * Backend verifies ownership and returns { result, attempt, learnerInfo }.
 * @param {string} attemptId
 * @returns {Promise<{success:boolean,hasResult:boolean,result:object|null,attempt:object,learnerInfo:object}>}
 */
export const getResult = async (attemptId) => {
  const response = await ssoClient.fetch(`/api/assessment/result?attemptId=${encodeURIComponent(attemptId)}`, {
    method: 'GET',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load result (${response.status})`);
  }
  return response.json();
};

/**
 * Regenerate a stored assessment result for an attempt.
 * Backend deletes the existing result row and runs the same analyze flow used
 * after assessment submission.
 */
export const regenerateResult = async (attemptId, gradeLevel) => {
  const response = await ssoClient.fetch('/api/assessment/regenerate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attemptId, gradeLevel }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Failed to regenerate result (${response.status})`);
  }

  return response.json();
};

export const getAttemptWithResults = async (attemptId) => {
  if (!attemptId) throw new Error('Attempt ID is required');
  return fetchOwnAssessmentRecord('attempt', undefined, attemptId);
};

/**
 * Get the latest completed assessment result for a learner
 * @param {string} learnerIdOrUserId - Learner's ID from learners table OR user_id from auth
 * @returns {object|null} Latest assessment result, or null if none found
 */
export const getLatestResult = async (learnerIdOrUserId) => {
  if (!learnerIdOrUserId) return null;
  return fetchOwnAssessmentRecord('latest', learnerIdOrUserId);
};

/**
 * Check if learner can take assessment (6-month restriction)
 * In development mode, the restriction is bypassed for testing.
 * 
 * @param {string} learnerId - Learner's user_id
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 * @returns {object} { canTake: boolean, lastAttemptDate: Date|null, nextAvailableDate: Date|null }
 */
export const canTakeAssessment = async (learnerId, gradeLevel = null) => {
  // Bypass restriction in development mode
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  if (isDevelopment) {
    console.log('🔧 Development mode: Assessment 6-month restriction bypassed');
    return { canTake: true, lastAttemptDate: null, nextAvailableDate: null, devBypass: true };
  }

  const data = await fetchOwnAssessmentRecord('latest-date', learnerId);

  if (!data) {
    // No previous assessment, can take
    return { canTake: true, lastAttemptDate: null, nextAvailableDate: null };
  }

  const lastAttemptDate = new Date(data.created_at);
  const sixMonthsLater = new Date(lastAttemptDate);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  const now = new Date();
  const canTake = now >= sixMonthsLater;

  return {
    canTake,
    lastAttemptDate,
    nextAvailableDate: canTake ? null : sixMonthsLater
  };
};

/**
 * Check if learner has an in-progress attempt
 * @param {string} learnerIdOrUserId - Learner's ID from learners table OR user_id from auth
 * @returns {object|null} In-progress attempt with responses, or null if none found
 */
export const getInProgressAttempt = async (learnerIdOrUserId) => {
  if (!learnerIdOrUserId) return null;
  return fetchOwnAssessmentRecord('in-progress', learnerIdOrUserId);
};

/**
 * Abandon an in-progress attempt
 * @param {string} attemptId - Attempt UUID
 */
export const abandonAttempt = async (attemptId) => {
  await patchOwnAssessment(attemptId, {}, 'abandon');
};

// transformQuestionsForUI removed - was never called, referenced unused columns (subtype, module_title, part_type)

/**
 * Calculate aptitude scores from answers and questions
 * @param {Array} answers - Array of answer objects
 * @param {Array} questions - Array of question objects with correct_answer
 * @returns {Object} Scores object broken down by category
 */
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

  // Create a map of question ID to question details
  const questionMap = new Map();
  questions.forEach(q => {
    questionMap.set(q.id, {
      correct_answer: q.correct_answer,
      // Note: subtype column removed from DB, using category or dimension instead
      subtype: q.category || q.dimension || 'verbal'
    });
  });

  // Category mapping for AI-generated questions
  const categoryMap = {
    'mathematics': 'numerical',
    'math': 'numerical',
    'numerical_reasoning': 'numerical',
    'numerical': 'numerical',
    'verbal_reasoning': 'verbal',
    'verbal': 'verbal',
    'logical_reasoning': 'abstract',
    'logical': 'abstract',
    'abstract': 'abstract',
    'spatial_reasoning': 'spatial',
    'spatial': 'spatial',
    'clerical_speed': 'clerical',
    'clerical': 'clerical',
    'data_interpretation': 'numerical',
    'english': 'verbal',
    'science': 'abstract',
    'social_studies': 'verbal',
    'history': 'verbal',
    'geography': 'spatial',
    'civics': 'verbal',
    'economics': 'numerical',
    'general_knowledge': 'verbal',
    'reasoning': 'abstract',
    'aptitude': 'numerical'
  };

  // Initialize scores by category
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

  // Calculate percentages
  Object.keys(scoresByCategory).forEach(category => {
    const scores = scoresByCategory[category];
    scores.percentage = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
  });

  console.log(`✅ Aptitude scores by category:`, scoresByCategory);

  return {
    verbal: {
      correct: scoresByCategory.verbal.correct,
      total: scoresByCategory.verbal.total,
      percentage: scoresByCategory.verbal.percentage
    },
    numerical: {
      correct: scoresByCategory.numerical.correct,
      total: scoresByCategory.numerical.total,
      percentage: scoresByCategory.numerical.percentage
    },
    abstract: {
      correct: scoresByCategory.abstract.correct,
      total: scoresByCategory.abstract.total,
      percentage: scoresByCategory.abstract.percentage
    },
    spatial: {
      correct: scoresByCategory.spatial.correct,
      total: scoresByCategory.spatial.total,
      percentage: scoresByCategory.spatial.percentage
    },
    clerical: {
      correct: scoresByCategory.clerical.correct,
      total: scoresByCategory.clerical.total,
      percentage: scoresByCategory.clerical.percentage
    }
  };
};

/**
 * Calculate knowledge scores from answers and questions
 * @param {Array} answers - Array of answer objects
 * @param {Array} questions - Array of question objects with correct_answer
 * @returns {Object} Scores object with correct/total counts
 */
export const calculateKnowledgeScores = (answers, questions) => {
  console.log('🧮 Calculating knowledge scores...');
  console.log('📝 Answers count:', answers?.length);
  console.log('❓ Questions count:', questions?.length);

  if (!answers || !questions || answers.length === 0 || questions.length === 0) {
    console.warn('⚠️ Missing answers or questions for knowledge scoring');
    return { correct: 0, total: 0, percentage: 0 };
  }

  // Create a map of question ID to correct answer
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

/**
 * Complete an assessment attempt WITHOUT AI analysis
 * This is used by Submit button - AI analysis will be generated on-demand on result page
 * @param {string} attemptId - Attempt UUID
 * @param {string} learnerId - Learner's user_id
 * @param {string} streamId - Selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 * @param {object} sectionTimings - Time spent on each section
 */
/**
 * Retry helper with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in ms (will be exponentially increased)
 * @param {string} operationName - Name of operation for logging
 * @returns {Promise<any>} Result of the function
 */
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
      
      // Don't retry on certain errors
      if (error.code === 'PGRST116' || // Row not found
          error.code === '23505' ||    // Unique violation
          error.code === '23503' ||    // Foreign key violation
          error.message?.includes('JWT') || // Auth errors
          error.message?.includes('permission')) { // Permission errors
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

/**
 * Complete assessment attempt without AI analysis (industrial-grade error handling)
 * @param {string} attemptId - Assessment attempt ID
 * @param {string} learnerId - Learner ID
 * @param {string} streamId - Stream ID
 * @param {string} gradeLevel - Grade level
 * @param {object} sectionTimings - Time spent on each section
 * @returns {Promise<object>} Result record
 */
export const completeAttemptWithoutAI = async (attemptId, learnerId, streamId, gradeLevel, sectionTimings) => {
  const attempt = await fetchOwnAssessmentRecord('attempt', learnerId, attemptId);
  if (attempt.stream_id !== streamId || attempt.grade_level !== gradeLevel) throw new Error('Assessment context changed');
  if (sectionTimings && attempt.status === 'in_progress') await patchOwnAssessment(attemptId, { sectionTimings });
  const response = await ssoClient.fetch('/api/assessment/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attemptId }),
  });
  if (!response.ok) throw new Error('Assessment submission failed');
  const confirmation = await response.json();
  const resultId = confirmation?.data?.resultId;
  if (confirmation?.success !== true || typeof resultId !== 'string') throw new Error('Assessment submission confirmation unavailable');
  const completed = await fetchOwnAssessmentRecord('attempt', learnerId, attemptId);
  const result = completed.results?.find(row => row.id === resultId && row.attempt_id === attemptId);
  if (!result) throw new Error('Submitted assessment result unavailable');
  return result;
};

/**
 * Save aptitude scores to assessment attempt
 * @param {string} attemptId - Assessment attempt ID
 * @param {Object} scores - Aptitude scores object
 * @returns {Promise<Object>} Updated attempt
 */
export const saveAptitudeScores = async () => {
  throw new Error('Browser-provided scores cannot be persisted; submit the assessment for server grading');
};

/**
 * Save knowledge scores to assessment attempt
 * @param {string} attemptId - Assessment attempt ID
 * @param {Object} scores - Knowledge scores object
 * @returns {Promise<Object>} Updated attempt
 */
export const saveKnowledgeScores = async () => {
  throw new Error('Browser-provided scores cannot be persisted; submit the assessment for server grading');
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
  saveKnowledgeScores,
  retryClusterGeneration
};

export { retryClusterGeneration };
