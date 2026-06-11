import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiDelete } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

import { CONVERSATIONS_PER_PAGE, MAX_MESSAGES_PER_CONVERSATION } from '../constants';

import { useUser } from '@/shared/model/authStore';

const logger = getLogger('career-conversations-hook');
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface UseCareerConversationsReturn {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createNewConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;
  currentConversationId: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useCareerConversations(): UseCareerConversationsReturn {
  const user = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchConversations = useCallback(async (reset = false) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 0 : page;
      const response: any = await apiGet(`/career/conversations?page=${currentPage}`);

      const data = response.data || {};
      const items = (data.conversations || []).map((conv: any) => ({
        ...conv,
        messages: [] as ConversationMessage[],
      }));

      setConversations(prev => {
        if (reset) return items;
        return [...prev, ...items];
      });

      if (reset) setPage(0);
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      logger.error('Exception in fetchConversations', err instanceof Error ? err : new Error(String(err)), { page });
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, page]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setPage(prev => prev + 1);
    await fetchConversations(false);
  }, [hasMore, loading, fetchConversations]);

  const loadConversation = useCallback(async (id: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response: any = await apiGet(`/career/conversation?id=${encodeURIComponent(id)}`);
      const data = response.data;

      if (!data) {
        setError('Failed to load conversation');
        return;
      }

      const allMessages = data.messages || [];
      const limitedMessages = allMessages.slice(-MAX_MESSAGES_PER_CONVERSATION);

      setCurrentConversation({
        ...data,
        messages: limitedMessages,
      });
      setCurrentConversationId(id);
    } catch (err) {
      logger.error('Exception in loadConversation', err instanceof Error ? err : new Error(String(err)));
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createNewConversation = useCallback(() => {
    setCurrentConversation(null);
    setCurrentConversationId(null);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    if (!user?.id) return;

    const previousConversations = conversations;
    setConversations(prev => prev.filter(c => c.id !== id));

    if (currentConversationId === id) {
      setCurrentConversation(null);
      setCurrentConversationId(null);
    }

    try {
      await apiDelete(`/career/conversations?id=${encodeURIComponent(id)}`);
    } catch (err) {
      logger.error('Exception in deleteConversation', err instanceof Error ? err : new Error(String(err)));
      setError('Failed to delete conversation');
      setConversations(previousConversations);
      if (currentConversationId === id) {
        const conv = previousConversations.find(c => c.id === id);
        if (conv) {
          setCurrentConversation(conv);
          setCurrentConversationId(id);
        }
      }
    }
  }, [user?.id, currentConversationId, conversations]);

  useEffect(() => {
    if (user?.id) {
      fetchConversations(true);
    }
  }, [user?.id, fetchConversations]);

  return {
    conversations,
    currentConversation,
    loading,
    error,
    fetchConversations: () => fetchConversations(true),
    loadConversation,
    createNewConversation,
    deleteConversation,
    setCurrentConversationId,
    currentConversationId,
    hasMore,
    loadMore,
  };
}

export default useCareerConversations;
