import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGet, apiPost } from '@/shared/api/apiClient';
import { useUser } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('ai-feedback-hook');

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
  const user = useUser();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ownerEpoch = useRef(0);
  const writeVersions = useRef(new Map<string, number>());
  useEffect(() => {
    setFeedbackState({}); setLoading(null); setError(null);
    writeVersions.current.clear();
    return () => { ownerEpoch.current++; };
  }, [user?.id]);

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

    const owner = ownerEpoch.current;
    const advanceWrite = () => writeVersions.current.set(feedback.messageId, (writeVersions.current.get(feedback.messageId) ?? 0) + 1);
    advanceWrite();
    setLoading(feedback.messageId);
    setError(null);

    try {
      await apiPost('/career/feedback', {
        conversationId: feedback.conversationId,
        messageId: feedback.messageId,
        userMessage: feedback.userMessage,
        aiResponse: feedback.aiResponse,
        detectedIntent: feedback.detectedIntent,
        intentConfidence: feedback.intentConfidence,
        conversationPhase: feedback.conversationPhase,
        thumbsUp,
        userRating: userRating || null,
        userFeedback: userFeedbackText || null,
      });

      if (owner !== ownerEpoch.current) return false;
      advanceWrite();
      setFeedbackState(prev => ({
        ...prev,
        [feedback.messageId]: {
          thumbsUp,
          rating: userRating || null,
          feedback: userFeedbackText || null,
        },
      }));

      return true;
    } catch (err: any) {
      if (owner !== ownerEpoch.current) return false;
      advanceWrite();
      logger.error('Failed to submit AI feedback', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to submit feedback');
      return false;
    } finally {
      if (owner === ownerEpoch.current) setLoading(null);
    }
  }, [user?.id]);

  const loadFeedback = useCallback(async (conversationId: string) => {
    if (!user?.id || !conversationId) return;
    const owner = ownerEpoch.current;
    const versionsAtRead = new Map(writeVersions.current);
    try {
      const response: any = await apiGet(`/career/feedback?conversationId=${encodeURIComponent(conversationId)}`);
      if (owner !== ownerEpoch.current) return;
      const data = response.data || [];

      const newState: FeedbackState = {};
      data.forEach((item: {
        message_id: string;
        thumbs_up: boolean | null;
        user_rating: number | null;
        user_feedback: string | null;
      }) => {
        // A response started before a local write cannot replace that write's
        // acknowledged value, even when network responses arrive out of order.
        if (writeVersions.current.get(item.message_id) !== versionsAtRead.get(item.message_id)) return;
        newState[item.message_id] = {
          thumbsUp: item.thumbs_up,
          rating: item.user_rating,
          feedback: item.user_feedback,
        };
      });
      setFeedbackState(prev => ({ ...prev, ...newState }));
    } catch (err) {
      logger.error('Failed to load AI feedback', err instanceof Error ? err : new Error(String(err)));
    }
  }, [user?.id]);

  const getFeedback = useCallback((messageId: string): FeedbackData | null => {
    return feedbackState[messageId] ?? null;
  }, [feedbackState]);

  const getThumbsState = useCallback((messageId: string): boolean | null => {
    return feedbackState[messageId]?.thumbsUp ?? null;
  }, [feedbackState]);

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
    clearError: () => setError(null),
  };
}
