/**
 * Adaptive Aptitude Service
 * 
 * Main service for managing adaptive aptitude tests.
 * Now acts as a wrapper around the Adaptive Session API (Cloudflare Pages Functions).
 * Replaces direct Supabase calls with API calls for better reliability and CORS handling.
 * 
 * Requirements: 1.1, 2.2, 2.3, 2.4, 3.3, 5.2, 7.3, 8.1, 8.2, 8.3, 8.4
 * Task 66: Service refactoring to use API wrapper
 */

import * as AdaptiveAptitudeApiService from './adaptiveAptitudeApiService';
import {
  TestSession,
  TestResults,
  GradeLevel,
  AnswerResult,
} from '../types/adaptiveAptitude';

// =============================================================================
// RE-EXPORT TYPES FOR BACKWARD COMPATIBILITY
// =============================================================================

export type {
  InitializeTestOptions,
  InitializeTestResult,
  SubmitAnswerOptions,
  NextQuestionResult,
  ResumeTestResult,
} from './adaptiveAptitudeApiService';

// =============================================================================
// API WRAPPER FUNCTIONS
// All functions now call the Adaptive Session API instead of Supabase directly
// =============================================================================

/**
 * Initializes a new adaptive aptitude test session
 * 
 * Requirements: 1.1
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param options - Options containing studentId and gradeLevel
 * @returns InitializeTestResult with session and first question
 */
export async function initializeTest(
  options: InitializeTestOptions
): Promise<InitializeTestResult> {
  const { studentId, gradeLevel } = options;
  
  console.log('🚀 [AdaptiveAptitudeService] initializeTest called:', { studentId, gradeLevel });

  // Generate diagnostic screener questions
  console.log('📝 [AdaptiveAptitudeService] Generating diagnostic screener questions...');
  const questionResult = await QuestionGeneratorService.generateDiagnosticScreenerQuestions(
    gradeLevel
  );
  console.log('📋 [AdaptiveAptitudeService] Question generation result:', {
    questionsCount: questionResult.questions.length,
    fromCache: questionResult.fromCache,
    generatedCount: questionResult.generatedCount,
    cachedCount: questionResult.cachedCount,
  });

  if (questionResult.questions.length === 0) {
    console.error('❌ [AdaptiveAptitudeService] No questions generated!');
    throw new Error('Failed to generate diagnostic screener questions');
  }

  // Create session in database
  console.log('💾 [AdaptiveAptitudeService] Creating session in database...');
  const { data: sessionData, error: sessionError } = await supabase
    .from('adaptive_aptitude_sessions')
    .insert({
      student_id: studentId,
      grade_level: gradeLevel,
      current_phase: 'diagnostic_screener',
      current_difficulty: 1, // FIXED: Start at difficulty 1 for adaptive diagnostic
      difficulty_path: [],
      questions_answered: 0,
      correct_answers: 0,
      current_question_index: 0,
      current_phase_questions: questionResult.questions,
      status: 'in_progress',
    })
    .select()
    .single();

  if (sessionError || !sessionData) {
    console.error('❌ [AdaptiveAptitudeService] Failed to create session:', sessionError);
    throw new Error(`Failed to create test session: ${sessionError?.message || 'Unknown error'}`);
  }
  
  console.log('✅ [AdaptiveAptitudeService] Session created:', sessionData.id);

  const session = dbSessionToTestSession(
    sessionData,
    [],
    questionResult.questions
  );

  return {
    session,
    firstQuestion: questionResult.questions[0],
  };
}

/**
 * Gets the next question for the current session
 * 
 * Requirements: 2.2, 2.3, 2.4
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID
 * @returns NextQuestionResult with the next question or completion status
 */
