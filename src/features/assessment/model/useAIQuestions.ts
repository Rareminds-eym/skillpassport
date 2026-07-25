/**
 * useAIQuestions Hook
 * 
 * Loads AI-generated questions for aptitude and knowledge sections.
 * 
 * Grade Level Behavior:
 * - after10: Loads ONLY aptitude questions (stream-agnostic, no knowledge)
 * - after12, college, higher_secondary: Loads BOTH aptitude AND knowledge questions
 * - middle, highschool: Does not load AI questions (uses hardcoded questions)
 * 
 * @module features/assessment/career-test/hooks/useAIQuestions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore - JS file without type declarations
import { loadCareerAssessmentQuestions, getSavedQuestionsForLearner } from '../api/careerAssessmentAIService';
import type { GradeLevel } from '../model/types';

interface AIQuestion {
  id: string;
  text: string;
  question?: string; // AI uses 'question', UI expects 'text'
  options: string[];
  correct: string;
  correct_answer?: string; // AI uses 'correct_answer', UI expects 'correct'
  type?: string;
  subtype?: string;
  moduleTitle?: string;
}

interface AIQuestionsState {
  aptitude: AIQuestion[] | null;
  knowledge: AIQuestion[] | null;
}

interface ProgressState {
  stage: 'idle' | 'aptitude' | 'knowledge' | 'complete';
  aptitudeProgress: number; // 0-100
  knowledgeProgress: number; // 0-100
  estimatedTimeRemaining: number; // in seconds
  message: string;
}

interface UseAIQuestionsOptions {
  gradeLevel: GradeLevel | null;
  learnerStream: string | null;
  learnerId: string | null;
  attemptId: string | null;
  learnerProgram: string | null;
  isResuming?: boolean; // New flag to indicate if this is a resume operation
}

interface UseAIQuestionsResult {
  aiQuestions: AIQuestionsState;
  loading: boolean;
  error: string | null;
  progress: ProgressState;
  reload: () => Promise<void>;
}

/**
 * Normalize AI question format to match UI expectations
 */
const normalizeAIQuestion = (q: any): AIQuestion => {
  // Ensure options is always an array
  let normalizedOptions = q.options;
  if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
    // Convert object options { A: "...", B: "...", ... } to array
    normalizedOptions = Object.values(q.options);
  }

  return {
    ...q,
    text: q.question || q.text,
    correct: q.correct_answer || q.correct,
    options: normalizedOptions || []
  };
};

/**
 * Hook to load AI-generated questions for aptitude and knowledge sections
 */
