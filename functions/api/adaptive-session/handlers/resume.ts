/**
 * Resume and Find Session Handlers
 * 
 * Handles GET /resume/:sessionId and GET /find-in-progress/:studentId endpoints
 * Manages session resumption and discovery
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import type { 
  TestSession, 
  Question,
  GradeLevel
} from '../types';
import { dbSessionToTestSession, dbResponseToResponse } from '../utils/converters';

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
 * - Returns session, current question, and completion status
 */
export const resumeHandler: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const sessionId = pathParts[pathParts.length - 1];

  if (!sessionId) {
    return jsonResponse({ error: 'Session ID is required' }, 400);
  }

  try {
    console.log('🔄 [ResumeHandler] resumeTest called:', { sessionId });

    const supabase = createSupabaseAdminClient(env);

    // Fetch session from database
    const { data: sessionData, error: sessionError } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ [ResumeHandler] Failed to fetch session:', sessionError);
      return jsonResponse(
        { error: 'Session not found', message: sessionError?.message },
        404
      );
    }

    // Check if session is abandoned
    if (sessionData.status === 'abandoned') {
      console.error('❌ [ResumeHandler] Cannot resume abandoned session');
      return jsonResponse(
        { error: 'Cannot resume an abandoned session' },
        400
      );
    }

    console.log('📊 [ResumeHandler] Session status:', sessionData.status);

    // Fetch all responses for the session
    const { data: responsesData, error: responsesError } = await supabase
      .from('adaptive_aptitude_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true });

    if (responsesError) {
      console.error('❌ [ResumeHandler] Failed to fetch responses:', responsesError);
      throw new Error(`Failed to fetch responses: ${responsesError.message}`);
    }

    const responses = (responsesData || []).map(dbResponseToResponse);
    const currentPhaseQuestions = sessionData.current_phase_questions as Question[];

    console.log('📋 [ResumeHandler] Loaded data:', {
      responsesCount: responses.length,
      phaseQuestionsCount: currentPhaseQuestions.length,
    });

    const session = dbSessionToTestSession(
      sessionData,
      responses,
      currentPhaseQuestions
    );

    // Check if test is complete
    if (sessionData.status === 'completed') {
      console.log('✅ [ResumeHandler] Test is completed');
      
      // Fetch results if available
      const { data: resultsData } = await supabase
        .from('adaptive_aptitude_results')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      const result: ResumeTestResult = {
        session,
        currentQuestion: null,
        isTestComplete: true,
      };

      return jsonResponse(result);
    }

    // Get current question
    const currentQuestionIndex = sessionData.current_question_index as number;
    let currentQuestion: Question | null = null;

    if (currentQuestionIndex < currentPhaseQuestions.length) {
      currentQuestion = currentPhaseQuestions[currentQuestionIndex];
      console.log('📝 [ResumeHandler] Current question:', {
        index: currentQuestionIndex,
        questionId: currentQuestion.id,
      });
    } else {
      console.log('⚠️ [ResumeHandler] No current question available (may need phase transition)');
    }

    const result: ResumeTestResult = {
      session,
      currentQuestion,
      isTestComplete: false,
    };

    return jsonResponse(result);

  } catch (error) {
    console.error('❌ [ResumeHandler] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to resume test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};

/**
 * Finds an in-progress session for a student
 * 
 * Requirements: Session discovery
 * - Queries for in-progress sessions for student
 * - Optional grade level filter
 * - Returns most recent in-progress session or null
 */
export const findInProgressHandler: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const studentId = pathParts[pathParts.length - 1];

  if (!studentId) {
    return jsonResponse({ error: 'Student ID is required' }, 400);
  }

  // Get optional gradeLevel query parameter
  const gradeLevel = url.searchParams.get('gradeLevel') as GradeLevel | null;

  try {
    console.log('🔍 [FindInProgressHandler] findInProgressSession called:', { 
      studentId, 
      gradeLevel 
    });

    const supabase = createSupabaseAdminClient(env);

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
      console.log('📭 [FindInProgressHandler] No in-progress session found');
      return jsonResponse({ session: null }, 200);
    }

    console.log('✅ [FindInProgressHandler] Found in-progress session:', data.id);

    // Fetch responses
    const { data: responsesData } = await supabase
      .from('adaptive_aptitude_responses')
      .select('*')
      .eq('session_id', data.id)
      .order('sequence_number', { ascending: true });

    const responses = (responsesData || []).map(dbResponseToResponse);
    const currentPhaseQuestions = data.current_phase_questions as Question[];

    const session = dbSessionToTestSession(data, responses, currentPhaseQuestions);

    return jsonResponse({ session });

  } catch (error) {
    console.error('❌ [FindInProgressHandler] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to find in-progress session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};
