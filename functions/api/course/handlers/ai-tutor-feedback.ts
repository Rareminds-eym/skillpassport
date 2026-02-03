/**
 * AI Tutor Feedback Handler
 * 
 * Handles submission and updating of feedback for AI tutor chat messages.
 * Students can rate messages with thumbs up/down and provide optional text feedback.
 * 
 * Requirements: 7.5
 */

import type { PagesFunction, PagesEnv } from '../../../../src/functions-lib/types';
import { authenticateUser } from '../../shared/auth';
import { createSupabaseClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';

interface FeedbackRequestBody {
  conversationId?: string;
  messageIndex?: number;
  rating?: number;
  feedbackText?: string;
}

/**
 * POST /api/course/ai-tutor-feedback
 * 
 * Submit or update feedback for an AI tutor message
 * 
 * Request body:
 * - conversationId: string (required) - ID of the conversation
 * - messageIndex: number (required) - Index of the message in the conversation
 * - rating: number (required) - 1 for thumbs up, -1 for thumbs down
 * - feedbackText: string (optional) - Additional text feedback
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  try {
    const { request, env } = context;

    // Authenticate user
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { user, supabase } = auth;
    const studentId = user.id;

    // Parse request body
    let body: FeedbackRequestBody;
    try {
      body = await request.json() as FeedbackRequestBody;
    } catch (error) {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const { conversationId, messageIndex, rating, feedbackText } = body;

    // Validate required fields
    if (!conversationId || messageIndex === undefined || rating === undefined) {
      return jsonResponse(
        { error: 'Missing required fields: conversationId, messageIndex, rating' },
        400
      );
    }

    // Validate rating value
    if (rating !== 1 && rating !== -1) {
      return jsonResponse(
        { error: 'Invalid rating. Must be 1 (thumbs up) or -1 (thumbs down)' },
        400
      );
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await supabase
      .from('tutor_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (convError || !conversation) {
      return jsonResponse(
        { error: 'Conversation not found or access denied' },
        404
      );
    }

    // Check for existing feedback
    const { data: existingFeedback } = await supabase
      .from('tutor_feedback')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('message_index', messageIndex)
      .maybeSingle();

    if (existingFeedback) {
      // Update existing feedback
      const { error: updateError } = await supabase
        .from('tutor_feedback')
        .update({
          rating,
          feedback_text: feedbackText || null
        })
        .eq('id', existingFeedback.id);

      if (updateError) {
        console.error('Failed to update feedback:', updateError);
        return jsonResponse({ error: 'Failed to update feedback' }, 500);
      }

      return jsonResponse(
        { success: true, message: 'Feedback updated' },
        200
      );
    }

    // Insert new feedback
    const { error: insertError } = await supabase
      .from('tutor_feedback')
      .insert({
        conversation_id: conversationId,
        message_index: messageIndex,
        rating,
        feedback_text: feedbackText || null
      });

    if (insertError) {
      console.error('Failed to submit feedback:', insertError);
      return jsonResponse({ error: 'Failed to submit feedback' }, 500);
    }

    return jsonResponse(
      { success: true, message: 'Feedback submitted' },
      200
    );
  } catch (error) {
    console.error('AI tutor feedback error:', error);
    return jsonResponse(
      { error: 'Internal server error' },
      500
    );
  }
};
