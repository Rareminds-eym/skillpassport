import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Types (matching CareerAssistantContext)
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  [key: string]: any;
}

export interface FeedbackData {
  thumbsUp: boolean;
  rating?: number;
  feedbackText?: string;
}

interface CareerAssistantState {
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
  userScrolledUp: boolean;
  
  // Input state
  input: string;
  
  // Feedback state
  feedbackMap: Record<string, FeedbackData>;
  feedbackLoadingMap: Record<string, boolean>;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (id: string) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setCurrentConversationId: (id: string | null) => void;
  setConversationsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  
  // Message actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  removeMessage: (id: string) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setIsTyping: (isTyping: boolean) => void;
  
  // UI actions
  setShowWelcome: (show: boolean) => void;
  addChip: (chip: string) => void;
  removeChip: (chip: string) => void;
  toggleSidebar: () => void;
  setUserScrolledUp: (scrolled: boolean) => void;
  setInput: (input: string) => void;
  
  // Feedback actions
  setFeedback: (messageId: string, feedback: FeedbackData) => void;
  getFeedback: (messageId: string) => FeedbackData | null;
  setFeedbackLoading: (messageId: string, loading: boolean) => void;
  isFeedbackLoading: (messageId: string) => boolean;
  
  // Async handlers (placeholders - actual logic in components)
  onSelectConversation: (id: string) => Promise<void>;
  onNewConversation: () => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  onSendMessage: () => Promise<void>;
  onSendQuery: (query: string) => void;
  onStopTyping: () => void;
  onQuickAction: (prompt: string, label: string) => void;
  onFeedback: (messageId: string, thumbsUp: boolean, rating?: number, feedbackText?: string) => Promise<void>;
  
  // Reset
  reset: () => void;
  clearMessages: () => void;
}

export const useCareerAssistantStore = create<CareerAssistantState>()(
  immer((set, get) => ({
    // Initial state
    conversations: [],
    currentConversation: null,
    currentConversationId: null,
    conversationsLoading: false,
    hasMore: false,
    
    messages: [],
    loading: false,
    isTyping: false,
    
    showWelcome: true,
    selectedChips: [],
    sidebarCollapsed: false,
    userScrolledUp: false,
    
    input: '',
    
    feedbackMap: {},
    feedbackLoadingMap: {},

    // Conversation actions
    setConversations: (conversations) => {
      set((state) => {
        state.conversations = conversations;
      });
    },

    addConversation: (conversation) => {
      set((state) => {
        state.conversations.unshift(conversation);
        state.currentConversation = conversation;
        state.currentConversationId = conversation.id;
      });
    },

    removeConversation: (id) => {
      set((state) => {
        state.conversations = state.conversations.filter((c) => c.id !== id);
        if (state.currentConversationId === id) {
          state.currentConversation = null;
          state.currentConversationId = null;
          state.messages = [];
        }
      });
    },

    setCurrentConversation: (conversation) => {
      set((state) => {
        state.currentConversation = conversation;
        state.currentConversationId = conversation?.id || null;
      });
    },

    setCurrentConversationId: (id) => {
      set((state) => {
        state.currentConversationId = id;
        state.currentConversation = state.conversations.find((c) => c.id === id) || null;
      });
    },

    setConversationsLoading: (loading) => {
      set((state) => {
        state.conversationsLoading = loading;
      });
    },

    setHasMore: (hasMore) => {
      set((state) => {
        state.hasMore = hasMore;
      });
    },

    // Message actions
    setMessages: (messages) => {
      set((state) => {
        state.messages = messages;
      });
    },

    addMessage: (message) => {
      set((state) => {
        state.messages.push(message);
      });
    },

    removeMessage: (id) => {
      set((state) => {
        state.messages = state.messages.filter((m) => m.id !== id);
      });
    },

    updateMessage: (id, updates) => {
      set((state) => {
        const message = state.messages.find((m) => m.id === id);
        if (message) {
          Object.assign(message, updates);
        }
      });
    },

    setLoading: (loading) => {
      set((state) => {
        state.loading = loading;
      });
    },

    setIsTyping: (isTyping) => {
      set((state) => {
        state.isTyping = isTyping;
      });
    },

    // UI actions
    setShowWelcome: (show) => {
      set((state) => {
        state.showWelcome = show;
      });
    },

    addChip: (chip) => {
      set((state) => {
        if (!state.selectedChips.includes(chip)) {
          state.selectedChips.push(chip);
        }
      });
    },

    removeChip: (chip) => {
      set((state) => {
        state.selectedChips = state.selectedChips.filter((c) => c !== chip);
      });
    },

    toggleSidebar: () => {
      set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      });
    },

    setUserScrolledUp: (scrolled) => {
      set((state) => {
        state.userScrolledUp = scrolled;
      });
    },

    setInput: (input) => {
      set((state) => {
        state.input = input;
      });
    },

    // Feedback actions
    setFeedback: (messageId, feedback) => {
      set((state) => {
        state.feedbackMap[messageId] = feedback;
      });
    },

    getFeedback: (messageId) => {
      return get().feedbackMap[messageId] || null;
    },

    setFeedbackLoading: (messageId, loading) => {
      set((state) => {
        state.feedbackLoadingMap[messageId] = loading;
      });
    },

    isFeedbackLoading: (messageId) => {
      return get().feedbackLoadingMap[messageId] || false;
    },

    // Async handlers (placeholders - to be overridden or called from components)
    onSelectConversation: async () => {
      // Implement in component with actual logic
    },

    onNewConversation: async () => {
      // Implement in component with actual logic
    },

    onDeleteConversation: async () => {
      // Implement in component with actual logic
    },

    onLoadMore: async () => {
      // Implement in component with actual logic
    },

    onSendMessage: async () => {
      // Implement in component with actual logic
    },

    onSendQuery: () => {
      // Implement in component with actual logic
    },

    onStopTyping: () => {
      set((state) => {
        state.isTyping = false;
      });
    },

    onQuickAction: () => {
      // Implement in component with actual logic
    },

    onFeedback: async () => {
      // Implement in component with actual logic
    },

    // Reset
    reset: () => {
      set((state) => {
        state.currentConversation = null;
        state.currentConversationId = null;
        state.messages = [];
        state.showWelcome = true;
        state.input = '';
        state.selectedChips = [];
      });
    },

    clearMessages: () => {
      set((state) => {
        state.messages = [];
      });
    },
  }))
);

