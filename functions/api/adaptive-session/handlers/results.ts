/**
 * Results Handlers
 * 
 * Handles GET /results/:sessionId and GET /results/learner/:learnerId endpoints
 * Retrieves test results from database
 */

import type { PagesFunction } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import { getContextUser } from '../../../lib/auth';
import type { 
  TestResults, 
  DifficultyLevel, 
  Tier, 
  GradeLevel,
  Subtag,
  ConfidenceTag
} from '../types';
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
    return apiError(400, 'VALIDATION_ERROR', 'Session ID is required', request);
  }

  try {
    const user = getContextUser(context);
    const userId = user.id;

    console.log('✅ [GetResultsHandler] User authenticated:', userId);
    console.log('📊 [GetResultsHandler] getTestResults called:', { sessionId });

    const supabase = createSupabaseAdminClient(env);

    const { data, error } = await supabase
      .from('adaptive_aptitude_results')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      console.log('❌ [GetResultsHandler] Results not found:', error?.message);
      return apiSuccess({ results: null }, request);
    }

    // Verify session ownership by checking if the learner's user_id matches the authenticated user
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', data.learner_id)
      .single();

    if (learnerError || !learnerData) {
      console.error('❌ [GetResultsHandler] Failed to fetch learner:', learnerError);
      return apiError(404, 'NOT_FOUND', 'Learner not found', request);
    }

    if (learnerData.user_id !== userId) {
      console.error('❌ [GetResultsHandler] Session ownership verification failed', {
        learnerUserId: learnerData.user_id,
        authUserId: userId
      });
      return apiError(403, 'FORBIDDEN', 'Unauthorized: You do not own this session', request);
    }

    console.log('✅ [GetResultsHandler] Results found:', data.id);

    const results: TestResults = {
      id: data.id,
      sessionId: data.session_id,
      learnerId: data.learner_id,
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
    return apiSuccess(results, request);

  } catch (error) {
    console.error('❌ [GetResultsHandler] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to get results', request);
  }
};

/**
 * Gets all test results for a learner
 * 
 * Requirements: Learner results history
 * - Fetches all results for learner from adaptive_aptitude_results table
 * - Orders by completion date (most recent first)
 * - Returns array of TestResults objects
 * - Requires authentication and learner ID verification
 */
export const getlearnerResultsHandler: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const learnerId = pathParts[pathParts.length - 1];

  if (!learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'Learner ID is required', request);
  }

  try {
    const user = getContextUser(context);
    const userId = user.id;

    console.log('✅ [GetLearnerResultsHandler] User authenticated:', userId);

    // Verify learner ID matches authenticated user
    if (learnerId !== userId) {
      console.error('❌ [GetLearnerResultsHandler] Learner ID verification failed');
      return apiError(403, 'FORBIDDEN', 'Unauthorized: You can only access your own results', request);
    }

    console.log('📊 [GetLearnerResultsHandler] getlearnerTestResults called:', { learnerId });

    const supabase = createSupabaseAdminClient(env);

    const { data, error } = await supabase
      .from('adaptive_aptitude_results')
      .select('*')
      .eq('learner_id', learnerId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('❌ [GetLearnerResultsHandler] Failed to fetch results:', error);
      throw new Error(`Failed to fetch results: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('📭 [GetLearnerResultsHandler] No results found for learner');
      return apiSuccess({ results: [] }, request);
    }

    console.log('✅ [GetLearnerResultsHandler] Found results:', data.length);

    const results: TestResults[] = data.map(record => ({
      id: record.id,
      sessionId: record.session_id,
      learnerId: record.learner_id,
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

    return apiSuccess({ results }, request);

  } catch (error) {
    console.error('❌ [GetLearnerResultsHandler] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to get learner results', request);
  }
};
