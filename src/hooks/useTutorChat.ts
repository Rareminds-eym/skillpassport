import { useState, useCallback, useEffect } from 'react';
import {
  ChatMessage,
  Conversation,
  sendMessage,
  getLastConversationId,
  getConversations,
  getConversation,
  getSuggestedQuestions,
  submitFeedback as submitFeedbackService,
  deleteConversation as deleteConversationService,
} from '../services/tutorService';

export interface UseTutorChatOptions {
  courseId: string;
  lessonId?: string;
}

export interface UseTutorChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  isReasoning: boolean;
  currentReasoning: string;
  error: string | null;
  conversationId: string | null;
  conversations: Conversation[];
  suggestedQuestions: string[];
  sendMessage: (content: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  startNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  submitFeedback: (messageIndex: number, rating: 1 | -1, feedbackText?: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshSuggestions: () => Promise<void>;
}

export function useTutorChat({ courseId, lessonId }: UseTutorChatOptions): UseTutorChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReasoning, setIsReasoning] = useState(false);
  const [currentReasoning, setCurrentReasoning] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Fetch conversations on mount and when courseId changes
  const refreshConversations = useCallback(async () => {
    try {
      const convs = await getConversations(courseId);
      setConversations(convs);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [courseId]);

  // Fetch suggested questions when lessonId changes
  const refreshSuggestions = useCallback(async () => {
    if (!lessonId) {
      setSuggestedQuestions([]);
      return;
    }
    try {
      const questions = await getSuggestedQuestions(lessonId);
      setSuggestedQuestions(questions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestedQuestions([]);
    }
  }, [lessonId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    refreshSuggestions();
  }, [refreshSuggestions]);

  // Send a message to the AI tutor
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      setIsLoading(true);
      setIsStreaming(true);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Create placeholder for assistant message
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Stream the response
        const generator = sendMessage({
          conversationId: conversationId || undefined,
          courseId,
          lessonId,
          message: content.trim(),
        });

        setCurrentReasoning('');

        for await (const chunk of generator) {
          if (chunk.type === 'reasoning' && chunk.reasoning) {
            // AI is thinking/reasoning
            setIsReasoning(true);
            setCurrentReasoning((prev) => prev + chunk.reasoning);
          } else if (chunk.type === 'content' && chunk.content) {
            // AI is generating response content
            setIsReasoning(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + chunk.content }
                  : msg
              )
            );
          } else if (chunk.type === 'done') {
            // Stream complete
            if (chunk.conversationId && !conversationId) {
              setConversationId(chunk.conversationId);
              refreshConversations();
            }
          }
        }

        // Update conversation ID if this was a new conversation (fallback)
        const newConvId = getLastConversationId();
        if (newConvId && !conversationId) {
          setConversationId(newConvId);
          refreshConversations();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to send message');
        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setIsReasoning(false);
      }
    },
    [conversationId, courseId, lessonId, isStreaming, refreshConversations]
  );

  // Load an existing conversation
  const loadConversation = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const conv = await getConversation(convId);
      if (conv) {
        setConversationId(conv.id);
        setMessages(conv.messages);
      } else {
        setError('Conversation not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  // Edit a user message and regenerate AI response (ChatGPT-style)
  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!newContent.trim() || isStreaming) return;

      // Find the message index
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) return;

      // Only allow editing user messages
      const message = messages[messageIndex];
      if (message.role !== 'user') return;

      setError(null);
      setIsLoading(true);
      setIsStreaming(true);

      // Remove all messages after the edited message and update the edited message
      const updatedMessages = messages.slice(0, messageIndex);
      const editedUserMessage: ChatMessage = {
        ...message,
        content: newContent.trim(),
        timestamp: new Date(),
      };
      setMessages([...updatedMessages, editedUserMessage]);

      // Create placeholder for new assistant message
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Stream the new response
        const generator = sendMessage({
          conversationId: conversationId || undefined,
          courseId,
          lessonId,
          message: newContent.trim(),
        });

        setCurrentReasoning('');

        for await (const chunk of generator) {
          if (chunk.type === 'reasoning' && chunk.reasoning) {
            setIsReasoning(true);
            setCurrentReasoning((prev) => prev + chunk.reasoning);
          } else if (chunk.type === 'content' && chunk.content) {
            setIsReasoning(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + chunk.content }
                  : msg
              )
            );
          } else if (chunk.type === 'done') {
            if (chunk.conversationId && !conversationId) {
              setConversationId(chunk.conversationId);
              refreshConversations();
            }
          }
        }

        const newConvId = getLastConversationId();
        if (newConvId && !conversationId) {
          setConversationId(newConvId);
          refreshConversations();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to regenerate response');
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setIsReasoning(false);
      }
    },
    [messages, conversationId, courseId, lessonId, isStreaming, refreshConversations]
  );

  // Delete a conversation permanently
  const handleDeleteConversation = useCallback(
    async (convId: string) => {
      setError(null);
      try {
        await deleteConversationService(convId);
        // If we deleted the current conversation, clear it
        if (conversationId === convId) {
          setConversationId(null);
          setMessages([]);
        }
        // Refresh the conversations list
        await refreshConversations();
      } catch (err: any) {
        setError(err.message || 'Failed to delete conversation');
        throw err;
      }
    },
    [conversationId, refreshConversations]
  );

  // Submit feedback for a message
  const handleSubmitFeedback = useCallback(
    async (messageIndex: number, rating: 1 | -1, feedbackText?: string) => {
      if (!conversationId) {
        setError('No active conversation');
        return;
      }

      try {
        await submitFeedbackService(conversationId, messageIndex, rating, feedbackText);
      } catch (err: any) {
        setError(err.message || 'Failed to submit feedback');
      }
    },
    [conversationId]
  );

  return {
    messages,
    isLoading,
    isStreaming,
    isReasoning,
    currentReasoning,
    error,
    conversationId,
    conversations,
    suggestedQuestions,
    sendMessage: handleSendMessage,
    editMessage: handleEditMessage,
    loadConversation,
    startNewConversation,
    deleteConversation: handleDeleteConversation,
    submitFeedback: handleSubmitFeedback,
    refreshConversations,
    refreshSuggestions,
  };
}
