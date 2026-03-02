/**
 * Hook for managing Career AI conversations
 * Fetches, creates, and manages conversation history from Supabase
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Pagination: Load 20 conversations at a time
 * - Message limiting: Load only last 50 messages per conversation
 * - Lazy loading: Load full messages only when conversation is opened
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { CONVERSATIONS_PER_PAGE, MAX_MESSAGES_PER_CONVERSATION } from '../constants';

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
  message_count?: number; // Cached count for performance
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
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Fetch conversations with pagination
   * OPTIMIZATION: Only loads conversation metadata, not full messages
   * FIX: Uses functional setState to avoid stale closure
   */
  const fetchConversations = useCallback(async (reset = false) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 0 : page;
      const from = currentPage * CONVERSATIONS_PER_PAGE;
      const to = from + CONVERSATIONS_PER_PAGE - 1;

      const { data, error: fetchError, count } = await supabase
        .from('career_ai_conversations')
        .select('id, title, created_at, updated_at, message_count', { count: 'exact' })
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (fetchError) {
        console.error('Error fetching conversations:', fetchError);
        setError('Failed to load conversations');
        return;
      }

      // Add empty messages array for list display
      const conversationsWithEmptyMessages = (data || []).map(conv => ({
        ...conv,
        messages: [] as ConversationMessage[]
      }));

      // Use functional setState to avoid stale closure
      setConversations(prev => {
        if (reset) {
          return conversationsWithEmptyMessages;
        }
        return [...prev, ...conversationsWithEmptyMessages];
      });

      if (reset) {
        setPage(0);
      }

      // Calculate total loaded using functional approach
      const newLength = conversationsWithEmptyMessages.length;
      setHasMore(count ? (reset ? newLength : newLength + (currentPage * CONVERSATIONS_PER_PAGE)) < count : false);

    } catch (err) {
      console.error('Error in fetchConversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, page]); // Removed conversations.length dependency

  /**
   * Load more conversations (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setPage(prev => prev + 1);
    await fetchConversations(false);
  }, [hasMore, loading, fetchConversations]);

  /**
   * Load a specific conversation with messages
   * OPTIMIZATION: Only loads last 50 messages for performance
   */
  const loadConversation = useCallback(async (id: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('career_ai_conversations')
        .select('*')
        .eq('id', id)
        .eq('student_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error loading conversation:', fetchError);
        setError('Failed to load conversation');
        return;
      }

      // Limit messages to last 50 for performance
      const allMessages = data.messages || [];
      const limitedMessages = allMessages.slice(-MAX_MESSAGES_PER_CONVERSATION);

      setCurrentConversation({
        ...data,
        messages: limitedMessages
      });
      setCurrentConversationId(id);
    } catch (err) {
      console.error('Error in loadConversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new conversation (just resets state, actual creation happens on first message)
  const createNewConversation = useCallback(() => {
    setCurrentConversation(null);
    setCurrentConversationId(null);
  }, []);

  // Delete a conversation with optimistic update
  const deleteConversation = useCallback(async (id: string) => {
    if (!user?.id) return;

    // Optimistic update: Remove from UI immediately
    const previousConversations = conversations;
    setConversations(prev => prev.filter(c => c.id !== id));

    // If deleted conversation was current, reset
    if (currentConversationId === id) {
      setCurrentConversation(null);
      setCurrentConversationId(null);
    }

    try {
      const { error: deleteError } = await supabase
        .from('career_ai_conversations')
        .delete()
        .eq('id', id)
        .eq('student_id', user.id);

      if (deleteError) {
        console.error('Error deleting conversation:', deleteError);
        setError('Failed to delete conversation');
        // Rollback on error
        setConversations(previousConversations);
        if (currentConversationId === id) {
          const conv = previousConversations.find(c => c.id === id);
          if (conv) {
            setCurrentConversation(conv);
            setCurrentConversationId(id);
          }
        }
        return;
      }
    } catch (err) {
      console.error('Error in deleteConversation:', err);
      setError('Failed to delete conversation');
      // Rollback on error
      setConversations(previousConversations);
    }
  }, [user?.id, currentConversationId, conversations]);

  // Fetch conversations on mount
  useEffect(() => {
    if (user?.id) {
      fetchConversations(true); // Reset on mount
    }
  }, [user?.id, fetchConversations]); // Added fetchConversations to dependencies

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
