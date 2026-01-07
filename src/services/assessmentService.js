/**
 * Assessment Service
 * Handles all database operations for the assessment system
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all assessment sections
 * @param {string} gradeLevel - Grade level filter: 'middle', 'highschool', 'higher_secondary', or 'after12'
 */
export const fetchSections = async (gradeLevel = null) => {
  let query = supabase
    .from('personal_assessment_sections')
    .select('*')
    .eq('is_active', true);

  // Filter by grade level if provided
  if (gradeLevel) {
    query = query.eq('grade_level', gradeLevel);
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
  console.log('Has profileSnapshot:', !!geminiResults?.profileSnapshot);

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

  // Prepare data for insertion
  const dataToInsert = {
    attempt_id: attemptId,
    student_id: studentId,
    grade_level: gradeLevel,
    stream_id: streamId,
    status: 'completed',
    riasec_scores: geminiResults.riasec?.scores || null,
    riasec_code: geminiResults.riasec?.code || null,
    aptitude_scores: geminiResults.aptitude?.scores || null,
    aptitude_overall: geminiResults.aptitude?.overallScore || null,
    bigfive_scores: geminiResults.bigFive || null,
    work_values_scores: geminiResults.workValues?.scores || null,
    employability_scores: geminiResults.employability?.skillScores || null,
    employability_readiness: geminiResults.employability?.overallReadiness || null,
    knowledge_score: geminiResults.knowledge?.score || null,
    knowledge_details: geminiResults.knowledge || null,
    career_fit: geminiResults.careerFit || null,
    skill_gap: geminiResults.skillGap || null,
    skill_gap_courses: geminiResults.skillGapCourses || null,
    roadmap: geminiResults.roadmap || null,
    profile_snapshot: geminiResults.profileSnapshot || null,
    timing_analysis: geminiResults.timingAnalysis || null,
    final_note: geminiResults.finalNote || null,
    overall_summary: geminiResults.overallSummary || null,
    gemini_results: geminiResults
  };

  console.log('Data to insert:', {
    grade_level: dataToInsert.grade_level,
    stream_id: dataToInsert.stream_id,
    has_riasec: !!dataToInsert.riasec_scores,
    has_profileSnapshot: !!dataToInsert.profile_snapshot,
    has_careerFit: !!dataToInsert.career_fit,
    has_skillGap: !!dataToInsert.skill_gap,
    has_roadmap: !!dataToInsert.roadmap
  });

  // Save results
  console.log('=== Inserting into personal_assessment_results ===');
  console.log('Attempt ID:', attemptId);
  console.log('Student ID:', studentId);
  console.log('Stream ID:', streamId);
  
  const { data: results, error: resultsError } = await supabase
    .from('personal_assessment_results')
    .insert(dataToInsert)
    .select()
    .single();

  if (resultsError) {
    console.error('❌ Error inserting results:', resultsError);
    console.error('Full error object:', JSON.stringify(resultsError, null, 2));
    console.error('Error details:', {
      code: resultsError.code,
      message: resultsError.message,
      details: resultsError.details,
      hint: resultsError.hint,
      status: resultsError.status,
      statusText: resultsError.statusText
    });
    
    // Check if it's an RLS error
    if (resultsError.code === '42501' || resultsError.message?.includes('policy')) {
      console.error('🔒 This appears to be an RLS (Row Level Security) policy error');
      console.error('The student_id in the insert must match auth.uid()');
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
      results:personal_assessment_results(*),
      responses:personal_assessment_responses(
        *,
        question:personal_assessment_questions(*)
      )
    `)
    .eq('id', attemptId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get the latest completed assessment result for a student
 * @param {string} studentId - Student's user_id
 */
export const getLatestResult = async (studentId) => {
  const { data, error } = await supabase
    .from('personal_assessment_results')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() to return null instead of 406 error when no rows found

  if (error) throw error;
  return data;
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
 * @param {string} studentId - Student's user_id
 */
export const getInProgressAttempt = async (studentId) => {
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select(`
      *,
      stream:personal_assessment_streams(*),
      responses:personal_assessment_responses(*)
    `)
    .eq('student_id', studentId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
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
