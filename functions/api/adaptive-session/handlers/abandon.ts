/**
 * Abandon Session Handler
 * 
 * Handles POST /abandon/:sessionId endpoint
 * Marks a session as abandoned
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { authenticateUser } from '../../shared/auth';

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
    return jsonResponse({ error: 'Session ID is required' }, 400);
  }

  try {
    // Authenticate user
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      console.error('❌ [AbandonHandler] Authentication required');
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    console.log('✅ [AbandonHandler] User authenticated:', auth.user.id);
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
      return jsonResponse(
        { error: 'Session not found', message: fetchError?.message },
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
      console.error('❌ [AbandonHandler] Failed to fetch learner:', learnerError);
      return jsonResponse(
        { error: 'Learner not found' },
        404
      );
    }

    if (learnerData.user_id !== auth.user.id) {
      console.error('❌ [AbandonHandler] Session ownership verification failed', {
        learnerUserId: learnerData.user_id,
        authUserId: auth.user.id
      });
      return jsonResponse(
        { error: 'Unauthorized: You do not own this session' },
        403
      );
    }

    // Check if already abandoned or completed
    if (sessionData.status === 'abandoned') {
      console.log('⚠️ [AbandonHandler] Session already abandoned');
      return jsonResponse({ 
        success: true, 
        message: 'Session was already abandoned' 
      });
    }

    if (sessionData.status === 'completed') {
      console.log('⚠️ [AbandonHandler] Cannot abandon completed session');
      return jsonResponse(
        { error: 'Cannot abandon a completed session' },
        400
      );
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

    return jsonResponse({ 
      success: true, 
      message: 'Session abandoned successfully' 
    });

  } catch (error) {
    console.error('❌ [AbandonHandler] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to abandon session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};
