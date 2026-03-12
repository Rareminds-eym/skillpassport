// AI Questions State interface
export interface AIQuestionsState {
  aptitude?: AssessmentQuestion[] | null;
  knowledge?: AssessmentQuestion[] | null;
}

// Assessment System Types
export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'rating' | 'text' | 'boolean' | 'multiselect' | 'singleselect' | string;
  options?: string[];
  responseScale?: number;
  category?: string;
  section?: string;
  partType?: string;
  categoryMapping?: Record<string, unknown>;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions?: AssessmentQuestion[];
  responseScale?: number;
  totalQuestions?: number;
}

export interface AdaptiveTestResults {
  sectionId: string;
  sessionId: string;
  answers: Record<string, unknown>;
  score?: number;
  completedAt: string;
  timeSpent?: number;
  recommendations?: string[];
}

export interface AssessmentError {
  type: 'network' | 'validation' | 'timeout' | 'unknown';
  message: string;
  code?: string;
}

export interface SectionConfig {
  id: string;
  title: string;
  responseScale: number;
  questionCount: number;
  category?: string;
}
export interface PendingAttempt {
  id: string;
  current_section_index: number | null;
  current_question_index: number | null;
  elapsed_time: number | null;
  timer_remaining: number | null;
  adaptive_aptitude_session_id: string | null;
  grade_level: string;
  stream_id: string | null;
  section_timings: Record<string, unknown> | null;
<<<<<<< HEAD
=======
  restoredResponses: Record<string, unknown> | null;
>>>>>>> 0da8df84a1014474fb32c61b14c7232a0bafe81f
  all_responses: Record<string, unknown> | null;
}