import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

// Types
export type AssessmentFlowStatus =
  | 'idle'
  | 'checkingEligibility'
  | 'gradeSelection'
  | 'categorySelection'
  | 'streamSelection'
  | 'sectionIntro'
  | 'inProgress'
  | 'sectionComplete'
  | 'submitting'
  | 'completed'
  | 'restricted'
  | 'error'
  | 'resumePrompt';

export type GradeLevel = '9' | '10' | '11' | '12' | 'college';
export type StreamCategory = 'after_10th' | 'after_12th' | 'college';
export type AnswerValue = string | number | string[] | boolean | null;

export interface Answers {
  [questionId: string]: AnswerValue;
}

export interface SectionTimings {
  [sectionId: string]: number;
}

export interface AssessmentAttempt {
  id: string;
  grade_level: GradeLevel;
  stream_id: string | null;
  current_section_index: number;
  current_question_index: number;
  section_timings: SectionTimings;
  [key: string]: any;
}

export interface AssessmentFlowState {
  status: AssessmentFlowStatus;
  gradeLevel: GradeLevel | null;
  selectedCategory: StreamCategory | null;
  studentStream: string | null;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  answers: Answers;
  sectionTimings: SectionTimings;
  timeRemaining: number | null;
  elapsedTime: number;
  error: string | null;
  pendingAttempt: AssessmentAttempt | null;
}

interface AssessmentStore extends AssessmentFlowState {
  // Computed flags
  isLoading: boolean;
  isInProgress: boolean;
  isSubmitting: boolean;
  isCompleted: boolean;
  isRestricted: boolean;
  hasError: boolean;
  showGradeSelection: boolean;
  showCategorySelection: boolean;
  showStreamSelection: boolean;
  showResumePrompt: boolean;
  showSectionIntro: boolean;
  showSectionComplete: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  
  // Actions - State setters
  setStatus: (status: AssessmentFlowStatus) => void;
  setGradeLevel: (gradeLevel: GradeLevel) => void;
  setCategory: (category: StreamCategory) => void;
  setStream: (stream: string) => void;
  setSectionIndex: (index: number) => void;
  setQuestionIndex: (index: number) => void;
  setAnswer: (questionId: string, answer: AnswerValue) => void;
  setAnswers: (answers: Answers) => void;
  mergeAnswers: (answers: Answers) => void;
  setTimeRemaining: (time: number | null) => void;
  decrementTime: () => void;
  incrementElapsedTime: () => void;
  setElapsedTime: (time: number) => void;
  setSectionTiming: (sectionId: string, time: number) => void;
  setSectionTimings: (timings: SectionTimings) => void;
  setError: (error: string | null) => void;
  setPendingAttempt: (attempt: AssessmentAttempt | null) => void;
  
  // Actions - Navigation
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (sectionIndex: number, questionIndex: number) => void;
  nextSection: () => void;
  goToSection: (index: number) => void;
  
  // Actions - Flow control
  startNewAssessment: () => void;
  startSection: () => void;
  completeSection: () => void;
  submitAssessment: () => void;
  completeAssessment: () => void;
  showResumeDialog: (attempt: AssessmentAttempt, answers: Answers) => void;
  resumeAssessment: () => void;
  showRestriction: (message: string) => void;
  reset: () => void;
  
  // Computed values
  getProgressPercentage: () => number;
  getTotalQuestions: () => number;
  getAnsweredQuestions: () => number;
}

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

