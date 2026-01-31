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
  const { getPagesApiUrl } = await import('../utils/pagesUrl');
  const API_URL = getPagesApiUrl('analyze-assessment');

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
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`📝 Assessment data keys:`, Object.keys(assessmentData));
  console.log(`🎯 STREAM CONTEXT: Student is in ${assessmentData.stream} stream, AI should recommend careers from this stream`);
  console.log(`📋 RIASEC Answers Count:`, Object.keys(assessmentData.riasecAnswers || {}).length);
  console.log(`📋 Aptitude Scores:`, assessmentData.aptitudeScores);

  updateProgress('analyzing', 'AI is processing your responses...');

  try {
    // Add cache-busting parameter to force new worker version
    // This bypasses Cloudflare edge cache to get the latest deployed version
    const cacheBuster = Date.now();
    const apiUrl = `${API_URL}?v=${cacheBuster}`;
    
    const response = await fetch(apiUrl, {
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
 * NOW considers ALL past assessments to provide comprehensive recommendations
 * 
 * @param {Object} assessmentResults - Parsed results from current AI assessment
 * @param {string} studentId - Student ID to fetch all past assessments
 * @returns {Promise<Object>} - Results with platformCourses, coursesByType, and skillGapCourses added
 */
export const addCourseRecommendations = async (assessmentResults, studentId = null) => {
  try {
    console.log('=== Adding Course Recommendations ===');
    updateProgress('courses', 'Finding relevant courses...');

    // If studentId provided, fetch all past assessments to build comprehensive profile
    let aggregatedProfile = assessmentResults;
    
    if (studentId) {
      try {
        console.log(`Fetching all past assessments for student: ${studentId}`);
        const { data: pastAssessments, error } = await supabase
          .from('personal_assessment_results')
          .select('riasec_scores, aptitude_scores, skill_gap, career_fit, stream_id, grade_level')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(5); // Consider last 5 assessments

        if (!error && pastAssessments && pastAssessments.length > 0) {
          console.log(`Found ${pastAssessments.length} past assessments`);
          
          // Aggregate skill gaps from all assessments
          const allSkillGaps = [];
          pastAssessments.forEach(assessment => {
            if (assessment.skill_gap?.priorityA) {
              allSkillGaps.push(...assessment.skill_gap.priorityA);
            }
          });

          // Deduplicate skills by name
          const uniqueSkills = Array.from(
            new Map(allSkillGaps.map(skill => [skill.skill, skill])).values()
          );

          // Merge with current assessment
          aggregatedProfile = {
            ...assessmentResults,
            skillGap: {
              ...assessmentResults.skillGap,
              priorityA: uniqueSkills.slice(0, 10), // Top 10 unique skills
              allAssessments: pastAssessments.length
            }
          };

          console.log(`Aggregated ${uniqueSkills.length} unique skills from ${pastAssessments.length} assessments`);
        }
      } catch (fetchError) {
        console.warn('Failed to fetch past assessments:', fetchError.message);
        // Continue with current assessment only
      }
    }

    let coursesByType = { technical: [], soft: [] };
    let platformCourses = [];

    try {
      // Fetch courses by type using aggregated profile
      coursesByType = await getRecommendedCoursesByType(aggregatedProfile, 5);
      console.log(`Found ${coursesByType.technical.length} technical and ${coursesByType.soft.length} soft skill courses`);

      platformCourses = [...coursesByType.technical, ...coursesByType.soft];

      // Fallback to combined fetch if by-type returned nothing
      if (platformCourses.length === 0) {
        platformCourses = await getRecommendedCourses(aggregatedProfile);
        console.log(`Fallback: Found ${platformCourses.length} platform course recommendations`);
      }
    } catch (error) {
      console.warn('Failed to get platform course recommendations:', error.message);
      try {
        platformCourses = await getRecommendedCourses(aggregatedProfile);
      } catch (fallbackError) {
        console.warn('Fallback also failed:', fallbackError.message);
      }
    }

    // Get courses mapped to each priority skill gap (using aggregated skills)
    let skillGapCourses = {};
    try {
      const skillGaps = aggregatedProfile.skillGap?.priorityA || [];
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
 * Exported for testing
 */
export const getSectionPrefix = (baseSection, gradeLevel) => {
  if (gradeLevel === 'middle') {
    const middleSchoolMap = {
      'riasec': 'middle_interest_explorer',
      'bigfive': 'middle_strengths_character',
      'knowledge': 'middle_learning_preferences'
    };
    return middleSchoolMap[baseSection] || baseSection;
  } else if (gradeLevel === 'highschool') {
    // NOTE: higher_secondary removed from here - it uses comprehensive sections with 'riasec', 'bigfive', etc.
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
  
  // MCQ questions (college/after10/after12)
  // Count answers where isCorrect is explicitly true (not null or undefined)
  const correctCount = answers.filter(a => a.isCorrect === true).length;
  const scoredCount = answers.filter(a => a.isCorrect !== null && a.isCorrect !== undefined).length;
  
  // Debug logging for troubleshooting
  if (scoredCount < answers.length) {
    console.warn(`⚠️ ${answers.length - scoredCount} answers could not be scored (missing correct answer data)`);
  }
  
  return {
    correct: correctCount,
    total: answers.length,
    scored: scoredCount,
    percentage: answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0
  };
};

/**
 * Prepare assessment data for analysis
 * Transforms raw answers into structured format for the AI
 * 
 * @param {Object} studentContext - Additional student context for better AI recommendations
 * @param {string} studentContext.rawGrade - Original grade string (e.g., "PG Year 1", "Grade 10")
 * @param {string} studentContext.programName - Student's program name (e.g., "MCA", "B.Tech CSE")
 * @param {string} studentContext.programCode - Program code if available
 * @param {string} studentContext.degreeLevel - Extracted degree level (undergraduate/postgraduate/diploma)
 */
const prepareAssessmentData = (answers, stream, questionBanks, sectionTimings = {}, gradeLevel = 'after12', preCalculatedScores = null, studentContext = {}) => {
  const { 
    riasecQuestions, 
    aptitudeQuestions, 
    bigFiveQuestions, 
    workValuesQuestions, 
    employabilityQuestions, 
    streamKnowledgeQuestions 
  } = questionBanks;

  // ============================================================================
  // ENHANCED LOGGING: Log grade level and section prefix before extraction (Requirement 6.1, 6.2)
  // ============================================================================
  console.log('=== prepareAssessmentData EXTRACTION START ===');
  console.log('📊 Grade Level:', gradeLevel);
  console.log('📊 Stream:', stream);
  console.log('📊 Total answers received:', Object.keys(answers).length);
  console.log('📊 Sample answer keys (first 10):', Object.keys(answers).slice(0, 10));
  console.log('📊 Sample answer entries (first 3):', Object.entries(answers).slice(0, 3));
  
  // Log section prefixes that will be used for extraction
  console.log('📊 Section Prefixes for extraction:');
  console.log('   - RIASEC prefix:', getSectionPrefix('riasec', gradeLevel));
  console.log('   - BigFive prefix:', getSectionPrefix('bigfive', gradeLevel));
  console.log('   - Aptitude prefix:', getSectionPrefix('aptitude', gradeLevel));
  console.log('   - Knowledge prefix:', getSectionPrefix('knowledge', gradeLevel));
  console.log('   - Values prefix: values (no mapping)');
  console.log('   - Employability prefix: employability (no mapping)');
  
  console.log('📊 Question banks provided:');
  console.log('   - riasecQuestions:', riasecQuestions?.length || 0);
  console.log('   - bigFiveQuestions:', bigFiveQuestions?.length || 0);
  console.log('   - workValuesQuestions:', workValuesQuestions?.length || 0);
  console.log('   - employabilityQuestions:', employabilityQuestions?.length || 0);
  console.log('   - aptitudeQuestions:', aptitudeQuestions?.length || 0);
  console.log('   - streamKnowledgeQuestions:', streamKnowledgeQuestions ? Object.keys(streamKnowledgeQuestions).length : 0, 'streams');

  // Extract RIASEC answers - IMPROVED: Extract even if riasecQuestions is empty
  const riasecAnswers = {};
  const riasecPrefix = getSectionPrefix('riasec', gradeLevel);
  console.log('🔍 RIASEC Extraction DEBUG:');
  console.log('  - RIASEC prefix:', riasecPrefix);
  console.log('  - Looking for keys starting with:', `${riasecPrefix}_`);
  console.log('  - Grade level:', gradeLevel);
  
  // First, try to extract using question bank
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${riasecPrefix}_`)) {
      console.log('  - Found RIASEC key:', key, 'value:', value);
      const questionId = key.replace(`${riasecPrefix}_`, '');
      const question = riasecQuestions?.find(q => q.id === questionId);
      
      if (question) {
        // For after10/after12/college: questions have a 'type' field (R, I, A, S, E, C)
        // This is the RIASEC category directly
        riasecAnswers[questionId] = {
          question: question.text,
          answer: value,
          riasecType: question.type, // Use the type field as RIASEC category
          categoryMapping: question.categoryMapping,
          questionType: question.categoryMapping ? 'multiselect' : 'rating' // Determine question type
        };
        console.log(`  ✅ Extracted with question bank: ${questionId}, RIASEC type: ${question.type}`);
      } else {
        // FALLBACK: For middle/high school questions (ms1, hs1, etc.) or standard RIASEC (r1, i1, etc.)
        // Middle/high school questions have categoryMapping in the question bank, so we need the question
        // For now, extract the answer and let the AI analyze it
        riasecAnswers[questionId] = {
          question: `Interest question ${questionId}`,
          answer: value,
          questionType: 'rating', // Middle/high school use rating scale
          categoryMapping: null, // Will be analyzed by AI
          riasecType: null // Unknown without question bank
        };
        console.log(`  ⚠️ Extracted without question bank (fallback): ${questionId} = ${value}`);
      }
    }
  });
  
  console.log('RIASEC answers extracted:', Object.keys(riasecAnswers).length);
  if (Object.keys(riasecAnswers).length === 0) {
    console.error('❌ NO RIASEC ANSWERS EXTRACTED! This will cause zero scores.');
    console.error('   Check if answer keys match expected format:', `${riasecPrefix}_ms1`, `${riasecPrefix}_hs1`, `${riasecPrefix}_r1`, 'etc.');
    console.error('   Available answer keys:', Object.keys(answers).filter(k => k.includes('interest') || k.includes('riasec')).slice(0, 10));
  } else {
    console.log('✅ RIASEC answers extracted successfully');
    console.log('   Sample extracted keys:', Object.keys(riasecAnswers).slice(0, 5));
    console.log('   Sample extracted values:', Object.values(riasecAnswers).slice(0, 2));
  }

  // ============================================================================
  // EXTRACTION SUMMARY: Log count of extracted answers (Requirement 6.2, 6.3)
  // ============================================================================
  console.log('📊 RIASEC Extraction Summary:');
  console.log('   - Prefix used:', riasecPrefix);
  console.log('   - Answers extracted:', Object.keys(riasecAnswers).length);
  console.log('   - Expected for higher_secondary: 48 (8 per RIASEC type)');
  console.log('   - Sample keys:', Object.keys(riasecAnswers).slice(0, 5).join(', '));

  // Extract Aptitude answers - IMPROVED: Handle AI-generated questions with correct answers
  const aptitudeAnswers = {
    verbal: [],
    numerical: [],
    abstract: [],
    spatial: [],
    clerical: []
  };

  // For AI-generated aptitude questions, the correct answer is stored in the question object
  const aptitudePrefix = getSectionPrefix('aptitude', gradeLevel);
  console.log('Aptitude prefix:', aptitudePrefix);
  console.log('📊 Aptitude questions available for scoring:', aptitudeQuestions?.length || 0);
  if (aptitudeQuestions?.length > 0) {
    console.log('📊 Sample question IDs:', aptitudeQuestions.slice(0, 3).map(q => q.id));
    console.log('📊 Sample question has correct_answer:', !!aptitudeQuestions[0]?.correct_answer, 'correct:', !!aptitudeQuestions[0]?.correct);
    console.log('📊 Sample question type:', aptitudeQuestions[0]?.type);
  } else {
    console.warn('⚠️ NO APTITUDE QUESTIONS AVAILABLE - Scoring will fail!');
    console.warn('⚠️ This usually means fetchAIAptitudeQuestions() did not return questions');
    console.warn('⚠️ Check if userId is correct and questions exist in career_assessment_ai_questions table');
  }
  
  // Track scoring statistics
  let questionsFound = 0;
  let questionsNotFound = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${aptitudePrefix}_`)) {
      const questionId = key.replace(`${aptitudePrefix}_`, '');
      const question = aptitudeQuestions?.find(q => q.id === questionId);
      
      if (question) {
        questionsFound++;
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
          // MCQ question with correct answer
          // Handle different field names: correct, correctAnswer, correct_answer, answer
          const correctAnswer = question.correct || question.correctAnswer || question.correct_answer || question.answer;
          
          // Normalize both values for comparison (handle JSONB strings, trim whitespace, etc.)
          const normalizeValue = (v) => {
            if (v === null || v === undefined) return '';
            // Convert to string and trim
            let str = String(v).trim();
            // Remove surrounding quotes if present (from JSONB)
            if (str.startsWith('"') && str.endsWith('"')) {
              str = str.slice(1, -1);
            }
            return str;
          };
          
          const normalizedStudentAnswer = normalizeValue(value);
          const normalizedCorrectAnswer = normalizeValue(correctAnswer);
          const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer;
          
          // Track statistics
          if (isCorrect) {
            correctAnswers++;
          } else {
            incorrectAnswers++;
          }
          
          // Debug log for troubleshooting (only log first few mismatches to avoid spam)
          if (!isCorrect && normalizedStudentAnswer && normalizedCorrectAnswer && incorrectAnswers <= 3) {
            console.log(`📝 Answer mismatch: "${normalizedStudentAnswer}" vs "${normalizedCorrectAnswer}" (question: ${questionId})`);
          }
          
          const answerData = {
            questionId,
            question: question.text || question.question,
            studentAnswer: normalizedStudentAnswer,
            correctAnswer: normalizedCorrectAnswer,
            isCorrect: isCorrect,
            subtype: question.subtype || question.category || 'verbal'
          };
          const category = (question.subtype || question.category || 'verbal').toLowerCase();
          
          // Map category to aptitude category
          // AI-generated questions use subtypes like 'english', 'mathematics', 'science', 'social_studies'
          // These need to be mapped to standard aptitude categories: verbal, numerical, abstract, spatial, clerical
          const categoryMap = {
            // Standard aptitude categories
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
            // AI-generated question subtypes (from question-generation-api)
            'english': 'verbal',           // English comprehension → Verbal reasoning
            'science': 'abstract',         // Science reasoning → Abstract/Logical reasoning
            'social_studies': 'verbal',    // Social studies → Verbal (reading comprehension)
            'history': 'verbal',           // History → Verbal
            'geography': 'spatial',        // Geography → Spatial reasoning
            'civics': 'verbal',            // Civics → Verbal
            'economics': 'numerical',      // Economics → Numerical reasoning
            'general_knowledge': 'verbal', // GK → Verbal
            'reasoning': 'abstract',       // General reasoning → Abstract
            'aptitude': 'numerical'        // General aptitude → Numerical
          };
          const mappedCategory = categoryMap[category] || category;
          
          if (aptitudeAnswers[mappedCategory]) {
            aptitudeAnswers[mappedCategory].push(answerData);
          } else {
            // Default to verbal if category not found
            aptitudeAnswers.verbal.push(answerData);
          }
        }
      } else {
        // FALLBACK: For AI-generated questions without questionBank lookup
        // Store the answer without scoring (will be sent to AI for analysis)
        questionsNotFound++;
        if (questionsNotFound <= 3) {
          console.log(`⚠️ Aptitude answer without question bank: ${questionId} = ${value}`);
        }
        aptitudeAnswers.verbal.push({
          questionId,
          question: `Aptitude question ${questionId}`,
          studentAnswer: value,
          correctAnswer: null, // Unknown
          isCorrect: null, // Unknown - cannot score without correct answer
          subtype: 'unknown'
        });
      }
    }
  });
  
  // Log scoring summary
  console.log('📊 Aptitude Scoring Summary:');
  console.log(`   Questions found: ${questionsFound}`);
  console.log(`   Questions NOT found: ${questionsNotFound}`);
  console.log(`   Correct answers: ${correctAnswers}`);
  console.log(`   Incorrect answers: ${incorrectAnswers}`);
  if (questionsNotFound > 0) {
    console.warn(`⚠️ ${questionsNotFound} questions could not be scored - check if aptitudeQuestions were properly fetched`);
  }
  
  console.log('Aptitude answers extracted:', {
    verbal: aptitudeAnswers.verbal.length,
    numerical: aptitudeAnswers.numerical.length,
    abstract: aptitudeAnswers.abstract.length,
    spatial: aptitudeAnswers.spatial.length,
    clerical: aptitudeAnswers.clerical.length
  });

  // ============================================================================
  // EXTRACTION SUMMARY: Log aptitude extraction details (Requirement 6.2, 6.3)
  // ============================================================================
  console.log('📊 Aptitude Extraction Summary:');
  console.log('   - Prefix used:', aptitudePrefix);
  console.log('   - Total answers extracted:', 
    aptitudeAnswers.verbal.length + 
    aptitudeAnswers.numerical.length + 
    aptitudeAnswers.abstract.length + 
    aptitudeAnswers.spatial.length + 
    aptitudeAnswers.clerical.length
  );
  console.log('   - By category:', {
    verbal: aptitudeAnswers.verbal.length,
    numerical: aptitudeAnswers.numerical.length,
    abstract: aptitudeAnswers.abstract.length,
    spatial: aptitudeAnswers.spatial.length,
    clerical: aptitudeAnswers.clerical.length
  });
  console.log('   - Expected for higher_secondary: 48 total (varies by category)');

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

  // ============================================================================
  // EXTRACTION SUMMARY: Log BigFive extraction details (Requirement 6.2, 6.3)
  // ============================================================================
  console.log('📊 BigFive Extraction Summary:');
  console.log('   - Prefix used:', bigFivePrefix);
  console.log('   - Answers extracted:', Object.keys(bigFiveAnswers).length);
  console.log('   - Expected for higher_secondary: 30 (6 per trait: O, C, E, A, N)');
  console.log('   - Sample keys:', Object.keys(bigFiveAnswers).slice(0, 5).join(', '));

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

  // ============================================================================
  // EXTRACTION SUMMARY: Log WorkValues extraction details (Requirement 6.2, 6.3)
  // ============================================================================
  console.log('📊 WorkValues Extraction Summary:');
  console.log('   - Prefix used: values (no mapping)');
  console.log('   - Answers extracted:', Object.keys(workValuesAnswers).length);
  console.log('   - Expected for higher_secondary: 24 (3 per dimension)');
  console.log('   - Sample keys:', Object.keys(workValuesAnswers).slice(0, 5).join(', '));

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

  // ============================================================================
  // EXTRACTION SUMMARY: Log Employability extraction details (Requirement 6.2, 6.3)
  // ============================================================================
  const totalSelfRating = Object.values(employabilityAnswers.selfRating).reduce((sum, arr) => sum + arr.length, 0);
  console.log('📊 Employability Extraction Summary:');
  console.log('   - Prefix used: employability (no mapping)');
  console.log('   - SJT answers extracted:', employabilityAnswers.sjt.length);
  console.log('   - Self-rating answers extracted:', totalSelfRating);
  console.log('   - Total answers:', employabilityAnswers.sjt.length + totalSelfRating);
  console.log('   - Expected for higher_secondary: 14 total (7 SJT + 7 self-rating)');

  // Extract Knowledge answers
  const knowledgeAnswers = {};
  const streamQuestions = streamKnowledgeQuestions?.[stream] || [];
  const knowledgePrefix = getSectionPrefix('knowledge', gradeLevel);
  console.log('📚 Knowledge prefix:', knowledgePrefix);
  console.log('📚 Stream questions available:', streamQuestions.length);
  if (streamQuestions.length === 0) {
    console.warn('⚠️ NO KNOWLEDGE QUESTIONS AVAILABLE - Scoring will fail!');
    console.warn('⚠️ Check if fetchAIKnowledgeQuestions() returned questions');
  }
  
  /**
   * Get the correct answer text from a question
   * Handles both "Option X" format and direct text format
   */
  const getCorrectAnswerText = (question) => {
    let correctAnswer = question.correct_answer || question.correctAnswer || question.correct;
    
    // If correct_answer is in "Option X" format, convert to actual text
    if (correctAnswer && typeof correctAnswer === 'string') {
      const optionMatch = correctAnswer.match(/^Option\s+([A-D])$/i);
      if (optionMatch && question.options) {
        const optionLetter = optionMatch[1].toUpperCase();
        const optionIndex = optionLetter.charCodeAt(0) - 'A'.charCodeAt(0);
        if (optionIndex >= 0 && optionIndex < question.options.length) {
          correctAnswer = question.options[optionIndex];
          console.log(`   🔄 Converted "${question.correct_answer}" to "${correctAnswer}"`);
        }
      }
    }
    
    // If correct is just a letter (A, B, C, D), convert to actual text
    if (correctAnswer && correctAnswer.length === 1 && /[A-D]/i.test(correctAnswer) && question.options) {
      const optionIndex = correctAnswer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
      if (optionIndex >= 0 && optionIndex < question.options.length) {
        correctAnswer = question.options[optionIndex];
        console.log(`   🔄 Converted letter "${question.correct}" to "${correctAnswer}"`);
      }
    }
    
    return correctAnswer;
  };
  
  let knowledgeFound = 0;
  let knowledgeNotFound = 0;
  let knowledgeCorrect = 0;
  
  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(`${knowledgePrefix}_`)) {
      const questionId = key.replace(`${knowledgePrefix}_`, '');
      const question = streamQuestions.find(q => q.id === questionId);
      if (question) {
        knowledgeFound++;
        // Get correct answer with format normalization
        const correctAnswer = getCorrectAnswerText(question);
        
        // Normalize values for comparison
        const normalizeValue = (v) => {
          if (v === null || v === undefined) return '';
          let str = String(v).trim();
          if (str.startsWith('"') && str.endsWith('"')) {
            str = str.slice(1, -1);
          }
          return str;
        };
        
        const normalizedStudentAnswer = normalizeValue(value);
        const normalizedCorrectAnswer = normalizeValue(correctAnswer);
        const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer;
        
        if (isCorrect) knowledgeCorrect++;
        
        knowledgeAnswers[questionId] = {
          question: question.text || question.question,
          studentAnswer: normalizedStudentAnswer,
          correctAnswer: normalizedCorrectAnswer,
          isCorrect: isCorrect,
          options: question.options
        };
      } else {
        knowledgeNotFound++;
        if (knowledgeNotFound <= 3) {
          console.log(`⚠️ Knowledge question not found: ${questionId}`);
        }
      }
    }
  });
  
  console.log('📚 Knowledge Scoring Summary:');
  console.log(`   Questions found: ${knowledgeFound}`);
  console.log(`   Questions NOT found: ${knowledgeNotFound}`);
  console.log(`   Correct answers: ${knowledgeCorrect}`);
  console.log('📚 Knowledge answers extracted:', Object.keys(knowledgeAnswers).length);

  // ============================================================================
  // EXTRACTION SUMMARY: Log Knowledge extraction details (Requirement 6.2, 6.3)
  // ============================================================================
  console.log('📊 Knowledge Extraction Summary:');
  console.log('   - Prefix used:', knowledgePrefix);
  console.log('   - Stream:', stream);
  console.log('   - Answers extracted:', Object.keys(knowledgeAnswers).length);
  console.log('   - Expected for higher_secondary: 20 (stream-specific)');
  console.log('   - Correct answers:', knowledgeCorrect);
  console.log('   - Sample keys:', Object.keys(knowledgeAnswers).slice(0, 5).join(', '));

  // Calculate aptitude scores - USE PRE-CALCULATED if available
  let aptitudeScores;
  if (preCalculatedScores?.aptitude) {
    console.log('✅ Using pre-calculated aptitude scores from attempt');
    aptitudeScores = preCalculatedScores.aptitude;
  } else {
    console.log('⚠️ Calculating aptitude scores from questions (fallback)');
    aptitudeScores = {
      verbal: calculateAptitudeScore(aptitudeAnswers.verbal),
      numerical: calculateAptitudeScore(aptitudeAnswers.numerical),
      abstract: calculateAptitudeScore(aptitudeAnswers.abstract),
      spatial: calculateAptitudeScore(aptitudeAnswers.spatial),
      clerical: calculateAptitudeScore(aptitudeAnswers.clerical)
    };
  }
  
  // Log calculated scores
  console.log('📊 Final Aptitude Scores:', JSON.stringify(aptitudeScores, null, 2));
  const totalCorrect = Object.values(aptitudeScores).reduce((sum, s) => sum + (s.correct || 0), 0);
  const totalQuestions = Object.values(aptitudeScores).reduce((sum, s) => sum + (s.total || 0), 0);
  console.log(`📊 Total Aptitude: ${totalCorrect}/${totalQuestions} correct (${totalQuestions > 0 ? Math.round((totalCorrect/totalQuestions)*100) : 0}%)`);
  
  // Calculate knowledge score - USE PRE-CALCULATED if available
  let knowledgeCorrectCount, knowledgeTotalCount;
  if (preCalculatedScores?.knowledge) {
    console.log('✅ Using pre-calculated knowledge scores from attempt');
    knowledgeCorrectCount = preCalculatedScores.knowledge.correct || 0;
    knowledgeTotalCount = preCalculatedScores.knowledge.total || 0;
  } else {
    console.log('⚠️ Calculating knowledge scores from questions (fallback)');
    knowledgeCorrectCount = Object.values(knowledgeAnswers).filter(a => a.isCorrect).length;
    knowledgeTotalCount = Object.keys(knowledgeAnswers).length;
  }
  console.log(`📚 Total Knowledge: ${knowledgeCorrectCount}/${knowledgeTotalCount} correct (${knowledgeTotalCount > 0 ? Math.round((knowledgeCorrectCount/knowledgeTotalCount)*100) : 0}%)`);


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
  // RULE-BASED STREAM RECOMMENDATION (For After 10th and After 12th students)
  // ============================================================================
  let ruleBasedStreamHint = null;
  
  if (gradeLevel === 'after10' || gradeLevel === 'after12') {
    try {
      console.log(`🎯 Calculating rule-based stream recommendation for ${gradeLevel} student...`);
      
      // Calculate RIASEC scores from answers for rule-based engine
      const riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      Object.values(riasecAnswers).forEach(answer => {
        const { answer: value, riasecType, categoryMapping, questionType } = answer;
        
        // For after10/after12/college: Use riasecType directly from question
        if (riasecType) {
          // Rating-based scoring (1-5 scale)
          if (typeof value === 'number') {
            // Rating 1-2: 0 points, 3: 1 point, 4: 2 points, 5: 3 points
            const points = value <= 2 ? 0 : (value === 3 ? 1 : (value === 4 ? 2 : 3));
            riasecScores[riasecType] = (riasecScores[riasecType] || 0) + points;
          }
        }
        // For middle/high school: Use categoryMapping
        else if (questionType === 'multiselect' && Array.isArray(value)) {
          value.forEach(option => {
            const mappedType = categoryMapping?.[option];
            if (mappedType) riasecScores[mappedType] = (riasecScores[mappedType] || 0) + 2;
          });
        } else if (questionType === 'singleselect') {
          const mappedType = categoryMapping?.[value];
          if (mappedType) riasecScores[mappedType] = (riasecScores[mappedType] || 0) + 2;
        } else if (questionType === 'rating' && typeof value === 'number') {
          // Rating 1-3: 0 points, 4: 1 point, 5: 2 points
          const points = value >= 4 ? (value === 5 ? 2 : 1) : 0;
          // Need to determine RIASEC type from question context
          // For now, distribute evenly or skip
        }
      });
      
      // ========================================================================
      // FLAT PROFILE DETECTION
      // ========================================================================
      // Check if RIASEC scores are too similar (flat profile)
      const riasecValues = Object.values(riasecScores);
      const maxRiasec = Math.max(...riasecValues);
      const minRiasec = Math.min(...riasecValues);
      const riasecRange = maxRiasec - minRiasec;
      const avgRiasec = riasecValues.reduce((a, b) => a + b, 0) / riasecValues.length;
      
      // Calculate variance to detect flat profile
      const riasecVariance = riasecValues.reduce((sum, val) => sum + Math.pow(val - avgRiasec, 2), 0) / riasecValues.length;
      const riasecStdDev = Math.sqrt(riasecVariance);
      
      // Flat profile: low standard deviation (all scores within ~3 points of each other)
      const isFlatProfile = riasecStdDev < 2 || riasecRange < 4;
      
      console.log('📊 RIASEC Profile Analysis:');
      console.log('   Range:', riasecRange, '(max:', maxRiasec, '- min:', minRiasec, ')');
      console.log('   Std Dev:', riasecStdDev.toFixed(2));
      console.log('   Is Flat Profile:', isFlatProfile);
      
      // Calculate rule-based recommendation
      const ruleBasedRecommendation = calculateStreamRecommendations(
        { riasec: { scores: riasecScores } },
        { subjectMarks: [], projects: [], experiences: [] }
      );
      
      // Adjust confidence for flat profiles
      let adjustedConfidence = ruleBasedRecommendation.confidenceScore;
      if (isFlatProfile) {
        // Lower confidence for flat profiles - max 70%
        adjustedConfidence = Math.min(70, adjustedConfidence);
        console.log('⚠️ Flat profile detected - lowering confidence from', ruleBasedRecommendation.confidenceScore, 'to', adjustedConfidence);
      }
      
      ruleBasedStreamHint = {
        stream: ruleBasedRecommendation.recommendedStream,
        streamId: ruleBasedRecommendation.allStreamScores?.[0]?.streamId || 'pcms',
        confidence: adjustedConfidence,
        matchLevel: isFlatProfile ? 'Medium' : ruleBasedRecommendation.streamFit,
        reasoning: ruleBasedRecommendation.reasoning,
        riasecScores: riasecScores,
        alternativeStream: ruleBasedRecommendation.alternativeStream,
        allScores: ruleBasedRecommendation.allStreamScores?.slice(0, 3).map(s => ({
          stream: s.streamName,
          score: s.matchScore,
          category: s.category
        })),
        // Add flat profile info for AI to consider
        profileAnalysis: {
          isFlatProfile,
          riasecRange,
          riasecStdDev: riasecStdDev.toFixed(2),
          warning: isFlatProfile ? 'Student has undifferentiated interests - multiple streams may be equally valid' : null
        }
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

  // Extract degree level from grade string if not provided
  let degreeLevel = studentContext.degreeLevel;
  if (!degreeLevel && studentContext.rawGrade) {
    const gradeStr = studentContext.rawGrade.toLowerCase();
    if (gradeStr.includes('pg') || gradeStr.includes('postgraduate') || gradeStr.includes('m.tech') || gradeStr.includes('mtech') || gradeStr.includes('mca') || gradeStr.includes('mba') || gradeStr.includes('m.sc')) {
      degreeLevel = 'postgraduate';
    } else if (gradeStr.includes('ug') || gradeStr.includes('undergraduate') || gradeStr.includes('b.tech') || gradeStr.includes('btech') || gradeStr.includes('bca') || gradeStr.includes('b.sc') || gradeStr.includes('b.com') || gradeStr.includes('ba ')) {
      degreeLevel = 'undergraduate';
    } else if (gradeStr.includes('diploma')) {
      degreeLevel = 'diploma';
    }
  }

  // ============================================================================
  // FINAL EXTRACTION SUMMARY: Log all extraction counts (Requirement 6.6)
  // ============================================================================
  console.log('📊 === FINAL EXTRACTION SUMMARY ===');
  console.log('📊 Grade Level:', gradeLevel);
  console.log('📊 Stream:', stream);
  console.log('📊 Total input answers:', Object.keys(answers).length);
  console.log('📊 Extracted answers by section:');
  console.log('   - RIASEC:', Object.keys(riasecAnswers).length, '/ expected: 48 for higher_secondary');
  console.log('   - BigFive:', Object.keys(bigFiveAnswers).length, '/ expected: 30 for higher_secondary');
  console.log('   - WorkValues:', Object.keys(workValuesAnswers).length, '/ expected: 24 for higher_secondary');
  console.log('   - Employability:', employabilityAnswers.sjt.length + Object.values(employabilityAnswers.selfRating).reduce((sum, arr) => sum + arr.length, 0), '/ expected: 14 for higher_secondary');
  console.log('   - Aptitude:', 
    aptitudeAnswers.verbal.length + 
    aptitudeAnswers.numerical.length + 
    aptitudeAnswers.abstract.length + 
    aptitudeAnswers.spatial.length + 
    aptitudeAnswers.clerical.length,
    '/ expected: 48 for higher_secondary'
  );
  console.log('   - Knowledge:', Object.keys(knowledgeAnswers).length, '/ expected: 20 for higher_secondary');
  console.log('📊 === END EXTRACTION SUMMARY ===');

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
    adaptiveAptitudeResults: answers.adaptive_aptitude_results || null,
    // Add student context for AI prompt enhancement
    studentContext: {
      rawGrade: studentContext.rawGrade || null,
      programName: studentContext.programName || null,
      programCode: studentContext.programCode || null,
      degreeLevel: degreeLevel || null
    }
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
 * @param {Object} studentContext - Additional student context (program, degree level, etc.)
 * @returns {Promise<Object>} - AI-analyzed results with course recommendations
 */
export const analyzeAssessmentWithOpenRouter = async (
  answers, 
  stream, 
  questionBanks, 
  sectionTimings = {}, 
  gradeLevel = 'after12',
  preCalculatedScores = null,
  studentContext = {}
) => {
  console.log('🤖 Starting assessment analysis...');
  console.log(`📊 Grade: ${gradeLevel}, Stream: ${stream}`);
  if (studentContext.rawGrade) {
    console.log(`📚 Student Context: ${studentContext.rawGrade}${studentContext.programName ? ` (${studentContext.programName})` : ''}`);
  }
  
  updateProgress('preparing', 'Preparing your assessment data...');
  
  try {
    // Prepare the assessment data (includes rule-based stream hint for after10 and student context)
    const assessmentData = prepareAssessmentData(answers, stream, questionBanks, sectionTimings, gradeLevel, preCalculatedScores, studentContext);

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

    // Add course recommendations (fetch studentId from auth)
    let studentId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get student_id from students table
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();
        studentId = student?.id;
      }
    } catch (error) {
      console.warn('Could not fetch studentId for course recommendations:', error.message);
    }

    // DISABLED: Course generation during assessment
    // Courses are now generated on-demand when user clicks a job role
    // This improves assessment generation speed significantly
    console.log('📋 Skipping course generation (will be generated on-demand)');
    // const resultsWithCourses = await addCourseRecommendations(parsedResults, studentId);
    
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