// Convenience hooks
export const useCareerConversations = () => {
  const conversations = useCareerAssistantStore((state) => state.conversations);
  const currentConversation = useCareerAssistantStore((state) => state.currentConversation);
  const currentConversationId = useCareerAssistantStore((state) => state.currentConversationId);
  const loading = useCareerAssistantStore((state) => state.conversationsLoading);
  const hasMore = useCareerAssistantStore((state) => state.hasMore);
  return { conversations, currentConversation, currentConversationId, loading, hasMore };
};

export const useCareerMessages = () => {
  const messages = useCareerAssistantStore((state) => state.messages);
  const loading = useCareerAssistantStore((state) => state.loading);
  const isTyping = useCareerAssistantStore((state) => state.isTyping);
  return { messages, loading, isTyping };
};

export const useCareerUIState = () => {
  const showWelcome = useCareerAssistantStore((state) => state.showWelcome);
  const sidebarCollapsed = useCareerAssistantStore((state) => state.sidebarCollapsed);
  const userScrolledUp = useCareerAssistantStore((state) => state.userScrolledUp);
  const selectedChips = useCareerAssistantStore((state) => state.selectedChips);
  const input = useCareerAssistantStore((state) => state.input);
  return { showWelcome, sidebarCollapsed, userScrolledUp, selectedChips, input };
};

export const useCareerAssistantActions = () => {
  const setConversations = useCareerAssistantStore((state) => state.setConversations);
  const setCurrentConversationId = useCareerAssistantStore((state) => state.setCurrentConversationId);
  const setMessages = useCareerAssistantStore((state) => state.setMessages);
  const addMessage = useCareerAssistantStore((state) => state.addMessage);
  const setInput = useCareerAssistantStore((state) => state.setInput);
  const setShowWelcome = useCareerAssistantStore((state) => state.setShowWelcome);
  const toggleSidebar = useCareerAssistantStore((state) => state.toggleSidebar);
  const addChip = useCareerAssistantStore((state) => state.addChip);
  const removeChip = useCareerAssistantStore((state) => state.removeChip);
  const onSendQuery = useCareerAssistantStore((state) => state.onSendQuery);
  const onStopTyping = useCareerAssistantStore((state) => state.onStopTyping);
  const reset = useCareerAssistantStore((state) => state.reset);
  return { setConversations, setCurrentConversationId, setMessages, addMessage, setInput, setShowWelcome, toggleSidebar, addChip, removeChip, onSendQuery, onStopTyping, reset };
};

export const useCareerFeedback = (messageId: string) =>
  useCareerAssistantStore((state) => ({
    feedback: state.getFeedback(messageId),
    isLoading: state.isFeedbackLoading(messageId),
    setFeedback: (feedback: FeedbackData) => state.setFeedback(messageId, feedback),
  }));
