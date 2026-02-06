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

    console.log('📊 [NextQuestionHandler] Session data:', {
      status: sessionData.status,
      currentPhase: sessionData.current_phase,
      currentQuestionIndex: sessionData.current_question_index,
      questionsAnswered: sessionData.questions_answered,
      currentDifficulty: sessionData.current_difficulty,
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
      });

      // Call question generation API
      const questionGenUrl = new URL('/api/question-generation/generate/single', request.url);
      const questionGenResponse = await fetch(questionGenUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeLevel,
          phase: 'adaptive_core',
          difficulty: currentDifficulty,
          subtag: selectedSubtag,
          count: 1,
          excludeQuestionIds: allExcludeIds,
          excludeQuestionTexts: allExcludeTexts,
        }),
      });

      if (questionGenResponse.ok) {
        const questionResult = await questionGenResponse.json();

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
            const retryResponse = await fetch(questionGenUrl.toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gradeLevel,
                phase: 'adaptive_core',
                difficulty: currentDifficulty,
                subtag: selectedSubtag,
                count: 1,
                excludeQuestionIds: retryExcludeIds,
                excludeQuestionTexts: retryExcludeTexts,
              }),
            });

            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
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
          }

          if (!validation.isValid) {
            console.error(`❌ [NextQuestionHandler] All retries exhausted with subtag ${selectedSubtag}`);
            console.error(`❌ [NextQuestionHandler] Attempting fallback with different subtag...`);
            
            // Try one more time with a completely different subtag
            const fallbackSubtags = ALL_SUBTAGS.filter(s => s !== selectedSubtag && s !== lastSubtag);
            const fallbackSubtag = fallbackSubtags[Math.floor(Math.random() * fallbackSubtags.length)];
            
            console.log(`🔄 [NextQuestionHandler] Fallback attempt with subtag: ${fallbackSubtag}`);
            
            const fallbackResponse = await fetch(questionGenUrl.toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gradeLevel,
                phase: 'adaptive_core',
                difficulty: currentDifficulty,
                subtag: fallbackSubtag,
                count: 1,
                excludeQuestionIds: [...allExcludeIds, newQuestion.id],
                excludeQuestionTexts: [...allExcludeTexts, newQuestion.text],
              }),
            });
            
            if (fallbackResponse.ok) {
              const fallbackResult = await fallbackResponse.json();
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
                  // CHANGED: Allow the question to proceed with a warning instead of blocking
                  newQuestion = fallbackQuestion;
                  validation = { isValid: true, reason: 'Allowed with warning after all retries' };
                }
              }
            }
            
            // If we still have a duplicate after fallback, allow it with warning
            if (!validation.isValid) {
              console.warn(`⚠️ [NextQuestionHandler] Using best available question after all attempts`);
              console.warn(`⚠️ [NextQuestionHandler] Question may be similar to previous questions`);
              // CHANGED: Allow the test to continue instead of returning error
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
          // No questions returned - this is an error, don't fall through to phase transition
          console.error('❌ [NextQuestionHandler] Question generation returned empty array');
          return jsonResponse(
            {
              error: 'Failed to generate question',
              message: 'Question generation returned no questions'
            },
            500
          );
        }
      } else {
        // Question generation failed - return error instead of falling through
        const errorData = await questionGenResponse.json().catch(() => ({}));
        console.error('❌ [NextQuestionHandler] Question generation failed:', errorData);
        return jsonResponse(
          {
            error: 'Failed to generate question',
            message: errorData.message || 'Question generation API returned error',
            details: errorData
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

      // Call question generation API for adaptive core
      const questionGenUrl = new URL('/api/question-generation/generate/adaptive', request.url);
      const questionGenResponse = await fetch(questionGenUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeLevel,
          startingDifficulty: tierResult.startingDifficulty,
          count: 10,
          excludeQuestionIds: existingQuestionIds,
          excludeQuestionTexts: existingQuestionTexts,
        }),
      });

      if (!questionGenResponse.ok) {
        throw new Error('Failed to generate adaptive core questions');
      }

      const questionResult = await questionGenResponse.json();
      newQuestions = questionResult.questions;
    } else {
      // Stability confirmation phase
      const band = provisionalBand || currentDifficulty;

      const questionGenUrl = new URL('/api/question-generation/generate/stability', request.url);
      const questionGenResponse = await fetch(questionGenUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeLevel,
          provisionalBand: band,  // Fixed: was 'difficulty', should be 'provisionalBand'
          count: 6,  // 6 questions for stability confirmation phase
          excludeQuestionIds: existingQuestionIds,
          excludeQuestionTexts: existingQuestionTexts,
        }),
      });

      if (!questionGenResponse.ok) {
        const errorText = await questionGenResponse.text();
        console.error('❌ [NextQuestionHandler] Stability generation failed:', {
          status: questionGenResponse.status,
          statusText: questionGenResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to generate stability confirmation questions: ${questionGenResponse.statusText}`);
      }

      const questionResult = await questionGenResponse.json();
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
      
      // Log warning if fewer than 6 questions but continue with what we have
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