export async function getNextQuestion(sessionId: string): Promise<NextQuestionResult> {
  console.log('📋 [AdaptiveAptitudeService] getNextQuestion called:', { sessionId });
  
  // Fetch session from database
  const { data: sessionData, error: sessionError } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !sessionData) {
    console.error('❌ [AdaptiveAptitudeService] Failed to fetch session:', sessionError);
    throw new Error(`Failed to fetch session: ${sessionError?.message || 'Session not found'}`);
  }
  
  console.log('📊 [AdaptiveAptitudeService] Session data:', {
    status: sessionData.status,
    currentPhase: sessionData.current_phase,
    currentQuestionIndex: sessionData.current_question_index,
    questionsAnswered: sessionData.questions_answered,
    currentDifficulty: sessionData.current_difficulty,
    phaseQuestionsCount: (sessionData.current_phase_questions as Question[])?.length,
  });

  // Check if test is already complete
  if (sessionData.status === 'completed') {
    console.log('🏁 [AdaptiveAptitudeService] Test already completed');
    return {
      question: null,
      isTestComplete: true,
      currentPhase: sessionData.current_phase as TestPhase,
      progress: {
        questionsAnswered: sessionData.questions_answered,
        currentQuestionIndex: sessionData.current_question_index,
        totalQuestionsInPhase: (sessionData.current_phase_questions as Question[]).length,
      },
    };
  }

  const currentPhaseQuestions = sessionData.current_phase_questions as Question[];
  const currentQuestionIndex = sessionData.current_question_index as number;
  const currentPhase = sessionData.current_phase as TestPhase;
  const currentDifficulty = sessionData.current_difficulty as DifficultyLevel;
  const gradeLevel = sessionData.grade_level as GradeLevel;

  console.log('📊 [AdaptiveAptitudeService] getNextQuestion - checking phase questions:', {
    currentQuestionIndex,
    totalPhaseQuestions: currentPhaseQuestions?.length,
    hasMoreQuestions: currentQuestionIndex < (currentPhaseQuestions?.length || 0),
    currentPhase,
    currentDifficulty,
  });

  // Calculate total questions answered across all phases
  const totalQuestionsAnswered = sessionData.questions_answered as number;
  const maxTotalQuestions = DEFAULT_ADAPTIVE_TEST_CONFIG.phases.diagnostic_screener.maxQuestions +
    DEFAULT_ADAPTIVE_TEST_CONFIG.phases.adaptive_core.maxQuestions +
    DEFAULT_ADAPTIVE_TEST_CONFIG.phases.stability_confirmation.maxQuestions; // 8 + 36 + 6 = 50

  // Hard limit: if we've answered max questions, complete the test
  if (totalQuestionsAnswered >= maxTotalQuestions) {
    console.log('🏁 [AdaptiveAptitudeService] Max questions reached, completing test');
    return {
      question: null,
      isTestComplete: true,
      currentPhase,
      progress: {
        questionsAnswered: totalQuestionsAnswered,
        currentQuestionIndex,
        totalQuestionsInPhase: currentPhaseQuestions.length,
      },
    };
  }

  // For adaptive_core phase, generate questions dynamically based on current difficulty
  // Limit to maxQuestions for this phase (36)
  const adaptiveCoreQuestionsAnswered = totalQuestionsAnswered - DEFAULT_ADAPTIVE_TEST_CONFIG.phases.diagnostic_screener.maxQuestions;
  if (currentPhase === 'adaptive_core' && adaptiveCoreQuestionsAnswered < DEFAULT_ADAPTIVE_TEST_CONFIG.phases.adaptive_core.maxQuestions) {
    // Get all previously answered question IDs to exclude (including question text to prevent content duplicates)
    const { data: responses } = await supabase
      .from('adaptive_aptitude_responses')
      .select('question_id, question_text')
      .eq('session_id', sessionId);
    
    const excludeIds = (responses || []).map(r => r.question_id);
    const answeredQuestionTexts = (responses || []).map(r => r.question_text).filter(Boolean);
    
    // Also exclude questions already in current phase that haven't been answered
    const currentPhaseIds = currentPhaseQuestions.map(q => q.id);
    const currentPhaseTexts = currentPhaseQuestions.map(q => q.text);
    const allExcludeIds = [...new Set([...excludeIds, ...currentPhaseIds])];
    const allExcludeTexts = [...new Set([...answeredQuestionTexts, ...currentPhaseTexts])];
    
    // Enhanced logging for exclusion list construction (Requirements: 2.1)
    console.log('🔒 [AdaptiveAptitudeService] Building exclusion list for adaptive core:');
    console.log('  📊 Answered questions count:', excludeIds.length);
    console.log('  📊 Current phase questions count:', currentPhaseIds.length);
    console.log('  📊 Total excluded IDs:', allExcludeIds.length);
    console.log('  📊 Total excluded texts:', allExcludeTexts.length);
    console.log('  🔍 Sample excluded IDs (first 5):', allExcludeIds.slice(0, 5));
    console.log('  🔍 All answered question IDs:', excludeIds);
    console.log('  🔍 All current phase question IDs:', currentPhaseIds);
    
    // Validate exclusion list is complete (Requirements: 1.4)
    const exclusionValidation = validateExclusionListComplete(
      allExcludeIds,
      excludeIds,
      currentPhaseIds
    );
    
    if (!exclusionValidation.isValid) {
      console.error('❌ [AdaptiveAptitudeService] Exclusion list validation failed:', exclusionValidation.reason);
    }
    
    // Select a subtag that maintains balance (avoid consecutive same subtag)
    const lastSubtag = currentPhaseQuestions.length > 0 
      ? currentPhaseQuestions[currentPhaseQuestions.length - 1]?.subtag 
      : null;
    
    // Get a different subtag if possible
    const availableSubtags = ALL_SUBTAGS.filter(s => s !== lastSubtag);
    const selectedSubtag = availableSubtags[Math.floor(Math.random() * availableSubtags.length)] || ALL_SUBTAGS[0];
    
    console.log('🎯 [AdaptiveAptitudeService] Generating adaptive question:', {
      difficulty: currentDifficulty,
      subtag: selectedSubtag,
      excludeIdsCount: allExcludeIds.length,
      excludeTextsCount: allExcludeTexts.length,
    });
    
    // Generate a single question at the current difficulty
    const questionResult = await QuestionGeneratorService.generateQuestions({
      gradeLevel,
      phase: 'adaptive_core',
      difficulty: currentDifficulty,
      subtag: selectedSubtag,
      count: 1,
      excludeQuestionIds: allExcludeIds,
      excludeQuestionTexts: allExcludeTexts,  // NOW PASSING QUESTION TEXTS!
    });
    
    if (questionResult.questions.length > 0) {
      let newQuestion = questionResult.questions[0];
      let retryCount = 0;
      const maxRetries = 1;
      
      // Validate question is not a duplicate (Requirements: 3.3)
      const validation = validateQuestionNotDuplicate(newQuestion, allExcludeIds, allExcludeTexts);
      
      if (!validation.isValid) {
        console.warn(`⚠️ [AdaptiveAptitudeService] Generated question is duplicate: ${validation.reason}`);
        console.warn(`⚠️ [AdaptiveAptitudeService] Question ID: ${newQuestion.id}`);
        console.warn(`⚠️ [AdaptiveAptitudeService] Attempting retry with updated exclusions...`);
        
        // Requirements: 3.4, 4.2 - Add retry when generated question is duplicate
        // Add duplicate ID to exclusion list
        const retryExcludeIds = [...allExcludeIds, newQuestion.id];
        // Add duplicate text to exclusion texts
        const retryExcludeTexts = [...allExcludeTexts, newQuestion.text];
        
        retryCount++;
        
        // Call question generation again with updated exclusions
        const retryResult = await QuestionGeneratorService.generateQuestions({
          gradeLevel,
          phase: 'adaptive_core',
          difficulty: currentDifficulty,
          subtag: selectedSubtag,
          count: 1,
          excludeQuestionIds: retryExcludeIds,
          excludeQuestionTexts: retryExcludeTexts,
        });
        
        if (retryResult.questions.length > 0) {
          const retryValidation = validateQuestionNotDuplicate(
            retryResult.questions[0],
            allExcludeIds,
            allExcludeTexts
          );
          
          if (retryValidation.isValid) {
            newQuestion = retryResult.questions[0];
            console.log('✅ [AdaptiveAptitudeService] Retry successful, using new question');
            console.log(`✅ [AdaptiveAptitudeService] New question ID: ${newQuestion.id}`);
          } else {
            // Requirements: 4.3 - Graceful degradation after retry exhaustion
            console.error(`❌ [AdaptiveAptitudeService] Retry also returned duplicate: ${retryValidation.reason}`);
            console.error(`❌ [AdaptiveAptitudeService] Retry question ID: ${retryResult.questions[0].id}`);
            console.error(`❌ [AdaptiveAptitudeService] Retry exhausted (${retryCount}/${maxRetries}), allowing duplicate to avoid blocking test progress`);
            
            // Track retry failures for monitoring
            console.error(`❌ [AdaptiveAptitudeService] RETRY_FAILURE: session=${sessionId}, originalQuestionId=${newQuestion.id}, retryQuestionId=${retryResult.questions[0].id}, difficulty=${currentDifficulty}, subtag=${selectedSubtag}`);
            
            // Use the retry question anyway to avoid blocking test progress
            newQuestion = retryResult.questions[0];
          }
        } else {
          // Requirements: 4.3 - Graceful degradation when retry returns no questions
          console.error(`❌ [AdaptiveAptitudeService] Retry returned no questions`);
          console.error(`❌ [AdaptiveAptitudeService] Retry exhausted (${retryCount}/${maxRetries}), using original duplicate to avoid blocking test progress`);
          
          // Track retry failures for monitoring
          console.error(`❌ [AdaptiveAptitudeService] RETRY_FAILURE: session=${sessionId}, originalQuestionId=${newQuestion.id}, retryQuestionId=none, difficulty=${currentDifficulty}, subtag=${selectedSubtag}`);
          
          // Keep the original question to avoid blocking test progress
        }
      }
      
      // Update session with the new question added to the phase questions
      const updatedPhaseQuestions = [...currentPhaseQuestions, newQuestion];
      await supabase
        .from('adaptive_aptitude_sessions')
        .update({ current_phase_questions: updatedPhaseQuestions })
        .eq('id', sessionId);
      
      console.log('✅ [AdaptiveAptitudeService] Generated adaptive question:', {
        questionId: newQuestion.id,
        difficulty: newQuestion.difficulty,
        subtag: newQuestion.subtag,
      });
      
      return {
        question: newQuestion,
        isTestComplete: false,
        currentPhase,
        progress: {
          questionsAnswered: sessionData.questions_answered,
          currentQuestionIndex,
          totalQuestionsInPhase: updatedPhaseQuestions.length,
        },
      };
    }
  }

  // FIXED: For diagnostic_screener, generate questions dynamically like adaptive_core
  // This makes the diagnostic truly adaptive, adjusting difficulty based on performance
  if (currentPhase === 'diagnostic_screener') {
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
    
    console.log('🔒 [AdaptiveAptitudeService] Building exclusion list for diagnostic screener:');
    console.log('  📊 Total excluded IDs:', allExcludeIds.length);
    console.log('  📊 Total excluded texts:', allExcludeTexts.length);
    
    // Select a random subtag for variety
    const availableSubtags = ALL_SUBTAGS;
    const selectedSubtag = availableSubtags[Math.floor(Math.random() * availableSubtags.length)];
    
    console.log('🎯 [AdaptiveAptitudeService] Generating diagnostic question:', {
      difficulty: currentDifficulty,
      subtag: selectedSubtag,
      excludeIdsCount: allExcludeIds.length,
    });
    
    // Generate a single question at the current difficulty
    const questionResult = await QuestionGeneratorService.generateQuestions({
      gradeLevel,
      phase: 'diagnostic_screener',
      difficulty: currentDifficulty,
      subtag: selectedSubtag,
      count: 1,
      excludeQuestionIds: allExcludeIds,
      excludeQuestionTexts: allExcludeTexts,
    });
    
    if (questionResult.questions.length > 0) {
      const newQuestion = questionResult.questions[0];
      
      // Update session with the new question
      const updatedPhaseQuestions = [...currentPhaseQuestions, newQuestion];
      await supabase
        .from('adaptive_aptitude_sessions')
        .update({ current_phase_questions: updatedPhaseQuestions })
        .eq('id', sessionId);
      
      console.log('✅ [AdaptiveAptitudeService] Generated diagnostic question:', {
        questionId: newQuestion.id,
        difficulty: newQuestion.difficulty,
      });
      
      return {
        question: newQuestion,
        isTestComplete: false,
        currentPhase,
        progress: {
          questionsAnswered: sessionData.questions_answered,
          currentQuestionIndex,
          totalQuestionsInPhase: updatedPhaseQuestions.length,
        },
      };
    }
  }

  // For stability_confirmation, use pre-generated questions
  // NOTE: diagnostic_screener and adaptive_core are now generated dynamically above
  if (currentPhase === 'stability_confirmation' && currentQuestionIndex < currentPhaseQuestions.length) {
    const nextQuestion = currentPhaseQuestions[currentQuestionIndex];
    console.log('✅ [AdaptiveAptitudeService] Returning question at index', currentQuestionIndex, ':', {
      questionId: nextQuestion?.id,
      questionText: nextQuestion?.text?.substring(0, 50),
      hasOptions: !!nextQuestion?.options,
      optionKeys: nextQuestion?.options ? Object.keys(nextQuestion.options) : [],
    });
    return {
      question: nextQuestion,
      isTestComplete: false,
      currentPhase: sessionData.current_phase as TestPhase,
      progress: {
        questionsAnswered: sessionData.questions_answered,
        currentQuestionIndex,
        totalQuestionsInPhase: currentPhaseQuestions.length,
      },
    };
  }

  // Need to transition to next phase or complete test
  
  // Determine next phase
  let nextPhase: TestPhase | null = null;
  
  if (currentPhase === 'diagnostic_screener') {
    nextPhase = 'adaptive_core';
  } else if (currentPhase === 'adaptive_core') {
    nextPhase = 'stability_confirmation';
  } else {
    // Test is complete
    return {
      question: null,
      isTestComplete: true,
      currentPhase,
      progress: {
        questionsAnswered: sessionData.questions_answered,
        currentQuestionIndex,
        totalQuestionsInPhase: currentPhaseQuestions.length,
      },
    };
  }

  // Generate questions for next phase
  const provisionalBand = sessionData.provisional_band as DifficultyLevel | null;
  
  // Get ALL answered question IDs and texts to exclude (from responses table)
  const { data: allResponses } = await supabase
    .from('adaptive_aptitude_responses')
    .select('question_id, question_text')
    .eq('session_id', sessionId);
  
  const answeredQuestionIds = (allResponses || []).map(r => r.question_id);
  const answeredQuestionTexts = (allResponses || []).map(r => r.question_text).filter(Boolean);
  
  // Also include current phase questions that haven't been answered yet
  const existingQuestionIds = [
    ...answeredQuestionIds,
    ...currentPhaseQuestions.map(q => q.id)
  ];
  
  const existingQuestionTexts = [
    ...answeredQuestionTexts,
    ...currentPhaseQuestions.map(q => q.text)
  ];
  
  // Enhanced logging for exclusion list construction (Requirements: 2.1)
  console.log('🔒 [AdaptiveAptitudeService] Building exclusion list for phase transition:');
  console.log('  📊 Answered questions count:', answeredQuestionIds.length);
  console.log('  📊 Current phase questions count:', currentPhaseQuestions.length);
  console.log('  📊 Total excluded IDs:', existingQuestionIds.length);
  console.log('  📊 Total excluded texts:', existingQuestionTexts.length);
  console.log('  🔍 Sample excluded IDs (first 5):', existingQuestionIds.slice(0, 5));
  console.log('  🔍 All answered question IDs:', answeredQuestionIds);
  console.log('  🔍 All current phase question IDs:', currentPhaseQuestions.map(q => q.id));
  
  // Validate exclusion list is complete (Requirements: 1.4)
  const exclusionValidation = validateExclusionListComplete(
    existingQuestionIds,
    answeredQuestionIds,
    currentPhaseQuestions.map(q => q.id)
  );
  
  if (!exclusionValidation.isValid) {
    console.error('❌ [AdaptiveAptitudeService] Exclusion list validation failed:', exclusionValidation.reason);
  }
  
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
    
    const questionResult = await QuestionGeneratorService.generateAdaptiveCoreQuestions(
      gradeLevel,
      tierResult.startingDifficulty,
      10,
      existingQuestionIds,
      existingQuestionTexts
    );
    newQuestions = questionResult.questions;
  } else {
    // Stability confirmation phase
    const band = provisionalBand || currentDifficulty;
    const questionResult = await QuestionGeneratorService.generateStabilityConfirmationQuestions(
      gradeLevel,
      band,
      5,
      existingQuestionIds,
      existingQuestionTexts
    );
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

  return {
    question: newQuestions[0],
    isTestComplete: false,
    currentPhase: nextPhase,
    progress: {
      questionsAnswered: sessionData.questions_answered,
      currentQuestionIndex: 0,
      totalQuestionsInPhase: newQuestions.length,
    },
  };
}

