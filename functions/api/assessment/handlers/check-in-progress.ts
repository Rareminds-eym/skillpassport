/**
 * Check In-Progress Handler
 *
 * Handles GET /api/assessment/check-in-progress
 * Returns assessment attempt data, with smart detection of adaptive aptitude sessions
 *
 * Architecture:
 * - personal_assessment_attempts: Tracks regular assessment sections
 * - adaptive_aptitude_sessions: Tracks adaptive test progress (separate table)
 * - Link: adaptive_aptitude_session_id in personal_assessment_attempts
 *
 * Resume Logic:
 * 1. Fetch in-progress attempt
 * 2. If adaptive_aptitude_session_id exists, fetch that session
 * 3. If adaptive session is in-progress, return its data alongside attempt data
 * 4. Frontend detects isAdaptiveInProgress flag and uses adaptive resume flow
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { CheckInProgressResult } from '../types';

const createEmptyResponse = (): CheckInProgressResult => ({
  success: true,
  hasInProgress: false,
  attemptId: null,
  answers: {},
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  gradeLevel: null,
  streamId: null,
  sectionTimings: {},
  timerRemaining: null,
  elapsedTime: 0,
  started_at: null,
  adaptiveSession: null,
  isAdaptiveInProgress: false
});

export async function checkInProgressHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    // Step 1: Get learner ID
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    if (learnerError || !learnerData?.id) {
      return Response.json(createEmptyResponse());
    }

    const learnerId = learnerData.id;

    // Step 2: Get in-progress assessment attempt
    const { data: attempts, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select(
        `id,
         all_responses,
         current_section_index,
         current_question_index,
         timer_remaining,
         elapsed_time,
         grade_level,
         stream_id,
         section_timings,
         started_at,
         adaptive_aptitude_session_id`
      )
      .eq('learner_id', learnerId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1);

    if (attemptError || !attempts || attempts.length === 0) {
      return Response.json(createEmptyResponse());
    }

    const attempt = attempts[0];

    // Step 3: If adaptive session is linked, fetch it
    let adaptiveSessionData = null;
    let isAdaptiveInProgress = false;

    if (attempt.adaptive_aptitude_session_id) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('adaptive_aptitude_sessions')
        .select(
          `id,
           current_question_index,
           questions_answered,
           status,
           current_phase_questions,
           all_responses,
           grade_level,
           current_phase,
           current_difficulty`
        )
        .eq('id', attempt.adaptive_aptitude_session_id)
        .maybeSingle();

      if (sessionData) {
        adaptiveSessionData = {
          sessionId: sessionData.id,
          currentQuestionIndex: sessionData.current_question_index || 0,
          questionsAnswered: sessionData.questions_answered || 0,
          status: sessionData.status,
          phase: sessionData.current_phase,
          difficulty: sessionData.current_difficulty,
          currentPhaseQuestions: sessionData.current_phase_questions || [],
          allResponses: sessionData.all_responses || []
        };

        if (sessionData.status === 'in_progress') {
          isAdaptiveInProgress = true;
        }
        // 'completed' status is intentionally left as isAdaptiveInProgress=false
        // Frontend uses adaptiveSessionData.status === 'completed' to detect this case
      }
    }

    // Step 4: Build response with context
    const result: CheckInProgressResult = {
      success: true,
      hasInProgress: true,
      attemptId: attempt.id,
      answers: attempt.all_responses || {},
      all_responses: attempt.all_responses || {},
      // If adaptive is in progress, return adaptive position; otherwise regular position
      currentSectionIndex: isAdaptiveInProgress
        ? attempt.current_section_index || 0  // Frontend will interpret this with adaptive context
        : attempt.current_section_index || 0,
      currentQuestionIndex: isAdaptiveInProgress
        ? (adaptiveSessionData?.currentQuestionIndex || 0)  // Use adaptive question index
        : attempt.current_question_index || 0,
      gradeLevel: attempt.grade_level || null,
      streamId: attempt.stream_id || null,
      stream_id: attempt.stream_id || null,
      sectionTimings: attempt.section_timings || {},
      timerRemaining: attempt.timer_remaining,
      elapsedTime: attempt.elapsed_time || 0,
      started_at: attempt.started_at || null,
      // New fields for adaptive resume
      adaptiveSession: adaptiveSessionData,
      isAdaptiveInProgress: isAdaptiveInProgress,
      totalQuestionsAdaptive: adaptiveSessionData?.questionsAnswered || 0,
      // Legacy format for ResumePromptScreen compatibility
      adaptiveProgress: adaptiveSessionData ? {
        questionsAnswered: adaptiveSessionData.questionsAnswered
      } : undefined
    };

    return Response.json(result);
  } catch (error) {
    return Response.json(createEmptyResponse());
  }
}
