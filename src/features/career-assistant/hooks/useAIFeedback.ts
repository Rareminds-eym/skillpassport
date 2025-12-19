/**
 * Hook for managing AI feedback/evaluations
 * Allows students to rate AI responses with thumbs up/down, star rating, and text feedback
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

export interface AIFeedback {
  conversationId: string;
  messageId: string;
  userMessage: string;
  aiResponse: string;
  detectedIntent?: string;
  intentConfidence?: string;
  conversationPhase?: string;
}

export interface FeedbackData {
  thumbsUp: boolean | null;
  rating: number | null;
  feedback: string | null;
}

export interface FeedbackState {
  [messageId: string]: FeedbackData;
}

export function useAIFeedback() {
  const { user } = useAuth();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit feedback for an AI response
   */
  const submitFeedback = useCallback(async (
    feedback: AIFeedback,
    thumbsUp: boolean,
    userRating?: number,
    userFeedbackText?: string
  ): Promise<boolean> => {
    if (!user?.id) {
      setError('Please log in to submit feedback');
      return false;
    }

    setLoading(feedback.messageId);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from('ai_evaluations')
        .select('id')
        .eq('conversation_id', feedback.conversationId)
        .eq('message_id', feedback.messageId)
        .single();

      if (existing) {
        const { error: updateError } = await supabase
          .from('ai_evaluations')
          .update({
            thumbs_up: thumbsUp,
            user_rating: userRating || null,
            user_feedback: userFeedbackText || null,
            feedback_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('ai_evaluations')
          .insert({
            conversation_id: feedback.conversationId,
            student_id: user.id,
            message_id: feedback.messageId,
            user_message: feedback.userMessage,
            ai_response: feedback.aiResponse,
            detected_intent: feedback.detectedIntent,
            intent_confidence: feedback.intentConfidence,
            conversation_phase: feedback.conversationPhase,
            thumbs_up: thumbsUp,
            user_rating: userRating || null,
            user_feedback: userFeedbackText || null,
            feedback_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Update local state with full feedback data
      setFeedbackState(prev => ({
        ...prev,
        [feedback.messageId]: {
          thumbsUp,
          rating: userRating || null,
          feedback: userFeedbackText || null
        }
      }));

      return true;
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback');
      return false;
    } finally {
      setLoading(null);
    }
  }, [user?.id]);

  /**
   * Load existing feedback for a conversation (includes rating and feedback text)
   */
  const loadFeedback = useCallback(async (conversationId: string) => {
    if (!user?.id || !conversationId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_evaluations')
        .select('message_id, thumbs_up, user_rating, user_feedback')
        .eq('conversation_id', conversationId)
        .eq('student_id', user.id);

      if (fetchError) throw fetchError;

      if (data) {
        const newState: FeedbackState = {};
        data.forEach((item: { 
          message_id: string; 
          thumbs_up: boolean | null;
          user_rating: number | null;
          user_feedback: string | null;
        }) => {
          newState[item.message_id] = {
            thumbsUp: item.thumbs_up,
            rating: item.user_rating,
            feedback: item.user_feedback
          };
        });
        setFeedbackState(prev => ({ ...prev, ...newState }));
      }
    } catch (err) {
      console.error('Error loading feedback:', err);
    }
  }, [user?.id]);

  /**
   * Get full feedback data for a specific message
   */
  const getFeedback = useCallback((messageId: string): FeedbackData | null => {
    return feedbackState[messageId] ?? null;
  }, [feedbackState]);

  /**
   * Get just thumbs up/down state (for backward compatibility)
   */
  const getThumbsState = useCallback((messageId: string): boolean | null => {
    return feedbackState[messageId]?.thumbsUp ?? null;
  }, [feedbackState]);

  /**
   * Check if feedback is being submitted for a message
   */
  const isLoading = useCallback((messageId: string): boolean => {
    return loading === messageId;
  }, [loading]);

  return {
    submitFeedback,
    loadFeedback,
    getFeedback,
    getThumbsState,
    isLoading,
    feedbackState,
    error,
    clearError: () => setError(null)
  };
}
