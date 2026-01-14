/**
 * AI Assessment Service
 * Uses OpenRouter API via Cloudflare Worker to analyze assessment answers and provide personalized results
 * 
 * The heavy lifting (prompt building, AI calls) is now handled by the Cloudflare Worker.
 * This service handles:
 * - Data preparation (transforms raw answers to structured format)
 * - API communication with the worker
 * - Response validation
 * - Course recommendations (requires authenticated Supabase client)
 * - Rule-based stream recommendation (for After 10th students)
 * 
 * @version 2.1.0 - Added hybrid stream recommendation
 */

import {
  getCoursesForMultipleSkillGaps,
  getRecommendedCourses,
  getRecommendedCoursesByType
} from './courseRecommendationService';

// Import stream matching engine for After 10th students
import { calculateStreamRecommendations } from '../features/assessment/assessment-result/utils/streamMatchingEngine';

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Update analysis progress (for UI feedback)
 * @param {string} stage - Current stage: 'preparing' | 'sending' | 'analyzing' | 'processing' | 'courses' | 'saving' | 'complete' | 'error'
 * @param {string} message - Optional message to display
 */
const updateProgress = (stage, message) => {
  if (typeof window !== 'undefined' && window.setAnalysisProgress) {
    window.setAnalysisProgress(stage, message);
  }
  console.log(`📊 Analysis Progress: ${stage} - ${message || ''}`);
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
const callOpenRouterAssessment = async (assessmentData) => {
  const API_URL = import.meta.env.VITE_ASSESSMENT_API_URL || 
                  'https://analyze-assessment-api.dark-mode-d021.workers.dev';

  // Get auth token
  updateProgress('sending', 'Authenticating...');
  const { data: { session } } = await import('../lib/supabaseClient').then(m => m.supabase.auth.getSession());
  const token = session?.access_token;

  if (!token) {
    updateProgress('error', 'Authentication required');
    throw new Error('Authentication required for assessment analysis');
  }

  console.log('🤖 Sending assessment data to backend for analysis...');
  console.log(`📊 Grade Level: ${assessmentData.gradeLevel}, Stream: ${assessmentData.stream}`);
  console.log(`🔗 API URL: ${API_URL}/analyze-assessment`);
  console.log(`📝 Assessment data keys:`, Object.keys(assessmentData));
  console.log(`🎯 STREAM CONTEXT: Student is in ${assessmentData.stream} stream, AI should recommend careers from this stream`);
  console.log(`📋 RIASEC Answers Count:`, Object.keys(assessmentData.riasecAnswers || {}).length);
  console.log(`📋 Aptitude Scores:`, assessmentData.aptitudeScores);

  updateProgress('analyzing', 'AI is processing your responses...');

  try {
    const response = await fetch(`${API_URL}/analyze-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ assessmentData })
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
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
    console.log('📦 Full API Response:', JSON.stringify(result).substring(0, 500));

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
    
    // Debug: Log career clusters to verify stream alignment
    if (result.data.careerFit?.clusters) {
      console.log('🎯 AI CAREER CLUSTERS (from worker):');
      result.data.careerFit.clusters.forEach((cluster, idx) => {
        console.log(`   ${idx + 1}. ${cluster.title} (${cluster.fit} - ${cluster.matchScore}%)`);
      });
    }
    
    return result.data;
  } catch (error) {
    console.error('❌ Assessment API call failed:', error);
    updateProgress('error', error.message);
    throw error;
  }
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that all required fields are present in the AI response
 * @param {Object} results - Parsed results from AI
 * @returns {Object} - { isValid: boolean, missingFields: string[] }
 */
const validateResults = (results) => {
  const missingFields = [];

  // Core sections
  if (!results.riasec?.topThree?.length) missingFields.push('riasec.topThree');
  if (!results.aptitude?.scores) missingFields.push('aptitude.scores');
  if (!results.aptitude?.topStrengths?.length) missingFields.push('aptitude.topStrengths');
  if (!results.bigFive || typeof results.bigFive.O === 'undefined') missingFields.push('bigFive');
  if (!results.workValues?.topThree?.length) missingFields.push('workValues.topThree');
  if (!results.employability?.strengthAreas?.length) missingFields.push('employability');
  if (!results.knowledge || typeof results.knowledge.score === 'undefined') missingFields.push('knowledge');
  
  // Career fit (critical)
  if (!results.careerFit?.clusters?.length) missingFields.push('careerFit.clusters');
  
  // Skill gap and roadmap
  if (!results.skillGap?.priorityA?.length) missingFields.push('skillGap');
  if (!results.roadmap?.projects?.length) missingFields.push('roadmap');
  
  // Summary sections
  if (!results.finalNote?.advantage) missingFields.push('finalNote');
  if (!results.profileSnapshot?.aptitudeStrengths?.length) missingFields.push('profileSnapshot.aptitudeStrengths');
  if (!results.overallSummary) missingFields.push('overallSummary');

  // Optional but log if missing
  if (!results.timingAnalysis?.overallPace) {
    console.log('Note: timingAnalysis not included in response');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// ============================================================================
// COURSE RECOMMENDATIONS
// ============================================================================

/**
 * Add course recommendations to assessment results
 * Fetches platform courses that match the student's profile using RAG-based recommendations
 * 
 * @param {Object} assessmentResults - Parsed results from AI
 * @returns {Promise<Object>} - Results with platformCourses, coursesByType, and skillGapCourses added
 */
const addCourseRecommendations = async (assessmentResults) => {
  try {
    console.log('=== Adding Course Recommendations ===');
    updateProgress('courses', 'Finding relevant courses...');

    let coursesByType = { technical: [], soft: [] };
    let platformCourses = [];

    try {
      // Fetch courses by type - ensures both technical and soft skills
      coursesByType = await getRecommendedCoursesByType(assessmentResults, 5);
      console.log(`Found ${coursesByType.technical.length} technical and ${coursesByType.soft.length} soft skill courses`);

      platformCourses = [...coursesByType.technical, ...coursesByType.soft];

      // Fallback to combined fetch if by-type returned nothing
      if (platformCourses.length === 0) {
        platformCourses = await getRecommendedCourses(assessmentResults);
        console.log(`Fallback: Found ${platformCourses.length} platform course recommendations`);
      }
    } catch (error) {
      console.warn('Failed to get platform course recommendations:', error.message);
      try {
        platformCourses = await getRecommendedCourses(assessmentResults);
      } catch (fallbackError) {
        console.warn('Fallback also failed:', fallbackError.message);
      }
    }

    // Get courses mapped to each priority skill gap
    let skillGapCourses = {};
    try {
      const skillGaps = assessmentResults.skillGap?.priorityA || [];
      if (skillGaps.length > 0) {
        skillGapCourses = await getCoursesForMultipleSkillGaps(skillGaps);
        console.log(`Mapped courses to ${Object.keys(skillGapCourses).length} skill gaps`);
      }
    } catch (error) {
      console.warn('Failed to get skill gap course mappings:', error.message);
    }

    return {
      ...assessmentResults,
      platformCourses,
      coursesByType,
      skillGapCourses
    };
  } catch (error) {
    console.error('Error adding course recommendations:', error);
    return {
      ...assessmentResults,
      platformCourses: [],
      coursesByType: { technical: [], soft: [] },
      skillGapCourses: {}
    };
  }
};

// ============================================================================
// DATA PREPARATION
// ============================================================================

/**
 * Format seconds to readable time string
 */
const formatTimeForPrompt = (seconds) => {
  if (!seconds || seconds <= 0) return 'Not recorded';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} seconds`;
  if (secs === 0) return `${mins} minute${mins > 1 ? 's' : ''}`;
  return `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs > 1 ? 's' : ''}`;
};

/**
 * Get section prefix based on grade level
 * Maps to database section names in personal_assessment_sections table
 */
const getSectionPrefix = (baseSection, gradeLevel) => {
  if (gradeLevel === 'middle') {
    const middleSchoolMap = {
      'riasec': 'middle_interest_explorer',
      'bigfive': 'middle_strengths_character',
      'knowledge': 'middle_learning_preferences'
    };
    return middleSchoolMap[baseSection] || baseSection;
  } else if (gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
    const highSchoolMap = {
      'riasec': 'hs_interest_explorer',
      'bigfive': 'hs_strengths_character',
      'aptitude': 'hs_aptitude_sampling',
      'knowledge': 'hs_learning_preferences'
    };
    return highSchoolMap[baseSection] || baseSection;
  }
  return baseSection;
};

/**
 * Calculate aptitude score from answers
 */
const calculateAptitudeScore = (answers) => {
  if (answers.length === 0) return { correct: 0, total: 0 };

  // Rating questions (high school)
  if (answers[0]?.rating !== undefined) {
    const avgRating = answers.reduce((sum, a) => sum + (a.rating || 0), 0) / answers.length;
    const percentage = (avgRating / 4) * 100;
    return {
      averageRating: avgRating,
      total: answers.length,
      percentage: Math.round(percentage)
    };
  }
  
  // MCQ questions (college)
  return {
    correct: answers.filter(a => a.isCorrect).length,
    total: answers.length
  };
};

/**
 * Prepare assessment data for analysis
 * Transforms raw answers into structured format for the AI
 */
const prepareAssessmentData = (answers, stream, questionBanks, sectionTimings = {}, gradeLevel = 'after12') => {
  const { 
    riasecQuestions, 
    aptitudeQuestions, 
    bigFiveQuestions, 
    workValuesQuestions, 
    employabilityQuestions, 
    streamKnowledgeQuestions 
  } = questionBanks;

  // Debug: Log what we received
  console.log('=== prepareAssessmentData DEBUG ===');
  console.log('Total answers received:', Object.keys(answers).length);
  console.log('Sample answer keys (first 10):', Object.keys(answers).slice(0, 10));
  console.log('Sample answer entries (first 3):', Object.entries(answers).slice(0, 3));
  console.log('Grade level:', gradeLevel);
  console.log('riasecQuestions provided:', riasecQuestions?.length || 0);
  console.log('bigFiveQuestions provided:', bigFiveQuestions?.length || 0);
  console.log('workValuesQuestions provided:', workValuesQuestions?.length || 0);
  console.log('employabilityQuestions provided:', employabilityQuestions?.length || 0);

  // Extract RIASEC answers - IMPROVED: Extract even if riasecQuestions is empty
  const riasecAnswers = {};
  const riasecPrefix = getSectionPrefix('riasec', gradeLevel);
  console.log('🔍 RIASEC Extraction DEBUG:');
  console.log('  - RIASEC prefix:', riasecPrefix);
  console.log('  - Looking for keys starting with:', `${riasecPrefix}_`);
  
  // First, try to extract using question bank
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${riasecPrefix}_`)) {
      console.log('  - Found RIASEC key:', key, 'value:', value);
      const questionId = key.replace(`${riasecPrefix}_`, '');
      const question = riasecQuestions?.find(q => q.id === questionId);
      
      if (question) {
        riasecAnswers[questionId] = {
          question: question.text,
          answer: value,
          categoryMapping: question.categoryMapping,
          type: question.type
        };
      } else {
        // FALLBACK: Extract RIASEC type from question ID (e.g., 'r1' -> 'R', 'i2' -> 'I')
        // This ensures we capture answers even if questionBanks is empty
        const riasecType = questionId.charAt(0).toUpperCase();
        if (['R', 'I', 'A', 'S', 'E', 'C'].includes(riasecType)) {
          riasecAnswers[questionId] = {
            question: `RIASEC ${riasecType} question ${questionId}`,
            answer: value,
            type: riasecType,
            // For rating questions, the answer IS the score
            categoryMapping: null
          };
          console.log(`Extracted RIASEC answer without question bank: ${questionId} = ${value}`);
        }
      }
    }
  });
  
  console.log('RIASEC answers extracted:', Object.keys(riasecAnswers).length);
  if (Object.keys(riasecAnswers).length === 0) {
    console.error('❌ NO RIASEC ANSWERS EXTRACTED! This will cause zero scores.');
    console.error('   Check if answer keys match expected format:', `${riasecPrefix}_r1`, `${riasecPrefix}_r2`, 'etc.');
  } else {
    console.log('✅ RIASEC answers extracted successfully');
    console.log('   Sample extracted keys:', Object.keys(riasecAnswers).slice(0, 5));
  }

  // Extract Aptitude answers
  const aptitudeAnswers = {
    verbal: [],
    numerical: [],
    abstract: [],
    spatial: [],
    clerical: []
  };

  if (aptitudeQuestions) {
    const aptitudePrefix = getSectionPrefix('aptitude', gradeLevel);
    Object.entries(answers).forEach(([key, value]) => {
      if (key.startsWith(`${aptitudePrefix}_`)) {
        const questionId = key.replace(`${aptitudePrefix}_`, '');
        const question = aptitudeQuestions.find(q => q.id === questionId);
        if (question) {
          const isRatingQuestion = question.type === 'rating' || !question.correct;

          if (isRatingQuestion) {
            const answerData = {
              questionId,
              question: question.text,
              rating: value,
              taskType: question.taskType || question.task_type,
              type: question.type
            };
            const taskCategory = (question.taskType || question.task_type || 'verbal').toLowerCase();
            if (aptitudeAnswers[taskCategory]) {
              aptitudeAnswers[taskCategory].push(answerData);
            }
          } else {
            const answerData = {
              questionId,
              question: question.text,
              studentAnswer: value,
              correctAnswer: question.correct,
              isCorrect: value === question.correct,
              subtype: question.subtype
            };
            if (aptitudeAnswers[question.subtype]) {
              aptitudeAnswers[question.subtype].push(answerData);
            }
          }
        }
      }
    });
  }

  // Extract Big Five answers - IMPROVED: Extract even if bigFiveQuestions is empty
  const bigFiveAnswers = {};
  const bigFivePrefix = getSectionPrefix('bigfive', gradeLevel);
  console.log('BigFive prefix:', bigFivePrefix);
  
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${bigFivePrefix}_`)) {
      const questionId = key.replace(`${bigFivePrefix}_`, '');
      const question = bigFiveQuestions?.find(q => q.id === questionId);
      
      if (question) {
        bigFiveAnswers[questionId] = { question: question.text, answer: value };
      } else {
        // FALLBACK: Extract even without question bank
        bigFiveAnswers[questionId] = { 
          question: `BigFive question ${questionId}`, 
          answer: value 
        };
        console.log(`Extracted BigFive answer without question bank: ${questionId} = ${value}`);
      }
    }
  });
  
  console.log('BigFive answers extracted:', Object.keys(bigFiveAnswers).length);

  // Extract Work Values answers - IMPROVED: Extract even if workValuesQuestions is empty
  const workValuesAnswers = {};
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('values_')) {
      const questionId = key.replace('values_', '');
      const question = workValuesQuestions?.find(q => q.id === questionId);
      
      if (question) {
        workValuesAnswers[questionId] = { question: question.text, answer: value };
      } else {
        // FALLBACK: Extract even without question bank
        workValuesAnswers[questionId] = { 
          question: `Work Values question ${questionId}`, 
          answer: value 
        };
        console.log(`Extracted WorkValues answer without question bank: ${questionId} = ${value}`);
      }
    }
  });
  
  console.log('WorkValues answers extracted:', Object.keys(workValuesAnswers).length);

  // Extract Employability answers - IMPROVED: Extract even if employabilityQuestions is empty
  const employabilityAnswers = {
    selfRating: {
      Communication: [],
      Teamwork: [],
      ProblemSolving: [],
      Adaptability: [],
      Leadership: [],
      DigitalFluency: [],
      Professionalism: [],
      CareerReadiness: []
    },
    sjt: []
  };

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('employability_')) {
      const questionId = key.replace('employability_', '');
      const question = employabilityQuestions?.find(q => q.id === questionId);
      
      if (question) {
        if (question.partType === 'selfRating') {
          const domain = question.type;
          if (employabilityAnswers.selfRating[domain]) {
            employabilityAnswers.selfRating[domain].push({
              question: question.text,
              answer: value,
              domain: question.moduleTitle
            });
          }
        } else if (question.partType === 'sjt') {
          const studentBest = value?.best || value;
          const studentWorst = value?.worst || null;
          let score = 1;
          if (studentBest === question.bestAnswer) score = 2;
          if (studentBest === question.worstAnswer) score = 0;

          employabilityAnswers.sjt.push({
            scenario: question.scenario || question.text,
            question: question.text,
            studentBestChoice: studentBest,
            studentWorstChoice: studentWorst,
            correctBest: question.bestAnswer,
            correctWorst: question.worstAnswer,
            bestCorrect: studentBest === question.bestAnswer,
            worstCorrect: studentWorst === question.worstAnswer,
            score
          });
        }
      } else {
        // FALLBACK: Extract even without question bank
        // Try to determine if it's SJT based on value structure
        if (typeof value === 'object' && (value?.best || value?.worst)) {
          employabilityAnswers.sjt.push({
            scenario: `Employability SJT question ${questionId}`,
            question: `Employability SJT question ${questionId}`,
            studentBestChoice: value?.best || value,
            studentWorstChoice: value?.worst || null,
            score: 1 // Default score when we can't verify
          });
        } else {
          // Assume it's a self-rating question
          employabilityAnswers.selfRating.CareerReadiness.push({
            question: `Employability question ${questionId}`,
            answer: value,
            domain: 'General'
          });
        }
        console.log(`Extracted Employability answer without question bank: ${questionId}`);
      }
    }
  });
  
  console.log('Employability SJT answers extracted:', employabilityAnswers.sjt.length);
  console.log('Employability selfRating categories with answers:', 
    Object.entries(employabilityAnswers.selfRating)
      .filter(([_, arr]) => arr.length > 0)
      .map(([key, arr]) => `${key}:${arr.length}`)
      .join(', ') || 'none'
  );

  // Extract Knowledge answers
  const knowledgeAnswers = {};
  const streamQuestions = streamKnowledgeQuestions?.[stream] || [];
  const knowledgePrefix = getSectionPrefix('knowledge', gradeLevel);
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${knowledgePrefix}_`)) {
      const questionId = key.replace(`${knowledgePrefix}_`, '');
      const question = streamQuestions.find(q => q.id === questionId);
      if (question) {
        knowledgeAnswers[questionId] = {
          question: question.text,
          studentAnswer: value,
          correctAnswer: question.correct,
          isCorrect: value === question.correct,
          options: question.options
        };
      }
    }
  });

  // Calculate aptitude scores
  const aptitudeScores = {
    verbal: calculateAptitudeScore(aptitudeAnswers.verbal),
    numerical: calculateAptitudeScore(aptitudeAnswers.numerical),
    abstract: calculateAptitudeScore(aptitudeAnswers.abstract),
    spatial: calculateAptitudeScore(aptitudeAnswers.spatial),
    clerical: calculateAptitudeScore(aptitudeAnswers.clerical)
  };

  // Calculate timing metrics
  const totalAptitudeQuestions = aptitudeQuestions?.length || 50;
  const timingData = {
    riasec: {
      seconds: sectionTimings.riasec || 0,
      formatted: formatTimeForPrompt(sectionTimings.riasec),
      questionsCount: riasecQuestions?.length || 0,
      avgSecondsPerQuestion: sectionTimings.riasec && riasecQuestions?.length 
        ? Math.round(sectionTimings.riasec / riasecQuestions.length) : 0
    },
    aptitude: {
      seconds: sectionTimings.aptitude || 0,
      formatted: formatTimeForPrompt(sectionTimings.aptitude),
      questionsCount: totalAptitudeQuestions,
      avgSecondsPerQuestion: sectionTimings.aptitude 
        ? Math.round(sectionTimings.aptitude / totalAptitudeQuestions) : 0
    },
    bigfive: {
      seconds: sectionTimings.bigfive || 0,
      formatted: formatTimeForPrompt(sectionTimings.bigfive),
      questionsCount: bigFiveQuestions?.length || 0,
      avgSecondsPerQuestion: sectionTimings.bigfive && bigFiveQuestions?.length 
        ? Math.round(sectionTimings.bigfive / bigFiveQuestions.length) : 0
    },
    values: {
      seconds: sectionTimings.values || 0,
      formatted: formatTimeForPrompt(sectionTimings.values),
      questionsCount: workValuesQuestions?.length || 0,
      avgSecondsPerQuestion: sectionTimings.values && workValuesQuestions?.length 
        ? Math.round(sectionTimings.values / workValuesQuestions.length) : 0
    },
    employability: {
      seconds: sectionTimings.employability || 0,
      formatted: formatTimeForPrompt(sectionTimings.employability),
      questionsCount: employabilityQuestions?.length || 0,
      avgSecondsPerQuestion: sectionTimings.employability && employabilityQuestions?.length 
        ? Math.round(sectionTimings.employability / employabilityQuestions.length) : 0
    },
    knowledge: {
      seconds: sectionTimings.knowledge || 0,
      formatted: formatTimeForPrompt(sectionTimings.knowledge),
      questionsCount: streamQuestions.length,
      avgSecondsPerQuestion: sectionTimings.knowledge && streamQuestions.length 
        ? Math.round(sectionTimings.knowledge / streamQuestions.length) : 0
    },
    totalTime: Object.values(sectionTimings).reduce((sum, t) => sum + (t || 0), 0)
  };
  timingData.totalFormatted = formatTimeForPrompt(timingData.totalTime);

  console.log('=== ASSESSMENT DATA PREPARED ===');
  console.log('Grade Level:', gradeLevel);
  console.log('Stream:', stream);
  console.log('RIASEC prefix used:', riasecPrefix);
  console.log('BigFive prefix used:', bigFivePrefix);
  console.log('Total answers received:', Object.keys(answers).length);
  console.log('Sample answer keys:', Object.keys(answers).slice(0, 10));
  console.log('RIASEC answers extracted:', Object.keys(riasecAnswers).length);
  console.log('BigFive answers extracted:', Object.keys(bigFiveAnswers).length);
  console.log('WorkValues answers extracted:', Object.keys(workValuesAnswers).length);
  console.log('Employability SJT answers:', employabilityAnswers.sjt.length);
  console.log('Knowledge answers extracted:', Object.keys(knowledgeAnswers).length);
  console.log('Aptitude scores:', aptitudeScores);
  
  // Debug: Check if riasecQuestions was provided
  console.log('riasecQuestions provided:', riasecQuestions?.length || 0);
  console.log('bigFiveQuestions provided:', bigFiveQuestions?.length || 0);
  console.log('workValuesQuestions provided:', workValuesQuestions?.length || 0);
  console.log('employabilityQuestions provided:', employabilityQuestions?.length || 0);
  
  // Debug: Check for keys that should match RIASEC pattern
  const riasecKeys = Object.keys(answers).filter(k => k.startsWith('riasec_'));
  console.log('Keys starting with riasec_:', riasecKeys.length, riasecKeys.slice(0, 5));

  // ============================================================================
  // RULE-BASED STREAM RECOMMENDATION (For After 10th students)
  // ============================================================================
  let ruleBasedStreamHint = null;
  
  if (gradeLevel === 'after10') {
    try {
      console.log('🎯 Calculating rule-based stream recommendation for After 10th student...');
      
      // Calculate RIASEC scores from answers for rule-based engine
      const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      Object.values(riasecAnswers).forEach(answer => {
        const { answer: value, categoryMapping, type } = answer;
        
        if (type === 'multiselect' && Array.isArray(value)) {
          value.forEach(option => {
            const riasecType = categoryMapping?.[option];
            if (riasecType) riasecScores[riasecType] = (riasecScores[riasecType] || 0) + 2;
          });
        } else if (type === 'singleselect') {
          const riasecType = categoryMapping?.[value];
          if (riasecType) riasecScores[riasecType] = (riasecScores[riasecType] || 0) + 2;
        } else if (type === 'rating' && typeof value === 'number') {
          // Rating 1-3: 0 points, 4: 1 point, 5: 2 points
          const points = value >= 4 ? (value === 5 ? 2 : 1) : 0;
          // Need to determine RIASEC type from question context
          // For now, distribute evenly or skip
        }
      });
      
      // Calculate rule-based recommendation
      const ruleBasedRecommendation = calculateStreamRecommendations(
        { riasec: { scores: riasecScores } },
        { subjectMarks: [], projects: [], experiences: [] }
      );
      
      ruleBasedStreamHint = {
        stream: ruleBasedRecommendation.recommendedStream,
        streamId: ruleBasedRecommendation.allStreamScores?.[0]?.streamId || 'pcms',
        confidence: ruleBasedRecommendation.confidenceScore,
        matchLevel: ruleBasedRecommendation.streamFit,
        reasoning: ruleBasedRecommendation.reasoning,
        riasecScores: riasecScores,
        alternativeStream: ruleBasedRecommendation.alternativeStream,
        allScores: ruleBasedRecommendation.allStreamScores?.slice(0, 3).map(s => ({
          stream: s.streamName,
          score: s.matchScore,
          category: s.category
        }))
      };
      
      console.log('✅ Rule-based recommendation:', ruleBasedStreamHint.stream);
      console.log('   Confidence:', ruleBasedStreamHint.confidence + '%');
      console.log('   RIASEC Scores:', riasecScores);
      console.log('   Alternative:', ruleBasedStreamHint.alternativeStream);
    } catch (error) {
      console.error('❌ Error calculating rule-based stream recommendation:', error);
      // Continue without rule-based hint
    }
  }

  return {
    stream,
    gradeLevel,
    riasecAnswers,
    aptitudeAnswers,
    aptitudeScores,
    bigFiveAnswers,
    workValuesAnswers,
    employabilityAnswers,
    knowledgeAnswers,
    totalKnowledgeQuestions: streamQuestions.length,
    totalAptitudeQuestions,
    sectionTimings: timingData,
    ruleBasedStreamHint, // Add rule-based hint for After 10th students
    adaptiveAptitudeResults: answers.adaptive_aptitude_results || null
  };
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Analyze assessment results using OpenRouter AI via Cloudflare Worker
 * 
 * @param {Object} answers - All answers from the assessment
 * @param {string} stream - Student's selected stream
 * @param {Object} questionBanks - All question banks for reference
 * @param {Object} sectionTimings - Time spent on each section in seconds
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', 'after10', or 'after12'
 * @returns {Promise<Object>} - AI-analyzed results with course recommendations
 */
export const analyzeAssessmentWithOpenRouter = async (
  answers, 
  stream, 
  questionBanks, 
  sectionTimings = {}, 
  gradeLevel = 'after12'
) => {
  console.log('🤖 Starting assessment analysis...');
  console.log(`📊 Grade: ${gradeLevel}, Stream: ${stream}`);
  
  updateProgress('preparing', 'Preparing your assessment data...');
  
  try {
    // Prepare the assessment data (includes rule-based stream hint for after10)
    const assessmentData = prepareAssessmentData(answers, stream, questionBanks, sectionTimings, gradeLevel);

    // Call the Cloudflare Worker (handles prompt building and AI call)
    let parsedResults = await callOpenRouterAssessment(assessmentData);

    // Validate stream recommendation for After 10th students
    if (gradeLevel === 'after10') {
      const { validateStreamRecommendation } = await import('./assessmentService');
      parsedResults = validateStreamRecommendation(parsedResults);
    }

    // Validate the results
    const { isValid, missingFields } = validateResults(parsedResults);
    if (!isValid) {
      console.warn('⚠️ Response has missing fields:', missingFields);
    }

    // Add course recommendations
    const resultsWithCourses = await addCourseRecommendations(parsedResults);
    
    updateProgress('saving', 'Saving your results...');
    
    console.log('✅ Assessment analysis complete');
    
    // Mark as complete after a short delay to show the saving stage
    setTimeout(() => updateProgress('complete', 'Analysis complete!'), 500);
    
    return resultsWithCourses;
    
  } catch (error) {
    console.error('❌ Assessment analysis failed:', error.message);
    updateProgress('error', error.message);
    throw new Error(`Assessment analysis failed: ${error.message}. Please try again.`);
  }
};

// Legacy alias for backward compatibility
export const analyzeAssessmentWithGemini = analyzeAssessmentWithOpenRouter;

/**
 * Calculate knowledge score from answers (legacy function)
 */
export const calculateKnowledgeWithGemini = async (answers, questions) => {
  let correct = 0;
  let total = 0;
  const incorrectTopics = [];
  const correctTopics = [];

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith('knowledge_')) {
      const questionId = key.replace('knowledge_', '');
      const question = questions.find(q => q.id === questionId);

      if (question) {
        total++;
        if (value === question.correct) {
          correct++;
          correctTopics.push(question.text.substring(0, 50));
        } else {
          incorrectTopics.push(question.text.substring(0, 50));
        }
      }
    }
  });

  return {
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
    correctCount: correct,
    totalQuestions: total,
    strongTopics: correctTopics.slice(0, 3),
    weakTopics: incorrectTopics.slice(0, 3)
  };
};

export default {
  analyzeAssessmentWithOpenRouter,
  analyzeAssessmentWithGemini: analyzeAssessmentWithOpenRouter,
  calculateKnowledgeWithGemini
};
