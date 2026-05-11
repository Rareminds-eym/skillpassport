/**
 * Gemini API Service
 * Handles API communication with OpenRouter via Cloudflare Worker
 * 
 * @version 2.1.0
 */

import { prepareAssessmentData, validateResults } from './assessmentDataPrep.js';
import { addCourseRecommendations } from './courseIntegration.js';
import { getCurrentSession } from '@/shared/api/authUtils';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('gemini-api-service');

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Update analysis progress (for UI feedback)
 * @param {string} stage - Current stage: 'preparing' | 'sending' | 'analyzing' | 'processing' | 'courses' | 'saving' | 'complete' | 'error'
 * @param {string} message - Optional message to display
 */
export const updateProgress = (stage, message) => {
  if (typeof window !== 'undefined' && window.setAnalysisProgress) {
    window.setAnalysisProgress(stage, message);
  }
};

// ============================================================================
// API COMMUNICATION
// ============================================================================

/**
 * Call OpenRouter API via Cloudflare Worker for assessment analysis
 * The worker handles prompt building based on grade level
 * 
 * @param {Object} assessmentData - The prepared assessment data
 * @returns {Promise<Object>} - The analyzed results from AI
 */
export const callOpenRouterAssessment = async (assessmentData) => {
  logger.info('[FRONTEND] === CALLING ANALYZE-ASSESSMENT API ===');
  logger.info('[FRONTEND] Assessment data:', {
    gradeLevel: assessmentData.gradeLevel,
    stream: assessmentData.stream,
    haslearnerContext: !!assessmentData.learnerContext,
    learnerContext: assessmentData.learnerContext,
    hasAdaptiveResults: !!assessmentData.adaptiveAptitudeResults,
    riasecAnswersCount: Object.keys(assessmentData.riasecAnswers || {}).length,
    aptitudeScores: assessmentData.aptitudeScores
  });

  const { getApiUrl } = await import('@/shared/api/apiUtils');
  const API_URL = getApiUrl('analyze-assessment');

  // Get auth token (via SSO, not Supabase auth which is disabled)
  updateProgress('sending', 'Authenticating...');
  const { data: { session } } = await getCurrentSession();
  const token = session?.access_token;

  if (!token) {
    logger.error('[FRONTEND] ❌ No auth token found');
    updateProgress('error', 'Authentication required');
    throw new Error('Authentication required for assessment analysis');
  }

  logger.info('[FRONTEND] 🤖 Sending assessment data to backend for analysis...');
  logger.info('[FRONTEND] 📊 Grade Level:', { gradeLevel: assessmentData.gradeLevel, stream: assessmentData.stream });
  logger.info('[FRONTEND] 🎯 STREAM CONTEXT: Learner is in', { stream: assessmentData.stream, message: 'stream, AI should recommend careers from this stream' });

  updateProgress('analyzing', 'AI is processing your responses...');

  try {
    // Add cache-busting parameter to force new worker version
    const cacheBuster = Date.now();
    const apiUrl = `${API_URL}?v=${cacheBuster}`;
    
    const requestBody = { assessmentData };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    logger.info('[FRONTEND] 📡 Response received');
    logger.info('[FRONTEND] 📊 Response status:', { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      logger.error('[FRONTEND] ❌ API request failed');
      const errorText = await response.text();
      logger.error('[FRONTEND] ❌ Error response:', { error: errorText });
      logger.error('❌ === API CALL FAILED ===', {
        statusCode: response.status,
        statusText: response.statusText,
        errorResponse: errorText,
        apiUrl: API_URL,
        gradeLevel: assessmentData.gradeLevel,
        stream: assessmentData.stream,
        riasecAnswersCount: Object.keys(assessmentData.riasecAnswers || {}).length,
        aptitudeScores: JSON.stringify(assessmentData.aptitudeScores)
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      updateProgress('error', errorData.error || `Server error: ${response.status}`);
      throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
    }

    updateProgress('processing', 'Processing AI results...');

    const result = await response.json();
    logger.info('📦 API Response:', { success: result.success, hasData: !!result.data, error: result.error });

    if (!result.success || !result.data) {
      logger.error('❌ Invalid response:', { success: result.success, data: result.data, error: result.error, details: result.details });
      updateProgress('error', result.error || 'Invalid response from server');
      throw new Error(result.error || result.details || 'Invalid response from server');
    }

    logger.info('✅ Assessment analysis successful');
    logger.info('📊 Response keys:', { keys: Object.keys(result.data) });
    
    // Log seed for deterministic verification
    if (result.data._metadata?.seed) {
      logger.info('🎲 DETERMINISTIC SEED:', { seed: result.data._metadata.seed, model: result.data._metadata.model, deterministic: result.data._metadata.deterministic });
      
      // Log failure details if any models failed before success
      if (result.data._metadata.failureDetails && result.data._metadata.failureDetails.length > 0) {
        logger.warn('⚠️ MODEL FAILURES BEFORE SUCCESS:', {
          failures: result.data._metadata.failureDetails.map((f, idx) => `${idx + 1}. ❌ ${f.model} - ${f.status || ''} - ${f.error}`),
          finalModel: result.data._metadata.model
        });
      }
    } else {
      logger.warn('⚠️ NO SEED IN RESPONSE - Using old worker version?');
    }
    
    // Debug: Log career clusters to verify stream alignment
    if (result.data.careerFit?.clusters) {
      logger.info('🎯 AI CAREER CLUSTERS (from worker):', {
        clusters: result.data.careerFit.clusters.map((c, idx) => `${idx + 1}. ${c.title} (${c.fit} - ${c.matchScore}%)`)
      });
    }
    
    return result.data;
  } catch (error) {
    logger.error('❌ === ASSESSMENT API CALL EXCEPTION ===', {
      errorMessage: error.message,
      errorStack: error.stack,
      gradeLevel: assessmentData.gradeLevel,
      stream: assessmentData.stream,
      riasecAnswers: Object.keys(assessmentData.riasecAnswers || {}).length,
      bigFiveAnswers: Object.keys(assessmentData.bigFiveAnswers || {}).length,
      aptitudeScores: JSON.stringify(assessmentData.aptitudeScores)
    });
    
    updateProgress('error', error.message);
    throw error;
  }
};

/**
 * Main assessment analysis function
 * Orchestrates the entire assessment analysis pipeline
 * 
 * @param {Object} answers - Raw assessment answers
 * @param {string} stream - Learner's stream/program
 * @param {Object} questionBanks - Question banks for all sections
 * @param {Object} sectionTimings - Time spent on each section
 * @param {string} gradeLevel - Learner's grade level
 * @param {Object} preCalculatedScores - Pre-calculated scores (optional)
 * @param {string} learnerId - Learner ID for course recommendations
 * @param {Object} learnerContext - Additional learner context
 * @param {Object} adaptiveResults - Adaptive aptitude results
 * @returns {Promise<Object>} - AI-analyzed results with course recommendations
 */
export const analyzeAssessmentWithOpenRouter = async (
  answers, 
  stream, 
  questionBanks, 
  sectionTimings = {}, 
  gradeLevel = 'after12', 
  preCalculatedScores = null, 
  learnerId = null, 
  learnerContext = {}, 
  adaptiveResults = null
) => {
  logger.info('=== analyzeAssessmentWithGemini START ===', {
    gradeLevel,
    stream,
    learnerId: learnerId || 'Not provided',
    hasAdaptiveResults: !!adaptiveResults,
    hasPreCalculatedScores: !!preCalculatedScores,
    questionBanks: {
      riasec: questionBanks.riasecQuestions?.length || 0,
      aptitude: questionBanks.aptitudeQuestions?.length || 0,
      bigFive: questionBanks.bigFiveQuestions?.length || 0,
      values: questionBanks.workValuesQuestions?.length || 0,
      employability: questionBanks.employabilityQuestions?.length || 0,
      knowledge: questionBanks.streamKnowledgeQuestions ? Object.keys(questionBanks.streamKnowledgeQuestions).length : 0
    }
  });
  
  updateProgress('preparing', 'Preparing your assessment data...');
  
  try {
    // Prepare the assessment data (includes rule-based stream hint for after10 and learner context)
    const assessmentData = prepareAssessmentData(
      answers, 
      stream, 
      questionBanks, 
      sectionTimings, 
      gradeLevel, 
      preCalculatedScores, 
      learnerContext, 
      adaptiveResults
    );

    // Call the Cloudflare Worker (handles prompt building and AI call)
    let parsedResults = await callOpenRouterAssessment(assessmentData);

    // Validate stream recommendation for After 10th learners
    if (gradeLevel === 'after10' && parsedResults.streamRecommendation) {
      logger.info('🎯 Validating After 10th stream recommendation with rule-based engine...', {
        ruleBasedStreams: calculateStreamRecommendations(parsedResults).map(s => s.stream)
      });
    }

    // Validate the results
    const { isValid, missingFields } = validateResults(parsedResults);
    if (!isValid) {
      logger.warn('⚠️ Response has missing fields:', { missingFields });
    }

    logger.info('📋 Skipping course generation (will be generated on-demand)');
    
    updateProgress('saving', 'Saving your results...');
    
    logger.info('✅ Assessment analysis complete');
    
    // Mark as complete after a short delay to show the saving stage
    setTimeout(() => updateProgress('complete', 'Analysis complete!'), 500);
    
    // Return results without courses
    return parsedResults;

  } catch (error) {
    logger.error('❌ Assessment analysis failed:', { error: error.message });
    updateProgress('error', error.message);
    throw new Error(`Assessment analysis failed: ${error.message}. Please try again.`);
  }
};

// Legacy alias for backward compatibility
export const analyzeAssessmentWithGemini = analyzeAssessmentWithOpenRouter;