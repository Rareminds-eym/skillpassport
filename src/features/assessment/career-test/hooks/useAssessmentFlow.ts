/**
 * useAssessmentFlow Hook
 * 
 * Main state machine for the career assessment flow.
 * Manages navigation, answers, timers, and flow state.
 * 
 * @module features/assessment/career-test/hooks/useAssessmentFlow
 */

import { useState, useCallback, useMemo } from 'react';
import type { GradeLevel } from '../config/sections';

export type FlowScreen =
  | 'loading'
  | 'restriction'
  | 'resume_prompt'
  | 'grade_selection'
  | 'category_selection'
  | 'stream_selection'
  | 'section_intro'
  | 'assessment'
  | 'question'
  | 'section_complete'
  | 'submitting'
  | 'error';

interface Section {
  id: string;
  title: string;
  questions: any[];
  responseScale?: any[];
  isTimed?: boolean;
  timeLimit?: number;
  isAptitude?: boolean;
  isKnowledge?: boolean;
  isAdaptive?: boolean;
  individualTimeLimit?: number;
}

interface SJTAnswer {
  best: string | null;
  worst: string | null;
}

interface UseAssessmentFlowOptions {
  sections: Section[];
  onSectionComplete?: (sectionId: string, timeSpent: number) => void;
  onAnswerChange?: (questionId: string, answer: any) => void;
}

interface UseAssessmentFlowResult {
  // Current state
  currentScreen: FlowScreen;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  currentSection: Section | null;
  currentQuestion: any | null;

  // Answers
  answers: Record<string, any>;

  // Grade/Stream
  gradeLevel: GradeLevel | null;
  studentStream: string | null;
  selectedCategory: string | null;

  // Timers
  timeRemaining: number | null;
  elapsedTime: number;
  aptitudeQuestionTimer: number;
  aptitudePhase: 'individual' | 'shared';

  // UI State
  showSectionIntro: boolean;
  showSectionComplete: boolean;
  isSubmitting: boolean;
  isSaving: boolean;
  error: string | null;

  // Section timings
  sectionTimings: Record<string, number>;

