/**
 * Gemini API Service
 * Handles API communication with OpenRouter via Cloudflare Worker
 * 
 * @version 2.1.0
 */

import { prepareAssessmentData, validateResults } from './assessmentDataPrep.js';
import { addCourseRecommendations } from './courseIntegration.js';

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
  console.log('[FRONTEND] === CALLING ANALYZE-ASSESSMENT API ===');
  console.log('[FRONTEND] Assessment data:', {
    gradeLevel: assessmentData.gradeLevel,
    stream: assessmentData.stream,
    hasStudentContext: !!assessmentData.studentContext,
    studentContext: assessmentData.studentContext,
    hasAdaptiveResults: !!assessmentData.adaptiveAptitudeResults,
    riasecAnswersCount: Object.keys(assessmentData.riasecAnswers || {}).length,
    aptitudeScores: assessmentData.aptitudeScores
  });

  const { getPagesApiUrl } = await import('../../utils/pagesUrl');
  const API_URL = getPagesApiUrl('analyze-assessment');

  // Get auth token
  updateProgress('sending', 'Authenticating...');
  const { data: { session } } = await import('../../lib/supabaseClient').then(m => m.supabase.auth.getSession());
  const token = session?.access_token;

  if (!token) {
    console.error('[FRONTEND] ❌ No auth token found');
    updateProgress('error', 'Authentication required');
    throw new Error('Authentication required for assessment analysis');
  }

  console.log('[FRONTEND] 🤖 Sending assessment data to backend for analysis...');
  console.log('[FRONTEND] 📊 Grade Level:', assessmentData.gradeLevel, 'Stream:', assessmentData.stream);
  console.log('[FRONTEND] 🎯 STREAM CONTEXT: Student is in', assessmentData.stream, 'stream, AI should recommend careers from this stream');

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

    console.log('[FRONTEND] 📡 Response received');
    console.log('[FRONTEND] 📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[FRONTEND] ❌ API request failed');
      const errorText = await response.text();
      console.error('[FRONTEND] ❌ Error response:', errorText);
      console.error('❌ === API CALL FAILED ===');
      console.error('❌ Status Code:', response.status);
      console.error('❌ Status Text:', response.statusText);
      console.error('❌ Error Response:', errorText);
      console.error('❌ Request Summary:');
      console.error('   - API URL:', API_URL);
      console.error('   - Grade Level:', assessmentData.gradeLevel);
      console.error('   - Stream:', assessmentData.stream);
      console.error('   - RIASEC Answers Count:', Object.keys(assessmentData.riasecAnswers || {}).length);
      console.error('   - Aptitude Scores:', JSON.stringify(assessmentData.aptitudeScores));
      console.error('❌ === END API CALL FAILED ===');
      
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
    console.log('📦 API Response:', { success: result.success, hasData: !!result.data, error: result.error });

    if (!result.success || !result.data) {
      console.error('❌ Invalid response:', result);
      console.error('❌ Response success:', result.success);
      console.error('❌ Response data:', result.data);
      console.error('❌ Response error:', result.error);
      console.error('❌ Response details:', result.details);
      updateProgress('error', result.error || 'Invalid response from server');
      throw new Error(result.error || result.details || 'Invalid response from server');
    }

    console.log('✅ Assessment analysis successful');
    console.log('📊 Response keys:', Object.keys(result.data));
    
    // Log seed for deterministic verification
    if (result.data._metadata?.seed) {
      console.log('🎲 DETERMINISTIC SEED:', result.data._metadata.seed);
      console.log('🎲 Model used:', result.data._metadata.model);
      console.log('🎲 Deterministic:', result.data._metadata.deterministic);
      
      // Log failure details if any models failed before success
      if (result.data._metadata.failureDetails && result.data._metadata.failureDetails.length > 0) {
        console.warn('⚠️ MODEL FAILURES BEFORE SUCCESS:');
        result.data._metadata.failureDetails.forEach((failure, idx) => {
          console.warn(`   ${idx + 1}. ❌ ${failure.model}`);
          if (failure.status) {
            console.warn(`      Status: ${failure.status}`);
          }
          console.warn(`      Error: ${failure.error}`);
        });
        console.log(`✅ Final success with: ${result.data._metadata.model}`);
      }
    } else {
      console.warn('⚠️ NO SEED IN RESPONSE - Using old worker version?');
    }
    
    // Debug: Log career clusters to verify stream alignment
    if (result.data.careerFit?.clusters) {
      console.log('🎯 AI CAREER CLUSTERS (from worker):');
      result.data.careerFit.clusters.forEach((cluster, idx) => {
        console.log(`   ${idx + 1}. ${cluster.title} (${cluster.fit} - ${cluster.matchScore}%)`);
      });
    }
    
    return result.data;
  } catch (error) {
    console.error('❌ === ASSESSMENT API CALL EXCEPTION ===');
    console.error('❌ Error Message:', error.message);
    console.error('❌ Error Stack:', error.stack);
    console.error('❌ Request Context:');
    console.error('   - Grade Level:', assessmentData.gradeLevel);
    console.error('   - Stream:', assessmentData.stream);
    console.error('   - RIASEC Answers:', Object.keys(assessmentData.riasecAnswers || {}).length);
    console.error('   - BigFive Answers:', Object.keys(assessmentData.bigFiveAnswers || {}).length);
    console.error('   - Aptitude Scores:', JSON.stringify(assessmentData.aptitudeScores));
    console.error('❌ === END ASSESSMENT API CALL EXCEPTION ===');
    
    updateProgress('error', error.message);
    throw error;
  }
};

