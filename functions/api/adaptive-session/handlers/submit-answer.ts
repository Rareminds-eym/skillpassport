/**
 * Submit Answer Handler
 * 
 * Handles POST /submit-answer endpoint
 * Records answer, updates difficulty, checks stop conditions
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import type { 
  SubmitAnswerOptions, 
  AnswerResult, 
  TestPhase, 
  DifficultyLevel, 
  Question,
  StopConditionResult
} from '../types';
import { DEFAULT_ADAPTIVE_TEST_CONFIG } from '../types';
import { dbSessionToTestSession, dbResponseToResponse } from '../utils/converters';
import { AdaptiveEngine } from '../utils/adaptive-engine';
import { authenticateUser } from '../../shared/auth';

/**
 * Submits an answer for the current question
 * 
 * Requirements: 5.2
 * - Records response with timing
 * - Calculates next difficulty
 * - Checks phase completion and stop conditions
 * - Requires authentication and session ownership verification
 */
export const submitAnswerHandler: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    // Authenticate user
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      console.error('❌ [SubmitAnswerHandler] Authentication required');
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    console.log('✅ [SubmitAnswerHandler] User authenticated:', auth.user.id);

    // Parse request body
    const body = await request.json() as SubmitAnswerOptions;
    const { sessionId, questionId, selectedAnswer, responseTimeMs } = body;

    if (!sessionId || !questionId || !selectedAnswer || responseTimeMs === undefined) {
      return jsonResponse(
        { error: 'Missing required fields: sessionId, questionId, selectedAnswer, responseTimeMs' },
        400
      );
    }

    // Validate selectedAnswer
    if (!['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
      return jsonResponse(
        { error: 'Invalid selectedAnswer. Must be one of: A, B, C, D' },
        400
      );
    }

    console.log('📝 [SubmitAnswerHandler] submitAnswer called:', {
      sessionId,
      questionId,
      selectedAnswer,
      responseTimeMs,
    });

    const supabase = createSupabaseAdminClient(env);

    // Fetch session from database
    const { data: sessionData, error: sessionError } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ [SubmitAnswerHandler] Failed to fetch session:', sessionError);
      return jsonResponse(
        { error: 'Session not found', message: sessionError?.message },
        404
      );
    }

    // Verify session ownership
    if (sessionData.student_id !== auth.user.id) {
      console.error('❌ [SubmitAnswerHandler] Session ownership verification failed');
      return jsonResponse(
        { error: 'Unauthorized: You do not own this session' },
        403
      );
    }

    console.log('📊 [SubmitAnswerHandler] Session state before update:', {
      currentQuestionIndex: sessionData.current_question_index,
      questionsAnswered: sessionData.questions_answered,
      phaseQuestionsCount: (sessionData.current_phase_questions as Question[])?.length,
    });

    const currentPhaseQuestions = sessionData.current_phase_questions as Question[];
    const currentQuestionIndex = sessionData.current_question_index as number;
    const currentPhase = sessionData.current_phase as TestPhase;
    const currentDifficulty = sessionData.current_difficulty as DifficultyLevel;
    const difficultyPath = (sessionData.difficulty_path as number[]).map(d => d as DifficultyLevel);

    // Find the current question
    const currentQuestion = currentPhaseQuestions.find(q => q.id === questionId);

    if (!currentQuestion) {
      return jsonResponse(
        { error: 'Question not found in current phase', questionId },
        404
      );
    }

    // Check if answer is correct
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    // Calculate new difficulty (only during adaptive_core phase)
    let newDifficulty = currentDifficulty;
    let difficultyChange: 'increased' | 'decreased' | 'unchanged' = 'unchanged';

    if (currentPhase === 'adaptive_core') {
      const adjustment = AdaptiveEngine.adjustDifficulty(currentDifficulty, isCorrect);
      newDifficulty = adjustment.newDifficulty;
      difficultyChange = adjustment.change;
    }

    // Update difficulty path
    const newDifficultyPath = [...difficultyPath, currentDifficulty];

    // Create response record with full question content
    const sequenceNumber = sessionData.questions_answered + 1;

    const { error: responseError } = await supabase
      .from('adaptive_aptitude_responses')
      .insert({
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        response_time_ms: responseTimeMs,
        difficulty_at_time: currentDifficulty,
        subtag: currentQuestion.subtag,
        phase: currentPhase,
        sequence_number: sequenceNumber,
        // Store full question content for audit trail
        question_text: currentQuestion.text,
        question_options: currentQuestion.options,
        correct_answer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation || null,
      })
      .select()
      .single();

    if (responseError) {
      console.error('❌ [SubmitAnswerHandler] Failed to record response:', responseError);
      throw new Error(`Failed to record response: ${responseError.message}`);
    }

    // Update session
    const newQuestionsAnswered = sessionData.questions_answered + 1;
    const newCorrectAnswers = sessionData.correct_answers + (isCorrect ? 1 : 0);
    const newQuestionIndex = currentQuestionIndex + 1;

    console.log('📈 [SubmitAnswerHandler] Updating session:', {
      oldQuestionIndex: currentQuestionIndex,
      newQuestionIndex,
      newQuestionsAnswered,
      phaseQuestionsCount: currentPhaseQuestions.length,
      willBePhaseComplete: newQuestionIndex >= currentPhaseQuestions.length,
    });

    // Calculate provisional band during adaptive core
    let provisionalBand = sessionData.provisional_band as DifficultyLevel | null;
    if (currentPhase === 'adaptive_core' && newDifficultyPath.length >= 3) {
      // Use mode of last 3 difficulties as provisional band
      const lastThree = newDifficultyPath.slice(-3);
      const counts = new Map<DifficultyLevel, number>();
      for (const d of lastThree) {
        counts.set(d, (counts.get(d) || 0) + 1);
      }
      let maxCount = 0;
      for (const [d, count] of counts) {
        if (count > maxCount) {
          maxCount = count;
          provisionalBand = d;
        }
      }
    }

    // Check if phase is complete
    const phaseComplete = newQuestionIndex >= currentPhaseQuestions.length;

    // Check stop conditions for adaptive core
    let stopCondition: StopConditionResult | null = null;
    let testComplete = false;
    let nextPhase: TestPhase | null = null;

    if (currentPhase === 'adaptive_core') {
      // Fetch all responses for stop condition check
      const { data: allResponses } = await supabase
        .from('adaptive_aptitude_responses')
        .select('*')
        .eq('session_id', sessionId);

      const responses = (allResponses || []).map(dbResponseToResponse);
      stopCondition = AdaptiveEngine.checkStopConditions(
        newQuestionsAnswered,
        newDifficultyPath,
        responses
      );

      if (stopCondition.shouldStop) {
        // Move to stability confirmation or complete test
        if (phaseComplete) {
          nextPhase = 'stability_confirmation';
        }
      }
    }

    // Determine if test is complete
    // Hard limit: max 50 questions total (8 + 36 + 6)
    const maxTotalQuestions = DEFAULT_ADAPTIVE_TEST_CONFIG.phases.diagnostic_screener.maxQuestions +
      DEFAULT_ADAPTIVE_TEST_CONFIG.phases.adaptive_core.maxQuestions +
      DEFAULT_ADAPTIVE_TEST_CONFIG.phases.stability_confirmation.maxQuestions;

    if (newQuestionsAnswered >= maxTotalQuestions) {
      testComplete = true;
      console.log('🏁 [SubmitAnswerHandler] Max questions reached, marking test complete');
    } else if (currentPhase === 'stability_confirmation' && phaseComplete) {
      testComplete = true;
    }

    // Update session in database
    const updateData: Record<string, unknown> = {
      questions_answered: newQuestionsAnswered,
      correct_answers: newCorrectAnswers,
      current_question_index: newQuestionIndex,
      current_difficulty: newDifficulty,
      difficulty_path: newDifficultyPath,
      provisional_band: provisionalBand,
      updated_at: new Date().toISOString(),
    };

    if (testComplete) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('adaptive_aptitude_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      console.error('❌ [SubmitAnswerHandler] Failed to update session:', updateError);
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    console.log('✅ [SubmitAnswerHandler] Session updated in database');

    // Fetch updated session
    const { data: updatedSessionData } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    console.log('📊 [SubmitAnswerHandler] Session state after update:', {
      currentQuestionIndex: updatedSessionData?.current_question_index,
      questionsAnswered: updatedSessionData?.questions_answered,
    });

    // Fetch all responses for the session
    const { data: allSessionResponses } = await supabase
      .from('adaptive_aptitude_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true });

    const updatedSession = dbSessionToTestSession(
      updatedSessionData!,
      (allSessionResponses || []).map(dbResponseToResponse),
      currentPhaseQuestions
    );

    const result: AnswerResult = {
      isCorrect,
      previousDifficulty: currentDifficulty,
      newDifficulty,
      difficultyChange,
      phaseComplete,
      nextPhase,
      testComplete,
      stopCondition,
      updatedSession,
    };

    return jsonResponse(result);

  } catch (error) {
    console.error('❌ [SubmitAnswerHandler] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to submit answer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};
