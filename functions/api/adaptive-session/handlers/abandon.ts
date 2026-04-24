/**
 * Abandon Session Handler
 * 
 * Handles POST /abandon/:sessionId endpoint
 * Marks a session as abandoned
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';

/**
 * Abandons a test session
 * 
 * Requirements: Session abandonment
 * - Updates session status to 'abandoned'
 * - Updates updated_at timestamp
 * - Returns success response
 * - Requires authentication (handled by withAuth middleware)
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
    // Get authenticated user from context (set by withAuth middleware)
    const user = context.data?.user;
    if (!user) {
      console.error('❌ [AbandonHandler] No user in context');
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    const userId = user.sub; // SSO JWT uses 'sub' for user ID
    console.log('✅ [AbandonHandler] User authenticated:', userId);
    console.log('🚫 [AbandonHandler] abandonSession called:', { sessionId });

    const supabase = createSupabaseAdminClient(env);

    // Check if session exists
    const { data: sessionData, error: fetchError } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('id, status, student_id')
      .eq('id', sessionId)
      .single();

    if (fetchError || !sessionData) {
      console.error('❌ [AbandonHandler] Session not found:', fetchError);
      return jsonResponse(
        { error: 'Session not found', message: fetchError?.message },
        404
      );
    }

    // Verify session ownership by checking if the student's user_id matches the authenticated user
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', sessionData.student_id)
      .single();

    if (studentError || !studentData) {
      console.error('❌ [AbandonHandler] Failed to fetch student:', studentError);
      return jsonResponse(
        { error: 'Student not found' },
        404
      );
    }

    if (studentData.user_id !== userId) {
      console.error('❌ [AbandonHandler] Session ownership verification failed', {
        studentUserId: studentData.user_id,
        authUserId: userId
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