/**
 * Main assessment analysis function
 * Orchestrates the entire assessment analysis pipeline
 * 
 * @param {Object} answers - Raw assessment answers
 * @param {string} stream - Student's stream/program
 * @param {Object} questionBanks - Question banks for all sections
 * @param {Object} sectionTimings - Time spent on each section
 * @param {string} gradeLevel - Student's grade level
 * @param {Object} preCalculatedScores - Pre-calculated scores (optional)
 * @param {string} studentId - Student ID for course recommendations
 * @param {Object} studentContext - Additional student context
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
  studentId = null, 
  studentContext = {}, 
  adaptiveResults = null
) => {
  console.log('=== analyzeAssessmentWithGemini START ===');
  console.log('🤖 Starting assessment analysis...');
  console.log('📊 Grade Level:', gradeLevel);
  console.log('📊 Stream:', stream);
  console.log('📊 Student ID:', studentId || 'Not provided');
  console.log('📊 Has adaptive results:', !!adaptiveResults);
  console.log('📊 Pre-calculated scores:', !!preCalculatedScores);
  console.log('📊 Question banks:', {
    riasec: questionBanks.riasecQuestions?.length || 0,
    aptitude: questionBanks.aptitudeQuestions?.length || 0,
    bigFive: questionBanks.bigFiveQuestions?.length || 0,
    values: questionBanks.workValuesQuestions?.length || 0,
    employability: questionBanks.employabilityQuestions?.length || 0,
    knowledge: questionBanks.streamKnowledgeQuestions ? Object.keys(questionBanks.streamKnowledgeQuestions).length : 0
  });
  
  updateProgress('preparing', 'Preparing your assessment data...');
  
  try {
    // Prepare the assessment data (includes rule-based stream hint for after10 and student context)
    const assessmentData = prepareAssessmentData(
      answers, 
      stream, 
      questionBanks, 
      sectionTimings, 
      gradeLevel, 
      preCalculatedScores, 
      studentContext, 
      adaptiveResults
    );

    // Call the Cloudflare Worker (handles prompt building and AI call)
    let parsedResults = await callOpenRouterAssessment(assessmentData);

    // Validate stream recommendation for After 10th students
    if (gradeLevel === 'after10' && parsedResults.streamRecommendation) {
      console.log('🎯 Validating After 10th stream recommendation with rule-based engine...');
      const ruleBasedStreams = calculateStreamRecommendations(parsedResults);
      console.log('🎯 Rule-based streams:', ruleBasedStreams.map(s => s.stream));
    }

    // Validate the results
    const { isValid, missingFields } = validateResults(parsedResults);
    if (!isValid) {
      console.warn('⚠️ Response has missing fields:', missingFields);
    }

    console.log('📋 Skipping course generation (will be generated on-demand)');
    
    updateProgress('saving', 'Saving your results...');
    
    console.log('✅ Assessment analysis complete');
    
    // Mark as complete after a short delay to show the saving stage
    setTimeout(() => updateProgress('complete', 'Analysis complete!'), 500);
    
    // Return results without courses
    return parsedResults;

  } catch (error) {
    console.error('❌ Assessment analysis failed:', error.message);
    updateProgress('error', error.message);
    throw new Error(`Assessment analysis failed: ${error.message}. Please try again.`);
  }
};

// Legacy alias for backward compatibility
export const analyzeAssessmentWithGemini = analyzeAssessmentWithOpenRouter;