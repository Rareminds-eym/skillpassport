// Custom Hook for Counselling Chat Management (Local State Only)

import { useState, useCallback, useRef } from 'react';
import {
  CounsellingMessage,
  CounsellingTopicType,
  MessageRole,
  StudentContext,
} from '../types/counselling';
import { streamCounsellingResponse } from '../services/aiCounsellingService';

export interface UseCounsellingChatOptions {
  sessionId?: string;
  topic: CounsellingTopicType;
  studentContext?: StudentContext;
  initialMessages?: CounsellingMessage[];
}

export function useCounsellingChat(options: UseCounsellingChatOptions) {
  const [messages, setMessages] = useState<CounsellingMessage[]>(options.initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId] = useState(options.sessionId || `session-${Date.now()}`);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Send message and get AI response
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      try {
        setIsStreaming(true);
        setError(null);
        abortControllerRef.current = new AbortController();

        // Add user message
        const userMessage: CounsellingMessage = {
          id: `msg-${Date.now()}-user`,
          session_id: currentSessionId,
          role: 'user',
          content: content.trim(),
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Prepare conversation history
        const conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Create placeholder for AI response
        const assistantMessageId = `msg-${Date.now()}-assistant`;
        const assistantMessage: CounsellingMessage = {
          id: assistantMessageId,
          session_id: currentSessionId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Stream AI response
        let fullResponse = '';
        const stream = streamCounsellingResponse(
          {
            session_id: currentSessionId,
            message: content,
            student_context: options.studentContext,
            topic: options.topic,
          },
          conversationHistory
        );

        for await (const chunk of stream) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          fullResponse += chunk;

          // Update message with streamed content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: fullResponse } : msg
            )
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('Error sending message:', err);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [currentSessionId, isStreaming, messages, options.studentContext, options.topic]
  );

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Load messages (for switching between sessions)
  const loadMessages = useCallback((newMessages: CounsellingMessage[]) => {
    setMessages(newMessages);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sessionId: currentSessionId,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadMessages,
  };
}
