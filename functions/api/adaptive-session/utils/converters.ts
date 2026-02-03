/**
 * Converter utilities for adaptive session API
 * Converts database records to typed objects
 */

import type {
  TestSession,
  Response,
  Question,
  GradeLevel,
  TestPhase,
  Tier,
  DifficultyLevel,
  Subtag,
} from '../types';

/**
 * Converts a database session record to a TestSession object
 */
export function dbSessionToTestSession(
  dbSession: Record<string, unknown>,
  responses: Response[] = [],
  currentPhaseQuestions: Question[] = []
): TestSession {
  return {
    id: dbSession.id as string,
    studentId: dbSession.student_id as string,
    gradeLevel: dbSession.grade_level as GradeLevel,
    currentPhase: dbSession.current_phase as TestPhase,
    tier: dbSession.tier as Tier | null,
    currentDifficulty: dbSession.current_difficulty as DifficultyLevel,
    difficultyPath: (dbSession.difficulty_path as number[]).map(d => d as DifficultyLevel),
    questionsAnswered: dbSession.questions_answered as number,
    correctAnswers: dbSession.correct_answers as number,
    currentQuestionIndex: dbSession.current_question_index as number,
    responses,
    currentPhaseQuestions,
    provisionalBand: dbSession.provisional_band as DifficultyLevel | null,
    status: dbSession.status as 'in_progress' | 'completed' | 'abandoned',
    startedAt: dbSession.started_at as string,
    updatedAt: dbSession.updated_at as string,
    completedAt: dbSession.completed_at as string | null,
  };
}

/**
 * Converts a database response record to a Response object
 */
export function dbResponseToResponse(dbResponse: Record<string, unknown>): Response {
  return {
    id: dbResponse.id as string,
    sessionId: dbResponse.session_id as string,
    questionId: dbResponse.question_id as string,
    selectedAnswer: dbResponse.selected_answer as 'A' | 'B' | 'C' | 'D',
    isCorrect: dbResponse.is_correct as boolean,
    responseTimeMs: dbResponse.response_time_ms as number,
    difficultyAtTime: dbResponse.difficulty_at_time as DifficultyLevel,
    subtag: dbResponse.subtag as Subtag,
    phase: dbResponse.phase as TestPhase,
    sequenceNumber: dbResponse.sequence_number as number,
    answeredAt: dbResponse.answered_at as string,
  };
}
