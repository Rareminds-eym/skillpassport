/**
 * Educator API Types
 */

export interface ChatRequest {
  conversationId?: string;
  message: string;
  selectedChips?: string[];
}

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type EducatorIntent = 
  | 'student-insights'
  | 'class-analytics'
  | 'intervention-needed'
  | 'guidance-request'
  | 'skill-trends'
  | 'career-readiness'
  | 'resource-recommendation'
  | 'general';
