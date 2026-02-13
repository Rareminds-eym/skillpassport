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
import { type GradeLevel } from '../config/sections';
import { getAdaptiveGradeLevel } from '../../../assessment/utils/gradeUtils';
import { 
  AssessmentSnapshotBuilder, 
  createSnapshotBuilder 
} from '../services/assessmentSnapshotBuilder';
import type { AssessmentSnapshot } from '../types/assessmentSnapshot';

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
  isKnowledge?: boolean;
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
  setSections: (sections: Section[]) => void;
  
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
  snapshotBuilder: AssessmentSnapshotBuilder | null;
  
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
  updateProgress: (sectionIndex: number, questionIndex: number, timings: Record<string, number>, timerRemaining?: number | null, elapsedTime?: number | null, allResponses?: Record<string, any>, overrideAttemptId?: string) => Promise<any>;
  checkInProgressAttempt: () => Promise<any>;
  buildAndSaveSnapshot: (adaptiveResults?: any) => Promise<AssessmentSnapshot | null>;
  createSnapshotBuilderForResume: (attemptId: string, gradeLevel?: string) => any;
  
  // AI Questions
  aiQuestions: any;
  questionsLoading: boolean;
  questionsError: string | null;
  loadQuestions: () => void;
  
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
  const { user, session: authSession } = useAuth();
  
  // Student grade info
  const {
    studentId,
    studentGrade,
    isCollegeStudent,
    studentProgram,
    monthsInGrade,
    loading: loadingStudentGrade
  } = useStudentGrade({ userId: user?.id, userEmail: user?.email });
  
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
  
  // Snapshot builder for comprehensive data capture
  const [snapshotBuilder, setSnapshotBuilder] = React.useState<AssessmentSnapshotBuilder | null>(null);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = React.useState<Date | null>(null);
  
  // Track answered questions with timestamps for snapshot
  const answeredQuestionsRef = React.useRef<Map<string, { 
    answer: any; 
    answeredAt: string; 
    timeSpentSeconds: number;
    question: any;
  }>>(new Map());
  
  // Flow state machine
  const flow = useAssessmentFlow({
    sections,
    onSectionComplete: (sectionId, timeSpent) => {
      // Complete section in snapshot builder
      if (snapshotBuilder) {
        snapshotBuilder.completeSection(sectionId, timeSpent);
      }
    },
    onAnswerChange: (questionId, answer) => {
      // Track question with full context for snapshot
      if (flow.currentSection && flow.currentQuestion) {
        const now = new Date();
        const timeSpent = currentQuestionStartTime 
          ? Math.round((now.getTime() - currentQuestionStartTime.getTime()) / 1000)
          : 0;
        
        // Extract section and question IDs
        let sectionId = flow.currentSection.id;
        let qId = questionId.includes('_') 
          ? questionId.substring(questionId.indexOf('_') + 1)
          : questionId;
        
        // Store in ref for snapshot building
        answeredQuestionsRef.current.set(questionId, {
          answer,
          answeredAt: now.toISOString(),
          timeSpentSeconds: timeSpent,
          question: flow.currentQuestion
        });
        
        // Add to snapshot builder if available
        if (snapshotBuilder) {
          snapshotBuilder.addQuestion(sectionId, {
            questionId: qId,
            question: flow.currentQuestion,
            sectionId,
            sequence: flow.currentQuestionIndex + 1,
            answer,
            answeredAt: now.toISOString(),
            timeSpentSeconds: timeSpent
          });
        }
      }
      
      // Auto-save to database if enabled
      if (useDatabase && currentAttempt?.id) {
        // Handle different question ID formats
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
            }
          }
        } else {
          // Fallback: use current section if available
          const currentSection = flow.currentSection;
          sectionId = currentSection?.id || 'unknown';
          qId = questionId;
        }
        
        dbSaveResponse(sectionId, qId, answer, isCorrect);
      }
    }
  });
  
  // AI Questions for aptitude/knowledge sections
  const {
    aiQuestions,
    loading: questionsLoading,
    error: questionsError,
    reload: loadQuestions
  } = useAIQuestions({
    gradeLevel: flow.gradeLevel,
    studentStream: flow.studentStream,
    studentId,
    attemptId: currentAttempt?.id || null,
    studentProgram
  });
  
  // Adaptive Aptitude Hook
  const adaptiveAptitude = useAdaptiveAptitude({
    studentId: studentId || '',
    gradeLevel: getAdaptiveGradeLevel(flow.gradeLevel || 'after12'),
    onTestComplete: (testResults) => {
      flow.setAnswer('adaptive_aptitude_results', testResults);
      flow.completeSection();
    },
    onError: (err) => {
      flow.setError(`Adaptive test error: ${err}`);
    },
  });
  
  // Get current question (handle adaptive sections)
  const currentQuestion = useMemo(() => {
    if (flow.currentSection?.isAdaptive) {
      return adaptiveAptitude.currentQuestion;
    }
    return flow.currentQuestion;
  }, [flow.currentSection, flow.currentQuestion, adaptiveAptitude.currentQuestion]);
  
  // Track question start time and section starts
  useEffect(() => {
    // Reset start time when question changes
    setCurrentQuestionStartTime(new Date());
    
    // Start section tracking if we have sections and builder
    // CRITICAL: Check for both 'assessment' (resumed) and 'section_intro' (new) screens
    const isAssessmentScreen = flow.currentScreen === 'assessment' || flow.currentScreen === 'section_intro';
    
    if (isAssessmentScreen && snapshotBuilder && sections.length > 0) {
      // Start ALL sections in the builder (they get marked as completed later)
      sections.forEach(section => {
        if (!answeredQuestionsRef.current.has(`_section_started_${section.id}`)) {
          snapshotBuilder.startSection(section.id, { 
            questions: section.questions, 
            title: section.title, 
            description: section.description 
          });
          answeredQuestionsRef.current.set(`_section_started_${section.id}`, {
            answer: null,
            answeredAt: new Date().toISOString(),
            timeSpentSeconds: 0,
            question: null
          });
        }
      });
    }
  }, [flow.currentQuestion, flow.currentScreen, snapshotBuilder, sections]);

  /**
   * Create snapshot builder for resume (when currentAttempt is not yet set)
   * This allows AssessmentTestPage to create the builder with pendingAttempt.id
   */
  const createSnapshotBuilderForResume = useCallback((attemptId: string, gradeLevel: string = 'college') => {
    if (!isCollegeStudent || !studentId || snapshotBuilder) {
      return null;
    }
    
    const builder = createSnapshotBuilder(
      attemptId,
      studentId,
      gradeLevel,
      {
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    );
    setSnapshotBuilder(builder);
    return builder;
  }, [isCollegeStudent, studentId, snapshotBuilder]);

  // CRITICAL: Create snapshot builder during resume for college students
  // This useEffect handles the case when currentAttempt is already set
  useEffect(() => {
    // Only create if: college student, has attempt, no builder yet, has studentId
    if (isCollegeStudent && currentAttempt?.id && !snapshotBuilder && studentId) {
      const builder = createSnapshotBuilder(
        currentAttempt.id,
        studentId,
        currentAttempt.grade_level || 'college',
        {
          userAgent: navigator.userAgent,
          screen: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      );
      setSnapshotBuilder(builder);
    }
  }, [isCollegeStudent, currentAttempt?.id, currentAttempt?.grade_level, studentId, snapshotBuilder]);
  
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
    const attempt = await dbStartAssessment(streamId, gradeLevel);
    
    // Initialize snapshot builder if we have valid attempt and student
    if (attempt?.id && studentId && isCollegeStudent) {
      const builder = createSnapshotBuilder(
        attempt.id,
        studentId,
        gradeLevel,
        {
          userAgent: navigator.userAgent,
          screen: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      );
      setSnapshotBuilder(builder);
      
      // If sections already exist, start tracking them immediately
      if (sections.length > 0) {
        sections.forEach(section => {
          if (!answeredQuestionsRef.current.has(`_section_started_${section.id}`)) {
            builder.startSection(section.id, { 
              questions: section.questions, 
              title: section.title, 
              description: section.description 
            });
            answeredQuestionsRef.current.set(`_section_started_${section.id}`, {
              answer: null,
              answeredAt: new Date().toISOString(),
              timeSpentSeconds: 0,
              question: null
            });
          }
        });
      }
    }
    
    return attempt;
  }, [dbStartAssessment, studentId, isCollegeStudent, sections]);
  
  const saveResponse = useCallback(async (
    sectionName: string, 
    questionId: string, 
    value: any, 
    isCorrect: boolean | null = null
  ) => {
    return dbSaveResponse(sectionName, questionId, value, isCorrect);
  }, [dbSaveResponse]);
  
  /**
   * Build and save comprehensive assessment snapshot with all questions, options, and answers
   * Call this when assessment is complete (before completeAttempt)
   */
  const buildAndSaveSnapshot = useCallback(async (
    adaptiveResults?: {
      questionsAnswered: number;
      correctAnswers: number;
      estimatedAbility: number;
      phasesCompleted: string[];
      finalPhase: string;
      reliability: number;
    }
  ): Promise<AssessmentSnapshot | null> => {
    if (!snapshotBuilder || !currentAttempt?.id) {
      return null;
    }
    
    try {
      // Get adaptive session ID if available
      const adaptiveSessionId = currentAttempt?.adaptive_aptitude_session_id || undefined;
      
      // Build the snapshot
      const snapshot = await snapshotBuilder.buildSnapshot(
        adaptiveSessionId,
        adaptiveResults
      );
      
      // Save to database with auth token
      await snapshotBuilder.saveToDatabase(snapshot, authSession?.access_token);
      
      return snapshot;
    } catch (error) {
      return null;
    }
  }, [snapshotBuilder, currentAttempt]);
  
  const updateProgress = useCallback(async (
    sectionIndex: number, 
    questionIndex: number, 
    timings: Record<string, number>,
    timerRemaining?: number | null,
    elapsedTime?: number | null,
    allResponses?: Record<string, any>,
    overrideAttemptId?: string // Optional: for resume when currentAttempt not yet set
  ) => {
    // CRITICAL: For college students, save incremental snapshot at every progress update
    // This replaces the all_responses column usage for comprehensive data capture
    // Use overrideAttemptId during resume, otherwise use currentAttempt.id
    const attemptId = overrideAttemptId || currentAttempt?.id;
    
    if (isCollegeStudent && snapshotBuilder && attemptId) {
      try {
        await snapshotBuilder.buildAndSaveIncrementalSnapshot(
          sectionIndex,
          questionIndex,
          false, // isComplete = false (in progress)
          currentAttempt?.adaptive_aptitude_session_id || undefined,
          undefined, // No final adaptive results yet
          authSession?.access_token // Pass auth token from React context
        );
      } catch (snapshotError) {
        // Continue with regular progress update even if snapshot fails
      }
    }

    // For college students, don't save to all_responses since snapshot has all the data
    // For non-college students, continue with regular all_responses save
    const responsesToSave = isCollegeStudent ? null : allResponses;
    
    return dbUpdateProgress(sectionIndex, questionIndex, timings, timerRemaining, elapsedTime, responsesToSave, null, overrideAttemptId);
  }, [dbUpdateProgress, isCollegeStudent, snapshotBuilder, currentAttempt]);
  
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
    snapshotBuilder,
    
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
    // Section Management
    setSections,
    resetFlow: flow.resetFlow,
    
    // Database Actions
    startAssessment,
    saveResponse,
    updateProgress,
    checkInProgressAttempt,
    buildAndSaveSnapshot,
    createSnapshotBuilderForResume,
    
    // AI Questions
    aiQuestions,
    questionsLoading,
    questionsError,
    loadQuestions,
  };
  
  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};

export default AssessmentContext;