  // Actions
  setCurrentScreen: (screen: FlowScreen) => void;
  setCurrentSectionIndex: (index: number) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setShowSectionIntro: (show: boolean) => void;
  setGradeLevel: (level: GradeLevel) => void;
  setStudentStream: (stream: string) => void;
  setSelectedCategory: (category: string) => void;
  setAnswer: (questionId: string, value: any) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  startSection: () => void;
  completeSection: () => void;
  goToNextSection: () => void;
  jumpToSection: (sectionIndex: number) => void;
  setTimeRemaining: (time: number | null) => void;
  setElapsedTime: (time: number | ((prev: number) => number)) => void;
  setAptitudeQuestionTimer: (time: number) => void;
  setError: (error: string | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setSectionTimings: (timings: Record<string, number>) => void;
  resetFlow: () => void;

  // Computed
  isLastSection: boolean;
  isLastQuestion: boolean;
  isCurrentQuestionAnswered: boolean;
  questionId: string;
}

/**
 * Main assessment flow state machine hook
 */
export const useAssessmentFlow = ({
  sections,
  onSectionComplete,
  onAnswerChange
}: UseAssessmentFlowOptions): UseAssessmentFlowResult => {
  // Flow state
  const [currentScreen, setCurrentScreen] = useState<FlowScreen>('loading');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Answers
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Grade/Stream
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
  const [studentStream, setStudentStream] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Timers
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [aptitudeQuestionTimer, setAptitudeQuestionTimer] = useState(60);
  const [aptitudePhase, setAptitudePhase] = useState<'individual' | 'shared'>('individual');

  // UI State
  const [showSectionIntro, setShowSectionIntro] = useState(true);
  const [showSectionComplete, setShowSectionComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section timings
  const [sectionTimings, setSectionTimings] = useState<Record<string, number>>({});

  // Current section and question
  const currentSection = sections[currentSectionIndex] || null;
  const currentQuestion = currentSection?.questions?.[currentQuestionIndex] || null;

  // Question ID
  const questionId = currentSection && currentQuestion
    ? `${currentSection.id}_${currentQuestion.id}`
    : '';

  // Computed values
  const isLastSection = currentSectionIndex === sections.length - 1;

  // For adaptive sections, never show "Complete Section" - the adaptive hook handles completion
  // For regular sections, check if we're on the last question
  const isLastQuestion = currentSection?.isAdaptive
    ? false // Adaptive section handles its own completion
    : currentSection
      ? currentQuestionIndex === (currentSection.questions?.length || 1) - 1
      : false;

  // Check if current question is answered
  const isCurrentQuestionAnswered = useMemo(() => {
    if (!questionId || !currentQuestion) return false;

    const answer = answers[questionId];
    if (answer === undefined || answer === null) return false;

    // SJT questions need both best and worst
    if (currentQuestion.partType === 'sjt') {
      const sjtAnswer = answer as SJTAnswer;
      return Boolean(sjtAnswer?.best && sjtAnswer?.worst);
    }

    // Multiselect questions
    if (currentQuestion.type === 'multiselect') {
      return Array.isArray(answer) && answer.length === currentQuestion.maxSelections;
    }

    // Text questions
    if (currentQuestion.type === 'text') {
      return typeof answer === 'string' && answer.trim().length >= 10;
    }

    return true;
  }, [questionId, currentQuestion, answers]);

  // Actions
  const setAnswer = useCallback((qId: string, value: any) => {
    setAnswers(prev => {
      if (value === undefined || (typeof value === 'object' && Object.keys(value).length === 0)) {
        const { [qId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [qId]: value };
    });
    onAnswerChange?.(qId, value);
  }, [onAnswerChange]);

  const goToNextQuestion = useCallback(() => {
    if (!currentSection) return;

    if (currentQuestionIndex < (currentSection.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // End of section - save timing and show complete screen
      // Calculate time spent on this section
      // For aptitude/knowledge sections, always use elapsedTime (they use per-question timers)
      // For other timed sections, use timeLimit - timeRemaining
      const timeSpent = (currentSection.isAptitude || currentSection.isKnowledge)
        ? elapsedTime
        : currentSection.isTimed
          ? (currentSection.timeLimit || 0) - (timeRemaining || 0)
          : elapsedTime;

      // Save section timing
      setSectionTimings(prev => ({
        ...prev,
        [currentSection.id]: timeSpent
      }));

      // Notify parent component
      onSectionComplete?.(currentSection.id, timeSpent);

      // Show section complete screen
      setShowSectionComplete(true);
    }
  }, [currentSection, currentQuestionIndex, timeRemaining, elapsedTime, onSectionComplete]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const startSection = useCallback(() => {
    setShowSectionIntro(false);
    setShowSectionComplete(false);
  }, [showSectionIntro, showSectionComplete, currentSectionIndex, elapsedTime]);

  const completeSection = useCallback(() => {
    console.log('🔄 completeSection called');
    console.log('📊 completeSection state:', {
      currentSectionId: currentSection?.id,
      currentSectionIndex,
      sectionsLength: sections.length,
      isLastSection: currentSectionIndex === sections.length - 1,
      isTimed: currentSection?.isTimed,
      timeRemaining,
      elapsedTime
    });

    if (currentSection) {
      // Calculate time spent on this section
      // For aptitude/knowledge sections, always use elapsedTime (they use per-question timers)
      // For other timed sections, use timeLimit - timeRemaining
      const timeSpent = (currentSection.isAptitude || currentSection.isKnowledge)
        ? elapsedTime
        : currentSection.isTimed
          ? (currentSection.timeLimit || 0) - (timeRemaining || 0)
          : elapsedTime;

      console.log('⏱️ Section time spent:', timeSpent);

      setSectionTimings(prev => ({
        ...prev,
        [currentSection.id]: timeSpent
      }));

      onSectionComplete?.(currentSection.id, timeSpent);
    }
    console.log('✅ Setting showSectionComplete to true');
    setShowSectionComplete(true);
  }, [currentSection, timeRemaining, elapsedTime, onSectionComplete, currentSectionIndex, sections.length]);

  const goToNextSection = useCallback(() => {
    setShowSectionComplete(false);

    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setTimeRemaining(null);
      setElapsedTime(0);
      setShowSectionIntro(true);
    }
  }, [currentSectionIndex, sections.length]);

  const jumpToSection = useCallback((sectionIndex: number) => {
    console.log(`🎯 jumpToSection called: sectionIndex=${sectionIndex}, sections.length=${sections.length}`);
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      console.log(`✅ Jumping to section ${sectionIndex}: ${sections[sectionIndex]?.title || 'unknown'}`);
      console.log('📊 jumpToSection - Setting state:', {
        currentSectionIndex: sectionIndex,
        currentQuestionIndex: 0,
        timeRemaining: null,
        elapsedTime: 0,
        showSectionIntro: true,
        showSectionComplete: false
      });
      setCurrentSectionIndex(sectionIndex);
      setCurrentQuestionIndex(0);
      setTimeRemaining(null);
      setElapsedTime(0);
      setShowSectionIntro(true);
      setShowSectionComplete(false);
      console.log('✅ jumpToSection state updates queued');
    } else {
      console.warn(`❌ Cannot jump to section ${sectionIndex}: sections.length=${sections.length}`);
    }
  }, [sections]);

  const resetFlow = useCallback(() => {
    setCurrentScreen('loading');
    setCurrentSectionIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setGradeLevel(null);
    setStudentStream(null);
    setSelectedCategory(null);
    setTimeRemaining(null);
    setElapsedTime(0);
    setAptitudeQuestionTimer(60);
    setAptitudePhase('individual');
    setShowSectionIntro(true);
    setShowSectionComplete(false);
    setIsSubmitting(false);
    setIsSaving(false);
    setError(null);
    setSectionTimings({});
  }, []);

  return {
    // Current state
    currentScreen,
    currentSectionIndex,
    currentQuestionIndex,
    currentSection,
    currentQuestion,

    // Answers
    answers,

    // Grade/Stream
    gradeLevel,
    studentStream,
    selectedCategory,

    // Timers
    timeRemaining,
    elapsedTime,
    aptitudeQuestionTimer,
    aptitudePhase,

    // UI State
    showSectionIntro,
    showSectionComplete,
    isSubmitting,
    isSaving,
    error,

    // Section timings
    sectionTimings,

    // Actions
    setCurrentScreen,
    setCurrentSectionIndex, // Added for resume functionality
    setCurrentQuestionIndex, // Added for resume functionality
    setShowSectionIntro, // Added for resume functionality
    setGradeLevel,
    setStudentStream,
    setSelectedCategory,
    setAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    startSection,
    completeSection,
    goToNextSection,
    jumpToSection,
    setTimeRemaining,
    setElapsedTime,
    setAptitudeQuestionTimer,
    setError,
    setIsSubmitting,
    setIsSaving,
    setSectionTimings, // Added for resume functionality
    resetFlow,

    // Computed
    isLastSection,
    isLastQuestion,
    isCurrentQuestionAnswered,
    questionId
  };
};

export default useAssessmentFlow;
