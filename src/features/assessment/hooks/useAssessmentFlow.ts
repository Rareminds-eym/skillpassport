/**
 * Assessment Flow State Machine
 * Replaces 30+ useState hooks with a single reducer for predictable state management
 */

import { useReducer, useCallback } from 'react';
import type {
  AssessmentFlowState,
  AssessmentFlowStatus,
  GradeLevel,
  StreamCategory,
  Answers,
  SectionTimings,
  AssessmentAttempt,
  AnswerValue,
} from '../types/assessment.types';

// ============================================
// Initial State
// ============================================

const initialState: AssessmentFlowState = {
  status: 'idle',
  gradeLevel: null,
  selectedCategory: null,
  studentStream: null,
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  answers: {},
  sectionTimings: {},
  timeRemaining: null,
  elapsedTime: 0,
  error: null,
  pendingAttempt: null,
};

// ============================================
// Action Types
// ============================================

type AssessmentAction =
  | { type: 'SET_STATUS'; payload: AssessmentFlowStatus }
  | { type: 'SET_GRADE_LEVEL'; payload: GradeLevel }
  | { type: 'SET_CATEGORY'; payload: StreamCategory }
  | { type: 'SET_STREAM'; payload: string }
  | { type: 'SET_SECTION_INDEX'; payload: number }
  | { type: 'SET_QUESTION_INDEX'; payload: number }
  | { type: 'SET_ANSWER'; payload: { questionId: string; answer: AnswerValue } }
  | { type: 'SET_ANSWERS'; payload: Answers }
  | { type: 'MERGE_ANSWERS'; payload: Answers }
  | { type: 'SET_TIME_REMAINING'; payload: number | null }
  | { type: 'DECREMENT_TIME' }
  | { type: 'INCREMENT_ELAPSED_TIME' }
  | { type: 'SET_ELAPSED_TIME'; payload: number }
  | { type: 'SET_SECTION_TIMING'; payload: { sectionId: string; time: number } }
  | { type: 'SET_SECTION_TIMINGS'; payload: SectionTimings }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PENDING_ATTEMPT'; payload: AssessmentAttempt | null }
  | { type: 'SHOW_RESUME_PROMPT'; payload: AssessmentAttempt }
  | { type: 'RESUME_ASSESSMENT'; payload: { attempt: AssessmentAttempt; answers: Answers } }
  | { type: 'START_NEW_ASSESSMENT' }
  | { type: 'START_SECTION' }
  | { type: 'COMPLETE_SECTION' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'NEXT_SECTION' }
  | { type: 'SUBMIT_ASSESSMENT' }
  | { type: 'COMPLETE_ASSESSMENT' }
  | { type: 'SHOW_RESTRICTION'; payload: string }
  | { type: 'RESET' };

// ============================================
// Reducer
// ============================================

