/**
 * Link Adaptive Session to Assessment Attempt
 * 
 * Handles POST /link-to-attempt endpoint
 * Links an adaptive aptitude session to an assessment attempt
 * Uses admin client to bypass RLS for foreign key constraint
 */

import type { PagesFunction } from '../../lib/types';
import { jsonResponse } from '../../lib/response';
import { createSupabaseAdminClient } from '../../lib/supabase';
import { getContextUser } from '../../lib/auth';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    const user = getContextUser(context);
    const auth = { user };

    const body = await request.json() as { attemptId: string; sessionId: string };
    const { attemptId, sessionId } = body;

    if (!attemptId || !sessionId) {
      return jsonResponse(
        { error: 'Missing required fields: attemptId and sessionId' },
        400
      );
    }

    // Use admin client to bypass RLS for foreign key constraint check
    const supabase = createSupabaseAdminClient(env);

    // First, get the learner record for the authenticated user
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .eq('user_id', auth.user.id)
      .single();

    if (learnerError || !learnerData) {
      console.error('❌ [LinkToAttemptHandler] Learner record not found:', learnerError);
      return jsonResponse(
        { error: 'Learner record not found', message: learnerError?.message },
        404
      );
    }

    const learnerId = learnerData.id;

    // Guard: if attempt already has a completed adaptive session, do not overwrite it
    const { data: existingAttempt } = await supabase
      .from('personal_assessment_attempts')
      .select('adaptive_aptitude_session_id')
      .eq('id', attemptId)
      .single();

    if (existingAttempt?.adaptive_aptitude_session_id) {
      const { data: existingSession } = await supabase
        .from('adaptive_aptitude_sessions')
        .select('status')
        .eq('id', existingAttempt.adaptive_aptitude_session_id)
        .single();

      if (existingSession?.status === 'completed') {
        return jsonResponse({
          success: true,
          skipped: true,
          reason: 'Attempt already linked to a completed adaptive session',
          existingSessionId: existingAttempt.adaptive_aptitude_session_id,
        });
      }
    }

    // Verify the session belongs to the authenticated user's learner record
    const { data: sessionData, error: sessionError } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('learner_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return jsonResponse(
        { error: 'Session not found', message: sessionError?.message },
        404
      );
    }

    if (sessionData.learner_id !== learnerId) {
      return jsonResponse(
        { error: 'Unauthorized: You do not own this session' },
        403
      );
    }

    // Verify the attempt belongs to the authenticated user's learner record
    const { data: attemptData, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('learner_id')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attemptData) {
      return jsonResponse(
        { error: 'Attempt not found', message: attemptError?.message },
        404
      );
    }

    if (attemptData.learner_id !== learnerId) {
      return jsonResponse(
        { error: 'Unauthorized: You do not own this attempt' },
        403
      );
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
      return jsonResponse(
        { error: 'Failed to link session to attempt', message: updateError.message },
        500
      );
    }

    return jsonResponse({
      success: true,
      attempt: updatedAttempt,
    });

  } catch (error) {
    return jsonResponse(
      {
        error: 'Failed to link session to attempt',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
