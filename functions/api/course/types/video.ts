/**
 * Video Processing Types
 * 
 * Type definitions for video transcription and summarization
 */

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: number;
}

export interface VideoChapter {
  timestamp: number;
  title: string;
  summary: string;
}

export interface SentimentData {
  overall: string;
  overallScore: number;
  segments: Array<{
    text: string;
    sentiment: string;
    score: number;
    startWord: number;
    endWord: number;
  }>;
}

export interface Speaker {
  id: number;
  utterances: Array<{ start: number; end: number; text: string }>;
}

export interface NotableQuote {
  text: string;
  timestamp: number;
  speaker?: number;
  context?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
  topic?: string;
}

export interface TranscriptionResult {
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  provider: string;
  sentimentData: SentimentData | null;
  speakers: Speaker[];
  deepgramSummary: string | null;
}

export interface VideoSummaryResult {
  summary: string;
  keyPoints: string[];
  chapters: VideoChapter[];
  topics: string[];
}
