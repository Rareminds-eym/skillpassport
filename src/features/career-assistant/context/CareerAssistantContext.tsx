/**
 * Career Assistant Context
 * 
 * Provides centralized state management for Career AI chat interface.
 * Eliminates prop drilling by making conversation state, messages, and handlers
 * available to all child components through Context API.
 * 
 * @author Senior React Developer
 * @pattern Context API + Custom Hooks
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Conversation } from '../hooks/useCareerConversations';
import { Message } from '../hooks/useOptimizedMessages';
import { FeedbackData } from '../hooks/useAIFeedback';

// ==================== TYPES ====================

interface CareerAssistantContextValue {
  // Conversation state
  conversations: Conversation[];
  currentConversation: Conversation | null;
  currentConversationId: string | null;
  conversationsLoading: boolean;
  hasMore: boolean;
  
  // Message state
  messages: Message[];
  loading: boolean;
  isTyping: boolean;
  
  // UI state
  showWelcome: boolean;
  selectedChips: string[];
  sidebarCollapsed: boolean;
  
  // Conversation handlers
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  
  // Message handlers
  onSendMessage: () => Promise<void>;
  onSendQuery: (query: string) => void;
  onStopTyping: () => void;
  
  // UI handlers
  onQuickAction: (prompt: string, label: string) => void;
  onRemoveChip: (label: string) => void;
  onToggleSidebar: () => void;
  
  // Input state
  input: string;
  setInput: (value: string) => void;
  
  // Feedback handlers
  onFeedback: (messageId: string, thumbsUp: boolean, rating?: number, feedbackText?: string) => Promise<void>;
  getFeedback: (messageId: string) => FeedbackData | null;
  isFeedbackLoading: (messageId: string) => boolean;
  
  // UI state
  userScrolledUp: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  setUserScrolledUp: (value: boolean) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  handleScroll: () => void;
}

// ==================== CONTEXT ====================

const CareerAssistantContext = createContext<CareerAssistantContextValue | undefined>(undefined);

// ==================== PROVIDER ====================

interface CareerAssistantProviderProps {
  children: ReactNode;
  value: CareerAssistantContextValue;
}

/**
 * Provider component that wraps the Career Assistant UI
 * Makes all state and handlers available to child components
 * 
 * OPTIMIZATION: Memoizes context value to prevent unnecessary re-renders
 */
export const CareerAssistantProvider: React.FC<CareerAssistantProviderProps> = ({ 
  children, 
  value 
}) => {
  // Memoize context value to prevent re-renders when parent re-renders
  // Only recreate when actual values change
  const memoizedValue = useMemo(() => value, [
    // Conversation state
    value.conversations,
    value.currentConversation,
    value.currentConversationId,
    value.conversationsLoading,
    value.hasMore,
    
    // Message state
    value.messages,
    value.loading,
    value.isTyping,
    
    // UI state
    value.showWelcome,
    value.selectedChips,
    value.sidebarCollapsed,
    
    // Handlers (stable references from useCallback)
    value.onSelectConversation,
    value.onNewConversation,
    value.onDeleteConversation,
    value.onLoadMore,
    value.onSendMessage,
    value.onSendQuery,
    value.onStopTyping,
    value.onQuickAction,
    value.onRemoveChip,
    value.onToggleSidebar,
    value.onFeedback,
    value.getFeedback,
    value.isFeedbackLoading,
    
    // Input state
    value.input,
    value.setInput,
    
    // Scroll state
    value.userScrolledUp,
    value.scrollToBottom,
    value.setUserScrolledUp,
    value.messagesEndRef,
    value.messagesContainerRef,
    value.handleScroll,
  ]);

  return (
    <CareerAssistantContext.Provider value={memoizedValue}>
      {children}
    </CareerAssistantContext.Provider>
  );
};

// ==================== HOOK ====================

/**
 * Custom hook to access Career Assistant context
 * Throws error if used outside of CareerAssistantProvider
 * 
 * @example
 * const { messages, onSendMessage } = useCareerAssistantContext();
 */
export const useCareerAssistantContext = (): CareerAssistantContextValue => {
  const context = useContext(CareerAssistantContext);
  
  if (context === undefined) {
    throw new Error(
      'useCareerAssistantContext must be used within CareerAssistantProvider'
    );
  }
  
  return context;
};

export default CareerAssistantContext;
