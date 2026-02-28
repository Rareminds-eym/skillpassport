/**
 * Results Handlers
 * 
 * Handles GET /results/:sessionId and GET /results/student/:studentId endpoints
 * Retrieves test results from database
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import type { 
  TestResults, 
  DifficultyLevel, 
  Tier, 
  GradeLevel,
  Subtag,
  ConfidenceTag
} from '../types';
import { authenticateUser } from '../../shared/auth';

/**
 * Gets test results for a session
 * 
 * Requirements: Results retrieval
 * - Fetches results from adaptive_aptitude_results table
 * - Returns TestResults object or null if not found
 * - Requires authentication and session ownership verification
 */
export const getResultsHandler: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const sessionId = pathParts[pathParts.length - 1];

  if (!sessionId) {
    return jsonResponse({ error: 'Session ID is required' }, 400);
  }

  try {
    // Authenticate user
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      console.error('❌ [GetResultsHandler] Authentication required');
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    console.log('✅ [GetResultsHandler] User authenticated:', auth.user.id);
    console.log('📊 [GetResultsHandler] getTestResults called:', { sessionId });

    const supabase = createSupabaseAdminClient(env);

    const { data, error } = await supabase
      .from('adaptive_aptitude_results')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      console.log('❌ [GetResultsHandler] Results not found:', error?.message);
      return jsonResponse({ results: null }, 200);
    }

    // Verify session ownership by checking if the student's user_id matches the authenticated user
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', data.student_id)
      .single();

    if (studentError || !studentData) {
      console.error('❌ [GetResultsHandler] Failed to fetch student:', studentError);
      return jsonResponse(
        { error: 'Student not found' },
        404
      );
    }

    if (studentData.user_id !== auth.user.id) {
      console.error('❌ [GetResultsHandler] Session ownership verification failed', {
        studentUserId: studentData.user_id,
        authUserId: auth.user.id
      });
      return jsonResponse(
        { error: 'Unauthorized: You do not own this session' },
        403
      );
    }

    console.log('✅ [GetResultsHandler] Results found:', data.id);

    const results: TestResults = {
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

    // Add caching headers for completed results
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('❌ [GetResultsHandler] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to get results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};

/**
 * Gets all test results for a student
 * 
 * Requirements: Student results history
 * - Fetches all results for student from adaptive_aptitude_results table
 * - Orders by completion date (most recent first)
 * - Returns array of TestResults objects
 * - Requires authentication and student ID verification
 */
export const getStudentResultsHandler: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const studentId = pathParts[pathParts.length - 1];

  if (!studentId) {
    return jsonResponse({ error: 'Student ID is required' }, 400);
  }

  try {
    // Authenticate user
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      console.error('❌ [GetStudentResultsHandler] Authentication required');
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    console.log('✅ [GetStudentResultsHandler] User authenticated:', auth.user.id);

    // Verify student ID matches authenticated user
    if (studentId !== auth.user.id) {
      console.error('❌ [GetStudentResultsHandler] Student ID verification failed');
      return jsonResponse(
        { error: 'Unauthorized: You can only access your own results' },
        403
      );
    }

    console.log('📊 [GetStudentResultsHandler] getStudentTestResults called:', { studentId });

    const supabase = createSupabaseAdminClient(env);

    const { data, error } = await supabase
      .from('adaptive_aptitude_results')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('❌ [GetStudentResultsHandler] Failed to fetch results:', error);
      throw new Error(`Failed to fetch results: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('📭 [GetStudentResultsHandler] No results found for student');
      return jsonResponse({ results: [] }, 200);
    }

    console.log('✅ [GetStudentResultsHandler] Found results:', data.length);

    const results: TestResults[] = data.map(record => ({
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

    return jsonResponse({ results });

  } catch (error) {
    console.error('❌ [GetStudentResultsHandler] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to get student results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};
