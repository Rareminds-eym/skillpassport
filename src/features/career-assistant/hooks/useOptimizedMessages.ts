/**
 * Optimized Messages Hook
 * 
 * Performance optimization for message handling in chat applications.
 * Uses React 18+ patterns including useCallback and useTransition
 * for smooth, non-blocking UI updates.
 * 
 * @author Senior React Developer
 * @pattern Performance Optimization
 */

import { useState, useCallback, useTransition } from 'react';
import type { Message } from '../types/message';

export type { Message };

export interface UseOptimizedMessagesReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  replaceMessages: (newMessages: Message[]) => void;
  isPending: boolean;
}

/**
 * Hook for optimized message state management
 * 
 * Features:
 * - useTransition for non-blocking updates
 * - Memoized message operations
 * - Optimized re-render prevention
 * 
 * @returns Message state and optimized operations
 */
export function useOptimizedMessages(): UseOptimizedMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();

  /**
   * Add a new message to the list
   * Uses useCallback to prevent function recreation on every render
   * Wrapped in startTransition for non-blocking updates
   */
  const addMessage = useCallback((message: Message) => {
    startTransition(() => {
      setMessages(prev => [...prev, message]);
    });
  }, []);

  /**
   * Update an existing message by ID
   * Optimized with useCallback and startTransition
   * Common use case: streaming AI responses
   */
  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    startTransition(() => {
      setMessages(prev => 
        prev.map(m => m.id === id ? { ...m, ...updates } : m)
      );
    });
  }, []);

  /**
   * Clear all messages
   * Used when starting a new conversation
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Replace entire message list
   * Used when loading a conversation from history
   * Synchronous to ensure immediate UI update
   */
  const replaceMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  return {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    clearMessages,
    replaceMessages,
    isPending,
  };
}
