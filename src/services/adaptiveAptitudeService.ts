/**
 * Adaptive Aptitude Service
 * 
 * Main service for managing adaptive aptitude tests.
 * Handles test initialization, question flow, answer submission, and result calculation.
 * 
 * Requirements: 1.1, 2.2, 2.3, 2.4, 3.3, 5.2, 7.3, 8.1, 8.2, 8.3, 8.4
 */

import { supabase } from '../lib/supabaseClient';
import {
  Question,
  Response,
  TestSession,
  TestResults,
  GradeLevel,
  TestPhase,
  DifficultyLevel,
  Tier,
  ConfidenceTag,
  Subtag,
  AnswerResult,
  StopConditionResult,
  ALL_DIFFICULTY_LEVELS,
  ALL_SUBTAGS,
  DEFAULT_ADAPTIVE_TEST_CONFIG,
} from '../types/adaptiveAptitude';
import { AdaptiveEngine } from './adaptiveEngine';
import { QuestionGeneratorService } from './questionGeneratorService';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for initializing a new test
 */
export interface InitializeTestOptions {
  studentId: string;
  gradeLevel: GradeLevel;
}

/**
 * Result of test initialization
 */
export interface InitializeTestResult {
  session: TestSession;
  firstQuestion: Question;
}

/**
 * Options for submitting an answer
 */
export interface SubmitAnswerOptions {
  sessionId: string;
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  responseTimeMs: number;
}

/**
 * Result of getting the next question
 */
