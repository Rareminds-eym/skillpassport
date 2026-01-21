import { create } from 'zustand';
import { Message, Conversation } from '../services/messageService';

interface MessageState {
  // Messages state
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  unreadCount: number;

  // Loading states
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;

  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  removeMessage: (messageId: number) => void;

  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;

  setCurrentConversationId: (conversationId: string | null) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount?: number) => void;

  setIsLoadingMessages: (isLoading: boolean) => void;
  setIsLoadingConversations: (isLoading: boolean) => void;

  // Optimistic updates
  addOptimisticMessage: (message: Omit<Message, 'id' | 'created_at' | 'updated_at'>) => number;
  removeOptimisticMessage: (tempId: number) => void;

  // Clear state
  clearMessages: () => void;
  clearAll: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  // Initial state
  messages: [],
  conversations: [],
  currentConversationId: null,
  unreadCount: 0,
  isLoadingMessages: false,
  isLoadingConversations: false,

  // Message actions
  setMessages: (messages) =>
    set({
      messages: messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }),

  addMessage: (message) =>
    set((state) => {
      // Check if message already exists to avoid duplicates
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return state;

      return {
        messages: [...state.messages, message].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      };
    }),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg)),
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),

  // Conversation actions
  setConversations: (conversations) =>
    set({
      conversations: conversations.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      }),
    }),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations
        .map((conv) => (conv.id === conversationId ? { ...conv, ...updates } : conv))
        .sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bTime - aTime;
        }),
    })),

  // Current conversation
  setCurrentConversationId: (conversationId) => set({ currentConversationId: conversationId }),

  // Unread count actions
  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnreadCount: (amount = 1) =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - amount),
    })),

  // Loading states
  setIsLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),
  setIsLoadingConversations: (isLoading) => set({ isLoadingConversations: isLoading }),

  // Optimistic updates
  addOptimisticMessage: (messageData) => {
    const tempId = Date.now(); // Temporary ID for optimistic message
    const optimisticMessage: Message = {
      ...(messageData as any),
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_read: false,
      attachments: [],
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    }));

    return tempId;
  },

  removeOptimisticMessage: (tempId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== tempId),
    })),

  // Clear actions
  clearMessages: () => set({ messages: [] }),

  clearAll: () =>
    set({
      messages: [],
      conversations: [],
      currentConversationId: null,
      unreadCount: 0,
      isLoadingMessages: false,
      isLoadingConversations: false,
    }),
}));

// Selectors for efficient component subscriptions
export const useMessages = () => useMessageStore((state) => state.messages);
export const useConversations = () => useMessageStore((state) => state.conversations);
export const useCurrentConversationId = () =>
  useMessageStore((state) => state.currentConversationId);
export const useUnreadCount = () => useMessageStore((state) => state.unreadCount);
export const useMessageLoadingStates = () =>
  useMessageStore((state) => ({
    isLoadingMessages: state.isLoadingMessages,
    isLoadingConversations: state.isLoadingConversations,
  }));

// Computed selectors
export const useCurrentConversation = () =>
  useMessageStore(
    (state) => state.conversations.find((conv) => conv.id === state.currentConversationId) || null
  );

export const useUnreadMessagesCount = () =>
  useMessageStore((state) => state.messages.filter((msg) => !msg.is_read).length);
