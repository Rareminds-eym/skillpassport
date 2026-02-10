/**
 * Link Adaptive Session to Assessment Attempt
 * 
 * Handles POST /link-to-attempt endpoint
 * Links an adaptive aptitude session to an assessment attempt
 * Uses admin client to bypass RLS for foreign key constraint
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { jsonResponse } from '../../../src/functions-lib/response';
import { createSupabaseAdminClient } from '../../../src/functions-lib/supabase';
import { authenticateUser } from '../shared/auth';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    // Authenticate user
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      console.error('❌ [LinkToAttemptHandler] Authentication required');
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    console.log('✅ [LinkToAttemptHandler] User authenticated:', auth.user.id);

    // Parse request body
    const body = await request.json() as { attemptId: string; sessionId: string };
    const { attemptId, sessionId } = body;

    if (!attemptId || !sessionId) {
      return jsonResponse(
        { error: 'Missing required fields: attemptId and sessionId' },
        400
      );
    }

    console.log('🔗 [LinkToAttemptHandler] Linking session to attempt:', {
      attemptId,
      sessionId,
    });

    // Use admin client to bypass RLS for foreign key constraint check
    const supabase = createSupabaseAdminClient(env);

    // First, get the student record for the authenticated user
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', auth.user.id)
      .single();

    if (studentError || !studentData) {
      console.error('❌ [LinkToAttemptHandler] Student record not found:', studentError);
      return jsonResponse(
        { error: 'Student record not found', message: studentError?.message },
        404
      );
    }

    const studentId = studentData.id;
    console.log('📋 [LinkToAttemptHandler] Found student ID:', studentId);

    // Verify the session belongs to the authenticated user's student record
    const { data: sessionData, error: sessionError } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('student_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ [LinkToAttemptHandler] Session not found:', sessionError);
      return jsonResponse(
        { error: 'Session not found', message: sessionError?.message },
        404
      );
    }

    // Verify session ownership (student_id should match the student record)
    if (sessionData.student_id !== studentId) {
      console.error('❌ [LinkToAttemptHandler] Session ownership verification failed');
      console.error('   Expected student_id:', studentId);
      console.error('   Session student_id:', sessionData.student_id);
      return jsonResponse(
        { error: 'Unauthorized: You do not own this session' },
        403
      );
    }

    // Verify the attempt belongs to the authenticated user's student record
    const { data: attemptData, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('student_id')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attemptData) {
      console.error('❌ [LinkToAttemptHandler] Attempt not found:', attemptError);
      return jsonResponse(
        { error: 'Attempt not found', message: attemptError?.message },
        404
      );
    }

    // Verify attempt ownership
    if (attemptData.student_id !== studentId) {
      console.error('❌ [LinkToAttemptHandler] Attempt ownership verification failed');
      console.error('   Expected student_id:', studentId);
      console.error('   Attempt student_id:', attemptData.student_id);
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
      console.error('❌ [LinkToAttemptHandler] Failed to update attempt:', updateError);
      return jsonResponse(
        { error: 'Failed to link session to attempt', message: updateError.message },
        500
      );
    }

    console.log('✅ [LinkToAttemptHandler] Successfully linked session to attempt');

    return jsonResponse({
      success: true,
      attempt: updatedAttempt,
    });

  } catch (error) {
    console.error('❌ [LinkToAttemptHandler] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to link session to attempt',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
