import { ssoClient } from '@/shared/api/ssoClient';

import { supabase } from '@/shared/api/supabaseClient';
import { getApiUrl, getAuthHeaders } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';
import type { WorksheetConfig, LessonPlanConfig } from '../types';

const logger = getLogger('tutor-service');

// ==================== API URL CONFIGURATION ====================
const API_URL = getApiUrl('course');

// ==================== TYPES ====================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  courseId: string;
  lessonId: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface ChatRequest {
  conversationId?: string;
  courseId: string;
  lessonId?: string;
  message: string;
  worksheetConfig?: WorksheetConfig;  // Optional worksheet configuration for educators
  lessonPlanConfig?: LessonPlanConfig;  // Optional lesson plan configuration for educators
}

export interface ProgressData {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  lastAccessed: string | null;
  completedAt: string | null;
  timeSpentSeconds: number;
}

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  lastAccessedLessonId: string | null;
  lastAccessedAt: string | null;
  progress: ProgressData[];
}

// ==================== CHAT FUNCTIONS ====================

export interface StreamChunk {
  type: 'content' | 'reasoning' | 'done';
  content?: string;
  reasoning?: string;
  conversationId?: string;
  messageId?: string;
}

/**
 * Send a message to the AI tutor with streaming response
 * Returns an async generator that yields content and reasoning chunks
 */
export async function* sendMessage(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
  const user = useAuthStore.getState().user;
    const sessionError = null;

  if (sessionError) {
    logger.error('Session error in sendMessage', sessionError instanceof Error ? sessionError : new Error(String(sessionError)));
    throw new Error('Authentication error. Please try logging in again.');
  }

  
  const response = await ssoClient.fetch(
    `${API_URL}/ai-tutor-chat`,
    {
      method: 'POST',
            body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorData = await response.json() as { error?: string };
    throw new Error(errorData.error || 'Failed to send message');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response stream');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let currentEventType = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      // Track event type
      if (line.startsWith('event: ')) {
        currentEventType = line.slice(7).trim();
        continue;
      }

      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);

          // Handle reasoning events (from grok/reasoning models)
          if (currentEventType === 'reasoning' && parsed.reasoning) {
            yield { type: 'reasoning', reasoning: parsed.reasoning };
          }
          // Handle content events
          else if (parsed.content) {
            yield { type: 'content', content: parsed.content };
          }
          // Handle done event with conversation info
          else if (parsed.conversationId) {
            (sendMessage as any).lastConversationId = parsed.conversationId;
            yield {
              type: 'done',
              conversationId: parsed.conversationId,
              messageId: parsed.messageId
            };
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

/**
 * Legacy wrapper for backward compatibility - yields only content strings
 */
export async function* sendMessageLegacy(request: ChatRequest): AsyncGenerator<string, void, unknown> {
  for await (const chunk of sendMessage(request)) {
    if (chunk.type === 'content' && chunk.content) {
      yield chunk.content;
    }
  }
}

/**
 * Get the last conversation ID from the most recent sendMessage call
 */
export function getLastConversationId(): string | null {
  return (sendMessage as any).lastConversationId || null;
}


// ==================== CONVERSATION FUNCTIONS ====================

/**
 * Get all conversations for a course
 */
export async function getConversations(courseId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('tutor_conversations')
    .select('id, title, course_id, lesson_id, created_at, updated_at, messages')
    .eq('course_id', courseId)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Error fetching conversations', error instanceof Error ? error : new Error(String(error)), { courseId });
    throw error;
  }

  return (data || []).map(conv => ({
    id: conv.id,
    title: conv.title || 'Untitled Conversation',
    courseId: conv.course_id,
    lessonId: conv.lesson_id,
    createdAt: new Date(conv.created_at),
    updatedAt: new Date(conv.updated_at),
    messages: (conv.messages || []).map((m: MessageData) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp)
    }))
  }));
}

/**
 * Get a specific conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('tutor_conversations')
    .select('id, title, course_id, lesson_id, created_at, updated_at, messages')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    logger.error('Error fetching conversation', error instanceof Error ? error : new Error(String(error)), { conversationId });
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title || 'Untitled Conversation',
    courseId: data.course_id,
    lessonId: data.lesson_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    messages: (data.messages || []).map((m: MessageData) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp)
    }))
  };
}

// ==================== SUGGESTED QUESTIONS ====================

/**
 * Get suggested questions for a lesson
 * Returns default suggestions if not authenticated or on error (graceful degradation)
 */
