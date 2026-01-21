/**
 * Question Navigation Hook
 *
 * Provides navigation logic for moving between questions in an assessment.
 * Supports linear navigation, jumping to specific questions, and section-based navigation.
 *
 * @module features/assessment/hooks/useQuestionNavigation
 */

import { useState, useCallback, useMemo } from 'react';

export interface Question {
  id: string;
  [key: string]: unknown;
}

export interface Section {
  id: string;
  name: string;
  questions: Question[];
}

export interface UseQuestionNavigationOptions {
  /** Array of questions (flat mode) */
  questions?: Question[];
  /** Array of sections with questions (section mode) */
  sections?: Section[];
  /** Initial question index */
  initialQuestionIndex?: number;
  /** Initial section index (for section mode) */
  initialSectionIndex?: number;
  /** Callback when question changes */
  onQuestionChange?: (questionIndex: number, sectionIndex?: number) => void;
  /** Callback when section changes */
  onSectionChange?: (sectionIndex: number) => void;
  /** Whether to allow navigation to unanswered questions */
  allowSkip?: boolean;
}

export interface UseQuestionNavigationReturn {
  /** Current question index (within section or overall) */
  currentQuestionIndex: number;
  /** Current section index (section mode only) */
  currentSectionIndex: number;
  /** Current question object */
  currentQuestion: Question | null;
  /** Current section object (section mode only) */
  currentSection: Section | null;
  /** Total number of questions */
  totalQuestions: number;
  /** Total number of sections */
  totalSections: number;
  /** Whether there's a next question */
  hasNext: boolean;
  /** Whether there's a previous question */
  hasPrevious: boolean;
  /** Whether at the last question of current section */
  isLastInSection: boolean;
  /** Whether at the first question of current section */
  isFirstInSection: boolean;
  /** Whether at the very last question overall */
  isLastOverall: boolean;
  /** Go to next question */
  goToNext: () => void;
  /** Go to previous question */
  goToPrevious: () => void;
  /** Go to specific question by index */
  goToQuestion: (index: number) => void;
  /** Go to specific section (section mode) */
  goToSection: (sectionIndex: number, questionIndex?: number) => void;
  /** Go to next section */
  goToNextSection: () => void;
  /** Go to previous section */
  goToPreviousSection: () => void;
  /** Get overall question number (1-indexed) */
  getOverallQuestionNumber: () => number;
  /** Get progress percentage */
  getProgressPercentage: (answeredCount: number) => number;
}

