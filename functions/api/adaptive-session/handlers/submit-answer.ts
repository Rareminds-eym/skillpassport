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

    // Verify session ownership by checking if the student's user_id matches the authenticated user
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', sessionData.student_id)
      .single();

    if (studentError || !studentData) {
      console.error('❌ [SubmitAnswerHandler] Failed to fetch student:', studentError);
      return jsonResponse(
        { error: 'Student not found' },
        404
      );
    }

    if (studentData.user_id !== auth.user.id) {
      console.error('❌ [SubmitAnswerHandler] Session ownership verification failed', {
        studentUserId: studentData.user_id,
        authUserId: auth.user.id
      });
      return jsonResponse(
        { error: 'Unauthorized: You do not own this session' },
        403
      );
    }

    // Check feature usage limit for adaptive aptitude questions
    const { data: usageData, error: usageError } = await supabase
      .from('rbac_feature_usage')
      .select('usage_count, usage_limit')
      .eq('user_id', auth.user.id)
      .eq('feature_key', 'adaptive_aptitude_questions')
      .single();

    if (usageData && usageData.usage_count >= usageData.usage_limit) {
      console.warn('⚠️ [SubmitAnswerHandler] Usage limit reached', {
        userId: auth.user.id,
        usageCount: usageData.usage_count,
        usageLimit: usageData.usage_limit
      });
      
      // Mark session as completed when limit is reached
      await supabase
        .from('adaptive_aptitude_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // Fetch updated session
      const { data: completedSessionData } = await supabase
        .from('adaptive_aptitude_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      // Fetch all responses for the session
      const { data: allSessionResponses } = await supabase
        .from('adaptive_aptitude_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('sequence_number', { ascending: true });
      
      const completedSession = dbSessionToTestSession(
        completedSessionData!,
        (allSessionResponses || []).map(dbResponseToResponse),
        []
      );
      
      // Return a result that marks test as complete
      return jsonResponse({
        isCorrect: false,
        previousDifficulty: sessionData.current_difficulty,
        newDifficulty: sessionData.current_difficulty,
        difficultyChange: 'unchanged',
        phaseComplete: true,
        nextPhase: null,
        testComplete: true,
        stopCondition: {
          met: true,
          reason: 'usage_limit',
          message: `You have reached the maximum of ${usageData.usage_limit} questions for this test.`
        },
        updatedSession: completedSession,
        limitReached: true
      });
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
      
      console.log('🎯 [SubmitAnswerHandler] Difficulty adjustment:', {
        currentDifficulty,
        isCorrect,
        newDifficulty,
        difficultyChange,
        questionNumber: sessionData.questions_answered + 1,
      });
    } else {
      console.log('ℹ️ [SubmitAnswerHandler] Not in adaptive_core phase, difficulty unchanged:', {
        currentPhase,
        currentDifficulty,
        questionNumber: sessionData.questions_answered + 1,
      });
    }

    // Update difficulty path - add the NEW difficulty after adjustment
    const newDifficultyPath = [...difficultyPath, newDifficulty];

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

    // Increment usage count for adaptive aptitude questions
    if (usageData) {
      await supabase
        .from('rbac_feature_usage')
        .update({ 
          usage_count: usageData.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', auth.user.id)
        .eq('feature_key', 'adaptive_aptitude_questions');
      
      console.log('📊 [SubmitAnswerHandler] Usage count incremented:', {
        userId: auth.user.id,
        newCount: usageData.usage_count + 1,
        limit: usageData.usage_limit
      });
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
    let phaseComplete = false;
    
    if (currentPhase === 'diagnostic_screener') {
      // Diagnostic: complete when all 8 questions answered
      phaseComplete = newQuestionIndex >= DEFAULT_ADAPTIVE_TEST_CONFIG.phases.diagnostic_screener.maxQuestions;
    } else if (currentPhase === 'adaptive_core') {
      // Adaptive core: complete when 36 questions answered (not based on array length)
      const adaptiveCoreQuestionsAnswered = newQuestionsAnswered - DEFAULT_ADAPTIVE_TEST_CONFIG.phases.diagnostic_screener.maxQuestions;
      phaseComplete = adaptiveCoreQuestionsAnswered >= DEFAULT_ADAPTIVE_TEST_CONFIG.phases.adaptive_core.maxQuestions;
      console.log('🎯 [SubmitAnswerHandler] Adaptive core progress:', {
        adaptiveCoreQuestionsAnswered,
        maxQuestions: DEFAULT_ADAPTIVE_TEST_CONFIG.phases.adaptive_core.maxQuestions,
        phaseComplete
      });
    } else if (currentPhase === 'stability_confirmation') {
      // Stability: complete when all 6 questions answered
      phaseComplete = newQuestionIndex >= DEFAULT_ADAPTIVE_TEST_CONFIG.phases.stability_confirmation.maxQuestions;
    }

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

      // CRITICAL: Always complete exactly 36 adaptive core questions
      // Only transition to stability after completing all 36 questions
      const adaptiveCoreQuestionsAnswered = newQuestionsAnswered - DEFAULT_ADAPTIVE_TEST_CONFIG.phases.diagnostic_screener.maxQuestions;
      if (adaptiveCoreQuestionsAnswered >= DEFAULT_ADAPTIVE_TEST_CONFIG.phases.adaptive_core.maxQuestions) {
        nextPhase = 'stability_confirmation';
        console.log('🎯 [SubmitAnswerHandler] Completed 36 adaptive core questions, transitioning to stability');
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
    
    // CRITICAL: If we're transitioning to next phase, test is NOT complete yet
    if (nextPhase) {
      testComplete = false;
      console.log('🔄 [SubmitAnswerHandler] Phase transition pending, test NOT complete yet');
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
