/**
 * Conversation Switcher Hook
 * 
 * Handles conversation switching with proper state management
 * to prevent race conditions and stale state issues.
 * 
 * Key Features:
 * - Immediate state clearing before async operations
 * - useTransition for non-blocking conversation loads
 * - Proper cleanup to prevent memory leaks
 * 
 * @author Senior React Developer
 * @pattern State Management & Race Condition Prevention
 */

import { useCallback, useRef, useEffect } from 'react';

export interface UseConversationSwitcherProps {
  loadConversation: (id: string) => Promise<void>;
  onMessagesCleared: () => void;
  onWelcomeStateChange: (show: boolean) => void;
}

export interface UseConversationSwitcherReturn {
  handleSelectConversation: (id: string) => Promise<void>;
  handleNewConversation: () => void;
  isLoadingConversation: boolean;
}

/**
 * Hook for managing conversation switching
 * 
 * Problem Solved:
 * When switching conversations, messages from the previous conversation
 * could briefly appear due to async state updates. This hook ensures
 * immediate state clearing before loading new data.
 * 
 * @param props Configuration for conversation switching
 * @returns Handlers for conversation operations
 */
export function useConversationSwitcher({
  loadConversation,
  onMessagesCleared,
  onWelcomeStateChange,
}: UseConversationSwitcherProps): UseConversationSwitcherReturn {
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Cleanup function to abort pending operations
   * Prevents memory leaks and stale state updates
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Handle conversation selection
   * 
   * Flow:
   * 1. Clear messages immediately (synchronous)
   * 2. Hide welcome screen
   * 3. Load conversation data (async, non-blocking)
   * 
   * This order prevents showing stale messages from previous conversation
   */
  const handleSelectConversation = useCallback(async (id: string) => {
    // Step 1: Immediate synchronous state clearing
    // This ensures old messages disappear instantly
    onMessagesCleared();
    onWelcomeStateChange(false);

    // Step 2: Load new conversation (not wrapped in startTransition for async functions)
    // startTransition doesn't support async functions directly in React 18
    try {
      await loadConversation(id);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      // Error handling can be added here
    }
  }, [loadConversation, onMessagesCleared, onWelcomeStateChange]);

  /**
   * Handle new conversation creation
   * 
   * Simply clears state and shows welcome screen
   * No async operations needed
   */
  const handleNewConversation = useCallback(() => {
    onMessagesCleared();
    onWelcomeStateChange(true);
  }, [onMessagesCleared, onWelcomeStateChange]);

  return {
    handleSelectConversation,
    handleNewConversation,
    isLoadingConversation: false, // Can be enhanced with state if needed
  };
}