export function useQuestionNavigation(
  options: UseQuestionNavigationOptions = {}
): UseQuestionNavigationReturn {
  const {
    questions = [],
    sections = [],
    initialQuestionIndex = 0,
    initialSectionIndex = 0,
    onQuestionChange,
    onSectionChange,
    allowSkip = true,
  } = options;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(initialSectionIndex);

  // Determine if we're in section mode
  const isSectionMode = sections.length > 0;

  // Get current section's questions
  const currentSectionQuestions = useMemo(() => {
    if (isSectionMode && sections[currentSectionIndex]) {
      return sections[currentSectionIndex].questions;
    }
    return questions;
  }, [isSectionMode, sections, currentSectionIndex, questions]);

  // Current question
  const currentQuestion = useMemo(() => {
    return currentSectionQuestions[currentQuestionIndex] || null;
  }, [currentSectionQuestions, currentQuestionIndex]);

  // Current section
  const currentSection = useMemo(() => {
    return isSectionMode ? sections[currentSectionIndex] || null : null;
  }, [isSectionMode, sections, currentSectionIndex]);

  // Total questions (in current section or overall)
  const totalQuestionsInSection = currentSectionQuestions.length;

  // Total questions overall
  const totalQuestions = useMemo(() => {
    if (isSectionMode) {
      return sections.reduce((sum, section) => sum + section.questions.length, 0);
    }
    return questions.length;
  }, [isSectionMode, sections, questions]);

  const totalSections = sections.length;

  // Navigation state
  const hasNext =
    currentQuestionIndex < totalQuestionsInSection - 1 ||
    (isSectionMode && currentSectionIndex < totalSections - 1);

  const hasPrevious = currentQuestionIndex > 0 || (isSectionMode && currentSectionIndex > 0);

  const isLastInSection = currentQuestionIndex === totalQuestionsInSection - 1;
  const isFirstInSection = currentQuestionIndex === 0;
  const isLastOverall =
    isLastInSection && (!isSectionMode || currentSectionIndex === totalSections - 1);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestionsInSection - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      onQuestionChange?.(newIndex, currentSectionIndex);
    } else if (isSectionMode && currentSectionIndex < totalSections - 1) {
      // Move to next section
      const newSectionIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(newSectionIndex);
      setCurrentQuestionIndex(0);
      onSectionChange?.(newSectionIndex);
      onQuestionChange?.(0, newSectionIndex);
    }
  }, [
    currentQuestionIndex,
    totalQuestionsInSection,
    isSectionMode,
    currentSectionIndex,
    totalSections,
    onQuestionChange,
    onSectionChange,
  ]);

  const goToPrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      onQuestionChange?.(newIndex, currentSectionIndex);
    } else if (isSectionMode && currentSectionIndex > 0) {
      // Move to previous section's last question
      const newSectionIndex = currentSectionIndex - 1;
      const prevSectionQuestions = sections[newSectionIndex].questions;
      const newQuestionIndex = prevSectionQuestions.length - 1;
      setCurrentSectionIndex(newSectionIndex);
      setCurrentQuestionIndex(newQuestionIndex);
      onSectionChange?.(newSectionIndex);
      onQuestionChange?.(newQuestionIndex, newSectionIndex);
    }
  }, [
    currentQuestionIndex,
    isSectionMode,
    currentSectionIndex,
    sections,
    onQuestionChange,
    onSectionChange,
  ]);

  const goToQuestion = useCallback(
    (index: number) => {
      if (!allowSkip) return;
      if (index >= 0 && index < totalQuestionsInSection) {
        setCurrentQuestionIndex(index);
        onQuestionChange?.(index, currentSectionIndex);
      }
    },
    [allowSkip, totalQuestionsInSection, currentSectionIndex, onQuestionChange]
  );

  const goToSection = useCallback(
    (sectionIndex: number, questionIndex: number = 0) => {
      if (!isSectionMode) return;
      if (sectionIndex >= 0 && sectionIndex < totalSections) {
        const sectionQuestions = sections[sectionIndex].questions;
        const validQuestionIndex = Math.min(questionIndex, sectionQuestions.length - 1);
        setCurrentSectionIndex(sectionIndex);
        setCurrentQuestionIndex(validQuestionIndex);
        onSectionChange?.(sectionIndex);
        onQuestionChange?.(validQuestionIndex, sectionIndex);
      }
    },
    [isSectionMode, totalSections, sections, onSectionChange, onQuestionChange]
  );

  const goToNextSection = useCallback(() => {
    if (isSectionMode && currentSectionIndex < totalSections - 1) {
      goToSection(currentSectionIndex + 1, 0);
    }
  }, [isSectionMode, currentSectionIndex, totalSections, goToSection]);

  const goToPreviousSection = useCallback(() => {
    if (isSectionMode && currentSectionIndex > 0) {
      goToSection(currentSectionIndex - 1, 0);
    }
  }, [isSectionMode, currentSectionIndex, goToSection]);

  const getOverallQuestionNumber = useCallback((): number => {
    if (!isSectionMode) {
      return currentQuestionIndex + 1;
    }

    let count = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      count += sections[i].questions.length;
    }
    return count + currentQuestionIndex + 1;
  }, [isSectionMode, currentSectionIndex, currentQuestionIndex, sections]);

  const getProgressPercentage = useCallback(
    (answeredCount: number): number => {
      if (totalQuestions === 0) return 0;
      return Math.round((answeredCount / totalQuestions) * 100);
    },
    [totalQuestions]
  );

  return {
    currentQuestionIndex,
    currentSectionIndex,
    currentQuestion,
    currentSection,
    totalQuestions,
    totalSections,
    hasNext,
    hasPrevious,
    isLastInSection,
    isFirstInSection,
    isLastOverall,
    goToNext,
    goToPrevious,
    goToQuestion,
    goToSection,
    goToNextSection,
    goToPreviousSection,
    getOverallQuestionNumber,
    getProgressPercentage,
  };
}

export default useQuestionNavigation;
