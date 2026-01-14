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
    console.log('🔍 Validating stream recommendation for After 10th student...');
    
    // Calculate rule-based recommendation
    const ruleBasedStream = calculateStreamRecommendations(
      { riasec: { scores: results.riasec?.scores || {} } },
      { subjectMarks: [], projects: [], experiences: [] }
    );
    
    const aiStream = results.streamRecommendation?.recommendedStream;
    const ruleStream = ruleBasedStream.recommendedStream;
    const ruleConfidence = ruleBasedStream.confidenceScore;
    
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
export const updateAttemptProgress = async (attemptId, progress) => {
  const updateData = {
    current_section_index: progress.sectionIndex,
    current_question_index: progress.questionIndex,
    section_timings: progress.sectionTimings,
    updated_at: new Date().toISOString()
  };
  
  // Include timer_remaining if provided (for timed sections)
  if (progress.timerRemaining !== undefined && progress.timerRemaining !== null) {
    updateData.timer_remaining = progress.timerRemaining;
  }
  
  // Include elapsed_time if provided (for non-timed sections)
  if (progress.elapsedTime !== undefined && progress.elapsedTime !== null) {
    updateData.elapsed_time = progress.elapsedTime;
  }

  // Include adaptive_aptitude_session_id if provided (for adaptive section)
  if (progress.adaptiveAptitudeSessionId) {
    updateData.adaptive_aptitude_session_id = progress.adaptiveAptitudeSessionId;
  }

  // Include all_responses if provided (for non-UUID questions like RIASEC, BigFive, etc.)
  // IMPORTANT: Merge with existing responses to preserve previous sections
  if (progress.allResponses) {
    console.log('🔍 DEBUG: Saving all_responses to database');
    console.log('🔍 DEBUG: allResponses count:', Object.keys(progress.allResponses).length);
    console.log('🔍 DEBUG: Sample keys:', Object.keys(progress.allResponses).slice(0, 10));
    console.log('🔍 DEBUG: Sample values:', Object.entries(progress.allResponses).slice(0, 3));
    
    // Load existing responses from database to merge
    try {
      const { data: existingAttempt } = await supabase
        .from('personal_assessment_attempts')
        .select('all_responses')
        .eq('id', attemptId)
        .single();
      
      // Merge existing responses with new ones (new ones override if same key)
      const mergedResponses = {
        ...(existingAttempt?.all_responses || {}),
        ...progress.allResponses
      };
      
      console.log('🔄 DEBUG: Merged responses count:', Object.keys(mergedResponses).length);
      updateData.all_responses = mergedResponses;
    } catch (mergeError) {
      console.warn('⚠️ Could not merge responses, using new ones only:', mergeError);
      updateData.all_responses = progress.allResponses;
    }
  } else {
    console.warn('⚠️ DEBUG: allResponses is empty or undefined!');
  }
  
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .update(updateData)
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
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
      console.error('Error saving all responses:', error);
      throw error;
    }
    
    console.log('✅ All responses saved to database');
    return data;
  } catch (err) {
    console.error('Error in saveAllResponses:', err);
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
    const { data, error } = await supabase
      .from('personal_assessment_attempts')
      .update({
        adaptive_aptitude_session_id: adaptiveSessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      // Log but don't throw - this is a non-critical operation
      console.warn('Could not update adaptive session ID:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    // Catch any unexpected errors - column might not exist yet
    console.warn('Error updating adaptive session ID:', err.message);
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
export const saveResponse = async (attemptId, questionId, responseValue, isCorrect = null) => {
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

  console.log('Saving response:', {
    attemptId,
    questionId,
    originalValue: responseValue,
    sanitizedValue,
    valueType: typeof sanitizedValue,
    isCorrect
  });

  const { data, error } = await supabase
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
    console.error('Error saving response:', error);
    console.error('Failed data:', {
      attempt_id: attemptId,
      question_id: questionId,
      response_value: sanitizedValue,
      is_correct: isCorrect
    });
    throw error;
  }

  return data;
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
 * Complete an assessment attempt and save results
 * @param {string} attemptId - Attempt UUID
 * @param {string} studentId - Student's user_id
 * @param {string} streamId - Selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 * @param {object} geminiResults - Full Gemini AI analysis results
 * @param {object} sectionTimings - Time spent on each section
 */
export const completeAttempt = async (attemptId, studentId, streamId, gradeLevel, geminiResults, sectionTimings) => {
  console.log('=== completeAttempt Debug ===');
  console.log('Grade Level:', gradeLevel);
  console.log('Student ID:', studentId);
  console.log('Stream ID:', streamId);
  console.log('Has geminiResults:', !!geminiResults);
  console.log('Gemini Results Keys:', geminiResults ? Object.keys(geminiResults) : []);

  // ============================================================================
  // CRITICAL VALIDATION: Ensure AI returned complete data
  // ============================================================================
  
  const requiredFields = [
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
  
  const missingFields = requiredFields.filter(field => !geminiResults[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ CRITICAL: AI returned incomplete data!');
    console.error('❌ Missing required fields:', missingFields);
    console.error('❌ AI Response Keys:', Object.keys(geminiResults));
    console.error('❌ Full AI Response:', JSON.stringify(geminiResults, null, 2));
    
    throw new Error(
      `AI analysis incomplete. Missing ${missingFields.length} required fields: ${missingFields.join(', ')}. ` +
      `Please try again or contact support if the issue persists.`
    );
  }

  // Validate nested required fields
  const nestedValidation = [
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

  console.log('✅ AI Response Validation Passed - All required fields present');

  // Update attempt status
  const { error: attemptError } = await supabase
    .from('personal_assessment_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      section_timings: sectionTimings
    })
    .eq('id', attemptId);

  if (attemptError) {
    console.error('Error updating attempt:', attemptError);
    throw attemptError;
  }

  // Prepare data for insertion - NO FALLBACKS, use actual AI data
  const dataToInsert = {
    attempt_id: attemptId,
    student_id: studentId,
    grade_level: gradeLevel,
    stream_id: streamId,
    status: 'completed',
    riasec_scores: geminiResults.riasec.scores,
    riasec_code: geminiResults.riasec.code,
    aptitude_scores: geminiResults.aptitude.scores,
    aptitude_overall: geminiResults.aptitude.overallScore,
    bigfive_scores: geminiResults.bigFive,
    work_values_scores: geminiResults.workValues.scores,
    employability_scores: geminiResults.employability.skillScores,
    employability_readiness: geminiResults.employability.overallReadiness,
    knowledge_score: geminiResults.knowledge.score,
    knowledge_details: geminiResults.knowledge,
    career_fit: geminiResults.careerFit,
    skill_gap: geminiResults.skillGap,
    skill_gap_courses: geminiResults.skillGapCourses || null,
    roadmap: geminiResults.roadmap,
    profile_snapshot: geminiResults.profileSnapshot || null,
    timing_analysis: geminiResults.timingAnalysis || null,
    final_note: geminiResults.finalNote || null,
    overall_summary: geminiResults.overallSummary || 'Assessment completed successfully.',
    gemini_results: geminiResults
  };

  console.log('✅ Data prepared for insertion (all from AI):', {
    grade_level: dataToInsert.grade_level,
    stream_id: dataToInsert.stream_id,
    has_riasec: !!dataToInsert.riasec_scores,
    has_work_values: !!dataToInsert.work_values_scores,
    has_employability: !!dataToInsert.employability_scores,
    has_careerFit: !!dataToInsert.career_fit,
    has_skillGap: !!dataToInsert.skill_gap,
    has_roadmap: !!dataToInsert.roadmap
  });

  // Save results - Use UPSERT to handle duplicate attempts
  console.log('=== Upserting into personal_assessment_results ===');
  
  const { data: results, error: resultsError } = await supabase
    .from('personal_assessment_results')
    .upsert(dataToInsert, {
      onConflict: 'attempt_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (resultsError) {
    console.error('❌ Error upserting results:', resultsError);
    console.error('Full error object:', JSON.stringify(resultsError, null, 2));
    
    // Check if it's an RLS error
    if (resultsError.code === '42501' || resultsError.message?.includes('policy')) {
      console.error('🔒 This appears to be an RLS (Row Level Security) policy error');
      console.error('The student_id in the upsert must match auth.uid()');
    }
    
    throw resultsError;
  }

  console.log('✅ Results saved successfully:', results.id);
  return results;
};

/**
 * Get student's assessment history
 * @param {string} studentId - Student's user_id
 */
export const getStudentAttempts = async (studentId) => {
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select(`
      *,
      stream:personal_assessment_streams(*),
      results:personal_assessment_results(*)
    `)
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
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select(`
      *,
      stream:personal_assessment_streams(*),
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
    console.warn('getLatestResult: No student ID provided');
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
    console.error('Error fetching latest result:', error);
    throw error;
  }

  // If found, return it
  if (data) {
    console.log('✅ Found assessment result (direct lookup)');
    return data;
  }

  // If not found, try looking up by user_id (in case we were passed auth.uid())
  console.log('🔄 No direct match, trying user_id lookup...');
  
  try {
    // Get student.id from user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentIdOrUserId)
      .maybeSingle();

    if (studentError) {
      console.warn('Error looking up student by user_id:', studentError);
      return null;
    }

    if (!student) {
      console.warn('No student record found for user_id:', studentIdOrUserId);
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
      console.error('Error fetching result by student.id:', resultError);
      return null;
    }

    if (resultData) {
      console.log('✅ Found assessment result (via user_id lookup)');
    } else {
      console.log('❌ No completed assessment result found for this student');
    }

    return resultData;
  } catch (err) {
    console.error('Error in user_id fallback lookup:', err);
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
    console.log('🔧 Development mode: Assessment 6-month restriction bypassed');
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
    console.warn('getInProgressAttempt: No student ID provided');
    return null;
  }

  // Try direct lookup first (assuming it's student.id)
  let { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select(`
      *,
      stream:personal_assessment_streams(*),
      responses:personal_assessment_responses(*)
    `)
    .eq('student_id', studentIdOrUserId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching in-progress attempt:', error);
    throw error;
  }

  // If found, return it
  if (data) {
    console.log('✅ Found in-progress attempt (direct lookup):', data.id);
    return data;
  }

  // If not found, try looking up by user_id (in case we were passed auth.uid())
  console.log('🔄 No direct match, trying user_id lookup...');
  
  try {
    // Get student.id from user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentIdOrUserId)
      .maybeSingle();

    if (studentError) {
      console.warn('Error looking up student by user_id:', studentError);
      return null;
    }

    if (!student) {
      console.warn('No student record found for user_id:', studentIdOrUserId);
      return null;
    }

    // Now try again with the correct student.id
    const { data: attemptData, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select(`
        *,
        stream:personal_assessment_streams(*),
        responses:personal_assessment_responses(*)
      `)
      .eq('student_id', student.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attemptError) {
      console.error('Error fetching attempt by student.id:', attemptError);
      return null;
    }

    if (attemptData) {
      console.log('✅ Found in-progress attempt (via user_id lookup):', attemptData.id);
    } else {
      console.log('❌ No in-progress attempt found for this student');
    }

    return attemptData;
  } catch (err) {
    console.error('Error in user_id fallback lookup:', err);
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
  getStudentAttempts,
  getAttemptWithResults,
  getLatestResult,
  getInProgressAttempt,
  abandonAttempt,
  transformQuestionsForUI,
  canTakeAssessment
};