export const useAssessmentStore = create<AssessmentStore>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,

        // Computed flags (using getters that access state)
        get isLoading() {
          return get().status === 'idle' || get().status === 'checkingEligibility';
        },
        get isInProgress() {
          return get().status === 'inProgress';
        },
        get isSubmitting() {
          return get().status === 'submitting';
        },
        get isCompleted() {
          return get().status === 'completed';
        },
        get isRestricted() {
          return get().status === 'restricted';
        },
        get hasError() {
          return get().status === 'error';
        },
        get showGradeSelection() {
          return get().status === 'gradeSelection';
        },
        get showCategorySelection() {
          return get().status === 'categorySelection';
        },
        get showStreamSelection() {
          return get().status === 'streamSelection';
        },
        get showResumePrompt() {
          return get().status === 'resumePrompt';
        },
        get showSectionIntro() {
          return get().status === 'sectionIntro';
        },
        get showSectionComplete() {
          return get().status === 'sectionComplete';
        },
        get canGoPrevious() {
          return get().currentQuestionIndex > 0;
        },
        get canGoNext() {
          // Logic depends on your specific requirements
          return true;
        },

        // State setters
        setStatus: (status) => {
          set((state) => {
            state.status = status;
          });
        },

        setGradeLevel: (gradeLevel) => {
          set((state) => {
            state.gradeLevel = gradeLevel;
            state.status = 'categorySelection';
          });
        },

        setCategory: (category) => {
          set((state) => {
            state.selectedCategory = category;
            state.status = 'streamSelection';
          });
        },

        setStream: (stream) => {
          set((state) => {
            state.studentStream = stream;
            state.status = 'sectionIntro';
            state.currentSectionIndex = 0;
            state.currentQuestionIndex = 0;
          });
        },

        setSectionIndex: (index) => {
          set((state) => {
            state.currentSectionIndex = index;
          });
        },

        setQuestionIndex: (index) => {
          set((state) => {
            state.currentQuestionIndex = index;
          });
        },

        setAnswer: (questionId, answer) => {
          set((state) => {
            state.answers[questionId] = answer;
          });
        },

        setAnswers: (answers) => {
          set((state) => {
            state.answers = answers;
          });
        },

        mergeAnswers: (answers) => {
          set((state) => {
            state.answers = { ...state.answers, ...answers };
          });
        },

        setTimeRemaining: (time) => {
          set((state) => {
            state.timeRemaining = time;
          });
        },

        decrementTime: () => {
          set((state) => {
            if (state.timeRemaining !== null && state.timeRemaining > 0) {
              state.timeRemaining -= 1;
            }
          });
        },

        incrementElapsedTime: () => {
          set((state) => {
            state.elapsedTime += 1;
          });
        },

        setElapsedTime: (time) => {
          set((state) => {
            state.elapsedTime = time;
          });
        },

        setSectionTiming: (sectionId, time) => {
          set((state) => {
            state.sectionTimings[sectionId] = time;
          });
        },

        setSectionTimings: (timings) => {
          set((state) => {
            state.sectionTimings = timings;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
            state.status = error ? 'error' : state.status;
          });
        },

        setPendingAttempt: (attempt) => {
          set((state) => {
            state.pendingAttempt = attempt;
          });
        },

        // Navigation
        nextQuestion: () => {
          set((state) => {
            state.currentQuestionIndex += 1;
          });
        },

        previousQuestion: () => {
          set((state) => {
            if (state.currentQuestionIndex > 0) {
              state.currentQuestionIndex -= 1;
            }
          });
        },

        goToQuestion: (sectionIndex, questionIndex) => {
          set((state) => {
            state.currentSectionIndex = sectionIndex;
            state.currentQuestionIndex = questionIndex;
          });
        },

        nextSection: () => {
          set((state) => {
            state.currentSectionIndex += 1;
            state.currentQuestionIndex = 0;
            state.status = 'sectionIntro';
            state.elapsedTime = 0;
            state.timeRemaining = null;
          });
        },

        goToSection: (index) => {
          set((state) => {
            state.currentSectionIndex = index;
            state.currentQuestionIndex = 0;
            state.status = 'sectionIntro';
          });
        },

        // Flow control
        startNewAssessment: () => {
          set((state) => {
            state.status = 'gradeSelection';
            state.pendingAttempt = null;
            state.answers = {};
            state.sectionTimings = {};
            state.currentSectionIndex = 0;
            state.currentQuestionIndex = 0;
            state.elapsedTime = 0;
            state.timeRemaining = null;
          });
        },

        startSection: () => {
          set((state) => {
            state.status = 'inProgress';
            state.elapsedTime = 0;
          });
        },

        completeSection: () => {
          set((state) => {
            state.status = 'sectionComplete';
          });
        },

        submitAssessment: () => {
          set((state) => {
            state.status = 'submitting';
          });
        },

        completeAssessment: () => {
          set((state) => {
            state.status = 'completed';
          });
        },

        showResumeDialog: (attempt, answers) => {
          set((state) => {
            state.pendingAttempt = attempt;
            state.status = 'resumePrompt';
            state.gradeLevel = attempt.grade_level;
            state.studentStream = attempt.stream_id;
            state.currentSectionIndex = attempt.current_section_index;
            state.currentQuestionIndex = attempt.current_question_index;
            state.answers = answers;
            state.sectionTimings = attempt.section_timings || {};
          });
        },

        resumeAssessment: () => {
          set((state) => {
            state.status = 'inProgress';
            state.pendingAttempt = null;
          });
        },

        showRestriction: (message) => {
          set((state) => {
            state.status = 'restricted';
            state.error = message;
          });
        },

        reset: () => {
          set((state) => {
            Object.assign(state, initialState);
          });
        },

        // Computed methods
        getProgressPercentage: () => {
          // This would need to know total questions - placeholder
          return 0;
        },

        getTotalQuestions: () => {
          // Placeholder - would need section/question data
          return 0;
        },

        getAnsweredQuestions: () => {
          return Object.keys(get().answers).length;
        },
      }),
      {
        name: 'assessment-storage',
        partialize: (state) => ({
          answers: state.answers,
          sectionTimings: state.sectionTimings,
          gradeLevel: state.gradeLevel,
          studentStream: state.studentStream,
          currentSectionIndex: state.currentSectionIndex,
          currentQuestionIndex: state.currentQuestionIndex,
        }),
      }
    )
  )
);

