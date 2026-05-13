// Counselling Type Definitions

export type CounsellingTopicType = 
  | 'academic' 
  | 'career' 
  | 'performance' 
  | 'mental-health'
  | 'general';

export type MessageRole = 'user' | 'assistant' | 'system';

export type SessionStatus = 'active' | 'completed' | 'archived';

export interface CounsellingMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  tokens_used?: number;
}

export interface CounsellingSession {
  id: string;
  learner_id: string;
  learner_name?: string;
  topic: CounsellingTopicType;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  metadata?: {
    tags?: string[];
    summary?: string;
    key_insights?: string[];
  };
}

export interface LearnerContext {
  id: string;
  name: string;
  email?: string;
  department?: string;
  year?: number;
  gpa?: number;
  enrolled_courses?: string[];
  recent_performance?: {
    subject: string;
    grade: string;
  }[];
  interests?: string[];
  career_goals?: string[];
}

export interface CounsellingRequest {
  session_id: string;
  message: string;
  learner_context?: LearnerContext;
  topic: CounsellingTopicType;
}

export interface CounsellingResponse {
  message: string;
  session_id: string;
  tokens_used?: number;
  suggestions?: string[];
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
}
