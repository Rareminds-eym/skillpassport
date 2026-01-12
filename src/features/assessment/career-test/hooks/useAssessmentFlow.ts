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
  setElapsedTime: (time: number) => void;
  setAptitudeQuestionTimer: (time: number) => void;
  setError: (error: string | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setIsSaving: (saving: boolean) => void;
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
  const isLastQuestion = currentSection 
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
      // End of section
      setShowSectionComplete(true);
    }
  }, [currentSection, currentQuestionIndex]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const startSection = useCallback(() => {
    setShowSectionIntro(false);
    setShowSectionComplete(false);
  }, []);

  const completeSection = useCallback(() => {
    if (currentSection) {
      const timeSpent = currentSection.isTimed
        ? (currentSection.timeLimit || 0) - (timeRemaining || 0)
        : elapsedTime;
      
      setSectionTimings(prev => ({
        ...prev,
        [currentSection.id]: timeSpent
      }));
      
      onSectionComplete?.(currentSection.id, timeSpent);
    }
    setShowSectionComplete(true);
  }, [currentSection, timeRemaining, elapsedTime, onSectionComplete]);

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
    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      setCurrentSectionIndex(sectionIndex);
      setCurrentQuestionIndex(0);
      setTimeRemaining(null);
      setElapsedTime(0);
      setShowSectionIntro(true);
      setShowSectionComplete(false);
    }
  }, [sections.length]);

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
    resetFlow,
    
    // Computed
    isLastSection,
    isLastQuestion,
    isCurrentQuestionAnswered,
    questionId
  };
};

export default useAssessmentFlow;
