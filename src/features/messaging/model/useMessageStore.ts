import { create } from 'zustand';
import type { Message, Conversation } from '../api/types';

/**
 * Draft message for a conversation
 */
interface DraftMessage {
  conversationId: string;
  text: string;
  updatedAt: string;
}

/**
 * Active conversation metadata
 */
interface ActiveConversation {
  conversationId: string;
  participantId: string;
  participantName?: string;
  participantRole?: string;
  lastOpenedAt: string;
}

interface MessageState {
  // Messages state
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  unreadCount: number;

  // Drafts state
  drafts: Map<string, DraftMessage>;

  // Per-conversation unread counts
  conversationUnreadCounts: Map<string, number>;

  // Active conversation metadata
  activeConversation: ActiveConversation | null;

  // Loading states
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;

  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number | string, updates: Partial<Message>) => void;
  removeMessage: (messageId: number | string) => void;

  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;

  setCurrentConversationId: (conversationId: string | null) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount?: number) => void;

  setIsLoadingMessages: (isLoading: boolean) => void;
  setIsLoadingConversations: (isLoading: boolean) => void;

  // Draft actions
  setDraft: (conversationId: string, text: string) => void;
  getDraft: (conversationId: string) => string | null;
  clearDraft: (conversationId: string) => void;
  clearAllDrafts: () => void;

  // Per-conversation unread count actions
  setConversationUnreadCount: (conversationId: string, count: number) => void;
  getConversationUnreadCount: (conversationId: string) => number;
  incrementConversationUnreadCount: (conversationId: string) => void;
  decrementConversationUnreadCount: (conversationId: string, amount?: number) => void;
  clearConversationUnreadCount: (conversationId: string) => void;

  // Active conversation actions
  setActiveConversation: (conversation: ActiveConversation | null) => void;
  getActiveConversation: () => ActiveConversation | null;
  clearActiveConversation: () => void;

  // Optimistic updates
  addOptimisticMessage: (message: Omit<Message, 'id' | 'created_at' | 'updated_at'>) => string;
  removeOptimisticMessage: (tempId: string) => void;

  // Duplicate detection
  isDuplicateMessage: (messageId: number | string) => boolean;

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
  drafts: new Map(),
  conversationUnreadCounts: new Map(),
  activeConversation: null,
  isLoadingMessages: false,
  isLoadingConversations: false,

  // Message actions
  setMessages: (messages) =>
    set({
      messages: messages.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }),

  addMessage: (message) =>
    set((state) => {
      // Check if message already exists to avoid duplicates
      const exists = state.messages.some(m => m.id === message.id);
      if (exists) return state;

      return {
        messages: [...state.messages, message].sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      };
    }),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter(msg => msg.id !== messageId)
    })),

  // Conversation actions
  setConversations: (conversations) =>
    set({
      conversations: conversations.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      })
    }),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ).sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      })
    })),

  // Current conversation
  setCurrentConversationId: (conversationId) =>
    set({ currentConversationId: conversationId }),

  // Unread count actions
  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnreadCount: (amount = 1) =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - amount)
    })),

  // Loading states
  setIsLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),
  setIsLoadingConversations: (isLoading) => set({ isLoadingConversations: isLoading }),

  // Optimistic updates
  addOptimisticMessage: (messageData) => {
    const tempId = `temp_${Date.now()}`; // Temporary ID format: temp_${timestamp}
    const optimisticMessage: Message = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...messageData as any,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_read: false,
      attachments: []
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }));

    return tempId;
  },

  removeOptimisticMessage: (tempId) =>
    set((state) => ({
      messages: state.messages.filter(msg => msg.id !== tempId)
    })),

  // Duplicate detection
  isDuplicateMessage: (messageId) => {
    const state = get();
    return state.messages.some(m => m.id === messageId);
  },

  // Draft actions
  setDraft: (conversationId, text) =>
    set((state) => {
      const newDrafts = new Map(state.drafts);
      if (text.trim()) {
        newDrafts.set(conversationId, {
          conversationId,
          text,
          updatedAt: new Date().toISOString(),
        });
      } else {
        newDrafts.delete(conversationId);
      }
      return { drafts: newDrafts };
    }),

  getDraft: (conversationId) => {
    const state = get();
    return state.drafts.get(conversationId)?.text || null;
  },

  clearDraft: (conversationId) =>
    set((state) => {
      const newDrafts = new Map(state.drafts);
      newDrafts.delete(conversationId);
      return { drafts: newDrafts };
    }),

  clearAllDrafts: () => set({ drafts: new Map() }),

  // Per-conversation unread count actions
  setConversationUnreadCount: (conversationId, count) =>
    set((state) => {
      const newCounts = new Map(state.conversationUnreadCounts);
      newCounts.set(conversationId, Math.max(0, count));
      return { conversationUnreadCounts: newCounts };
    }),

  getConversationUnreadCount: (conversationId) => {
    const state = get();
    return state.conversationUnreadCounts.get(conversationId) || 0;
  },

  incrementConversationUnreadCount: (conversationId) =>
    set((state) => {
      const newCounts = new Map(state.conversationUnreadCounts);
      const current = newCounts.get(conversationId) || 0;
      newCounts.set(conversationId, current + 1);
      return { conversationUnreadCounts: newCounts };
    }),

  decrementConversationUnreadCount: (conversationId, amount = 1) =>
    set((state) => {
      const newCounts = new Map(state.conversationUnreadCounts);
      const current = newCounts.get(conversationId) || 0;
      newCounts.set(conversationId, Math.max(0, current - amount));
      return { conversationUnreadCounts: newCounts };
    }),

  clearConversationUnreadCount: (conversationId) =>
    set((state) => {
      const newCounts = new Map(state.conversationUnreadCounts);
      newCounts.set(conversationId, 0);
      return { conversationUnreadCounts: newCounts };
    }),

  // Active conversation actions
  setActiveConversation: (conversation) =>
    set({ activeConversation: conversation }),

  getActiveConversation: () => {
    const state = get();
    return state.activeConversation;
  },

  clearActiveConversation: () => set({ activeConversation: null }),

  // Clear actions
  clearMessages: () => set({ messages: [] }),

  clearAll: () => set({
    messages: [],
    conversations: [],
    currentConversationId: null,
    unreadCount: 0,
    drafts: new Map(),
    conversationUnreadCounts: new Map(),
    activeConversation: null,
    isLoadingMessages: false,
    isLoadingConversations: false
  })
}));
