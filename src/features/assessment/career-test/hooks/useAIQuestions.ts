/**
 * useAIQuestions Hook
 * 
 * Loads AI-generated questions for aptitude and knowledge sections
 * for after10, after12, and college grade levels.
 * 
 * @module features/assessment/career-test/hooks/useAIQuestions
 */

import { useState, useEffect, useCallback } from 'react';
import { loadCareerAssessmentQuestions } from '../../../../services/careerAssessmentAIService';
import type { GradeLevel } from '../config/sections';

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

interface UseAIQuestionsOptions {
  gradeLevel: GradeLevel | null;
  studentStream: string | null;
  studentId: string | null;
  attemptId: string | null;
}

interface UseAIQuestionsResult {
  aiQuestions: AIQuestionsState;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Normalize AI question format to match UI expectations
 */
const normalizeAIQuestion = (q: any): AIQuestion => ({
  ...q,
  text: q.question || q.text,
  correct: q.correct_answer || q.correct
});

/**
 * Hook to load AI-generated questions for aptitude and knowledge sections
 */
export const useAIQuestions = ({
  gradeLevel,
  studentStream,
  studentId,
  attemptId
}: UseAIQuestionsOptions): UseAIQuestionsResult => {
  const [aiQuestions, setAiQuestions] = useState<AIQuestionsState>({
    aptitude: null,
    knowledge: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    // Only load for grade levels that use AI questions
    const usesAI = gradeLevel && ['after10', 'after12', 'college'].includes(gradeLevel);
    
    if (!usesAI || !studentStream) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🤖 Loading AI questions for ${gradeLevel} student, stream:`, studentStream);
      
      const questions = await loadCareerAssessmentQuestions(
        studentStream,
        gradeLevel,
        studentId || null,
        attemptId || null
      );

      // Normalize questions to match UI format
      const normalizedQuestions: AIQuestionsState = {
        aptitude: questions.aptitude?.map(normalizeAIQuestion) || null,
        knowledge: questions.knowledge?.map(normalizeAIQuestion) || null
      };

      setAiQuestions(normalizedQuestions);
      
      console.log('✅ AI questions loaded:', {
        aptitude: normalizedQuestions.aptitude?.length || 0,
        knowledge: normalizedQuestions.knowledge?.length || 0
      });
    } catch (err) {
      console.warn('Failed to load AI questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load AI questions');
    } finally {
      setLoading(false);
    }
  }, [gradeLevel, studentStream, studentId, attemptId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    aiQuestions,
    loading,
    error,
    reload: loadQuestions
  };
};

export default useAIQuestions;