function assessmentReducer(
  state: AssessmentFlowState,
  action: AssessmentAction
): AssessmentFlowState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload };

    case 'SET_GRADE_LEVEL':
      return {
        ...state,
        gradeLevel: action.payload,
        status: 'categorySelection',
      };

    case 'SET_CATEGORY':
      return {
        ...state,
        selectedCategory: action.payload,
        status: 'streamSelection',
      };

    case 'SET_STREAM':
      return {
        ...state,
        studentStream: action.payload,
        status: 'sectionIntro',
        currentSectionIndex: 0,
        currentQuestionIndex: 0,
      };

    case 'SET_SECTION_INDEX':
      return { ...state, currentSectionIndex: action.payload };

    case 'SET_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.payload };

    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answer,
        },
      };

    case 'SET_ANSWERS':
      return { ...state, answers: action.payload };

    case 'MERGE_ANSWERS':
      return {
        ...state,
        answers: { ...state.answers, ...action.payload },
      };

    case 'SET_TIME_REMAINING':
      return { ...state, timeRemaining: action.payload };

    case 'DECREMENT_TIME':
      if (state.timeRemaining === null || state.timeRemaining <= 0) {
        return state;
      }
      return { ...state, timeRemaining: state.timeRemaining - 1 };

    case 'INCREMENT_ELAPSED_TIME':
      return { ...state, elapsedTime: state.elapsedTime + 1 };

    case 'SET_ELAPSED_TIME':
      return { ...state, elapsedTime: action.payload };

    case 'SET_SECTION_TIMING':
      return {
        ...state,
        sectionTimings: {
          ...state.sectionTimings,
          [action.payload.sectionId]: action.payload.time,
        },
      };

    case 'SET_SECTION_TIMINGS':
      return { ...state, sectionTimings: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        status: action.payload ? 'error' : state.status,
      };

    case 'SET_PENDING_ATTEMPT':
      return { ...state, pendingAttempt: action.payload };

    case 'SHOW_RESUME_PROMPT':
      return {
        ...state,
        pendingAttempt: action.payload,
        status: 'resumePrompt',
      };

    case 'RESUME_ASSESSMENT':
      return {
        ...state,
        status: 'inProgress',
        pendingAttempt: null,
        gradeLevel: action.payload.attempt.grade_level,
        studentStream: action.payload.attempt.stream_id,
        currentSectionIndex: action.payload.attempt.current_section_index,
        currentQuestionIndex: action.payload.attempt.current_question_index,
        answers: action.payload.answers,
        sectionTimings: action.payload.attempt.section_timings || {},
      };

    case 'START_NEW_ASSESSMENT':
      return {
        ...state,
        status: 'gradeSelection',
        pendingAttempt: null,
        answers: {},
        sectionTimings: {},
        currentSectionIndex: 0,
        currentQuestionIndex: 0,
        elapsedTime: 0,
        timeRemaining: null,
      };

    case 'START_SECTION':
      return {
        ...state,
        status: 'inProgress',
        elapsedTime: 0,
      };

    case 'COMPLETE_SECTION':
      return {
        ...state,
        status: 'sectionComplete',
      };

    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };

    case 'PREVIOUS_QUESTION':
      if (state.currentQuestionIndex <= 0) return state;
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex - 1,
      };

    case 'NEXT_SECTION':
      return {
        ...state,
        currentSectionIndex: state.currentSectionIndex + 1,
        currentQuestionIndex: 0,
        status: 'sectionIntro',
        elapsedTime: 0,
        timeRemaining: null,
      };

    case 'SUBMIT_ASSESSMENT':
      return {
        ...state,
        status: 'submitting',
      };

    case 'COMPLETE_ASSESSMENT':
      return {
        ...state,
        status: 'completed',
      };

    case 'SHOW_RESTRICTION':
      return {
        ...state,
        status: 'restricted',
        error: action.payload,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ============================================
// Hook
// ============================================

export function useAssessmentFlow(initialOverrides?: Partial<AssessmentFlowState>) {
  const [state, dispatch] = useReducer(
    assessmentReducer,
    { ...initialState, ...initialOverrides }
  );

  // Action creators
  const actions = {
    setStatus: useCallback((status: AssessmentFlowStatus) => {
      dispatch({ type: 'SET_STATUS', payload: status });
    }, []),

    selectGradeLevel: useCallback((gradeLevel: GradeLevel) => {
      dispatch({ type: 'SET_GRADE_LEVEL', payload: gradeLevel });
    }, []),

    selectCategory: useCallback((category: StreamCategory) => {
      dispatch({ type: 'SET_CATEGORY', payload: category });
    }, []),

    selectStream: useCallback((stream: string) => {
      dispatch({ type: 'SET_STREAM', payload: stream });
    }, []),

    setAnswer: useCallback((questionId: string, answer: AnswerValue) => {
      dispatch({ type: 'SET_ANSWER', payload: { questionId, answer } });
    }, []),

    setAnswers: useCallback((answers: Answers) => {
      dispatch({ type: 'SET_ANSWERS', payload: answers });
    }, []),

    mergeAnswers: useCallback((answers: Answers) => {
      dispatch({ type: 'MERGE_ANSWERS', payload: answers });
    }, []),

    setTimeRemaining: useCallback((time: number | null) => {
      dispatch({ type: 'SET_TIME_REMAINING', payload: time });
    }, []),

    decrementTime: useCallback(() => {
      dispatch({ type: 'DECREMENT_TIME' });
    }, []),

    incrementElapsedTime: useCallback(() => {
      dispatch({ type: 'INCREMENT_ELAPSED_TIME' });
    }, []),

    setElapsedTime: useCallback((time: number) => {
      dispatch({ type: 'SET_ELAPSED_TIME', payload: time });
    }, []),

    setSectionTiming: useCallback((sectionId: string, time: number) => {
      dispatch({ type: 'SET_SECTION_TIMING', payload: { sectionId, time } });
    }, []),

    setSectionTimings: useCallback((timings: SectionTimings) => {
      dispatch({ type: 'SET_SECTION_TIMINGS', payload: timings });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    showResumePrompt: useCallback((attempt: AssessmentAttempt) => {
      dispatch({ type: 'SHOW_RESUME_PROMPT', payload: attempt });
    }, []),

    resumeAssessment: useCallback((attempt: AssessmentAttempt, answers: Answers) => {
      dispatch({ type: 'RESUME_ASSESSMENT', payload: { attempt, answers } });
    }, []),

    startNewAssessment: useCallback(() => {
      dispatch({ type: 'START_NEW_ASSESSMENT' });
    }, []),

    startSection: useCallback(() => {
      dispatch({ type: 'START_SECTION' });
    }, []),

    completeSection: useCallback(() => {
      dispatch({ type: 'COMPLETE_SECTION' });
    }, []),

    nextQuestion: useCallback(() => {
      dispatch({ type: 'NEXT_QUESTION' });
    }, []),

    previousQuestion: useCallback(() => {
      dispatch({ type: 'PREVIOUS_QUESTION' });
    }, []),

    nextSection: useCallback(() => {
      dispatch({ type: 'NEXT_SECTION' });
    }, []),

    goToSection: useCallback((index: number) => {
      dispatch({ type: 'SET_SECTION_INDEX', payload: index });
      dispatch({ type: 'SET_QUESTION_INDEX', payload: 0 });
      dispatch({ type: 'SET_STATUS', payload: 'sectionIntro' });
    }, []),

    goToQuestion: useCallback((sectionIndex: number, questionIndex: number) => {
      dispatch({ type: 'SET_SECTION_INDEX', payload: sectionIndex });
      dispatch({ type: 'SET_QUESTION_INDEX', payload: questionIndex });
    }, []),

    submitAssessment: useCallback(() => {
      dispatch({ type: 'SUBMIT_ASSESSMENT' });
    }, []),

    completeAssessment: useCallback(() => {
      dispatch({ type: 'COMPLETE_ASSESSMENT' });
    }, []),

    showRestriction: useCallback((message: string) => {
      dispatch({ type: 'SHOW_RESTRICTION', payload: message });
    }, []),

    reset: useCallback(() => {
      dispatch({ type: 'RESET' });
    }, []),
  };

  // Computed values
  const computed = {
    isLoading: state.status === 'idle' || state.status === 'checkingEligibility',
    isInProgress: state.status === 'inProgress',
    isSubmitting: state.status === 'submitting',
    isCompleted: state.status === 'completed',
    isRestricted: state.status === 'restricted',
    hasError: state.status === 'error',
    showGradeSelection: state.status === 'gradeSelection',
    showCategorySelection: state.status === 'categorySelection',
    showStreamSelection: state.status === 'streamSelection',
    showResumePrompt: state.status === 'resumePrompt',
    showSectionIntro: state.status === 'sectionIntro',
    showSectionComplete: state.status === 'sectionComplete',
  };

  return {
    state,
    actions,
    computed,
    dispatch,
  };
}

export type { AssessmentFlowState, AssessmentAction };