export async function getSuggestedQuestions(lessonId: string): Promise<string[]> {
  try {
    const user = useAuthStore.getState().user;
    const sessionError = null;

    if (sessionError) {
      logger.error('Session error in getSuggestedQuestions', sessionError instanceof Error ? sessionError : new Error(String(sessionError)), { lessonId });
      return getDefaultSuggestions();
    }

    const response = await ssoClient.fetch(
      `${API_URL}/ai-tutor-suggestions`,
      {
        method: 'POST',
                body: JSON.stringify({ lessonId }),
      }
    );

    // Handle auth errors gracefully - return defaults instead of throwing
    if (response.status === 401 || response.status === 403) {
      logger.warn('Auth required for suggestions, using defaults', { status: response.status, lessonId });
      return getDefaultSuggestions();
    }

    if (!response.ok) {
      // Return default suggestions on error
      logger.warn('Failed to fetch suggestions, using defaults', { status: response.status, lessonId });
      return getDefaultSuggestions();
    }

    const data = await response.json() as { questions?: string[] };
    return data.questions || getDefaultSuggestions();
  } catch (err) {
    logger.warn('Error fetching suggestions, using defaults', { lessonId, error: err instanceof Error ? err.message : String(err) });
    return getDefaultSuggestions();
  }
}

/**
 * Default suggestions when API is unavailable
 */
function getDefaultSuggestions(): string[] {
  return [
    "Can you explain the main concepts in this lesson?",
    "What are the key takeaways I should remember?",
    "Can you give me a practical example?"
  ];
}

// ==================== PROGRESS FUNCTIONS ====================

/**
 * Get learner progress for a course
 */
export async function getCourseProgress(courseId: string): Promise<CourseProgress> {
  const user = useAuthStore.getState().user;
  
  const response = await ssoClient.fetch(
    `${API_URL}/ai-tutor-progress?courseId=${courseId}`,
    {
      method: 'GET',
          }
  );

  if (!response.ok) {
    const errorData = await response.json() as { error?: string };
    throw new Error(errorData.error || 'Failed to get progress');
  }

  return response.json();
}

/**
 * Update lesson progress
 */
export async function updateLessonProgress(
  courseId: string,
  lessonId: string,
  status: 'not_started' | 'in_progress' | 'completed'
): Promise<void> {
  const user = useAuthStore.getState().user;
  
  const response = await ssoClient.fetch(
    `${API_URL}/ai-tutor-progress`,
    {
      method: 'POST',
            body: JSON.stringify({ courseId, lessonId, status }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json() as { error?: string };
    throw new Error(errorData.error || 'Failed to update progress');
  }
}

// ==================== FEEDBACK FUNCTIONS ====================

/**
 * Delete a conversation and all related data permanently
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  const user = useAuthStore.getState().user;
  
  // First, delete related feedback records
  const { error: feedbackError } = await supabase
    .from('tutor_feedback')
    .delete()
    .eq('conversation_id', conversationId);

  if (feedbackError) {
    logger.warn('Error deleting feedback', { conversationId });
    // Continue even if feedback deletion fails (might not have any feedback)
  }

  // Then delete the conversation
  const { error: conversationError } = await supabase
    .from('tutor_conversations')
    .delete()
    .eq('id', conversationId);

  if (conversationError) {
    logger.error('Error deleting conversation', conversationError instanceof Error ? conversationError : new Error(String(conversationError)), { conversationId });
    throw new Error('Failed to delete conversation');
  }
}

/**
 * Submit feedback for an AI response
 */
export async function submitFeedback(
  conversationId: string,
  messageIndex: number,
  rating: 1 | -1,
  feedbackText?: string
): Promise<void> {
  const user = useAuthStore.getState().user;
  
  const response = await ssoClient.fetch(
    `${API_URL}/ai-tutor-feedback`,
    {
      method: 'POST',
            body: JSON.stringify({ conversationId, messageIndex, rating, feedbackText }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json() as { error?: string };
    throw new Error(errorData.error || 'Failed to submit feedback');
  }
}
