/**
 * Assessment Service
 * Handles all database operations for the assessment system
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all assessment sections
 */
export const fetchSections = async () => {
  const { data, error } = await supabase
    .from('assessment_sections')
    .select('*')
    .eq('is_active', true)
    .order('order_number');

  if (error) throw error;
  return data;
};

/**
 * Fetch all available streams
 */
export const fetchStreams = async () => {
  const { data, error } = await supabase
    .from('assessment_streams')
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
    .from('assessment_questions')
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
 */
export const fetchAllQuestions = async (streamId) => {
  const sections = await fetchSections();
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
 */
export const createAttempt = async (studentId, streamId) => {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .insert({
      student_id: studentId,
      stream_id: streamId,
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
  
  const { data, error } = await supabase
    .from('assessment_attempts')
    .update(updateData)
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Save a response to a question
 * @param {string} attemptId - Attempt UUID
 * @param {string} questionId - Question UUID
 * @param {any} responseValue - The response value (can be number, string, or object)
 * @param {boolean} isCorrect - Whether the answer is correct (for MCQ)
 */
export const saveResponse = async (attemptId, questionId, responseValue, isCorrect = null) => {
  const { data, error } = await supabase
    .from('assessment_responses')
    .upsert({
      attempt_id: attemptId,
      question_id: questionId,
      response_value: responseValue,
      is_correct: isCorrect,
      responded_at: new Date().toISOString()
    }, {
      onConflict: 'attempt_id,question_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get all responses for an attempt
 * @param {string} attemptId - Attempt UUID
 */
export const getAttemptResponses = async (attemptId) => {
  const { data, error } = await supabase
    .from('assessment_responses')
    .select(`
      *,
      question:assessment_questions(*)
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
 * @param {object} geminiResults - Full Gemini AI analysis results
 * @param {object} sectionTimings - Time spent on each section
 */
export const completeAttempt = async (attemptId, studentId, streamId, geminiResults, sectionTimings) => {
  // Update attempt status
  const { error: attemptError } = await supabase
    .from('assessment_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      section_timings: sectionTimings
    })
    .eq('id', attemptId);

  if (attemptError) throw attemptError;

  // Save results
  const { data: results, error: resultsError } = await supabase
    .from('assessment_results')
    .insert({
      attempt_id: attemptId,
      student_id: studentId,
      stream_id: streamId,
      riasec_scores: geminiResults.riasec?.scores,
      riasec_code: geminiResults.riasec?.code,
      aptitude_scores: geminiResults.aptitude?.scores,
      aptitude_overall: geminiResults.aptitude?.overallScore,
      bigfive_scores: geminiResults.bigFive,
      work_values_scores: geminiResults.workValues?.scores,
      employability_scores: geminiResults.employability?.skillScores,
      employability_readiness: geminiResults.employability?.overallReadiness,
      knowledge_score: geminiResults.knowledge?.score,
      knowledge_details: geminiResults.knowledge,
      career_fit: geminiResults.careerFit,
      skill_gap: geminiResults.skillGap,
      roadmap: geminiResults.roadmap,
      profile_snapshot: geminiResults.profileSnapshot,
      timing_analysis: geminiResults.timingAnalysis,
      final_note: geminiResults.finalNote,
      overall_summary: geminiResults.overallSummary,
      gemini_results: geminiResults
    })
    .select()
    .single();

  if (resultsError) throw resultsError;
  return results;
};

/**
 * Get student's assessment history
 * @param {string} studentId - Student's user_id
 */
export const getStudentAttempts = async (studentId) => {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .select(`
      *,
      stream:assessment_streams(*),
      results:assessment_results(*)
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
    .from('assessment_attempts')
    .select(`
      *,
      stream:assessment_streams(*),
      results:assessment_results(*),
      responses:assessment_responses(
        *,
        question:assessment_questions(*)
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
    .from('assessment_results')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
};

/**
 * Check if student has an in-progress attempt
 * @param {string} studentId - Student's user_id
 */
export const getInProgressAttempt = async (studentId) => {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .select(`
      *,
      stream:assessment_streams(*),
      responses:assessment_responses(
        *,
        question:assessment_questions(*)
      )
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
    .from('assessment_attempts')
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
  transformQuestionsForUI
};
