/**
 * Abandon Session Handler
 * 
 * Handles POST /abandon/:sessionId endpoint
 * Marks a session as abandoned
 */

import type { PagesFunction } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import { getContextUser } from '../../../lib/auth';
/**
 * Abandons a test session
 * 
 * Requirements: Session abandonment
 * - Updates session status to 'abandoned'
 * - Updates updated_at timestamp
 * - Returns success response
 * - Requires authentication and session ownership verification
 */
export const abandonHandler: PagesFunction = async (context) => {
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

    console.log('✅ [AbandonHandler] User authenticated:', userId);
    console.log('🚫 [AbandonHandler] abandonSession called:', { sessionId });

    const supabase = createSupabaseAdminClient(env);

    // Check if session exists
    const { data: sessionData, error: fetchError } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('id, status, learner_id')
      .eq('id', sessionId)
      .single();

    if (fetchError || !sessionData) {
      console.error('❌ [AbandonHandler] Session not found:', fetchError);
      return apiError(404, 'NOT_FOUND', 'Session not found', request);
    }

    // Verify session ownership by checking if the learner's user_id matches the authenticated user
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', sessionData.learner_id)
      .single();

    if (learnerError || !learnerData) {
      console.error('❌ [AbandonHandler] Failed to fetch learner:', learnerError);
      return apiError(404, 'NOT_FOUND', 'Learner not found', request);
    }

    if (learnerData.user_id !== userId) {
      console.error('❌ [AbandonHandler] Session ownership verification failed', {
        learnerUserId: learnerData.user_id,
        authUserId: userId
      });
      return apiError(403, 'FORBIDDEN', 'Unauthorized: You do not own this session', request);
    }

    // Check if already abandoned or completed
    if (sessionData.status === 'abandoned') {
      console.log('⚠️ [AbandonHandler] Session already abandoned');
      return apiSuccess({ 
        message: 'Session was already abandoned' 
      }, request);
    }

    if (sessionData.status === 'completed') {
      console.log('⚠️ [AbandonHandler] Cannot abandon completed session');
      return apiError(400, 'VALIDATION_ERROR', 'Cannot abandon a completed session', request);
    }

    // Update session status
    const { error: updateError } = await supabase
      .from('adaptive_aptitude_sessions')
      .update({
        status: 'abandoned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('❌ [AbandonHandler] Failed to abandon session:', updateError);
      throw new Error(`Failed to abandon session: ${updateError.message}`);
    }

    console.log('✅ [AbandonHandler] Session abandoned successfully');

    return apiSuccess({ 
      message: 'Session abandoned successfully' 
    }, request);

  } catch (error) {
    console.error('❌ [AbandonHandler] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to abandon session', request);
  }
};
