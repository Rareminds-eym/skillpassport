import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Types
export interface Question {
  id: string;
  text: string;
  options?: string[];
  [key: string]: any;
}

interface TestState {
  // Data
  questions: Question[];
  selectedAnswers: (string | null)[];
  
  // Loading
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setQuestions: (questions: Question[]) => void;
  setSelectedAnswers: (answers: (string | null)[]) => void;
  setAnswer: (questionIndex: number, answer: string | null) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  goToQuestion: (index: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  submitTest: () => void;
  
  // Computed methods
  getCurrentQuestionIndex: () => number;
  getCurrentQuestion: () => Question | null;
  getIsComplete: () => boolean;
  getAnsweredCount: () => number;
  getTotalQuestions: () => number;
}

export const useTestStore = create<TestState>()(
  immer((set, get) => ({
    // Initial state
    questions: [],
    selectedAnswers: [],
    isLoading: false,
    error: null,

    // Computed methods
    getCurrentQuestionIndex: () => {
      const answered = get().selectedAnswers.filter((a) => a !== null).length;
      return Math.min(answered, get().questions.length - 1);
    },

    getCurrentQuestion: () => {
      const { questions } = get();
      const index = get().getCurrentQuestionIndex();
      return questions[index] || null;
    },

    getIsComplete: () => {
      const { questions, selectedAnswers } = get();
      if (questions.length === 0) return false;
      return selectedAnswers.every((a) => a !== null);
    },

    getAnsweredCount: () => {
      return get().selectedAnswers.filter((a) => a !== null).length;
    },

    getTotalQuestions: () => {
      return get().questions.length;
    },

    // Set questions
    setQuestions: (questions) => {
      set((state) => {
        state.questions = questions;
        state.selectedAnswers = new Array(questions.length).fill(null);
      });
    },

    // Set all answers
    setSelectedAnswers: (answers) => {
      set((state) => {
        state.selectedAnswers = answers;
      });
    },

    // Set single answer
    setAnswer: (questionIndex, answer) => {
      set((state) => {
        if (questionIndex >= 0 && questionIndex < state.questions.length) {
          state.selectedAnswers[questionIndex] = answer;
        }
      });
    },

    // Navigation
    goToNextQuestion: () => {
      set((state) => {
        const current = state.selectedAnswers.filter((a) => a !== null).length;
        const next = Math.min(current + 1, state.questions.length - 1);
        // Fill in nulls up to next index
        while (state.selectedAnswers.length <= next) {
          state.selectedAnswers.push(null);
        }
      });
    },

    goToPreviousQuestion: () => {
      set((state) => {
        const current = state.selectedAnswers.filter((a) => a !== null).length;
        const prev = Math.max(current - 1, 0);
        // This is just logical navigation, actual index is computed
      });
    },

    goToQuestion: (index) => {
      set((state) => {
        if (index >= 0 && index < state.questions.length) {
          // Ensure array is long enough
          while (state.selectedAnswers.length <= index) {
            state.selectedAnswers.push(null);
          }
        }
      });
    },

    // Loading and error
    setIsLoading: (isLoading) => {
      set((state) => {
        state.isLoading = isLoading;
      });
    },

    setError: (error) => {
      set((state) => {
        state.error = error;
      });
    },

    // Reset
    reset: () => {
      set((state) => {
        state.questions = [];
        state.selectedAnswers = [];
        state.isLoading = false;
        state.error = null;
      });
    },

    // Submit test
    submitTest: () => {
      // This would trigger test submission logic
      // For now, just mark as complete
      console.log('Test submitted with answers:', get().selectedAnswers);
    },
  }))
);

// Convenience hooks
export const useTestQuestions = () => useTestStore((state) => state.questions);
export const useTestAnswers = () => useTestStore((state) => state.selectedAnswers);
export const useTestLoading = () => useTestStore((state) => state.isLoading);
export const useTestProgress = () =>
  useTestStore((state) => ({
    answeredCount: useTestStore.getState().getAnsweredCount(),
    totalQuestions: useTestStore.getState().getTotalQuestions(),
    currentQuestion: state.getCurrentQuestion(),
    isComplete: state.getIsComplete(),
  }));

export const useTestActions = () =>
  useTestStore((state) => ({
    setQuestions: state.setQuestions,
    setAnswer: state.setAnswer,
    goToNextQuestion: state.goToNextQuestion,
    goToPreviousQuestion: state.goToPreviousQuestion,
    goToQuestion: state.goToQuestion,
    reset: state.reset,
    submitTest: state.submitTest,
  }));