export const useAIQuestions = ({
  gradeLevel,
  learnerStream,
  learnerId,
  attemptId,
  learnerProgram,
  isResuming = false
}: UseAIQuestionsOptions): UseAIQuestionsResult => {
  const [aiQuestions, setAiQuestions] = useState<AIQuestionsState>({
    aptitude: null,
    knowledge: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    stage: 'idle',
    aptitudeProgress: 0,
    knowledgeProgress: 0,
    estimatedTimeRemaining: 0,
    message: ''
  });

  // Use ref to track loading state synchronously to prevent race conditions
  const isLoadingRef = useRef(false);

  // Cleanup function to reset state on unmount
  useEffect(() => {
    return () => {
      setLoading(false);
      isLoadingRef.current = false;
      setError(null);
      setProgress({
        stage: 'idle',
        aptitudeProgress: 0,
        knowledgeProgress: 0,
        estimatedTimeRemaining: 0,
        message: ''
      });
    };
  }, []);

  const loadQuestions = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    // Only load for grade levels that use AI questions (stream-based assessments)
    const usesAI = gradeLevel && ['higher_secondary', 'after10', 'after12', 'college'].includes(gradeLevel);

    // For after10, we use 'general' stream if no specific stream is set
    const effectiveStream = learnerStream || (gradeLevel === 'after10' ? 'general' : null);


    if (!usesAI || !effectiveStream) {
      return;
    }

    // learnerId is required for both cache lookup and saving generated questions.
    // It is a dep of this useCallback so the hook re-fires automatically once it
    // becomes available. Returning here (without setting isLoadingRef) keeps the
    // mutex free so the subsequent valid call is never blocked.
    if (!learnerId) {
      console.log('⏳ learnerId not yet available, deferring question load');
      return;
    }

    // Set loading state to true when generation starts
    setLoading(true);
    isLoadingRef.current = true;
    setError(null);

    // Initialize progress tracking
    const startTime = Date.now();
    const TYPICAL_APTITUDE_TIME = 15; // seconds
    const TYPICAL_KNOWLEDGE_TIME = 12; // seconds
    const TOTAL_TIME = TYPICAL_APTITUDE_TIME + TYPICAL_KNOWLEDGE_TIME;

    try {

      // Stage 1: Loading aptitude questions
      setProgress({
        stage: 'aptitude',
        aptitudeProgress: 0,
        knowledgeProgress: 0,
        estimatedTimeRemaining: TOTAL_TIME,
        message: 'Generating aptitude questions...'
      });

      // Simulate progress updates for aptitude (every 500ms)
      const aptitudeProgressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.stage !== 'aptitude') return prev;
          const elapsed = (Date.now() - startTime) / 1000;
          const aptitudeProgress = Math.min(95, (elapsed / TYPICAL_APTITUDE_TIME) * 100);
          const remaining = Math.max(0, TOTAL_TIME - elapsed);
          return {
            ...prev,
            aptitudeProgress,
            estimatedTimeRemaining: Math.ceil(remaining),
            message: `Generating aptitude questions... ${Math.round(aptitudeProgress)}%`
          };
        });
      }, 500);

      const questions = await loadCareerAssessmentQuestions(
        effectiveStream,
        gradeLevel,
        learnerId || null,
        attemptId || null,
        learnerProgram || null
      );

      // Clear aptitude progress interval
      clearInterval(aptitudeProgressInterval);

      // Stage 2: Aptitude complete, loading knowledge questions
      const aptitudeCompleteTime = Date.now();
      setProgress({
        stage: 'knowledge',
        aptitudeProgress: 100,
        knowledgeProgress: 0,
        estimatedTimeRemaining: TYPICAL_KNOWLEDGE_TIME,
        message: 'Generating knowledge questions...'
      });

      // Simulate progress updates for knowledge (every 500ms)
      const knowledgeProgressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.stage !== 'knowledge') return prev;
          const elapsed = (Date.now() - aptitudeCompleteTime) / 1000;
          const knowledgeProgress = Math.min(95, (elapsed / TYPICAL_KNOWLEDGE_TIME) * 100);
          const remaining = Math.max(0, TYPICAL_KNOWLEDGE_TIME - elapsed);
          return {
            ...prev,
            knowledgeProgress,
            estimatedTimeRemaining: Math.ceil(remaining),
            message: `Generating knowledge questions... ${Math.round(knowledgeProgress)}%`
          };
        });
      }, 500);

      // Wait a bit to show knowledge progress (questions are already loaded)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Clear knowledge progress interval
      clearInterval(knowledgeProgressInterval);

      // Normalize questions to match UI format
      const normalizedQuestions: AIQuestionsState = {
        aptitude: questions.aptitude?.map(normalizeAIQuestion) || null,
        knowledge: questions.knowledge?.map(normalizeAIQuestion) || null
      };

      setAiQuestions(normalizedQuestions);

      // Stage 3: Complete
      setProgress({
        stage: 'complete',
        aptitudeProgress: 100,
        knowledgeProgress: 100,
        estimatedTimeRemaining: 0,
        message: 'Questions loaded successfully!'
      });

    } catch (err) {
      console.warn('Failed to load AI questions:', err);

      // Set user-friendly error message based on error type
      let userMessage = 'Failed to load AI questions. Please try again.';

      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          userMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('timeout')) {
          userMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('rate limit')) {
          userMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (err.message.includes('API')) {
          userMessage = 'Question generation service is temporarily unavailable. Please try again later.';
        }
      }

      setError(userMessage);

      // Reset progress on error
      setProgress({
        stage: 'idle',
        aptitudeProgress: 0,
        knowledgeProgress: 0,
        estimatedTimeRemaining: 0,
        message: ''
      });
    } finally {
      // Set loading state to false when generation completes
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [gradeLevel, learnerStream, learnerId, attemptId, learnerProgram]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    aiQuestions,
    loading,
    error,
    progress,
    reload: loadQuestions
  };
};

export default useAIQuestions;
