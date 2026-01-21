/**
 * Hook for managing Career AI conversations
 * Fetches, creates, and manages conversation history from Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

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
}

export function useCareerConversations(): UseCareerConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('career_ai_conversations')
        .select('id, title, messages, created_at, updated_at')
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching conversations:', fetchError);
        setError('Failed to load conversations');
        return;
      }

      setConversations(data || []);
    } catch (err) {
      console.error('Error in fetchConversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load a specific conversation
  const loadConversation = useCallback(
    async (id: string) => {
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

        setCurrentConversation(data);
        setCurrentConversationId(id);
      } catch (err) {
        console.error('Error in loadConversation:', err);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Create a new conversation (just resets state, actual creation happens on first message)
  const createNewConversation = useCallback(() => {
    setCurrentConversation(null);
    setCurrentConversationId(null);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(
    async (id: string) => {
      if (!user?.id) return;

      try {
        const { error: deleteError } = await supabase
          .from('career_ai_conversations')
          .delete()
          .eq('id', id)
          .eq('student_id', user.id);

        if (deleteError) {
          console.error('Error deleting conversation:', deleteError);
          setError('Failed to delete conversation');
          return;
        }

        // Remove from local state
        setConversations((prev) => prev.filter((c) => c.id !== id));

        // If deleted conversation was current, reset
        if (currentConversationId === id) {
          setCurrentConversation(null);
          setCurrentConversationId(null);
        }
      } catch (err) {
        console.error('Error in deleteConversation:', err);
        setError('Failed to delete conversation');
      }
    },
    [user?.id, currentConversationId]
  );

  // Fetch conversations on mount
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id, fetchConversations]);

  return {
    conversations,
    currentConversation,
    loading,
    error,
    fetchConversations,
    loadConversation,
    createNewConversation,
    deleteConversation,
    setCurrentConversationId,
    currentConversationId,
  };
}

export default useCareerConversations;
