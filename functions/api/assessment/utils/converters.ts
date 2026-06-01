/**
 * Assessment Type Converters
 *
 * Convert between database and API types
 */

import type { AssessmentAttempt, AssessmentResponse } from '../types';

/**
 * Convert database attempt record to typed AssessmentAttempt
 */
export function dbAttemptToAssessmentAttempt(dbAttempt: any): AssessmentAttempt {
  return {
    id: dbAttempt.id,
    learner_id: dbAttempt.learner_id,
    grade_level: dbAttempt.grade_level,
    stream_id: dbAttempt.stream_id || null,
    status: dbAttempt.status,
    all_responses: dbAttempt.all_responses || {},
    timer_remaining: dbAttempt.timer_remaining || null,
    elapsed_time: dbAttempt.elapsed_time || 0,
    current_section_index: dbAttempt.current_section_index || 0,
    current_question_index: dbAttempt.current_question_index || 0,
    section_timings: dbAttempt.section_timings || {},
    started_at: dbAttempt.started_at,
    completed_at: dbAttempt.completed_at,
    updated_at: dbAttempt.updated_at
  };
}

/**
 * Convert database response record to typed AssessmentResponse
 */
export function dbResponseToAssessmentResponse(dbResponse: any): AssessmentResponse {
  return {
    id: dbResponse.id,
    attempt_id: dbResponse.attempt_id,
    question_id: dbResponse.question_id,
    response_value: dbResponse.response_value
  };
}
