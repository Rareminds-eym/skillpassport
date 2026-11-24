import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiDelete } from '@/shared/api/apiClient';
import { useUser } from '@/shared/model/authStore';
import type { Message } from '../model/message';

export type ConversationMessage = Message;
export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
  message_count?: number;
}
interface Envelope<T> { data: T }
interface ConversationPage { conversations: Omit<Conversation, 'messages'>[]; hasMore: boolean }

export function useCareerConversations() {
  const user = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const page = useRef(0);
  const listSequence = useRef(0);
  const selectionSequence = useRef(0);
  const listBusy = useRef(false);
  const ownerEpoch = useRef(0);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (!user?.id || (!reset && listBusy.current)) return;
    const sequence = ++listSequence.current;
    const nextPage = reset ? 0 : page.current + 1;
    listBusy.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<Envelope<ConversationPage>>(`/career/conversations?page=${nextPage}`);
      if (!Array.isArray(response.data?.conversations) || typeof response.data.hasMore !== 'boolean') {
        throw new Error('Invalid conversation list');
      }
      if (sequence !== listSequence.current) return;
      const items = response.data.conversations.map(conv => ({ ...conv, messages: [] }));
      setConversations(previous => [...new Map((reset ? items : [...previous, ...items]).map(conv => [conv.id, conv])).values()]);
      page.current = nextPage;
      setHasMore(response.data.hasMore);
    } catch {
      if (sequence === listSequence.current) setError('Unable to load conversation history. Try again.');
    } finally {
      if (sequence === listSequence.current) {
        listBusy.current = false;
        setLoading(false);
      }
    }
  }, [user?.id]);
  const fetchConversations = useCallback(() => fetchPage(true), [fetchPage]);
  const loadMore = useCallback(async () => { if (hasMore) await fetchPage(false); }, [hasMore, fetchPage]);

  const loadConversation = useCallback(async (id: string) => {
    if (!user?.id) return false;
    const sequence = ++selectionSequence.current;
    setLoadingConversation(true);
    setError(null);
    try {
      const response = await apiGet<Envelope<Conversation>>(`/career/conversation?id=${encodeURIComponent(id)}`);
      if (response.data?.id !== id || !Array.isArray(response.data.messages)) throw new Error('Invalid conversation');
      if (sequence !== selectionSequence.current) return false;
      // Virtualization controls rendering; history data must not be silently truncated.
      setCurrentConversation(response.data);
      setCurrentConversationId(id);
      return true;
    } catch {
      if (sequence === selectionSequence.current) setError('Unable to open this conversation. Select it again to retry.');
      return false;
    } finally {
      if (sequence === selectionSequence.current) setLoadingConversation(false);
    }
  }, [user?.id]);

  const createNewConversation = useCallback(() => {
    selectionSequence.current++;
    setLoadingConversation(false);
    setCurrentConversation(null);
    setCurrentConversationId(null);
    setError(null);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    if (!user?.id) return false;
    setError(null);
    const owner = ownerEpoch.current;
    selectionSequence.current++;
    setLoadingConversation(false);
    try {
      // Commit UI deletion only after the server acknowledges it.
      await apiDelete(`/career/conversations?id=${encodeURIComponent(id)}`);
      if (owner !== ownerEpoch.current) return false;
      listSequence.current++;
      listBusy.current = false;
      setLoading(false);
      setConversations(previous => previous.filter(conv => conv.id !== id));
      setCurrentConversation(previous => previous?.id === id ? null : previous);
      setCurrentConversationId(previous => previous === id ? null : previous);
      return true;
    } catch {
      if (owner === ownerEpoch.current) setError('Unable to delete this conversation. Your history has been kept.');
      return false;
    }
  }, [user?.id]);

  useEffect(() => {
    setConversations([]);
    setCurrentConversation(null);
    setCurrentConversationId(null);
    setHasMore(false);
    if (user?.id) void fetchConversations();
    return () => { ownerEpoch.current++; listSequence.current++; selectionSequence.current++; listBusy.current = false; };
  }, [user?.id, fetchConversations]);

  return { conversations, currentConversation, currentConversationId, setCurrentConversationId,
    loading, loadingConversation, error, hasMore, fetchConversations, loadMore,
    loadConversation, createNewConversation, deleteConversation };
}
export default useCareerConversations;
