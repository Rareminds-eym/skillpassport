// University AI Types

export type CounsellingTopic = 'academic' | 'career' | 'performance' | 'wellbeing' | 'general';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  topic?: CounsellingTopic;
}

export interface StudentContext {
  id?: string;
  name?: string;
  email?: string;
  department?: string;
  year?: number;
  gpa?: number;
  courses?: string[];
  interests?: string[];
  goals?: string[];
}

export interface CounsellingResponse {
  content: string;
  suggestions?: string[];
  metadata?: {
    topic: CounsellingTopic;
    intentHandled?: string;
    confidence?: number;
  };
}