/**
 * Submits an answer for the current question
 * 
 * Requirements: 5.2
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param options - Options containing sessionId, questionId, selectedAnswer, responseTimeMs
 * @returns AnswerResult with correctness, difficulty changes, and updated session
 */
export async function submitAnswer(
  options: AdaptiveAptitudeApiService.SubmitAnswerOptions
): Promise<AnswerResult> {
  console.log('📝 [AdaptiveAptitudeService] submitAnswer (API wrapper):', {
    sessionId: options.sessionId,
    questionId: options.questionId,
  });

  // Fetch session from database
  const { data: sessionData, error: sessionError } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !sessionData) {
    throw new Error(`Failed to fetch session: ${sessionError?.message || 'Session not found'}`);
  }

  console.log('📊 [AdaptiveAptitudeService] Session state before update:', {
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
    throw new Error(`Question not found in current phase: ${questionId}`);
  }

  // Check if answer is correct
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  // FIXED: Calculate new difficulty for both diagnostic_screener and adaptive_core phases
  // This makes the diagnostic truly adaptive
  let newDifficulty = currentDifficulty;
  let difficultyChange: 'increased' | 'decreased' | 'unchanged' = 'unchanged';
  
  if (currentPhase === 'diagnostic_screener' || currentPhase === 'adaptive_core') {
    const adjustment = AdaptiveEngine.adjustDifficulty(currentDifficulty, isCorrect);
    newDifficulty = adjustment.newDifficulty;
    difficultyChange = adjustment.change;
    console.log(`🎯 [AdaptiveAptitudeService] Difficulty adjusted in ${currentPhase}:`, {
      isCorrect,
      previousDifficulty: currentDifficulty,
      newDifficulty,
      change: difficultyChange,
    });
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
    throw new Error(`Failed to record response: ${responseError.message}`);
  }

  // Update session
  const newQuestionsAnswered = sessionData.questions_answered + 1;
  const newCorrectAnswers = sessionData.correct_answers + (isCorrect ? 1 : 0);
  const newQuestionIndex = currentQuestionIndex + 1;

  console.log('📈 [AdaptiveAptitudeService] Updating session:', {
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
    console.log('🏁 [AdaptiveAptitudeService] Max questions reached, marking test complete');
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
    updated_at: new Date().toISOString(), // Track when session was last updated
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
    throw new Error(`Failed to update session: ${updateError.message}`);
  }

  console.log('✅ [AdaptiveAptitudeService] Session updated in database');

  // Fetch updated session
  const { data: updatedSessionData } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  console.log('📊 [AdaptiveAptitudeService] Session state after update:', {
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

  return {
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
}


// =============================================================================
// COMPLETE TEST
// =============================================================================

/**
 * Validates that a session has no duplicate questions
 * 
 * Requirements: 3.1
 * - Queries all responses for a session
 * - Groups by question_id and counts occurrences
 * - Returns list of duplicates with sequence numbers
 * 
 * @param sessionId - The session ID to validate
 * @returns Validation result with isValid flag and optional duplicates array
 */
async function validateSessionNoDuplicates(sessionId: string): Promise<{
  isValid: boolean;
  duplicates?: Array<{ questionId: string; sequences: number[] }>;
}> {
  // Query all responses for the session
  const { data: responses, error } = await supabase
    .from('adaptive_aptitude_responses')
    .select('question_id, sequence_number')
    .eq('session_id', sessionId)
    .order('sequence_number', { ascending: true });
  
  if (error) {
    console.error('❌ [AdaptiveAptitudeService] Failed to fetch responses for duplicate validation:', error);
    // Return valid to avoid blocking test completion on query errors
    return { isValid: true };
  }
  
  if (!responses || responses.length === 0) {
    // No responses means no duplicates
    return { isValid: true };
  }
  
  // Group by question_id and collect sequence numbers
  const questionMap = new Map<string, number[]>();
  
  for (const response of responses) {
    const questionId = response.question_id;
    const sequenceNumber = response.sequence_number;
    
    if (!questionMap.has(questionId)) {
      questionMap.set(questionId, []);
    }
    questionMap.get(questionId)!.push(sequenceNumber);
  }
  
  // Find duplicates (questions that appear more than once)
  const duplicates = Array.from(questionMap.entries())
    .filter(([_, sequences]) => sequences.length > 1)
    .map(([questionId, sequences]) => ({ questionId, sequences }));
  
  if (duplicates.length > 0) {
    console.error(`❌ [AdaptiveAptitudeService] Session ${sessionId} has duplicate questions:`, duplicates);
    return { isValid: false, duplicates };
  }
  
  console.log(`✅ [AdaptiveAptitudeService] Session ${sessionId} validation passed: No duplicate questions found`);
  return { isValid: true };
}

/**
 * Calculates accuracy breakdown by difficulty level
 * 
 * Requirements: 8.1
 * 
 * @param responses - All responses from the session
 * @returns Record of accuracy by difficulty level
 */
function calculateAccuracyByDifficulty(
  responses: Response[]
): Record<DifficultyLevel, { correct: number; total: number; accuracy: number }> {
  const result: Record<DifficultyLevel, { correct: number; total: number; accuracy: number }> = {
    1: { correct: 0, total: 0, accuracy: 0 },
    2: { correct: 0, total: 0, accuracy: 0 },
    3: { correct: 0, total: 0, accuracy: 0 },
    4: { correct: 0, total: 0, accuracy: 0 },
    5: { correct: 0, total: 0, accuracy: 0 },
  };

  for (const response of responses) {
    const difficulty = response.difficultyAtTime;
    result[difficulty].total++;
    if (response.isCorrect) {
      result[difficulty].correct++;
    }
  }

  // Calculate accuracy percentages
  for (const level of ALL_DIFFICULTY_LEVELS) {
    if (result[level].total > 0) {
      result[level].accuracy = (result[level].correct / result[level].total) * 100;
    }
  }

  return result;
}

/**
 * Calculates accuracy breakdown by subtag
 * 
 * Requirements: 8.2
 * 
 * @param responses - All responses from the session
 * @returns Record of accuracy by subtag
 */
function calculateAccuracyBySubtag(
  responses: Response[]
): Record<Subtag, { correct: number; total: number; accuracy: number }> {
  const result: Record<Subtag, { correct: number; total: number; accuracy: number }> = {
    numerical_reasoning: { correct: 0, total: 0, accuracy: 0 },
    logical_reasoning: { correct: 0, total: 0, accuracy: 0 },
    verbal_reasoning: { correct: 0, total: 0, accuracy: 0 },
    spatial_reasoning: { correct: 0, total: 0, accuracy: 0 },
    data_interpretation: { correct: 0, total: 0, accuracy: 0 },
    pattern_recognition: { correct: 0, total: 0, accuracy: 0 },
  };

  for (const response of responses) {
    const subtag = response.subtag;
    result[subtag].total++;
    if (response.isCorrect) {
      result[subtag].correct++;
    }
  }

  // Calculate accuracy percentages
  for (const subtag of ALL_SUBTAGS) {
    if (result[subtag].total > 0) {
      result[subtag].accuracy = (result[subtag].correct / result[subtag].total) * 100;
    }
  }

  return result;
}

/**
 * Classifies the difficulty path pattern
 * 
 * Requirements: 8.3
 * 
 * @param difficultyPath - Array of difficulty levels throughout the test
 * @returns Path classification
 */
function classifyPath(
  difficultyPath: DifficultyLevel[]
): 'ascending' | 'descending' | 'stable' | 'fluctuating' {
  if (difficultyPath.length < 2) {
    return 'stable';
  }

  let ascendingCount = 0;
  let descendingCount = 0;
  let stableCount = 0;

  for (let i = 1; i < difficultyPath.length; i++) {
    const diff = difficultyPath[i] - difficultyPath[i - 1];
    if (diff > 0) {
      ascendingCount++;
    } else if (diff < 0) {
      descendingCount++;
    } else {
      stableCount++;
    }
  }

  const totalChanges = difficultyPath.length - 1;
  const ascendingRatio = ascendingCount / totalChanges;
  const descendingRatio = descendingCount / totalChanges;
  const stableRatio = stableCount / totalChanges;

  // Determine classification based on dominant pattern
  if (stableRatio >= 0.6) {
    return 'stable';
  } else if (ascendingRatio >= 0.6) {
    return 'ascending';
  } else if (descendingRatio >= 0.6) {
    return 'descending';
  } else {
    return 'fluctuating';
  }
}

/**
 * Completes the test and calculates final results
 * 
 * Requirements: 3.3, 8.1, 8.2, 8.3, 8.4
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID
 * @returns TestResults with all analytics
 */
export async function completeTest(sessionId: string): Promise<TestResults> {
  console.log('🏁 [AdaptiveAptitudeService] completeTest (API wrapper):', { sessionId });
  return AdaptiveAptitudeApiService.completeTest(sessionId);
}

/**
 * Resumes an existing test session
 * 
 * Requirements: 7.3
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID to resume
 * @returns ResumeTestResult with session state and current question
 */
export async function resumeTest(
  sessionId: string
): Promise<AdaptiveAptitudeApiService.ResumeTestResult> {
  console.log('🔄 [AdaptiveAptitudeService] resumeTest (API wrapper):', { sessionId });
  return AdaptiveAptitudeApiService.resumeTest(sessionId);
}

/**
 * Finds an in-progress session for a student
 * 
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param studentId - The student ID
 * @param gradeLevel - Optional grade level filter
 * @returns The in-progress session or null
 */
export async function findInProgressSession(
  studentId: string,
  gradeLevel?: GradeLevel
): Promise<TestSession | null> {
  console.log('🔍 [AdaptiveAptitudeService] findInProgressSession (API wrapper):', {
    studentId,
    gradeLevel,
  });
  return AdaptiveAptitudeApiService.findInProgressSession(studentId, gradeLevel);
}

/**
 * Abandons a test session
 * 
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID to abandon
 */
export async function abandonSession(sessionId: string): Promise<void> {
  console.log('🚫 [AdaptiveAptitudeService] abandonSession (API wrapper):', { sessionId });
  return AdaptiveAptitudeApiService.abandonSession(sessionId);
}

/**
 * Gets test results for a session
 * 
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID
 * @returns TestResults or null if not found
 */
export async function getTestResults(sessionId: string): Promise<TestResults | null> {
  console.log('📊 [AdaptiveAptitudeService] getTestResults (API wrapper):', { sessionId });
  return AdaptiveAptitudeApiService.getTestResults(sessionId);
}

/**
 * Gets all test results for a student
 * 
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param studentId - The student ID
 * @returns Array of TestResults
 */
export async function getStudentTestResults(studentId: string): Promise<TestResults[]> {
  console.log('📊 [AdaptiveAptitudeService] getStudentTestResults (API wrapper):', { studentId });
  return AdaptiveAptitudeApiService.getStudentTestResults(studentId);
}

// =============================================================================
// ADAPTIVE APTITUDE SERVICE CLASS
// =============================================================================

/**
 * AdaptiveAptitudeService class providing all test management functionality
 * Task 66: Now wraps API calls instead of direct Supabase operations
 */
export class AdaptiveAptitudeService {
  /**
   * Initializes a new test session
   * Requirements: 1.1
   */
  static async initializeTest(
    options: AdaptiveAptitudeApiService.InitializeTestOptions
  ): Promise<AdaptiveAptitudeApiService.InitializeTestResult> {
    return initializeTest(options);
  }

  /**
   * Gets the next question for a session
   * Requirements: 2.2, 2.3, 2.4
   */
  static async getNextQuestion(
    sessionId: string
  ): Promise<AdaptiveAptitudeApiService.NextQuestionResult> {
    return getNextQuestion(sessionId);
  }

  /**
   * Submits an answer for the current question
   * Requirements: 5.2
   */
  static async submitAnswer(
    options: AdaptiveAptitudeApiService.SubmitAnswerOptions
  ): Promise<AnswerResult> {
    return submitAnswer(options);
  }

  /**
   * Completes the test and calculates results
   * Requirements: 3.3, 8.1, 8.2, 8.3, 8.4
   */
  static async completeTest(sessionId: string): Promise<TestResults> {
    return completeTest(sessionId);
  }

  /**
   * Resumes an existing test session
   * Requirements: 7.3
   */
  static async resumeTest(
    sessionId: string
  ): Promise<AdaptiveAptitudeApiService.ResumeTestResult> {
    return resumeTest(sessionId);
  }

  /**
   * Finds an in-progress session for a student
   */
  static async findInProgressSession(
    studentId: string,
    gradeLevel?: GradeLevel
  ): Promise<TestSession | null> {
    return findInProgressSession(studentId, gradeLevel);
  }

  /**
   * Abandons a test session
   */
  static async abandonSession(sessionId: string): Promise<void> {
    return abandonSession(sessionId);
  }

  /**
   * Gets test results for a session
   */
  static async getTestResults(sessionId: string): Promise<TestResults | null> {
    return getTestResults(sessionId);
  }

  /**
   * Gets all test results for a student
   */
  static async getStudentTestResults(studentId: string): Promise<TestResults[]> {
    return getStudentTestResults(studentId);
  }
}

export default AdaptiveAptitudeService;
