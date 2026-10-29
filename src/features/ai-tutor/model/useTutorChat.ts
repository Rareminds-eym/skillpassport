import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ChatMessage,
  Conversation,
  sendMessage,
  getLastConversationId,
  getConversations,
  getConversation,
  getSuggestedQuestions,
  submitFeedback as submitFeedbackService,
  deleteConversation as deleteConversationService
} from '../api/tutorService';
import type { WorksheetConfig } from '../types/worksheet';
import type { LessonPlanConfig } from '../types/lesson-plan';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-tutor-chat');

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export interface GenerationUsage {
  limit: number;
  used: number;
  remaining: number;
}

export interface UseTutorChatOptions {
  userId?: string;
  courseId: string;
  lessonId?: string;
  worksheetConfig?: WorksheetConfig;  // Optional worksheet configuration for educators
  lessonPlanConfig?: LessonPlanConfig;  // Optional lesson plan configuration for educators
  isEducator?: boolean;
  onGenerationUsageUpdate?: (usage: GenerationUsage) => void;
}

export interface UseTutorChatReturn {
  facilitatorMode: string;
  setFacilitatorMode: (mode: string) => void;
  activeFacilitator: string | undefined;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  isReasoning: boolean;
  currentReasoning: string;
  error: string | null;
  conversationId: string | null;
  conversations: Conversation[];
  suggestedQuestions: string[];
  sendMessage: (content: string, options?: { generate: boolean }) => Promise<void>;
  stopGeneration: () => void;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  startNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  submitFeedback: (messageIndex: number, rating: 1 | -1, feedbackText?: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshSuggestions: () => Promise<void>;
}

export function useTutorChat({
  userId,
  courseId,
  lessonId,
  worksheetConfig,
  lessonPlanConfig,
  onGenerationUsageUpdate,
  isEducator = false
}: UseTutorChatOptions): UseTutorChatReturn {
  const navigationRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const stopGeneration = useCallback(() => activeRequestRef.current?.abort(), []);
  useEffect(() => () => { activeRequestRef.current?.abort(); }, []);
  const [facilitatorMode, setFacilitatorMode] = useState('auto');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReasoning, setIsReasoning] = useState(false);
  const [currentReasoning, setCurrentReasoning] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const storageKey = userId ? `ai-tutor-active:${userId}:${courseId}` : null;
  const rememberConversation = useCallback((id: string | null) => {
    if (!storageKey) return;
    try {
      if (id) sessionStorage.setItem(storageKey, id);
      else sessionStorage.removeItem(storageKey);
    } catch { /* The server conversation remains accessible from history. */ }
  }, [storageKey]);
  useEffect(() => {
    const navigation = ++navigationRef.current;
    activeRequestRef.current?.abort();
    setConversationId(null); setMessages([]); setFacilitatorMode('auto');
    setError(null); setIsLoading(false);
    if (!storageKey) return;
    let active = true;
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(storageKey); } catch { return; }
    if (!saved) return;
    setIsLoading(true);
    getConversation(saved).then(conv => {
      if (!active || navigation !== navigationRef.current) return;
      if (!conv || conv.courseId !== courseId) { rememberConversation(null); return; }
      setConversationId(conv.id);
      setMessages(conv.messages);
      setFacilitatorMode([...conv.messages].reverse().find(m => m.facilitatorMode)?.facilitatorMode ?? 'auto');
    }).catch(err => { if (active && navigation === navigationRef.current) setError(getErrorMessage(err, 'Failed to restore conversation')); })
      .finally(() => { if (active && navigation === navigationRef.current) setIsLoading(false); });
    return () => { active = false; };
  }, [storageKey, courseId, rememberConversation]);

  // Fetch conversations on mount and when courseId changes
  const refreshConversations = useCallback(async () => {
    try {
      const convs = await getConversations(courseId);
      setConversations(convs);
    } catch (err) {
      logger.error('Error fetching conversations', err instanceof Error ? err : new Error(String(err)));
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
      logger.error('Error fetching suggestions', err instanceof Error ? err : new Error(String(err)));
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
  const handleSendMessage = useCallback(async (content: string, options?: { generate: boolean }) => {
    if (!content.trim() || isStreaming) return;

    const requestController = new AbortController();
    activeRequestRef.current = requestController;
    setError(null);
    setIsLoading(true);
    setIsStreaming(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Create placeholder for assistant message
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      status: 'streaming',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Stream the response
      const generator = sendMessage({
        conversationId: conversationId || undefined,
        courseId,
        lessonId,
        message: content.trim(),
        ...(isEducator ? { facilitatorMode } : {}),
        ...(options?.generate ? { worksheetConfig, lessonPlanConfig } : {}),
      }, requestController.signal);

      setCurrentReasoning('');

      for await (const chunk of generator) {
        requestController.signal.throwIfAborted();
        if (chunk.type === 'reasoning' && chunk.reasoning) {
          // AI is thinking/reasoning
          setIsReasoning(true);
          setCurrentReasoning(prev => prev + chunk.reasoning);
        } else if (chunk.type === 'content' && chunk.content) {
          // AI is generating response content
          setIsReasoning(false);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk.content }
                : msg
            )
          );
        } else if (chunk.type === 'done') {
          setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, id: chunk.messageId || msg.id, worksheetAvailable: chunk.worksheetAvailable, facilitator: chunk.facilitator, facilitatorMode: chunk.facilitatorMode, assignmentSourceId: chunk.assignmentSourceId, status: 'complete' } : msg));
          // Stream complete
          if (chunk.generationUsage) {
            onGenerationUsageUpdate?.(chunk.generationUsage);
          }

          if (chunk.conversationId && !conversationId) {
            setConversationId(chunk.conversationId);
            rememberConversation(chunk.conversationId);
            refreshConversations();
          }
        }
      }

      // Update conversation ID if this was a new conversation (fallback)
      const newConvId = getLastConversationId();
      if (newConvId && !conversationId) {
        setConversationId(newConvId);
        rememberConversation(newConvId);
        refreshConversations();
      }
    } catch (err: unknown) {
      if (!requestController.signal.aborted) setError(getErrorMessage(err, 'Failed to send message'));
      // Keep generated material available for export when persistence fails.
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId || msg.content.trim()).map(msg => msg.id === assistantMessageId ? { ...msg, status: requestController.signal.aborted ? 'stopped' as const : 'failed' as const } : msg));
    } finally {
      if (activeRequestRef.current === requestController) activeRequestRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
      setIsReasoning(false);
    }
  }, [
    conversationId,
    facilitatorMode, isEducator,
    courseId,
    lessonId,
    isStreaming,
    refreshConversations,
    rememberConversation,
    worksheetConfig,
    lessonPlanConfig,
    onGenerationUsageUpdate
  ]);

  // Load an existing conversation
  const loadConversation = useCallback(async (convId: string) => {
    ++navigationRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const conv = await getConversation(convId);
      if (conv) {
        setConversationId(conv.id);
        rememberConversation(conv.id);
        setMessages(conv.messages);
        setFacilitatorMode([...conv.messages].reverse().find(m => m.facilitatorMode)?.facilitatorMode ?? 'auto');
      } else {
        setError('Conversation not found');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load conversation'));
    } finally {
      setIsLoading(false);
    }
  }, [rememberConversation]);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    ++navigationRef.current;
    setIsLoading(false);
    rememberConversation(null);
    setConversationId(null);
    setFacilitatorMode('auto');
    setMessages([]);
    setError(null);
  }, [rememberConversation]);

  // Edit a user message and regenerate AI response (ChatGPT-style)
  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!newContent.trim() || isStreaming) return;

    // Find the message index
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Only allow editing user messages
    const message = messages[messageIndex];
    if (message.role !== 'user') return;

    const requestController = new AbortController();
    activeRequestRef.current = requestController;
    setError(null);
    setIsLoading(true);
    setIsStreaming(true);

    // Remove all messages after the edited message and update the edited message
    const updatedMessages = messages.slice(0, messageIndex);
    const editedUserMessage: ChatMessage = {
      ...message,
      content: newContent.trim(),
      timestamp: new Date()
    };
    setMessages([...updatedMessages, editedUserMessage]);

    // Create placeholder for new assistant message
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      status: 'streaming',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Stream the new response
      const generator = sendMessage({
        conversationId: conversationId || undefined,
        courseId,
        lessonId,
        message: newContent.trim(),
        ...(isEducator ? { facilitatorMode } : {}),
      }, requestController.signal);

      setCurrentReasoning('');

      for await (const chunk of generator) {
        requestController.signal.throwIfAborted();
        if (chunk.type === 'reasoning' && chunk.reasoning) {
          setIsReasoning(true);
          setCurrentReasoning(prev => prev + chunk.reasoning);
        } else if (chunk.type === 'content' && chunk.content) {
          setIsReasoning(false);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk.content }
                : msg
            )
          );
        } else if (chunk.type === 'done') {
          setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, id: chunk.messageId || msg.id, worksheetAvailable: chunk.worksheetAvailable, facilitator: chunk.facilitator, facilitatorMode: chunk.facilitatorMode, assignmentSourceId: chunk.assignmentSourceId, status: 'complete' } : msg));
          if (chunk.generationUsage) {
            onGenerationUsageUpdate?.(chunk.generationUsage);
          }

          if (chunk.conversationId && !conversationId) {
            setConversationId(chunk.conversationId);
            rememberConversation(chunk.conversationId);
            refreshConversations();
          }
        }
      }

      const newConvId = getLastConversationId();
      if (newConvId && !conversationId) {
        setConversationId(newConvId);
        rememberConversation(newConvId);
        refreshConversations();
      }
    } catch (err: unknown) {
      if (!requestController.signal.aborted) setError(getErrorMessage(err, 'Failed to regenerate response'));
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId || msg.content.trim()).map(msg => msg.id === assistantMessageId ? { ...msg, status: requestController.signal.aborted ? 'stopped' as const : 'failed' as const } : msg));
    } finally {
      if (activeRequestRef.current === requestController) activeRequestRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
      setIsReasoning(false);
    }
  }, [
    messages,
    conversationId,
    facilitatorMode, isEducator,
    courseId,
    lessonId,
    isStreaming,
    refreshConversations,
    rememberConversation,
    onGenerationUsageUpdate
  ]);

  // Delete a conversation permanently
  const handleDeleteConversation = useCallback(async (convId: string) => {
    setError(null);
    try {
      await deleteConversationService(convId);
      // If we deleted the current conversation, clear it
      if (conversationId === convId) {
        setFacilitatorMode('auto');
        rememberConversation(null);
    setConversationId(null);
        setMessages([]);
      }
      // Refresh the conversations list
      await refreshConversations();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete conversation'));
      throw err;
    }
  }, [conversationId, refreshConversations, rememberConversation]);

  // Submit feedback for a message
  const handleSubmitFeedback = useCallback(async (
    messageIndex: number,
    rating: 1 | -1,
    feedbackText?: string
  ) => {
    if (!conversationId) {
      setError('No active conversation');
      return;
    }

    try {
      await submitFeedbackService(conversationId, messageIndex, rating, feedbackText);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to submit feedback'));
    }
  }, [conversationId]);

  return {
    facilitatorMode, setFacilitatorMode,
    activeFacilitator: [...messages].reverse().find(m => m.facilitator)?.facilitator,
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
    stopGeneration,
    editMessage: handleEditMessage,
    loadConversation,
    startNewConversation,
    deleteConversation: handleDeleteConversation,
    submitFeedback: handleSubmitFeedback,
    refreshConversations,
    refreshSuggestions
  };
}
