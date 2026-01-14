/**
 * useAssessmentProgress Hook
 * 
 * Calculates and tracks assessment progress across sections.
 * 
 * @module features/assessment/career-test/hooks/useAssessmentProgress
 */

import { useMemo } from 'react';

interface Section {
  id: string;
  questions: any[];
  isAdaptive?: boolean;
}

interface AdaptiveProgress {
  questionsAnswered: number;
  estimatedTotalQuestions: number;
}

interface UseAssessmentProgressOptions {
  sections: Section[];
  currentSectionIndex: number;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  adaptiveProgress?: AdaptiveProgress | null;
}

interface UseAssessmentProgressResult {
  totalQuestions: number;
  answeredCount: number;
  progress: number;
  currentSectionProgress: number;
  sectionsCompleted: number;
  isLastSection: boolean;
  isLastQuestion: boolean;
}

/**
 * Hook to calculate assessment progress
 */
export const useAssessmentProgress = ({
  sections,
  currentSectionIndex,
  currentQuestionIndex,
  answers,
  adaptiveProgress
}: UseAssessmentProgressOptions): UseAssessmentProgressResult => {
  return useMemo(() => {
    if (!sections || sections.length === 0) {
      return {
        totalQuestions: 0,
        answeredCount: 0,
        progress: 0,
        currentSectionProgress: 0,
        sectionsCompleted: 0,
        isLastSection: false,
        isLastQuestion: false
      };
    }

    // Calculate total questions (including adaptive section estimate)
    const totalQuestions = sections.reduce((sum, section) => {
      if (section.isAdaptive) {
        return sum + (adaptiveProgress?.estimatedTotalQuestions || 20);
      }
      return sum + (section.questions?.length || 0);
    }, 0);

    // Count answered questions
    const regularAnsweredCount = Object.keys(answers).filter(
      key => !key.startsWith('adaptive_aptitude')
    ).length;
    const adaptiveAnsweredCount = adaptiveProgress?.questionsAnswered || 0;
    const answeredCount = regularAnsweredCount + adaptiveAnsweredCount;

    // Calculate overall progress
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    // Calculate current section progress
    const currentSection = sections[currentSectionIndex];
    let currentSectionProgress = 0;
    if (currentSection) {
      if (currentSection.isAdaptive) {
        const adaptiveTotal = adaptiveProgress?.estimatedTotalQuestions || 20;
        currentSectionProgress = adaptiveTotal > 0 
          ? (adaptiveAnsweredCount / adaptiveTotal) * 100 
          : 0;
      } else {
        const sectionTotal = currentSection.questions?.length || 0;
        currentSectionProgress = sectionTotal > 0 
          ? ((currentQuestionIndex + 1) / sectionTotal) * 100 
          : 0;
      }
    }

    // Check if on last section/question
    const isLastSection = currentSectionIndex === sections.length - 1;
    const isLastQuestion = currentSection?.isAdaptive
      ? false // Adaptive section handles its own completion
      : currentQuestionIndex === (currentSection?.questions?.length || 1) - 1;

    return {
      totalQuestions,
      answeredCount,
      progress,
      currentSectionProgress,
      sectionsCompleted: currentSectionIndex,
      isLastSection,
      isLastQuestion
    };
  }, [sections, currentSectionIndex, currentQuestionIndex, answers, adaptiveProgress]);
};

export default useAssessmentProgress;
