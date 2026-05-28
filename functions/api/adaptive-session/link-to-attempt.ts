/**
 * Link Adaptive Session to Assessment Attempt
 * 
 * Handles POST /link-to-attempt endpoint
 * Links an adaptive aptitude session to an assessment attempt
 * Uses admin client to bypass RLS for foreign key constraint
 */

import type { PagesFunction } from '../../lib/types';
import { apiSuccess, apiError } from '../../lib/response';
import { createSupabaseAdminClient } from '../../lib/supabase';
import { getContextUser } from '../../lib/auth';
export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    const user = getContextUser(context);
    const userId = user.id;

    console.log('✅ [LinkToAttemptHandler] User authenticated:', userId);

    // Parse request body
    const body = await request.json() as { attemptId: string; sessionId: string };
    const { attemptId, sessionId } = body;

    if (!attemptId || !sessionId) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: attemptId and sessionId', request);
    }

    console.log('🔗 [LinkToAttemptHandler] Linking session to attempt:', {
      attemptId,
      sessionId,
    });

    // Use admin client to bypass RLS for foreign key constraint check
    const supabase = createSupabaseAdminClient(env);

    // First, get the learner record for the authenticated user
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (learnerError || !learnerData) {
      console.error('❌ [LinkToAttemptHandler] Learner record not found:', learnerError);
      return apiError(404, 'NOT_FOUND', 'Learner record not found', request);
    }

    const learnerId = learnerData.id;
    console.log('📋 [LinkToAttemptHandler] Found learner ID:', learnerId);

    // Verify the session belongs to the authenticated user's learner record
    const { data: sessionData, error: sessionError } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('learner_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ [LinkToAttemptHandler] Session not found:', sessionError);
      return apiError(404, 'NOT_FOUND', 'Session not found', request);
    }

    // Verify session ownership (learner_id should match the learner record)
    if (sessionData.learner_id !== learnerId) {
      console.error('❌ [LinkToAttemptHandler] Session ownership verification failed');
      console.error('   Expected learner_id:', learnerId);
      console.error('   Session learner_id:', sessionData.learner_id);
      return apiError(403, 'FORBIDDEN', 'Unauthorized: You do not own this session', request);
    }

    // Verify the attempt belongs to the authenticated user's learner record
    const { data: attemptData, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('learner_id')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attemptData) {
      console.error('❌ [LinkToAttemptHandler] Attempt not found:', attemptError);
      return apiError(404, 'NOT_FOUND', 'Attempt not found', request);
    }

    // Verify attempt ownership
    if (attemptData.learner_id !== learnerId) {
      console.error('❌ [LinkToAttemptHandler] Attempt ownership verification failed');
      console.error('   Expected learner_id:', learnerId);
      console.error('   Attempt learner_id:', attemptData.learner_id);
      return apiError(403, 'FORBIDDEN', 'Unauthorized: You do not own this attempt', request);
    }

    // Update the attempt with the session ID (using admin client bypasses RLS)
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('personal_assessment_attempts')
      .update({
        adaptive_aptitude_session_id: sessionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [LinkToAttemptHandler] Failed to update attempt:', updateError);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to link session to attempt', request);
    }

    console.log('✅ [LinkToAttemptHandler] Successfully linked session to attempt');

    return apiSuccess({ attempt: updatedAttempt }, request);

  } catch (error) {
    console.error('❌ [LinkToAttemptHandler] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to link session to attempt', request);
  }
};