// Convenience hooks for common selections
export const useAssessmentStatus = () => 
  useAssessmentStore((state) => state.status);

export const useAssessmentAnswers = () => 
  useAssessmentStore((state) => state.answers);

export const useAssessmentCurrentQuestion = () => {
  const sectionIndex = useAssessmentStore((state) => state.currentSectionIndex);
  const questionIndex = useAssessmentStore((state) => state.currentQuestionIndex);
  return { sectionIndex, questionIndex };
};

export const useAssessmentTime = () => {
  const timeRemaining = useAssessmentStore((state) => state.timeRemaining);
  const elapsedTime = useAssessmentStore((state) => state.elapsedTime);
  return { timeRemaining, elapsedTime };
};

export const useAssessmentFlowActions = () => {
  const startNewAssessment = useAssessmentStore((state) => state.startNewAssessment);
  const startSection = useAssessmentStore((state) => state.startSection);
  const completeSection = useAssessmentStore((state) => state.completeSection);
  const submitAssessment = useAssessmentStore((state) => state.submitAssessment);
  const completeAssessment = useAssessmentStore((state) => state.completeAssessment);
  const resumeAssessment = useAssessmentStore((state) => state.resumeAssessment);
  const showResumeDialog = useAssessmentStore((state) => state.showResumeDialog);
  const showRestriction = useAssessmentStore((state) => state.showRestriction);
  const reset = useAssessmentStore((state) => state.reset);
  return { startNewAssessment, startSection, completeSection, submitAssessment, completeAssessment, resumeAssessment, showResumeDialog, showRestriction, reset };
};

export const useAssessmentNavigation = () => {
  const nextQuestion = useAssessmentStore((state) => state.nextQuestion);
  const previousQuestion = useAssessmentStore((state) => state.previousQuestion);
  const goToQuestion = useAssessmentStore((state) => state.goToQuestion);
  const nextSection = useAssessmentStore((state) => state.nextSection);
  const goToSection = useAssessmentStore((state) => state.goToSection);
  const canGoPrevious = useAssessmentStore((state) => state.canGoPrevious);
  const canGoNext = useAssessmentStore((state) => state.canGoNext);
  return { nextQuestion, previousQuestion, goToQuestion, nextSection, goToSection, canGoPrevious, canGoNext };
};
