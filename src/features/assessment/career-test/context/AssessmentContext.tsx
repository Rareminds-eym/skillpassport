/**
 * Assessment Context
 * 
 * Provides shared state across all assessment components.
 * Centralizes flow state, answers, timers, and actions.
 * 
 * @module features/assessment/career-test/context/AssessmentContext
 */

import React, { createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useAssessment } from '../../../../hooks/useAssessment';
import { useAdaptiveAptitude } from '../../../../hooks/useAdaptiveAptitude';
import { useAssessmentFlow, type FlowScreen } from '../hooks/useAssessmentFlow';
import { useStudentGrade } from '../hooks/useStudentGrade';
import { useAIQuestions } from '../hooks/useAIQuestions';
import { getSectionsForGrade, type GradeLevel } from '../config/sections';
import { getAdaptiveGradeLevel } from '../../../assessment/utils/gradeUtils';

// Types
interface Section {
  id: string;
  title: string;
  description: string;
  color: string;
  instruction: string;
  questions: any[];
  responseScale?: any[];
  isTimed?: boolean;
  timeLimit?: number;
  isAptitude?: boolean;
  isAdaptive?: boolean;
  individualTimeLimit?: number;
}

interface AssessmentContextValue {
  // User & Student Info
  user: any;
  studentId: string | null;
  studentGrade: string | null;
  isCollegeStudent: boolean;
  studentProgram: string | null;
  monthsInGrade: number | null;
  loadingStudentGrade: boolean;
  
  // Flow State
  currentScreen: FlowScreen;
  gradeLevel: GradeLevel | null;
  studentStream: string | null;
  selectedCategory: string | null;
  
  // Sections & Questions
  sections: Section[];
  currentSectionIndex: number;
  currentQuestionIndex: number;
  currentSection: Section | null;
  currentQuestion: any | null;
  questionId: string;
  
  // Answers
  answers: Record<string, any>;
  isCurrentQuestionAnswered: boolean;
  
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
  
  // Database
  currentAttempt: any;
  useDatabase: boolean;
  
  // Adaptive Aptitude
  adaptiveAptitude: ReturnType<typeof useAdaptiveAptitude>;
  adaptiveAptitudeAnswer: string | null;
  setAdaptiveAptitudeAnswer: (answer: string | null) => void;
  
  // Section Timings
  sectionTimings: Record<string, number>;
  
  // Computed
  isLastSection: boolean;
  isLastQuestion: boolean;
  
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
  setTimeRemaining: (time: number | null) => void;
  setElapsedTime: (time: number) => void;
  setAptitudeQuestionTimer: (time: number) => void;
  setError: (error: string | null) => void;
  resetFlow: () => void;
  
  // Database Actions
  startAssessment: (streamId: string | null, gradeLevel: string) => Promise<any>;
  saveResponse: (sectionName: string, questionId: string, value: any, isCorrect?: boolean | null) => Promise<any>;
  updateProgress: (sectionIndex: number, questionIndex: number, timings: Record<string, number>) => Promise<any>;
  checkInProgressAttempt: () => Promise<any>;
  
  // Navigation
  navigate: ReturnType<typeof useNavigate>;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export const useAssessmentContext = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessmentContext must be used within AssessmentProvider');
  }
  return context;
};

interface AssessmentProviderProps {
  children: React.ReactNode;
}

