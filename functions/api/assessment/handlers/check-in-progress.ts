/**
 * Check In-Progress Handler
 *
 * Handles GET /api/assessment/check-in-progress
 * Checks if user has an in-progress assessment
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { CheckInProgressResult } from '../types';

export async function checkInProgressHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    if (learnerError) {
      return Response.json(
        {
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
          started_at: null
        } as CheckInProgressResult
      );
    }

    if (!learnerData?.id) {
      return Response.json(
        {
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
          started_at: null
        } as CheckInProgressResult
      );
    }

    const learnerId = learnerData.id;

    const { data: attempts, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select(
        'id, all_responses, current_section_index, current_question_index, timer_remaining, elapsed_time, grade_level, stream_id, section_timings, started_at'
      )
      .eq('learner_id', learnerId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1);

    const attempt = attempts && attempts.length > 0 ? attempts[0] : null;

    if (attemptError) {
      return Response.json(
        {
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
          started_at: null
        } as CheckInProgressResult
      );
    }

    if (!attempt) {
      return Response.json(
        {
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
          started_at: null
        } as CheckInProgressResult
      );
    }

    const result: CheckInProgressResult = {
      success: true,
      hasInProgress: true,
      attemptId: attempt.id,
      answers: attempt.all_responses || {},
      all_responses: attempt.all_responses || {},
      currentSectionIndex: attempt.current_section_index || 0,
      currentQuestionIndex: attempt.current_question_index || 0,
      gradeLevel: attempt.grade_level || null,
      streamId: attempt.stream_id || null,
      stream_id: attempt.stream_id || null,
      sectionTimings: attempt.section_timings || {},
      timerRemaining: attempt.timer_remaining,
      elapsedTime: attempt.elapsed_time || 0,
      started_at: attempt.started_at || null
    };

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
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
        started_at: null
      } as CheckInProgressResult
    );
  }
}
