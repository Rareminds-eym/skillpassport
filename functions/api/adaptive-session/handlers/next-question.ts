/**
 * Next Question Handler
 * 
 * Handles GET /next-question/:sessionId endpoint
 * Returns the next question for the current session
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import type { NextQuestionResult, TestPhase, DifficultyLevel, GradeLevel, Question } from '../types';
import { DEFAULT_ADAPTIVE_TEST_CONFIG, ALL_SUBTAGS } from '../types';
import { validateExclusionListComplete, validateQuestionNotDuplicate } from '../utils/validation';
import { dbResponseToResponse } from '../utils/converters';
import { AdaptiveEngine } from '../utils/adaptive-engine';
import { extractNumericGrade } from '../utils/grade';
import { fetchSingleQuestion, fetchAdaptiveQuestions, fetchStabilityQuestions } from '../../question-bank/core';

/**
 * Gets the next question for the current session
 * 
 * Requirements: 2.2, 2.3, 2.4
 * - Returns next question based on current phase and difficulty
 * - Handles phase transitions
 * - Generates adaptive questions dynamically
 */
export const nextQuestionHandler: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const sessionId = pathParts[pathParts.length - 1];

  if (!sessionId) {
    return jsonResponse({ error: 'Session ID is required' }, 400);
  }

  try {
    console.log('📋 [NextQuestionHandler] getNextQuestion called:', { sessionId });

    const supabase = createSupabaseAdminClient(env);

    // Fetch session from database
    const { data: sessionData, error: sessionError } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ [NextQuestionHandler] Failed to fetch session:', sessionError);
      return jsonResponse(
        { error: 'Session not found', message: sessionError?.message },
        404
      );
    }

    // Look up the student's exact grade for precise question filtering
    const { data: studentRecord } = await supabase
      .from('students')
      .select('grade')
      .eq('id', sessionData.student_id)
      .single();

    const studentGrade = extractNumericGrade(studentRecord?.grade);
    console.log('📋 [NextQuestionHandler] Student grade:', { raw: studentRecord?.grade, numeric: studentGrade });

    console.log('📊 [NextQuestionHandler] Session data:', {
      status: sessionData.status,
      currentPhase: sessionData.current_phase,
      currentQuestionIndex: sessionData.current_question_index,
      questionsAnswered: sessionData.questions_answered,
      currentDifficulty: sessionData.current_difficulty,
      difficultyPath: sessionData.difficulty_path,
      phaseQuestionsCount: (sessionData.current_phase_questions as Question[])?.length,
    });

    // Check if test is already complete
    if (sessionData.status === 'completed') {
      console.log('🏁 [NextQuestionHandler] Test already completed');
      const result: NextQuestionResult = {
        question: null,
        isTestComplete: true,
        currentPhase: sessionData.current_phase as TestPhase,
        progress: {
          questionsAnswered: sessionData.questions_answered,
          currentQuestionIndex: sessionData.current_question_index,
          totalQuestionsInPhase: (sessionData.current_phase_questions as Question[]).length,
        },
      };
      return jsonResponse(result);
    }

    const currentPhaseQuestions = sessionData.current_phase_questions as Question[];
    const currentQuestionIndex = sessionData.current_question_index as number;
    const currentPhase = sessionData.current_phase as TestPhase;
    const currentDifficulty = sessionData.current_difficulty as DifficultyLevel;
    const gradeLevel = sessionData.grade_level as GradeLevel;

    // Calculate total questions answered across all phases
    const totalQuestionsAnswered = sessionData.questions_answered as number;
    const maxTotalQuestions = DEFAULT_ADAPTIVE_TEST_CONFIG.phases.diagnostic_screener.maxQuestions +
      DEFAULT_ADAPTIVE_TEST_CONFIG.phases.adaptive_core.maxQuestions +
      DEFAULT_ADAPTIVE_TEST_CONFIG.phases.stability_confirmation.maxQuestions;

    // Hard limit: if we've answered max questions, complete the test
    if (totalQuestionsAnswered >= maxTotalQuestions) {
      console.log('🏁 [NextQuestionHandler] Max questions reached, completing test');
      const result: NextQuestionResult = {
        question: null,
        isTestComplete: true,
        currentPhase,
        progress: {
          questionsAnswered: totalQuestionsAnswered,
          currentQuestionIndex,
          totalQuestionsInPhase: currentPhaseQuestions.length,
        },
      };
      return jsonResponse(result);
    }

    // For adaptive_core phase, generate questions dynamically
    const adaptiveCoreQuestionsAnswered = totalQuestionsAnswered - DEFAULT_ADAPTIVE_TEST_CONFIG.phases.diagnostic_screener.maxQuestions;
    if (currentPhase === 'adaptive_core' && adaptiveCoreQuestionsAnswered < DEFAULT_ADAPTIVE_TEST_CONFIG.phases.adaptive_core.maxQuestions) {
      // Get all previously answered question IDs to exclude
      const { data: responses } = await supabase
        .from('adaptive_aptitude_responses')
        .select('question_id, question_text')
        .eq('session_id', sessionId);

      const excludeIds = (responses || []).map(r => r.question_id);
      const answeredQuestionTexts = (responses || []).map(r => r.question_text).filter(Boolean);

      // Also exclude questions already in current phase
      const currentPhaseIds = currentPhaseQuestions.map(q => q.id);
      const currentPhaseTexts = currentPhaseQuestions.map(q => q.text);
      const allExcludeIds = [...new Set([...excludeIds, ...currentPhaseIds])];
      const allExcludeTexts = [...new Set([...answeredQuestionTexts, ...currentPhaseTexts])];

      console.log('🔒 [NextQuestionHandler] Building exclusion list for adaptive core:');
      console.log('  📊 Total excluded IDs:', allExcludeIds.length);
      console.log('  📊 Total excluded texts:', allExcludeTexts.length);

      // Validate exclusion list
      const exclusionValidation = validateExclusionListComplete(
        allExcludeIds,
        excludeIds,
        currentPhaseIds
      );

      if (!exclusionValidation.isValid) {
        console.error('❌ [NextQuestionHandler] Exclusion list validation failed:', exclusionValidation.reason);
      }

      // Select a subtag that maintains balance
      const lastSubtag = currentPhaseQuestions.length > 0
        ? currentPhaseQuestions[currentPhaseQuestions.length - 1]?.subtag
        : null;

      const availableSubtags = ALL_SUBTAGS.filter(s => s !== lastSubtag);
      const selectedSubtag = availableSubtags[Math.floor(Math.random() * availableSubtags.length)] || ALL_SUBTAGS[0];

      console.log('🎯 [NextQuestionHandler] Generating adaptive question:', {
        difficulty: currentDifficulty,
        subtag: selectedSubtag,
        excludeIdsCount: allExcludeIds.length,
        questionNumber: totalQuestionsAnswered + 1,
        adaptiveCoreQuestionNumber: adaptiveCoreQuestionsAnswered + 1,
      });

      // Fetch question directly from question bank (no HTTP round-trip)
      const questionResult = await fetchSingleQuestion(supabase, {
        gradeLevel,
        difficulty: currentDifficulty,
        subtag: selectedSubtag,
        excludeQuestionIds: allExcludeIds,
        studentGrade,
      });

      if (questionResult.questions && questionResult.questions.length > 0) {
        let newQuestion = questionResult.questions[0];
        let retryCount = 0;
        const maxRetries = 3;

        // Validate question is not a duplicate
        let validation = validateQuestionNotDuplicate(newQuestion, allExcludeIds, allExcludeTexts);

        while (!validation.isValid && retryCount < maxRetries) {
          console.warn(`⚠️ [NextQuestionHandler] Generated question is duplicate (attempt ${retryCount + 1}/${maxRetries}): ${validation.reason}`);
          console.warn(`⚠️ [NextQuestionHandler] Question ID: ${newQuestion.id}`);
          console.warn(`⚠️ [NextQuestionHandler] Question text: ${newQuestion.text.substring(0, 100)}...`);
          console.warn(`⚠️ [NextQuestionHandler] Attempting retry with updated exclusions...`);

          const retryExcludeIds = [...allExcludeIds, newQuestion.id];
          const retryExcludeTexts = [...allExcludeTexts, newQuestion.text];
          retryCount++;

          // Retry with updated exclusions
          const retryResult = await fetchSingleQuestion(supabase, {
            gradeLevel,
            difficulty: currentDifficulty,
            subtag: selectedSubtag,
            excludeQuestionIds: retryExcludeIds,
            studentGrade,
          });

          if (retryResult.questions && retryResult.questions.length > 0) {
            newQuestion = retryResult.questions[0];
            validation = validateQuestionNotDuplicate(newQuestion, allExcludeIds, allExcludeTexts);

            if (validation.isValid) {
              console.log(`✅ [NextQuestionHandler] Retry ${retryCount} successful`);
              console.log(`✅ [NextQuestionHandler] New question ID: ${newQuestion.id}`);
              break;
            } else {
              console.error(`❌ [NextQuestionHandler] Retry ${retryCount} also returned duplicate: ${validation.reason}`);
              console.error(`❌ [NextQuestionHandler] Retry question ID: ${newQuestion.id}`);
            }
          } else {
            console.error(`❌ [NextQuestionHandler] Retry ${retryCount} returned no questions`);
            break;
          }
        }

        if (!validation.isValid) {
          console.error(`❌ [NextQuestionHandler] All retries exhausted with subtag ${selectedSubtag}`);
          console.error(`❌ [NextQuestionHandler] Attempting fallback with different subtag...`);
          
          // Try one more time with a completely different subtag
          const fallbackSubtags = ALL_SUBTAGS.filter(s => s !== selectedSubtag && s !== lastSubtag);
          const fallbackSubtag = fallbackSubtags[Math.floor(Math.random() * fallbackSubtags.length)];
          
          console.log(`🔄 [NextQuestionHandler] Fallback attempt with subtag: ${fallbackSubtag}`);
          
          const fallbackResult = await fetchSingleQuestion(supabase, {
            gradeLevel,
            difficulty: currentDifficulty,
            subtag: fallbackSubtag,
            excludeQuestionIds: [...allExcludeIds, newQuestion.id],
            studentGrade,
          });
          
          if (fallbackResult.questions && fallbackResult.questions.length > 0) {
            const fallbackQuestion = fallbackResult.questions[0];
            const fallbackValidation = validateQuestionNotDuplicate(fallbackQuestion, allExcludeIds, allExcludeTexts);
            
            if (fallbackValidation.isValid) {
              console.log(`✅ [NextQuestionHandler] Fallback successful with different subtag`);
              newQuestion = fallbackQuestion;
              validation = fallbackValidation;
            } else {
              console.warn(`⚠️ [NextQuestionHandler] Fallback also returned similar question`);
              console.warn(`⚠️ [NextQuestionHandler] Allowing question to proceed to avoid blocking test`);
              newQuestion = fallbackQuestion;
              validation = { isValid: true, reason: 'Allowed with warning after all retries' };
            }
          }
          
          // If we still have a duplicate after fallback, allow it with warning
          if (!validation.isValid) {
            console.warn(`⚠️ [NextQuestionHandler] Using best available question after all attempts`);
            console.warn(`⚠️ [NextQuestionHandler] Question may be similar to previous questions`);
            validation = { isValid: true, reason: 'Allowed with warning - best available after retries' };
          }
        }

        // Update session with the new question
        const updatedPhaseQuestions = [...currentPhaseQuestions, newQuestion];
        await supabase
          .from('adaptive_aptitude_sessions')
          .update({ current_phase_questions: updatedPhaseQuestions })
          .eq('id', sessionId);

        console.log('✅ [NextQuestionHandler] Generated adaptive question:', {
          questionId: newQuestion.id,
          difficulty: newQuestion.difficulty,
          subtag: newQuestion.subtag,
          sessionDifficulty: currentDifficulty,
          match: newQuestion.difficulty === currentDifficulty ? '✅' : '❌ MISMATCH!',
        });

        const result: NextQuestionResult = {
          question: newQuestion,
          isTestComplete: false,
          currentPhase,
          progress: {
            questionsAnswered: sessionData.questions_answered,
            currentQuestionIndex,
            totalQuestionsInPhase: updatedPhaseQuestions.length,
          },
        };
        return jsonResponse(result);
      } else {
        // Last-resort: try without studentGrade and without subtag → widest possible search
        console.warn('⚠️ [NextQuestionHandler] Primary fetch empty, attempting last-resort question fetch...');
        const lastResortResult = await fetchSingleQuestion(supabase, {
          gradeLevel,
          difficulty: currentDifficulty,
          excludeQuestionIds: allExcludeIds,
        });

        if (lastResortResult.questions && lastResortResult.questions.length > 0) {
          const lastResortQuestion = lastResortResult.questions[0];
          console.log('✅ [NextQuestionHandler] Last-resort fetch succeeded:', { id: lastResortQuestion.id, difficulty: lastResortQuestion.difficulty });

          const updatedPhaseQuestions = [...currentPhaseQuestions, lastResortQuestion];
          await supabase
            .from('adaptive_aptitude_sessions')
            .update({ current_phase_questions: updatedPhaseQuestions })
            .eq('id', sessionId);

          const result: NextQuestionResult = {
            question: lastResortQuestion,
            isTestComplete: false,
            currentPhase,
            progress: {
              questionsAnswered: sessionData.questions_answered,
              currentQuestionIndex,
              totalQuestionsInPhase: updatedPhaseQuestions.length,
            },
          };
          return jsonResponse(result);
        }

        console.error('❌ [NextQuestionHandler] All question fetch attempts exhausted (including last-resort)');
        return jsonResponse(
          {
            error: 'Failed to fetch question',
            message: 'Question bank returned no questions for the current difficulty/grade after all fallback attempts'
          },
          500
        );
      }
    }

    // For diagnostic_screener and stability_confirmation, use pre-generated questions
    if (currentPhase !== 'adaptive_core' && currentQuestionIndex < currentPhaseQuestions.length) {
      const nextQuestion = currentPhaseQuestions[currentQuestionIndex];
      console.log('✅ [NextQuestionHandler] Returning question at index', currentQuestionIndex);

      const result: NextQuestionResult = {
        question: nextQuestion,
        isTestComplete: false,
        currentPhase,
        progress: {
          questionsAnswered: sessionData.questions_answered,
          currentQuestionIndex,
          totalQuestionsInPhase: currentPhaseQuestions.length,
        },
      };
      return jsonResponse(result);
    }

    // Need to transition to next phase or complete test
    let nextPhase: TestPhase | null = null;

    if (currentPhase === 'diagnostic_screener') {
      nextPhase = 'adaptive_core';
    } else if (currentPhase === 'adaptive_core') {
      nextPhase = 'stability_confirmation';
    } else {
      // Test is complete
      const result: NextQuestionResult = {
        question: null,
        isTestComplete: true,
        currentPhase,
        progress: {
          questionsAnswered: sessionData.questions_answered,
          currentQuestionIndex,
          totalQuestionsInPhase: currentPhaseQuestions.length,
        },
      };
      return jsonResponse(result);
    }

    // Generate questions for next phase
    const provisionalBand = sessionData.provisional_band as DifficultyLevel | null;

    // Get ALL answered question IDs and texts to exclude
    const { data: allResponses } = await supabase
      .from('adaptive_aptitude_responses')
      .select('question_id, question_text')
      .eq('session_id', sessionId);

    const answeredQuestionIds = (allResponses || []).map(r => r.question_id);
    const answeredQuestionTexts = (allResponses || []).map(r => r.question_text).filter(Boolean);

    const existingQuestionIds = [...answeredQuestionIds, ...currentPhaseQuestions.map(q => q.id)];
    const existingQuestionTexts = [...answeredQuestionTexts, ...currentPhaseQuestions.map(q => q.text)];

    console.log('🔒 [NextQuestionHandler] Building exclusion list for phase transition');

    let newQuestions: Question[];

    if (nextPhase === 'adaptive_core') {
      // Get tier from diagnostic screener responses
      const { data: responses } = await supabase
        .from('adaptive_aptitude_responses')
        .select('*')
        .eq('session_id', sessionId)
        .eq('phase', 'diagnostic_screener');

      const screenerResponses = (responses || []).map(dbResponseToResponse);
      const tierResult = AdaptiveEngine.classifyTier(screenerResponses);

      // Update session with tier
      await supabase
        .from('adaptive_aptitude_sessions')
        .update({
          tier: tierResult.tier,
          current_difficulty: tierResult.startingDifficulty,
        })
        .eq('id', sessionId);

      // Fetch adaptive core questions directly from question bank
      const questionResult = await fetchAdaptiveQuestions(supabase, {
        gradeLevel,
        startingDifficulty: tierResult.startingDifficulty,
        count: 10,
        excludeQuestionIds: existingQuestionIds,
        studentGrade,
      });
      newQuestions = questionResult.questions;
    } else {
      // Stability confirmation phase
      const band = provisionalBand || currentDifficulty;

      // Fetch stability questions directly from question bank
      const questionResult = await fetchStabilityQuestions(supabase, {
        gradeLevel,
        provisionalBand: band,
        count: 6,
        excludeQuestionIds: existingQuestionIds,
        studentGrade,
      });

      console.log('📊 [NextQuestionHandler] Stability generation result:', {
        questionsReceived: questionResult.questions?.length || 0,
        expectedCount: 6,
        fromCache: questionResult.fromCache,
        generatedCount: questionResult.generatedCount
      });
      
      if (!questionResult.questions || questionResult.questions.length === 0) {
        console.error('❌ [NextQuestionHandler] No stability questions generated!');
        throw new Error('Stability generation returned no questions');
      }
      
      if (questionResult.questions.length < 6) {
        console.warn(`⚠️ [NextQuestionHandler] Expected 6 stability questions but got ${questionResult.questions.length}`);
        console.warn(`⚠️ [NextQuestionHandler] Test will complete with ${questionResult.questions.length} stability questions`);
      }
      
      newQuestions = questionResult.questions;
    }

    // Update session with new phase and questions
    const { error: updateError } = await supabase
      .from('adaptive_aptitude_sessions')
      .update({
        current_phase: nextPhase,
        current_question_index: 0,
        current_phase_questions: newQuestions,
      })
      .eq('id', sessionId);

    if (updateError) {
      throw new Error(`Failed to update session for phase transition: ${updateError.message}`);
    }

    const result: NextQuestionResult = {
      question: newQuestions[0],
      isTestComplete: false,
      currentPhase: nextPhase,
      progress: {
        questionsAnswered: sessionData.questions_answered,
        currentQuestionIndex: 0,
        totalQuestionsInPhase: newQuestions.length,
      },
    };

    return jsonResponse(result);

  } catch (error) {
    console.error('❌ [NextQuestionHandler] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to get next question',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};
