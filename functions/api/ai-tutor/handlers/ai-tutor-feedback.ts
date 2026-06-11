/**
 * AI Tutor Feedback Handler
 * 
 * Handles submission and updating of feedback for AI tutor chat messages.
 * Learners can rate messages with thumbs up/down and provide optional text feedback.
 * 
 * Requirements: 7.5
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import { apiSuccess, apiError } from '../../../lib/response';

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
export const onRequestPost = async (context: AuthenticatedContext) => {
  const { request, env } = context;
  try {
    const user = getContextUser(context);
    const learnerId = user.id;
    const supabase = getServiceClient(env as any);

    // Parse request body
    let body: FeedbackRequestBody;
    try {
      body = await request.json() as FeedbackRequestBody;
    } catch (error) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', request);
    }

    const { conversationId, messageIndex, rating, feedbackText } = body;

    // Validate required fields
    if (!conversationId || messageIndex === undefined || rating === undefined) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: conversationId, messageIndex, rating', request);
    }

    // Validate rating value
    if (rating !== 1 && rating !== -1) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid rating. Must be 1 (thumbs up) or -1 (thumbs down)', request);
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await supabase
      .from('tutor_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (convError || !conversation) {
      return apiError(404, 'NOT_FOUND', 'Conversation not found or access denied', request);
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
        return apiError(500, 'INTERNAL_ERROR', 'Failed to update feedback', request);
      }

      return apiSuccess({ message: 'Feedback updated' }, request);
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
      return apiError(500, 'INTERNAL_ERROR', 'Failed to submit feedback', request);
    }

    return apiSuccess({ message: 'Feedback submitted' }, request);
  } catch (error) {
    console.error('AI tutor feedback error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
};
