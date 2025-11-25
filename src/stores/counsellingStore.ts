// Counselling Store - Local State Management with Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  CounsellingSession, 
  CounsellingMessage,
  CounsellingTopicType 
} from '../types/counselling';

interface CounsellingStore {
  sessions: CounsellingSession[];
  sessionMessages: Record<string, CounsellingMessage[]>;
  
  // Actions
  createSession: (topic: CounsellingTopicType, studentName?: string) => CounsellingSession;
  updateSession: (sessionId: string, updates: Partial<CounsellingSession>) => void;
  deleteSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: CounsellingMessage) => void;
  getSessionMessages: (sessionId: string) => CounsellingMessage[];
  clearAllData: () => void;
}

export const useCounsellingStore = create<CounsellingStore>()(persist(
  (set, get) => ({
    sessions: [],
    sessionMessages: {},

    createSession: (topic, studentName = 'Demo Student') => {
      const newSession: CounsellingSession = {
        id: `session-${Date.now()}`,
        student_id: 'student-demo',
        student_name: studentName,
        topic,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
      };

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        sessionMessages: {
          ...state.sessionMessages,
          [newSession.id]: [],
        },
      }));

      return newSession;
    },

    updateSession: (sessionId, updates) => {
      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.id === sessionId
            ? { ...session, ...updates, updated_at: new Date().toISOString() }
            : session
        ),
      }));
    },

    deleteSession: (sessionId) => {
      set((state) => {
        const { [sessionId]: _, ...remainingMessages } = state.sessionMessages;
        return {
          sessions: state.sessions.filter((session) => session.id !== sessionId),
          sessionMessages: remainingMessages,
        };
      });
    },

    addMessage: (sessionId, message) => {
      set((state) => ({
        sessionMessages: {
          ...state.sessionMessages,
          [sessionId]: [...(state.sessionMessages[sessionId] || []), message],
        },
      }));

      // Update session's updated_at
      get().updateSession(sessionId, {});
    },

    getSessionMessages: (sessionId) => {
      return get().sessionMessages[sessionId] || [];
    },

    clearAllData: () => {
      set({
        sessions: [],
        sessionMessages: {},
      });
    },
  }),
  {
    name: 'counselling-storage',
  }
));