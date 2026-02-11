/**
 * Video Processing Utilities
 * 
 * AI-powered functions for generating summaries, quotes, quiz questions, and flashcards
 */

import type {
  TranscriptSegment,
  VideoChapter,
  VideoSummaryResult,
  NotableQuote,
  QuizQuestion,
  Flashcard
} from '../types/video';
import { callOpenRouterWithRetry, repairAndParseJSON } from '../../shared/ai-config';

/**
 * Generate comprehensive video summary with AI
 * Includes summary, key points, chapters, and topics
 */
export async function generateVideoSummary(
  env: Record<string, any>,
  transcript: string,
  segments: TranscriptSegment[]
): Promise<VideoSummaryResult> {
  const systemPrompt = `You are an expert educational content analyzer. Analyze the video transcript and provide:
1. A comprehensive summary (2-3 paragraphs)
2. Key points (5-8 bullet points)
3. Chapter markers with timestamps and summaries
4. Main topics covered

Return JSON: {"summary": "...", "keyPoints": ["..."], "chapters": [{"timestamp": 0, "title": "...", "summary": "..."}], "topics": ["..."]}`;

  const userPrompt = `Transcript:\n${transcript.slice(0, 15000)}${transcript.length > 15000 ? '\n[truncated]' : ''}\n\nSegments:\n${segments.slice(0, 50).map(s => `[${Math.floor(s.start / 60)}:${Math.floor(s.start % 60).toString().padStart(2, '0')}] ${s.text}`).join('\n')}`;

  try {
    const content = await callOpenRouterWithRetry(
      env.OPENROUTER_API_KEY,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        models: ['google/gemini-2.0-flash-exp:free', 'openai/gpt-4o-mini'],
        maxTokens: 4000,
        temperature: 0.3
      }
    );
    
    const parsed = repairAndParseJSON(content, true);
    return {
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
      chapters: parsed.chapters || [],
      topics: parsed.topics || []
    };
  } catch (error) {
    console.error('Failed to generate video summary:', error);
    return { 
      summary: '', 
      keyPoints: [], 
      chapters: [], 
      topics: [] 
    };
  }
}

/**
 * Extract notable quotes from transcript
 */
export async function extractNotableQuotes(
  env: Record<string, any>,
  segments: TranscriptSegment[]
): Promise<NotableQuote[]> {
  const systemPrompt = `Extract 3-5 notable, memorable, or impactful quotes from this transcript. Include the approximate timestamp.
Return JSON: {"quotes": [{"text": "exact quote", "timestamp": seconds, "context": "brief context"}]}`;

  const userPrompt = `Transcript with timestamps:\n${segments.slice(0, 100).map(s => `[${Math.floor(s.start)}s] ${s.text}`).join('\n')}`;

  try {
    const content = await callOpenRouterWithRetry(
      env.OPENROUTER_API_KEY,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        models: ['google/gemini-2.0-flash-exp:free', 'openai/gpt-4o-mini'],
        maxTokens: 2000,
        temperature: 0.3
      }
    );
    
    const parsed = repairAndParseJSON(content, true);
    return parsed.quotes || [];
  } catch (error) {
    console.error('Failed to extract notable quotes:', error);
    return [];
  }
}

/**
 * Generate quiz questions from video content
 */
export async function generateQuizQuestions(
  env: Record<string, any>,
  transcript: string,
  summary: string,
  keyPoints: string[]
): Promise<QuizQuestion[]> {
  const systemPrompt = `Generate 5 multiple-choice quiz questions to test understanding of this content. Each question should have 4 options with one correct answer.
Return JSON: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Why this is correct"}]}`;

  const userPrompt = `Summary: ${summary}\n\nKey Points:\n${keyPoints.join('\n')}\n\nTranscript (first 5000 chars):\n${transcript.slice(0, 5000)}`;

  try {
    const content = await callOpenRouterWithRetry(
      env.OPENROUTER_API_KEY,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        models: ['google/gemini-2.0-flash-exp:free', 'openai/gpt-4o-mini'],
        maxTokens: 3000,
        temperature: 0.3
      }
    );
    
    const parsed = repairAndParseJSON(content, true);
    return parsed.questions || [];
  } catch (error) {
    console.error('Failed to generate quiz questions:', error);
    return [];
  }
}

/**
 * Generate flashcards for studying
 */
export async function generateFlashcards(
  env: Record<string, any>,
  transcript: string,
  keyPoints: string[],
  topics: string[]
): Promise<Flashcard[]> {
  const systemPrompt = `Create 5-8 flashcards for studying this content. Each flashcard should have a question/term on the front and the answer/definition on the back.
Return JSON: {"flashcards": [{"front": "Question or term", "back": "Answer or definition", "topic": "Related topic"}]}`;

  const userPrompt = `Topics: ${topics.join(', ')}\n\nKey Points:\n${keyPoints.join('\n')}\n\nTranscript excerpt:\n${transcript.slice(0, 5000)}`;

  try {
    const content = await callOpenRouterWithRetry(
      env.OPENROUTER_API_KEY,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        models: ['google/gemini-2.0-flash-exp:free', 'openai/gpt-4o-mini'],
        maxTokens: 3000,
        temperature: 0.3
      }
    );
    
    const parsed = repairAndParseJSON(content, true);
    return parsed.flashcards || [];
  } catch (error) {
    console.error('Failed to generate flashcards:', error);
    return [];
  }
}
