/**
 * Assessment Service
 * Handles all database operations for the assessment system
 */

import { supabase } from '../lib/supabaseClient';
import { calculateStreamRecommendations } from '../features/assessment/assessment-result/utils/streamMatchingEngine';

/**
 * Validate and enhance stream recommendation for After 10th students
 * Uses rule-based engine to verify AI recommendation
 */
export const validateStreamRecommendation = (results) => {
  if (results.gradeLevel !== 'after10') return results;

  try {
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
      results.streamRecommendation = {
        ...ruleBasedStream,
        isAfter10: true,
        source: 'rule-based-fallback',
        reason: 'AI response did not include streamRecommendation',
        aiSuggestion: null
      };
      return results;
    }

    // If AI and rule-based differ significantly, use rule-based if confidence is high
    if (aiStream !== ruleStream && ruleConfidence >= 75) {
      // Use rule-based if confidence is high
      if (ruleConfidence >= 80) {
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
      results.streamRecommendation = {
        ...results.streamRecommendation,
        ruleBasedConfirmation: ruleStream,
        ruleBasedConfidence: ruleConfidence,
        source: 'ai-confirmed-by-rules'
      };
    }
  } catch (error) {
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
export const fetchQuestionsBySection = async (sectionId, streamId = null) => {
  let query = supabase
    .from('personal_assessment_questions')
    .select('*')
    .eq('section_id', sectionId)
    .eq('is_active', true)
    .order('order_number');

  // For stream-specific sections, filter by stream
  if (streamId) {
    query = query.eq('stream_id', streamId);
  } else {
    query = query.is('stream_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

/**
 * Fetch all questions for an assessment (organized by section)
 * @param {string} streamId - Student's selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 */
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

/**
 * Create a new assessment attempt
 * @param {string} studentId - Student's user_id
 * @param {string} streamId - Selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 */
export const createAttempt = async (studentId, streamId, gradeLevel) => {
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .insert({
      student_id: studentId,
      stream_id: streamId,
      grade_level: gradeLevel,
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

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
export const updateAttemptProgress = async (attemptId, progress) => {
  // Validate required parameters
  if (!attemptId) {
    const error = new Error('Attempt ID is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  try {
    // First fetch existing data to merge section_timings and all_responses
    const existingAttempt = await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('personal_assessment_attempts')
        .select('section_timings, all_responses')
        .eq('id', attemptId)
        .single();
      
      if (error) throw error;
      return data;
    }, 2, 500, 'fetch existing attempt data');

    // IMPORTANT: Merge section_timings with existing timings instead of replacing
    // This ensures all section timings are preserved across multiple updates
    const mergedSectionTimings = {
      ...(existingAttempt?.section_timings || {}),
      ...(progress.sectionTimings || {})
    };

    const updateData = {
      current_section_index: progress.sectionIndex,
      current_question_index: progress.questionIndex,
      section_timings: mergedSectionTimings,
      updated_at: new Date().toISOString(),
      status: 'in_progress' // CRITICAL: Ensure attempt is marked as in_progress when progress is updated
    };

    // Include timer_remaining if provided (for timed sections)
    if (progress.timerRemaining !== undefined && progress.timerRemaining !== null) {
      updateData.timer_remaining = progress.timerRemaining;
    }

    // Include elapsed_time if provided (for non-timed sections)
    if (progress.elapsedTime !== undefined && progress.elapsedTime !== null) {
      updateData.elapsed_time = progress.elapsedTime;
    }

    // Include aptitude_question_timer if provided (for aptitude section per-question timer)
    if (progress.aptitudeQuestionTimer !== undefined && progress.aptitudeQuestionTimer !== null) {
      updateData.aptitude_question_timer = progress.aptitudeQuestionTimer;
    }

    // Include adaptive_aptitude_session_id if provided (for adaptive section)
    if (progress.adaptiveAptitudeSessionId) {
      updateData.adaptive_aptitude_session_id = progress.adaptiveAptitudeSessionId;
    }

    // Include all_responses if provided (for non-UUID questions like RIASEC, BigFive, etc.)
    // IMPORTANT: Merge with existing all_responses instead of replacing
    if (progress.allResponses) {
      // Merge existing responses with new ones (new ones take precedence)
      const mergedResponses = {
        ...(existingAttempt?.all_responses || {}),
        ...progress.allResponses
      };
      updateData.all_responses = mergedResponses;
    }

    // Update with retry logic
    const data = await retryWithBackoff(async () => {
      const { data: updatedData, error } = await supabase
        .from('personal_assessment_attempts')
        .update(updateData)
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      return updatedData;
    }, 3, 500, 'update attempt progress');

    return data;
  } catch (error) {
    // Enhanced error for better debugging
    const enhancedError = new Error(`Failed to update progress: ${error.message}`);
    enhancedError.code = error.code || 'PROGRESS_UPDATE_FAILED';
    enhancedError.originalError = error;
    enhancedError.attemptId = attemptId;
    enhancedError.progress = progress;
    
    // Log but don't throw for non-critical progress updates
    // This allows the assessment to continue even if progress save fails
    throw enhancedError;
  }
};

/**
 * Save all responses to the attempt (for non-UUID questions)
 * This is used for RIASEC, BigFive, Values, Employability questions that have string IDs
 * @param {string} attemptId - Attempt UUID
 * @param {object} allResponses - All responses object { "riasec_r1": 4, "bigfive_o1": 3, ... }
 */
export const saveAllResponses = async (attemptId, allResponses) => {
  try {
    const { data, error } = await supabase
      .from('personal_assessment_attempts')
      .update({
        all_responses: allResponses,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
};

/**
 * Update the adaptive aptitude session ID for an attempt
 * @param {string} attemptId - Attempt UUID
 * @param {string} adaptiveSessionId - Adaptive aptitude session UUID
 */
export const updateAttemptAdaptiveSession = async (attemptId, adaptiveSessionId) => {
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      return null;
    }

    // Call the API endpoint to link session (uses admin client to bypass RLS)
    const response = await fetch('/api/adaptive-session/link-to-attempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        attemptId,
        sessionId: adaptiveSessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return null;
    }

    const result = await response.json();
    return result.attempt;
  } catch (err) {
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
  // Validate required parameters
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

  // Ensure responseValue is never null or undefined
  // Convert null/undefined to appropriate defaults based on type
  let sanitizedValue = responseValue;

  if (responseValue === null || responseValue === undefined) {
    // Default to empty string for text responses, empty array for multi-select
    sanitizedValue = '';
  } else if (Array.isArray(responseValue) && responseValue.length === 0) {
    // For empty arrays, store as empty array JSON
    sanitizedValue = [];
  }

  try {
    const data = await retryWithBackoff(async () => {
      const { data: responseData, error } = await supabase
        .from('personal_assessment_responses')
        .upsert({
          attempt_id: attemptId,
          question_id: questionId,
          response_value: sanitizedValue,
          is_correct: isCorrect,
          responded_at: new Date().toISOString()
        }, {
          onConflict: 'attempt_id,question_id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return responseData;
    }, 3, 500, `save response for question ${questionId}`);

    return data;
  } catch (error) {
    // Enhanced error for better debugging
    const enhancedError = new Error(`Failed to save response: ${error.message}`);
    enhancedError.code = error.code || 'RESPONSE_SAVE_FAILED';
    enhancedError.originalError = error;
    enhancedError.attemptId = attemptId;
    enhancedError.questionId = questionId;
    enhancedError.responseValue = sanitizedValue;
    throw enhancedError;
  }
};

/**
 * Get all responses for an attempt
 * @param {string} attemptId - Attempt UUID
 */
export const getAttemptResponses = async (attemptId) => {
  const { data, error } = await supabase
    .from('personal_assessment_responses')
    .select(`
      *,
      question:personal_assessment_questions(*)
    `)
    .eq('attempt_id', attemptId);

  if (error) throw error;
  return data;
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
 * @param {string} studentId - Student's user_id
 * @param {string} streamId - Selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 * @param {object} geminiResults - Full Gemini AI analysis results
 * @param {object} sectionTimings - Time spent on each section
 */
export const completeAttempt = async (attemptId, studentId, streamId, gradeLevel, geminiResults, sectionTimings) => {
  // Fetch the attempt to get adaptive_aptitude_session_id
  const { data: attemptData, error: attemptFetchError } = await supabase
    .from('personal_assessment_attempts')
    .select('adaptive_aptitude_session_id')
    .eq('id', attemptId)
    .single();

  const adaptiveAptitudeSessionId = attemptData?.adaptive_aptitude_session_id || null;
  
  // CRITICAL FIX: Verify that adaptive results exist before using the session ID
  // The foreign key constraint requires that adaptive_aptitude_results.session_id exists
  let validatedAdaptiveSessionId = null;
  
  if (adaptiveAptitudeSessionId) {
    const { data: adaptiveResults, error: adaptiveError } = await supabase
      .from('adaptive_aptitude_results')
      .select('session_id')
      .eq('session_id', adaptiveAptitudeSessionId)
      .maybeSingle();
    
    if (adaptiveError) {
      // Will NOT save adaptive_aptitude_session_id to avoid foreign key constraint error
    } else if (adaptiveResults) {
      validatedAdaptiveSessionId = adaptiveAptitudeSessionId;
    }
  }

  // ============================================================================
  // VALIDATION: Check for suspicious score patterns (Requirement 6.4, 6.5)
  // ============================================================================

  // Validate RIASEC scores
  const riasecValidation = validateRIASECScores(geminiResults?.riasec?.scores);

  // Validate aptitude scores
  const aptitudeValidation = validateAptitudeScores(geminiResults?.aptitude?.scores);

  // ============================================================================
  // CRITICAL VALIDATION: Ensure AI returned complete data
  // Validation is grade-level specific since different grades have different sections
  // ============================================================================

  // Define required fields based on grade level
  let requiredFields;

  if (gradeLevel === 'middle' || gradeLevel === 'highschool') {
    // Middle school and high school have 4 sections:
    // 1. Interest Explorer (RIASEC)
    // 2. Strengths & Character (characterStrengths)
    // 3. Learning & Work Preferences (learningStyle)
    // 4. Adaptive Aptitude Test (handled separately via adaptive_aptitude_session_id)
    requiredFields = [
      'riasec',             // Section 1: Interest Explorer
      'characterStrengths', // Section 2: Strengths & Character
      'learningStyle',      // Section 3: Learning & Work Preferences
      'careerFit'           // Career recommendations (derived from all sections)
    ];
  } else {
    // Comprehensive assessment for after10, after12, college, higher_secondary
    requiredFields = [
      'riasec',
      'aptitude',
      'bigFive',
      'workValues',
      'employability',
      'knowledge',
      'careerFit',
      'skillGap',
      'roadmap'
    ];
  }

  const missingFields = requiredFields.filter(field => !geminiResults[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `AI analysis incomplete. Missing ${missingFields.length} required fields: ${missingFields.join(', ')}. ` +
      `Please try again or contact support if the issue persists.`
    );
  }

  // Validate nested required fields (grade-level specific)
  let nestedValidation;

  if (gradeLevel === 'middle' || gradeLevel === 'highschool') {
    // Simplified nested validation for middle/high school
    nestedValidation = [
      { path: 'careerFit.clusters', value: geminiResults.careerFit?.clusters },
      { path: 'roadmap.projects', value: geminiResults.roadmap?.projects }
    ];
  } else {
    // Comprehensive nested validation
    nestedValidation = [
      { path: 'workValues.scores', value: geminiResults.workValues?.scores },
      { path: 'employability.skillScores', value: geminiResults.employability?.skillScores },
      { path: 'employability.overallReadiness', value: geminiResults.employability?.overallReadiness },
      { path: 'careerFit.clusters', value: geminiResults.careerFit?.clusters },
      { path: 'skillGap.priorityA', value: geminiResults.skillGap?.priorityA },
      { path: 'roadmap.projects', value: geminiResults.roadmap?.projects }
    ];
  }

  const missingNested = nestedValidation.filter(v => !v.value).map(v => v.path);

  if (missingNested.length > 0) {
    throw new Error(
      `AI analysis incomplete. Missing nested fields: ${missingNested.join(', ')}. ` +
      `Please try again or contact support if the issue persists.`
    );
  }

  // Prepare data for insertion - explicitly extract each field
  const riasecScoresRaw = geminiResults?.riasec?.scores || null;
  
  // FIX: If RIASEC scores are all zeros but _originalScores exists, use those instead
  // This handles cases where AI returns zeros in scores but has calculated values in _originalScores
  const riasecScores = riasecScoresRaw && 
    Object.values(riasecScoresRaw).every(v => v === 0) && 
    geminiResults?.riasec?._originalScores
    ? geminiResults.riasec._originalScores  // Use original scores if current scores are all zeros
    : riasecScoresRaw;
  
  const riasecCode = geminiResults?.riasec?.code || null;
  const bigfiveScores = geminiResults?.bigFive || null;
  const careerFit = geminiResults?.careerFit || null;
  const skillGap = geminiResults?.skillGap || null;
  const skillGapCourses = geminiResults?.skillGapCourses || null;
  const platformCourses = geminiResults?.platformCourses || null;
  const coursesByType = geminiResults?.coursesByType || null;
  const roadmap = geminiResults?.roadmap || null;
  const profileSnapshot = geminiResults?.profileSnapshot || null;
  const timingAnalysis = geminiResults?.timingAnalysis || null;
  const finalNote = geminiResults?.finalNote || null;
  const overallSummary = geminiResults?.overallSummary || null;

  // Grade-level specific fields - only extract for comprehensive assessments
  const isSimplifiedAssessment = gradeLevel === 'middle' || gradeLevel === 'highschool';

  // Aptitude - available for all grade levels (adaptive for middle/high school)
  const aptitudeScores = geminiResults?.aptitude?.scores || null;
  const aptitudeOverall = geminiResults?.aptitude?.overallScore ?? null;

  // CRITICAL FIX: Extract adaptive aptitude results if present
  // This data comes from the adaptive aptitude test and should be preserved
  const adaptiveAptitudeResults = geminiResults?.adaptiveAptitudeResults || null;

  // These fields are ONLY for comprehensive assessments (after10, after12, college, higher_secondary)
  const workValuesScores = isSimplifiedAssessment ? null : (geminiResults?.workValues?.scores || null);
  const employabilityScores = isSimplifiedAssessment ? null : (geminiResults?.employability?.skillScores || null);
  const employabilityReadiness = isSimplifiedAssessment ? null : (geminiResults?.employability?.overallReadiness || null);
  const knowledgeScore = isSimplifiedAssessment ? null : (geminiResults?.knowledge?.score ?? null);
  const knowledgeDetails = isSimplifiedAssessment ? null : (geminiResults?.knowledge || null);

  const dataToInsert = {
    attempt_id: attemptId,
    student_id: studentId,
    grade_level: gradeLevel,
    stream_id: streamId,
    status: 'completed',
    adaptive_aptitude_session_id: validatedAdaptiveSessionId, // Only save if verified to exist
    riasec_scores: riasecScores,
    riasec_code: riasecCode,
    aptitude_scores: aptitudeScores,
    aptitude_overall: aptitudeOverall,
    bigfive_scores: bigfiveScores,
    work_values_scores: workValuesScores,
    employability_scores: employabilityScores,
    employability_readiness: employabilityReadiness,
    knowledge_score: knowledgeScore,
    knowledge_details: knowledgeDetails,
    career_fit: careerFit,
    skill_gap: skillGap,
    skill_gap_courses: skillGapCourses,
    platform_courses: platformCourses,
    courses_by_type: coursesByType,
    roadmap: roadmap,
    profile_snapshot: profileSnapshot,
    timing_analysis: timingAnalysis,
    final_note: finalNote,
    overall_summary: overallSummary,
    gemini_results: geminiResults
  };

  // STEP 1: Save results FIRST (before marking attempt as completed)
  // This ensures if insert fails, the attempt stays "in_progress" and can be retried
  const { data: results, error: resultsError } = await supabase
    .from('personal_assessment_results')
    .upsert(dataToInsert, {
      onConflict: 'attempt_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (resultsError) {
    // Don't mark attempt as completed if results failed to save
    throw resultsError;
  }

  // STEP 2: Only mark attempt as completed AFTER results are saved successfully
  
  const { error: attemptError } = await supabase
    .from('personal_assessment_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      section_timings: sectionTimings
    })
    .eq('id', attemptId);

  // STEP 3: Create notification for assessment completion
  try {
    // Fetch user_id from students table (studentId is the student record ID, not user_id)
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    if (!studentError && studentData?.user_id) {
      await supabase
        .from('notifications')
        .insert({
          recipient_id: studentData.user_id,
          type: 'assessment_completed',
          title: 'Career Assessment Completed',
          message: `Your ${gradeLevel === 'middle' ? 'Middle School' : gradeLevel === 'highschool' ? 'High School' : gradeLevel === 'after10' ? 'After 10th' : gradeLevel === 'after12' ? 'After 12th' : 'College'} career assessment has been completed. View your personalized results and career recommendations.`,
          assessment_id: attemptId,
          read: false,
          created_at: new Date().toISOString()
        });
    }
  } catch (notifErr) {
    // Don't throw - notification is not critical
  }

  return results;
};

/**
 * Get student's assessment history
 * @param {string} studentId - Student's user_id
 */
export const getStudentAttempts = async (studentId) => {
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get a specific attempt with full results
 * @param {string} attemptId - Attempt UUID
 */
export const getAttemptWithResults = async (attemptId) => {
  // 🔧 CRITICAL FIX: Join with personal_assessment_results to get the result record
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select(`
      *,
      results:personal_assessment_results(*)
    `)
    .eq('id', attemptId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get the latest completed assessment result for a student
 * @param {string} studentIdOrUserId - Student's ID from students table OR user_id from auth
 * @returns {object|null} Latest assessment result, or null if none found
 */
export const getLatestResult = async (studentIdOrUserId) => {
  if (!studentIdOrUserId) {
    return null;
  }

  // Try direct lookup first (assuming it's student.id)
  let { data, error } = await supabase
    .from('personal_assessment_results')
    .select('*')
    .eq('student_id', studentIdOrUserId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  // If found, return it
  if (data) {
    // CRITICAL FIX: Fetch adaptive aptitude data if linked
    if (data.adaptive_aptitude_session_id) {
      try {
        const { data: adaptiveResults } = await supabase
          .from('adaptive_aptitude_results')
          .select('*')
          .eq('session_id', data.adaptive_aptitude_session_id)
          .single();
        
        if (adaptiveResults) {
          // Add to gemini_results if it exists
          if (data.gemini_results) {
            data.gemini_results.adaptiveAptitudeResults = adaptiveResults;
          }
        }
      } catch (adaptiveError) {
        // Don't fail the whole request if adaptive data is missing
      }
    }
    
    return data;
  }

  // If not found, try looking up by user_id (in case we were passed auth.uid())
  try {
    // Get student.id from user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentIdOrUserId)
      .maybeSingle();

    if (studentError || !student) {
      return null;
    }

    // Now try again with the correct student.id
    const { data: resultData, error: resultError } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .eq('student_id', student.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resultError) {
      return null;
    }

    if (resultData) {
      // CRITICAL FIX: Fetch adaptive aptitude data if linked
      if (resultData.adaptive_aptitude_session_id) {
        try {
          const { data: adaptiveResults } = await supabase
            .from('adaptive_aptitude_results')
            .select('*')
            .eq('session_id', resultData.adaptive_aptitude_session_id)
            .single();
          
          if (adaptiveResults) {
            // Add to gemini_results if it exists
            if (resultData.gemini_results) {
              resultData.gemini_results.adaptiveAptitudeResults = adaptiveResults;
            }
          }
        } catch (adaptiveError) {
          // Don't fail the whole request if adaptive data is missing
        }
      }
    }

    return resultData;
  } catch (err) {
    return null;
  }
};

/**
 * Check if student can take assessment (6-month restriction)
 * In development mode, the restriction is bypassed for testing.
 * 
 * @param {string} studentId - Student's user_id
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 * @returns {object} { canTake: boolean, lastAttemptDate: Date|null, nextAvailableDate: Date|null }
 */
export const canTakeAssessment = async (studentId, gradeLevel = null) => {
  // Bypass restriction in development mode
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  if (isDevelopment) {
    return { canTake: true, lastAttemptDate: null, nextAvailableDate: null, devBypass: true };
  }

  const { data, error } = await supabase
    .from('personal_assessment_results')
    .select('created_at')
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

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
 * Check if student has an in-progress attempt
 * @param {string} studentIdOrUserId - Student's ID from students table OR user_id from auth
 * @returns {object|null} In-progress attempt with responses, or null if none found
 */
export const getInProgressAttempt = async (studentIdOrUserId) => {
  if (!studentIdOrUserId) {
    return null;
  }

  /**
   * Validate that an attempt has all required fields and correct data structure
   * Validates: Requirements 2.4, 3.2
   * @param {object} attempt - The attempt object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  const validateAttemptStructure = (attempt) => {
    if (!attempt) return false;

    // Required fields that must exist
    const requiredFields = [
      'id',
      'student_id',
      'stream_id',
      'grade_level',
      'status',
      'created_at',
      'current_section_index',
      'current_question_index'
    ];

    // Check all required fields exist
    for (const field of requiredFields) {
      if (attempt[field] === undefined || attempt[field] === null) {
        return false;
      }
    }

    // Validate field types
    if (typeof attempt.id !== 'string') {
      return false;
    }

    if (typeof attempt.student_id !== 'string') {
      return false;
    }

    if (typeof attempt.stream_id !== 'string') {
      return false;
    }

    if (typeof attempt.grade_level !== 'string') {
      return false;
    }

    if (attempt.status !== 'in_progress') {
      return false;
    }

    if (typeof attempt.current_section_index !== 'number') {
      return false;
    }

    if (typeof attempt.current_question_index !== 'number') {
      return false;
    }

    return true;
  };

  /**
   * Helper function to check if an attempt has meaningful progress
   * An attempt is considered "started" if it has:
   * - At least one response in personal_assessment_responses table, OR
   * - At least one answer in all_responses JSONB column, OR
   * - An adaptive aptitude session with progress, OR
   * - current_question_index > 0 (meaning at least one question was viewed/answered)
   */
  const hasProgress = (attempt) => {
    if (!attempt) return false;

    // CRITICAL FIX: Check if current_question_index > 0 (user has answered at least one question)
    if (attempt.current_question_index > 0) {
      return true;
    }

    // Check for answers in all_responses JSONB
    if (attempt.all_responses && typeof attempt.all_responses === 'object') {
      const keys = Object.keys(attempt.all_responses);
      // Filter out metadata keys that aren't actual answers
      const answerKeys = keys.filter(k =>
        !k.startsWith('_') &&
        k !== 'adaptive_aptitude_results'
      );
      if (answerKeys.length > 0) {
        return true;
      }
    }

    // Check for progress in assessment_snapshot_v2 (for college students)
    if (attempt.assessment_snapshot_v2?.sections) {
      const sections = attempt.assessment_snapshot_v2.sections;
      const hasSectionProgress = Object.values(sections).some(
        section => section.questions && section.questions.length > 0
      );
      if (hasSectionProgress) {
        return true;
      }
    }

    // Check for adaptive aptitude session progress
    if (attempt.adaptive_aptitude_session_id) {
      return true;
    }

    return false;
  };

  /**
   * Helper function to fetch adaptive session progress
   * Returns the number of questions answered in the adaptive session
   */
  const fetchAdaptiveProgress = async (sessionId) => {
    if (!sessionId) return null;

    try {
      const { data: sessionData, error } = await supabase
        .from('adaptive_aptitude_sessions')
        .select('questions_answered, current_question_index, status, current_phase')
        .eq('id', sessionId)
        .maybeSingle();

      if (error || !sessionData) {
        return null;
      }

      return {
        questionsAnswered: sessionData.questions_answered || 0,
        currentQuestionIndex: sessionData.current_question_index || 0,
        status: sessionData.status,
        currentPhase: sessionData.current_phase
      };
    } catch (err) {
      return null;
    }
  };

  // Try direct lookup first (assuming it's student.id)
  // Using maybeSingle() to avoid 406 errors when no rows are found
  let { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select('*')
    .eq('student_id', studentIdOrUserId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Handle errors (maybeSingle returns null for no rows, no error)
  if (error) {
    throw error;
  }

  // If found, check if it has actual progress
  if (data) {
    // Validate attempt structure before proceeding
    if (!validateAttemptStructure(data)) {
      return null;
    }

    if (hasProgress(data)) {
      // Fetch adaptive progress if there's an adaptive session
      if (data.adaptive_aptitude_session_id) {
        const adaptiveProgress = await fetchAdaptiveProgress(data.adaptive_aptitude_session_id);
        if (adaptiveProgress) {
          data.adaptiveProgress = adaptiveProgress;
        }
      }

      return data;
    } else {
      // Attempt exists but has no progress - abandon it silently
      try {
        await supabase
          .from('personal_assessment_attempts')
          .update({ status: 'abandoned' })
          .eq('id', data.id);
      } catch (abandonErr) {
        // Continue anyway
      }
      // Continue to check for other attempts or return null
      data = null;
    }
  }

  // If not found or abandoned, try looking up by user_id (in case we were passed auth.uid())
  try {
    // Get student.id from user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentIdOrUserId)
      .maybeSingle();

    if (studentError || !student) {
      return null;
    }

    // Now try again with the correct student.id
    // Using maybeSingle() to avoid 406 errors when no rows are found
    const { data: attemptData, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('*')
      .eq('student_id', student.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Handle errors (maybeSingle returns null for no rows, no error)
    if (attemptError) {
      return null;
    }

    if (!attemptData) {
      return null;
    }

    if (attemptData) {
      // Validate attempt structure before proceeding
      if (!validateAttemptStructure(attemptData)) {
        return null;
      }

      if (hasProgress(attemptData)) {
        // Fetch adaptive progress if there's an adaptive session
        if (attemptData.adaptive_aptitude_session_id) {
          const adaptiveProgress = await fetchAdaptiveProgress(attemptData.adaptive_aptitude_session_id);
          if (adaptiveProgress) {
            attemptData.adaptiveProgress = adaptiveProgress;
          }
        }

        return attemptData;
      } else {
        // Attempt exists but has no progress - abandon it silently
        try {
          await supabase
            .from('personal_assessment_attempts')
            .update({ status: 'abandoned' })
            .eq('id', attemptData.id);
        } catch (abandonErr) {
          // Continue anyway
        }
        return null;
      }
    }

    return attemptData;
  } catch (err) {
    return null;
  }
};

/**
 * Abandon an in-progress attempt
 * @param {string} attemptId - Attempt UUID
 */
export const abandonAttempt = async (attemptId) => {
  const { error } = await supabase
    .from('personal_assessment_attempts')
    .update({
      status: 'abandoned',
      updated_at: new Date().toISOString()
    })
    .eq('id', attemptId);

  if (error) throw error;
};

/**
 * Transform database questions to match existing frontend format
 * This helps maintain backward compatibility with the existing UI
 */
export const transformQuestionsForUI = (dbQuestions, sectionName) => {
  return dbQuestions.map(q => {
    const base = {
      id: q.id,
      text: q.question_text,
      type: q.subtype,
      moduleTitle: q.module_title
    };

    // Add options for MCQ questions
    if (q.question_type === 'mcq' && q.options) {
      base.options = q.options;
      base.correct = q.correct_answer;
    }

    // Add SJT-specific fields
    if (q.question_type === 'sjt') {
      base.partType = 'sjt';
      base.scenario = q.scenario;
      base.options = q.options;
      base.bestAnswer = q.best_answer;
      base.worstAnswer = q.worst_answer;
    }

    // Add self-rating fields
    if (q.part_type === 'selfRating') {
      base.partType = 'selfRating';
    }

    return base;
  });
};

/**
 * Calculate aptitude scores from answers and questions
 * @param {Array} answers - Array of answer objects
 * @param {Array} questions - Array of question objects with correct_answer
 * @returns {Object} Scores object broken down by category
 */
export const calculateAptitudeScores = (answers, questions) => {
  if (!answers || !questions || answers.length === 0 || questions.length === 0) {
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
      subtype: q.subtype || q.category || 'verbal'
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
  if (!answers || !questions || answers.length === 0 || questions.length === 0) {
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
 * @param {string} studentId - Student's user_id
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
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.code === 'PGRST116' || // Row not found
          error.code === '23505' ||    // Unique violation
          error.code === '23503' ||    // Foreign key violation
          error.message?.includes('JWT') || // Auth errors
          error.message?.includes('permission')) { // Permission errors
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  throw lastError;
};

/**
 * Complete assessment attempt without AI analysis (industrial-grade error handling)
 * @param {string} attemptId - Assessment attempt ID
 * @param {string} studentId - Student ID
 * @param {string} streamId - Stream ID
 * @param {string} gradeLevel - Grade level
 * @param {object} sectionTimings - Time spent on each section
 * @returns {Promise<object>} Result record
 */
export const completeAttemptWithoutAI = async (attemptId, studentId, streamId, gradeLevel, sectionTimings) => {
  // Validate required parameters
  if (!attemptId) {
    const error = new Error('Attempt ID is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  if (!studentId) {
    const error = new Error('Student ID is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // CRITICAL FIX: Get adaptive aptitude session ID from attempt's all_responses if it exists
  let adaptiveSessionId = null;
  try {
    adaptiveSessionId = await retryWithBackoff(async () => {
      const { data: attemptData, error } = await supabase
        .from('personal_assessment_attempts')
        .select('all_responses, adaptive_aptitude_session_id')
        .eq('id', attemptId)
        .single();
      
      if (error) throw error;
      
      // First check if it's already stored in the column
      if (attemptData?.adaptive_aptitude_session_id) {
        return attemptData.adaptive_aptitude_session_id;
      }
      
      // For college students, also check assessment_snapshot_v2 for adaptive results
      if (attemptData?.assessment_snapshot_v2?.sections?.adaptive_aptitude?.session_id) {
        return attemptData.assessment_snapshot_v2.sections.adaptive_aptitude.session_id;
      }

      // Fallback: Extract from all_responses
      const adaptiveResults = attemptData?.all_responses?.adaptive_aptitude_results;
      const sessionId = adaptiveResults?.sessionId || adaptiveResults?.session_id || null;
      
      return sessionId;
    }, 2, 500, 'fetch adaptive session ID');
  } catch (err) {
    // Non-critical error, continue without adaptive session ID
  }

  // Update attempt status to completed with retry logic
  try {
    await retryWithBackoff(async () => {
      const { error: attemptError } = await supabase
        .from('personal_assessment_attempts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          section_timings: sectionTimings
        })
        .eq('id', attemptId);

      if (attemptError) {
        throw attemptError;
      }
    }, 3, 1000, 'update attempt status');
  } catch (error) {
    // Critical error - cannot proceed without marking attempt as completed
    const enhancedError = new Error(`Failed to complete assessment: ${error.message}`);
    enhancedError.code = 'ATTEMPT_UPDATE_FAILED';
    enhancedError.originalError = error;
    enhancedError.attemptId = attemptId;
    throw enhancedError;
  }

  // Create a minimal result record WITHOUT AI analysis
  // AI analysis will be generated on-demand when viewing result page
  const dataToInsert = {
    attempt_id: attemptId,
    student_id: studentId,
    grade_level: gradeLevel,
    stream_id: streamId,
    status: 'completed',
    adaptive_aptitude_session_id: adaptiveSessionId,
    // All AI fields are null - will be populated when AI analysis runs
    riasec_scores: null,
    riasec_code: null,
    aptitude_scores: null,
    aptitude_overall: null,
    bigfive_scores: null,
    work_values_scores: null,
    employability_scores: null,
    employability_readiness: null,
    knowledge_score: null,
    knowledge_details: null,
    career_fit: null,
    skill_gap: null,
    skill_gap_courses: null,
    roadmap: null,
    profile_snapshot: null,
    timing_analysis: null,
    final_note: null,
    overall_summary: null,
    gemini_results: null
  };

  // Insert result with retry logic
  let results;
  try {
    results = await retryWithBackoff(async () => {
      const { data, error: resultsError } = await supabase
        .from('personal_assessment_results')
        .upsert(dataToInsert, {
          onConflict: 'attempt_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (resultsError) {
        throw resultsError;
      }
      
      return data;
    }, 3, 1000, 'insert result record');
  } catch (error) {
    // Critical error - result record creation failed
    const enhancedError = new Error(`Failed to save assessment results: ${error.message}`);
    enhancedError.code = 'RESULT_INSERT_FAILED';
    enhancedError.originalError = error;
    enhancedError.attemptId = attemptId;
    throw enhancedError;
  }

  return results;
};

/**
 * Save aptitude scores to assessment attempt
 * @param {string} attemptId - Assessment attempt ID
 * @param {Object} scores - Aptitude scores object
 * @returns {Promise<Object>} Updated attempt
 */
export const saveAptitudeScores = async (attemptId, scores) => {
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .update({
      aptitude_scores: scores,
      updated_at: new Date().toISOString()
    })
    .eq('id', attemptId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Save knowledge scores to assessment attempt
 * @param {string} attemptId - Assessment attempt ID
 * @param {Object} scores - Knowledge scores object
 * @returns {Promise<Object>} Updated attempt
 */
export const saveKnowledgeScores = async (attemptId, scores) => {
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .update({
      knowledge_scores: scores,
      updated_at: new Date().toISOString()
    })
    .eq('id', attemptId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
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
  getStudentAttempts,
  getAttemptWithResults,
  getLatestResult,
  getInProgressAttempt,
  abandonAttempt,
  transformQuestionsForUI,
  canTakeAssessment,
  calculateAptitudeScores,
  calculateKnowledgeScores,
  saveAptitudeScores,
  saveKnowledgeScores
};