export const AssessmentProvider: React.FC<AssessmentProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Student grade info
  const {
    studentId,
    studentGrade,
    isCollegeStudent,
    studentProgram,
    monthsInGrade,
    loading: loadingStudentGrade
  } = useStudentGrade();
  
  // Database integration
  const {
    loading: dbLoading,
    currentAttempt,
    startAssessment: dbStartAssessment,
    saveResponse: dbSaveResponse,
    updateProgress: dbUpdateProgress,
    checkInProgressAttempt,
    studentRecordId
  } = useAssessment();
  
  // Build sections based on grade level (will be populated after grade selection)
  const [sections, setSections] = React.useState<Section[]>([]);
  const [useDatabase, setUseDatabase] = React.useState(false);
  const [adaptiveAptitudeAnswer, setAdaptiveAptitudeAnswer] = React.useState<string | null>(null);
  
  // Flow state machine
  const flow = useAssessmentFlow({
    sections,
    onSectionComplete: (sectionId, timeSpent) => {
      console.log(`Section ${sectionId} completed in ${timeSpent}s`);
    },
    onAnswerChange: (questionId, answer) => {
      // Auto-save to database if enabled
      if (useDatabase && currentAttempt?.id) {
        // CRITICAL FIX: Handle different question ID formats
        // Format 1: sectionId_questionId (e.g., 'riasec_r1', 'bigfive_o1')
        // Format 2: sectionId_UUID (e.g., 'aptitude_f48f122d-...') - AI questions
        
        let sectionId: string;
        let qId: string;
        let isCorrect: boolean | null = null;
        
        if (questionId.includes('_')) {
          // Split by first underscore only
          const underscoreIndex = questionId.indexOf('_');
          sectionId = questionId.substring(0, underscoreIndex);
          qId = questionId.substring(underscoreIndex + 1);
          
          // Check if qId is a UUID (AI question)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qId);
          
          if (isUUID) {
            // For AI questions, check correctness if it's an MCQ (aptitude/knowledge)
            const currentQuestion = flow.currentQuestion;
            if (currentQuestion?.correct !== undefined) {
              // Compare answer with correct answer (handle both array and string correct values)
              const correctAnswer = currentQuestion.correct;
              if (Array.isArray(correctAnswer)) {
                isCorrect = correctAnswer.includes(answer);
              } else {
                isCorrect = answer === correctAnswer;
              }
              console.log(`✓ MCQ correctness check: ${isCorrect ? 'CORRECT' : 'INCORRECT'} (answer: ${answer}, correct: ${correctAnswer})`);
            }
            console.log(`💾 Saved AI question response: ${sectionId} / ${qId}, isCorrect: ${isCorrect}`);
          } else {
            // Static question (RIASEC, BigFive, etc.)
            console.log(`💾 Saved static question response: ${sectionId} / ${qId}`);
          }
        } else {
          // Fallback: use current section if available
          const currentSection = flow.currentSection;
          sectionId = currentSection?.id || 'unknown';
          qId = questionId;
          console.warn(`⚠️ Unknown question ID format: ${questionId}, using current section: ${sectionId}`);
        }
        
        dbSaveResponse(sectionId, qId, answer, isCorrect);
      }
    }
  });
  
  // AI Questions for aptitude/knowledge sections
  const {
    questions: aiQuestions,
    loading: questionsLoading,
    error: questionsError,
    loadQuestions
  } = useAIQuestions();
  
  // Adaptive Aptitude Hook
  const adaptiveAptitude = useAdaptiveAptitude({
    studentId: studentId || '',
    gradeLevel: getAdaptiveGradeLevel(flow.gradeLevel || 'after12'),
    onTestComplete: (testResults) => {
      console.log('✅ Adaptive aptitude test completed:', testResults);
      flow.setAnswer('adaptive_aptitude_results', testResults);
      flow.completeSection();
    },
    onError: (err) => {
      console.error('❌ Adaptive aptitude test error:', err);
      flow.setError(`Adaptive test error: ${err}`);
    },
  });
  
  // Update sections when grade level changes
  useEffect(() => {
    if (flow.gradeLevel) {
      const sectionConfigs = getSectionsForGrade(flow.gradeLevel);
      // Convert configs to full sections (questions will be loaded separately)
      const fullSections: Section[] = sectionConfigs.map(config => ({
        ...config,
        icon: null, // Icons handled by components
        questions: [] // Will be populated by AI questions or static data
      }));
      setSections(fullSections);
    }
  }, [flow.gradeLevel]);
  
  // Get current question (handle adaptive sections)
  const currentQuestion = useMemo(() => {
    if (flow.currentSection?.isAdaptive) {
      return adaptiveAptitude.currentQuestion;
    }
    return flow.currentQuestion;
  }, [flow.currentSection, flow.currentQuestion, adaptiveAptitude.currentQuestion]);
  
  // Get question ID (handle adaptive sections)
  const questionId = useMemo(() => {
    if (flow.currentSection?.isAdaptive && adaptiveAptitude.currentQuestion) {
      return `adaptive_aptitude_${adaptiveAptitude.currentQuestion.id}`;
    }
    return flow.questionId;
  }, [flow.currentSection, flow.questionId, adaptiveAptitude.currentQuestion]);
  
  // Check if current question is answered (handle adaptive)
  const isCurrentQuestionAnswered = useMemo(() => {
    if (flow.currentSection?.isAdaptive) {
      return adaptiveAptitudeAnswer !== null;
    }
    return flow.isCurrentQuestionAnswered;
  }, [flow.currentSection, flow.isCurrentQuestionAnswered, adaptiveAptitudeAnswer]);
  
  // Wrap database actions
  const startAssessment = useCallback(async (streamId: string | null, gradeLevel: string) => {
    setUseDatabase(true);
    return dbStartAssessment(streamId, gradeLevel);
  }, [dbStartAssessment]);
  
  const saveResponse = useCallback(async (
    sectionName: string, 
    questionId: string, 
    value: any, 
    isCorrect: boolean | null = null
  ) => {
    return dbSaveResponse(sectionName, questionId, value, isCorrect);
  }, [dbSaveResponse]);
  
  const updateProgress = useCallback(async (
    sectionIndex: number, 
    questionIndex: number, 
    timings: Record<string, number>
  ) => {
    return dbUpdateProgress(sectionIndex, questionIndex, timings);
  }, [dbUpdateProgress]);
  
  const value: AssessmentContextValue = {
    // User & Student Info
    user,
    studentId,
    studentGrade,
    isCollegeStudent,
    studentProgram,
    monthsInGrade,
    loadingStudentGrade,
    
    // Flow State
    currentScreen: flow.currentScreen,
    gradeLevel: flow.gradeLevel,
    studentStream: flow.studentStream,
    selectedCategory: flow.selectedCategory,
    
    // Sections & Questions
    sections,
    currentSectionIndex: flow.currentSectionIndex,
    currentQuestionIndex: flow.currentQuestionIndex,
    currentSection: flow.currentSection,
    currentQuestion,
    questionId,
    
    // Answers
    answers: flow.answers,
    isCurrentQuestionAnswered,
    
    // Timers
    timeRemaining: flow.timeRemaining,
    elapsedTime: flow.elapsedTime,
    aptitudeQuestionTimer: flow.aptitudeQuestionTimer,
    aptitudePhase: flow.aptitudePhase,
    
    // UI State
    showSectionIntro: flow.showSectionIntro,
    showSectionComplete: flow.showSectionComplete,
    isSubmitting: flow.isSubmitting,
    isSaving: flow.isSaving,
    error: flow.error,
    
    // Database
    currentAttempt,
    useDatabase,
    
    // Adaptive Aptitude
    adaptiveAptitude,
    adaptiveAptitudeAnswer,
    setAdaptiveAptitudeAnswer,
    
    // Section Timings
    sectionTimings: flow.sectionTimings,
    
    // Computed
    isLastSection: flow.isLastSection,
    isLastQuestion: flow.isLastQuestion,
    
    // Actions
    setCurrentScreen: flow.setCurrentScreen,
    setGradeLevel: flow.setGradeLevel,
    setStudentStream: flow.setStudentStream,
    setSelectedCategory: flow.setSelectedCategory,
    setAnswer: flow.setAnswer,
    goToNextQuestion: flow.goToNextQuestion,
    goToPreviousQuestion: flow.goToPreviousQuestion,
    startSection: flow.startSection,
    completeSection: flow.completeSection,
    goToNextSection: flow.goToNextSection,
    setTimeRemaining: flow.setTimeRemaining,
    setElapsedTime: flow.setElapsedTime,
    setAptitudeQuestionTimer: flow.setAptitudeQuestionTimer,
    setError: flow.setError,
    resetFlow: flow.resetFlow,
    
    // Database Actions
    startAssessment,
    saveResponse,
    updateProgress,
    checkInProgressAttempt,
    
    // Navigation
    navigate
  };
  
  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};

export default AssessmentContext;