export interface NextQuestionResult {
  question: Question | null;
  isTestComplete: boolean;
  currentPhase: TestPhase;
  progress: {
    questionsAnswered: number;
    currentQuestionIndex: number;
    totalQuestionsInPhase: number;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validation result for duplicate detection
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates that the exclusion list is complete
 * 
 * Requirements: 1.4
 * - Verifies all answered question IDs are in exclusion list
 * - Verifies all phase question IDs are in exclusion list
 * - Logs error if any IDs are missing
 * 
 * @param excludeIds - The built exclusion list
 * @param answeredIds - IDs of answered questions
 * @param phaseIds - IDs of current phase questions
 * @returns ValidationResult with isValid and optional reason
 */
function validateExclusionListComplete(
  excludeIds: string[],
  answeredIds: string[],
  phaseIds: string[]
): ValidationResult {
  const excludeSet = new Set(excludeIds);
  const missingAnsweredIds: string[] = [];
  const missingPhaseIds: string[] = [];
  
  // Check all answered question IDs are in exclusion list
  for (const id of answeredIds) {
    if (!excludeSet.has(id)) {
      missingAnsweredIds.push(id);
    }
  }
  
  // Check all phase question IDs are in exclusion list
  for (const id of phaseIds) {
    if (!excludeSet.has(id)) {
      missingPhaseIds.push(id);
    }
  }
  
  // Log errors if any IDs are missing
  if (missingAnsweredIds.length > 0) {
    console.error('❌ [AdaptiveAptitudeService] Exclusion list validation failed: Missing answered question IDs:', missingAnsweredIds);
  }
  
  if (missingPhaseIds.length > 0) {
    console.error('❌ [AdaptiveAptitudeService] Exclusion list validation failed: Missing phase question IDs:', missingPhaseIds);
  }
  
  const isValid = missingAnsweredIds.length === 0 && missingPhaseIds.length === 0;
  
  if (isValid) {
    console.log('✅ [AdaptiveAptitudeService] Exclusion list validation passed: All IDs accounted for');
  }
  
  return {
    isValid,
    reason: isValid 
      ? undefined 
      : `Missing ${missingAnsweredIds.length} answered IDs and ${missingPhaseIds.length} phase IDs from exclusion list`
  };
}

/**
 * Validates that a question is not a duplicate
 * 
 * Requirements: 3.3
 * - Checks if question ID is in exclusion list
 * - Checks if question text is in exclusion list
 * 
 * @param question - The question to validate
 * @param excludeIds - Array of question IDs to exclude
 * @param excludeTexts - Array of question texts to exclude
 * @returns ValidationResult with isValid and optional reason
 */
function validateQuestionNotDuplicate(
  question: Question,
  excludeIds: string[],
  excludeTexts: string[]
): ValidationResult {
  // Check if question ID is in exclusion list
  if (excludeIds.includes(question.id)) {
    return { 
      isValid: false, 
      reason: `Question ID ${question.id} is in exclusion list` 
    };
  }
  
  // Check if question text is in exclusion list
  if (excludeTexts.includes(question.text)) {
    return { 
      isValid: false, 
      reason: `Question text already used` 
    };
  }
  
  return { isValid: true };
}

/**
 * Converts a database session record to a TestSession object
 */
function dbSessionToTestSession(
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
function dbResponseToResponse(dbResponse: Record<string, unknown>): Response {
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

// =============================================================================
// INITIALIZE TEST
// =============================================================================

/**
 * Initializes a new adaptive aptitude test session
 * 
 * Requirements: 1.1
 * - Creates a new session with student ID and grade level
 * - Generates initial question set (diagnostic screener)
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
      current_difficulty: 3, // Default starting difficulty
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


// =============================================================================
// GET NEXT QUESTION
// =============================================================================

/**
 * Gets the next question for the current session
 * 
 * Requirements: 2.2, 2.3, 2.4
 * - Returns next question based on current phase and difficulty
 * - Handles phase transitions
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

  // For diagnostic_screener and stability_confirmation, use pre-generated questions
  // NOTE: Do NOT use this for adaptive_core - those are generated dynamically above
  if (currentPhase !== 'adaptive_core' && currentQuestionIndex < currentPhaseQuestions.length) {
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


// =============================================================================
// SUBMIT ANSWER
// =============================================================================

/**
 * Submits an answer for the current question
 * 
 * Requirements: 5.2
 * - Records response with timing
 * - Calculates next difficulty
 * - Checks phase completion and stop conditions
 * 
 * @param options - Options containing sessionId, questionId, selectedAnswer, responseTimeMs
 * @returns AnswerResult with correctness, difficulty changes, and updated session
 */
export async function submitAnswer(options: SubmitAnswerOptions): Promise<AnswerResult> {
  const { sessionId, questionId, selectedAnswer, responseTimeMs } = options;

  console.log('📝 [AdaptiveAptitudeService] submitAnswer called:', {
    sessionId,
    questionId,
    selectedAnswer,
    responseTimeMs,
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
 * - Calculates final aptitude level and confidence tag
 * - Generates analytics (accuracy by difficulty, by subtag)
 * - Stores results in database
 * 
 * @param sessionId - The session ID
 * @returns TestResults with all analytics
 */
export async function completeTest(sessionId: string): Promise<TestResults> {
  // Validate session has no duplicate questions (Requirements: 3.1, 3.2)
  const validation = await validateSessionNoDuplicates(sessionId);
  if (!validation.isValid) {
    console.error(`❌ [AdaptiveAptitudeService] Test completed with duplicates:`, validation.duplicates);
    // Log to monitoring/analytics system
    // Note: We still proceed with test completion to avoid blocking the user
  }
  
  // Fetch session from database
  const { data: sessionData, error: sessionError } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !sessionData) {
    throw new Error(`Failed to fetch session: ${sessionError?.message || 'Session not found'}`);
  }

  // Fetch all responses
  const { data: responsesData, error: responsesError } = await supabase
    .from('adaptive_aptitude_responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('sequence_number', { ascending: true });

  if (responsesError) {
    throw new Error(`Failed to fetch responses: ${responsesError.message}`);
  }

  const responses = (responsesData || []).map(dbResponseToResponse);
  const difficultyPath = (sessionData.difficulty_path as number[]).map(d => d as DifficultyLevel);
  const tier = sessionData.tier as Tier;
  const gradeLevel = sessionData.grade_level as GradeLevel;

  // Calculate final aptitude level
  // Use mode of last 5 difficulties or provisional band
  let aptitudeLevel: DifficultyLevel;
  
  if (difficultyPath.length >= 5) {
    const lastFive = difficultyPath.slice(-5);
    const counts = new Map<DifficultyLevel, number>();
    for (const d of lastFive) {
      counts.set(d, (counts.get(d) || 0) + 1);
    }
    let maxCount = 0;
    aptitudeLevel = lastFive[lastFive.length - 1]; // Default to last
    for (const [d, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        aptitudeLevel = d;
      }
    }
  } else if (sessionData.provisional_band) {
    aptitudeLevel = sessionData.provisional_band as DifficultyLevel;
  } else {
    aptitudeLevel = sessionData.current_difficulty as DifficultyLevel;
  }

  // Determine confidence tag
  const confidenceResult = AdaptiveEngine.determineConfidenceTag(difficultyPath, responses);
  const confidenceTag = confidenceResult.confidenceTag;

  // Calculate analytics
  const accuracyByDifficulty = calculateAccuracyByDifficulty(responses);
  const accuracyBySubtag = calculateAccuracyBySubtag(responses);
  const pathClassification = classifyPath(difficultyPath);

  // Calculate overall statistics
  const totalQuestions = responses.length;
  const totalCorrect = responses.filter(r => r.isCorrect).length;
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const averageResponseTimeMs = totalQuestions > 0
    ? Math.round(responses.reduce((sum, r) => sum + r.responseTimeMs, 0) / totalQuestions)
    : 0;

  const completedAt = new Date().toISOString();

  // Create results record with duplicate validation metadata
  const { data: resultsData, error: resultsError } = await supabase
    .from('adaptive_aptitude_results')
    .insert({
      session_id: sessionId,
      student_id: sessionData.student_id,
      aptitude_level: aptitudeLevel,
      confidence_tag: confidenceTag,
      tier,
      total_questions: totalQuestions,
      total_correct: totalCorrect,
      overall_accuracy: overallAccuracy,
      accuracy_by_difficulty: accuracyByDifficulty,
      accuracy_by_subtag: accuracyBySubtag,
      difficulty_path: difficultyPath,
      path_classification: pathClassification,
      average_response_time_ms: averageResponseTimeMs,
      grade_level: gradeLevel,
      completed_at: completedAt,
      // Include duplicate validation metadata (Requirements: 3.1, 3.2)
      metadata: {
        duplicateValidation: {
          isValid: validation.isValid,
          duplicates: validation.duplicates || [],
        },
      },
    })
    .select()
    .single();

  if (resultsError) {
    throw new Error(`Failed to create results: ${resultsError.message}`);
  }

  // Update session status to completed
  await supabase
    .from('adaptive_aptitude_sessions')
    .update({
      status: 'completed',
      completed_at: completedAt,
    })
    .eq('id', sessionId);

  return {
    id: resultsData.id,
    sessionId,
    studentId: sessionData.student_id,
    aptitudeLevel,
    confidenceTag,
    tier,
    totalQuestions,
    totalCorrect,
    overallAccuracy,
    accuracyByDifficulty,
    accuracyBySubtag,
    difficultyPath,
    pathClassification,
    averageResponseTimeMs,
    gradeLevel,
    completedAt,
  };
}


// =============================================================================
// RESUME TEST
// =============================================================================

/**
 * Result of resuming a test
 */
export interface ResumeTestResult {
  session: TestSession;
  currentQuestion: Question | null;
  isTestComplete: boolean;
}

/**
 * Resumes an existing test session
 * 
 * Requirements: 7.3
 * - Loads existing session from database
 * - Restores state and continues from last position
 * 
 * @param sessionId - The session ID to resume
 * @returns ResumeTestResult with session state and current question
 */
export async function resumeTest(sessionId: string): Promise<ResumeTestResult> {
  // Fetch session from database
  const { data: sessionData, error: sessionError } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !sessionData) {
    throw new Error(`Failed to fetch session: ${sessionError?.message || 'Session not found'}`);
  }

  // Check if session is abandoned
  if (sessionData.status === 'abandoned') {
    throw new Error('Cannot resume an abandoned session');
  }

  // Fetch all responses for the session
  const { data: responsesData, error: responsesError } = await supabase
    .from('adaptive_aptitude_responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('sequence_number', { ascending: true });

  if (responsesError) {
    throw new Error(`Failed to fetch responses: ${responsesError.message}`);
  }

  const responses = (responsesData || []).map(dbResponseToResponse);
  const currentPhaseQuestions = sessionData.current_phase_questions as Question[];

  const session = dbSessionToTestSession(
    sessionData,
    responses,
    currentPhaseQuestions
  );

  // Check if test is complete
  if (sessionData.status === 'completed') {
    return {
      session,
      currentQuestion: null,
      isTestComplete: true,
    };
  }

  // Get current question
  const currentQuestionIndex = sessionData.current_question_index as number;
  let currentQuestion: Question | null = null;

  if (currentQuestionIndex < currentPhaseQuestions.length) {
    currentQuestion = currentPhaseQuestions[currentQuestionIndex];
  }

  return {
    session,
    currentQuestion,
    isTestComplete: false,
  };
}

/**
 * Finds an in-progress session for a student
 * 
 * @param studentId - The student ID
 * @param gradeLevel - Optional grade level filter
 * @returns The in-progress session or null
 */
export async function findInProgressSession(
  studentId: string,
  gradeLevel?: GradeLevel
): Promise<TestSession | null> {
  let query = supabase
    .from('adaptive_aptitude_sessions')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1);

  if (gradeLevel) {
    query = query.eq('grade_level', gradeLevel);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  // Fetch responses
  const { data: responsesData } = await supabase
    .from('adaptive_aptitude_responses')
    .select('*')
    .eq('session_id', data.id)
    .order('sequence_number', { ascending: true });

  const responses = (responsesData || []).map(dbResponseToResponse);
  const currentPhaseQuestions = data.current_phase_questions as Question[];

  return dbSessionToTestSession(data, responses, currentPhaseQuestions);
}

/**
 * Abandons a test session
 * 
 * @param sessionId - The session ID to abandon
 */
export async function abandonSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('adaptive_aptitude_sessions')
    .update({
      status: 'abandoned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to abandon session: ${error.message}`);
  }
}

/**
 * Gets test results for a session
 * 
 * @param sessionId - The session ID
 * @returns TestResults or null if not found
 */
export async function getTestResults(sessionId: string): Promise<TestResults | null> {
  const { data, error } = await supabase
    .from('adaptive_aptitude_results')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    sessionId: data.session_id,
    studentId: data.student_id,
    aptitudeLevel: data.aptitude_level as DifficultyLevel,
    confidenceTag: data.confidence_tag as ConfidenceTag,
    tier: data.tier as Tier,
    totalQuestions: data.total_questions,
    totalCorrect: data.total_correct,
    overallAccuracy: data.overall_accuracy,
    accuracyByDifficulty: data.accuracy_by_difficulty as Record<DifficultyLevel, { correct: number; total: number; accuracy: number }>,
    accuracyBySubtag: data.accuracy_by_subtag as Record<Subtag, { correct: number; total: number; accuracy: number }>,
    difficultyPath: (data.difficulty_path as number[]).map(d => d as DifficultyLevel),
    pathClassification: data.path_classification as 'ascending' | 'descending' | 'stable' | 'fluctuating',
    averageResponseTimeMs: data.average_response_time_ms,
    gradeLevel: data.grade_level as GradeLevel,
    completedAt: data.completed_at,
  };
}

/**
 * Gets all test results for a student
 * 
 * @param studentId - The student ID
 * @returns Array of TestResults
 */
export async function getStudentTestResults(studentId: string): Promise<TestResults[]> {
  const { data, error } = await supabase
    .from('adaptive_aptitude_results')
    .select('*')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(record => ({
    id: record.id,
    sessionId: record.session_id,
    studentId: record.student_id,
    aptitudeLevel: record.aptitude_level as DifficultyLevel,
    confidenceTag: record.confidence_tag as ConfidenceTag,
    tier: record.tier as Tier,
    totalQuestions: record.total_questions,
    totalCorrect: record.total_correct,
    overallAccuracy: record.overall_accuracy,
    accuracyByDifficulty: record.accuracy_by_difficulty as Record<DifficultyLevel, { correct: number; total: number; accuracy: number }>,
    accuracyBySubtag: record.accuracy_by_subtag as Record<Subtag, { correct: number; total: number; accuracy: number }>,
    difficultyPath: (record.difficulty_path as number[]).map(d => d as DifficultyLevel),
    pathClassification: record.path_classification as 'ascending' | 'descending' | 'stable' | 'fluctuating',
    averageResponseTimeMs: record.average_response_time_ms,
    gradeLevel: record.grade_level as GradeLevel,
    completedAt: record.completed_at,
  }));
}

// =============================================================================
// ADAPTIVE APTITUDE SERVICE CLASS
// =============================================================================

/**
 * AdaptiveAptitudeService class providing all test management functionality
 */
export class AdaptiveAptitudeService {
  /**
   * Initializes a new test session
   * Requirements: 1.1
   */
  static async initializeTest(options: InitializeTestOptions): Promise<InitializeTestResult> {
    return initializeTest(options);
  }

  /**
   * Gets the next question for a session
   * Requirements: 2.2, 2.3, 2.4
   */
  static async getNextQuestion(sessionId: string): Promise<NextQuestionResult> {
    return getNextQuestion(sessionId);
  }

  /**
   * Submits an answer for the current question
   * Requirements: 5.2
   */
  static async submitAnswer(options: SubmitAnswerOptions): Promise<AnswerResult> {
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
  static async resumeTest(sessionId: string): Promise<ResumeTestResult> {
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

