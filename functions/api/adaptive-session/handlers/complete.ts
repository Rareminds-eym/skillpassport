/**
 * Complete Test Handler
 * 
 * Handles POST /complete/:sessionId endpoint
 * Completes test and calculates final results
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import type { 
  TestResults, 
  DifficultyLevel, 
  Tier, 
  GradeLevel,
  Response,
  Subtag,
  ConfidenceTag
} from '../types';
import { dbResponseToResponse } from '../utils/converters';
import { validateSessionNoDuplicates } from '../utils/validation';
import { 
  calculateAccuracyByDifficulty, 
  calculateAccuracyBySubtag, 
  classifyPath 
} from '../utils/analytics';
import { AdaptiveEngine } from '../utils/adaptive-engine';
import { authenticateUser } from '../../lib/auth';

/**
 * Completes the test and calculates final results
 * 
 * Requirements: 3.3, 8.1, 8.2, 8.3, 8.4
 * - Validates session has no duplicate questions
 * - Calculates final aptitude level and confidence tag
 * - Generates analytics (accuracy by difficulty, by subtag)
 * - Stores results in database
 * - Requires authentication and session ownership verification
 */
export const completeHandler: PagesFunction = async (context) => {
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
      console.error('❌ [CompleteHandler] Authentication required');
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    console.log('✅ [CompleteHandler] User authenticated:', auth.user.id);
    console.log('🏁 [CompleteHandler] completeTest called:', { sessionId });

    const supabase = createSupabaseAdminClient(env);

    // Validate session has no duplicate questions (Requirements: 3.1, 3.2)
    const validation = await validateSessionNoDuplicates(sessionId, supabase);
    if (!validation.isValid) {
      console.error(`❌ [CompleteHandler] Test completed with duplicates:`, validation.duplicates);
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
      console.error('❌ [CompleteHandler] Failed to fetch session:', sessionError);
      return jsonResponse(
        { error: 'Session not found', message: sessionError?.message },
        404
      );
    }

    // Verify session ownership by checking if the learner's user_id matches the authenticated user
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', sessionData.learner_id)
      .single();

    if (learnerError || !learnerData) {
      console.error('❌ [CompleteHandler] Failed to fetch learner:', learnerError);
      return jsonResponse(
        { error: 'Learner not found' },
        404
      );
    }

    if (learnerData.user_id !== auth.user.id) {
      console.error('❌ [CompleteHandler] Session ownership verification failed', {
        learnerUserId: learnerData.user_id,
        authUserId: auth.user.id
      });
      return jsonResponse(
        { error: 'Unauthorized: You do not own this session' },
        403
      );
    }

    // Fetch all responses
    const { data: responsesData, error: responsesError } = await supabase
      .from('adaptive_aptitude_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true });

    if (responsesError) {
      console.error('❌ [CompleteHandler] Failed to fetch responses:', responsesError);
      throw new Error(`Failed to fetch responses: ${responsesError.message}`);
    }

    const responses = (responsesData || []).map(dbResponseToResponse);
    const difficultyPath = (sessionData.difficulty_path as number[]).map(d => d as DifficultyLevel);
    const tier = sessionData.tier as Tier;
    const gradeLevel = sessionData.grade_level as GradeLevel;

    console.log('📊 [CompleteHandler] Session data:', {
      responsesCount: responses.length,
      difficultyPathLength: difficultyPath.length,
      tier,
      gradeLevel,
    });

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

    console.log('🎯 [CompleteHandler] Calculated aptitude level:', aptitudeLevel);

    // Determine confidence tag
    const confidenceResult = AdaptiveEngine.determineConfidenceTag(difficultyPath, responses);
    const confidenceTag = confidenceResult.confidenceTag;

    console.log('🔖 [CompleteHandler] Confidence tag:', confidenceTag);

    // Calculate analytics
    const accuracyByDifficulty = calculateAccuracyByDifficulty(responses);
    const accuracyBySubtag = calculateAccuracyBySubtag(responses);
    const pathClassification = classifyPath(difficultyPath);

    console.log('📈 [CompleteHandler] Analytics calculated:', {
      pathClassification,
      accuracyByDifficultyKeys: Object.keys(accuracyByDifficulty),
      accuracyBySubtagKeys: Object.keys(accuracyBySubtag),
    });

    // Calculate overall statistics
    const totalQuestions = responses.length;
    const totalCorrect = responses.filter(r => r.isCorrect).length;
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const averageResponseTimeMs = totalQuestions > 0
      ? Math.round(responses.reduce((sum, r) => sum + r.responseTimeMs, 0) / totalQuestions)
      : 0;

    const completedAt = new Date().toISOString();

    console.log('📊 [CompleteHandler] Overall statistics:', {
      totalQuestions,
      totalCorrect,
      overallAccuracy: overallAccuracy.toFixed(2) + '%',
      averageResponseTimeMs,
    });

    // Create results record with duplicate validation metadata
    const { data: resultsData, error: resultsError } = await supabase
      .from('adaptive_aptitude_results')
      .insert({
        session_id: sessionId,
        learner_id: sessionData.learner_id,
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
      console.error('❌ [CompleteHandler] Failed to create results:', resultsError);
      throw new Error(`Failed to create results: ${resultsError.message}`);
    }

    console.log('✅ [CompleteHandler] Results created:', resultsData.id);

    // Update session status to completed
    const { error: updateError } = await supabase
      .from('adaptive_aptitude_sessions')
      .update({
        status: 'completed',
        completed_at: completedAt,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('❌ [CompleteHandler] Failed to update session status:', updateError);
      throw new Error(`Failed to update session: ${updateError.message}`);
    }

    console.log('✅ [CompleteHandler] Session marked as completed');

    const result: TestResults = {
      id: resultsData.id,
      sessionId,
      learnerId: sessionData.learner_id,
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

    return jsonResponse(result);

  } catch (error) {
    console.error('❌ [CompleteHandler] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to complete test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};
