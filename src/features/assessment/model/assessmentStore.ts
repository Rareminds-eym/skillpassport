import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { TestSession, TestResults, TestPhase, DifficultyLevel, Question } from '@/shared/types/adaptiveAptitude';

export type AssessmentStatus = 'idle' | 'loading' | 'inProgress' | 'submitting' | 'completed' | 'error';

export interface AssessmentSection {
  id: string;
  name?: string;
  title?: string; // For section intro screen
  description?: string; // For section intro screen
  instruction?: string; // For section intro screen
  color?: string; // For section intro screen
  questions: any[];
  responseScale?: Array<{ value: number; label: string }>; // Response scale options
  isAptitude?: boolean;
  isAdaptive?: boolean;
  isKnowledge?: boolean;
  isTimed?: boolean;
  timeLimit?: number;
  individualTimeLimit?: number; // Per question time limit
}

export interface AssessmentState {
  // Assessment metadata
  attemptId: string | null;
  gradeLevel: string | null;
  streamId: string | null;

  // Progress tracking
  currentSectionIndex: number;
  currentQuestionIndex: number;
  sections: AssessmentSection[];

  // User responses
  answers: Record<string, any>;

  // UI state
  status: AssessmentStatus;
  loading: boolean;
  error: string | null;

  // Adaptive Aptitude Fields
  adaptiveSessionId: string | null;
  adaptivePhase: TestPhase | null;
  adaptiveCurrentQuestion: Question | null;
  adaptiveDifficulty: DifficultyLevel;
  adaptiveQuestionsAnswered: number;
  adaptiveCorrectAnswers: number;
  adaptiveAbilityEstimate: number;
  adaptiveTestComplete: boolean;
  adaptiveResults: TestResults | null;

  // Assessment Results Fields
  resultId: string | null;
  riasecScores: Record<string, number> | null;
  strengthScores: any[] | null;
  learningPreferences: Record<string, any> | null;
  aptitudeScores: any | null;
  profileSnapshot: any | null;
  analysisRetryCount: number;
  analysisMaxRetries: number;

  // Actions - Regular Assessment
  initializeAssessment: (sections: AssessmentSection[], attemptId: string, gradeLevel: string, streamId: string) => void;
  setSections: (sections: AssessmentSection[]) => void;
  setCurrentQuestion: (sectionIdx: number, questionIdx: number) => void;
  saveAnswer: (questionId: string, answer: any) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  nextSection: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStatus: (status: AssessmentStatus) => void;
  reset: () => void;

  // Actions - Adaptive Aptitude
  initializeAdaptiveSession: (session: TestSession, firstQuestion: Question) => void;
  setAdaptivePhase: (phase: TestPhase) => void;
  setAdaptiveCurrentQuestion: (question: Question | null) => void;
  setAdaptiveDifficulty: (difficulty: DifficultyLevel) => void;
  updateAdaptiveProgress: (answered: number, correct: number, ability: number) => void;
  setAdaptiveTestComplete: (complete: boolean) => void;
  setAdaptiveResults: (results: TestResults) => void;
  resetAdaptive: () => void;

  // Actions - Assessment Results
  setResultData: (data: {
    resultId: string;
    riasecScores: Record<string, number>;
    strengthScores: any[];
    learningPreferences: Record<string, any>;
    aptitudeScores: any;
    profileSnapshot: any;
  }) => void;
  incrementAnalysisRetryCount: () => void;
  resetAnalysisRetry: () => void;
  resetResults: () => void;
}

const initialState = {
  attemptId: null,
  gradeLevel: null,
  streamId: null,
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  sections: [],
  answers: {},
  status: 'idle' as AssessmentStatus,
  loading: false,
  error: null,
  adaptiveSessionId: null,
  adaptivePhase: null,
  adaptiveCurrentQuestion: null,
  adaptiveDifficulty: 3 as DifficultyLevel,
  adaptiveQuestionsAnswered: 0,
  adaptiveCorrectAnswers: 0,
  adaptiveAbilityEstimate: 0,
  adaptiveTestComplete: false,
  adaptiveResults: null,
  resultId: null,
  riasecScores: null,
  strengthScores: null,
  learningPreferences: null,
  aptitudeScores: null,
  profileSnapshot: null,
  analysisRetryCount: 0,
  analysisMaxRetries: 4,
};

export const useAssessmentStore = create<AssessmentState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      initializeAssessment: (sections, attemptId, gradeLevel, streamId) => {
        set((state) => {
          state.sections = sections;
          state.attemptId = attemptId;
          state.gradeLevel = gradeLevel;
          state.streamId = streamId;
          state.status = 'inProgress';
          state.loading = false;
        });
      },

      setCurrentQuestion: (sectionIdx, questionIdx) => {
        set((state) => {
          state.currentSectionIndex = sectionIdx;
          state.currentQuestionIndex = questionIdx;
        });
      },

      setSections: (sections) => {
        set((state) => {
          state.sections = sections;
        });
      },

      saveAnswer: (questionId, answer) => {
        set((state) => {
          state.answers[questionId] = answer;
        });
      },

      nextQuestion: () => {
        set((state) => {
          const currentSection = state.sections[state.currentSectionIndex];
          if (!currentSection) return;

          const questionCount = currentSection.questions.length;
          if (state.currentQuestionIndex < questionCount - 1) {
            state.currentQuestionIndex += 1;
          }
        });
      },

      previousQuestion: () => {
        set((state) => {
          if (state.currentQuestionIndex > 0) {
            state.currentQuestionIndex -= 1;
          }
        });
      },

      nextSection: () => {
        set((state) => {
          if (state.currentSectionIndex < state.sections.length - 1) {
            state.currentSectionIndex += 1;
            state.currentQuestionIndex = 0;
          }
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.loading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
          if (error) state.status = 'error';
        });
      },

      setStatus: (status) => {
        set((state) => {
          state.status = status;
        });
      },

      reset: () => {
        set(initialState);
      },

      // Adaptive Aptitude Actions
      initializeAdaptiveSession: (session, firstQuestion) => {
        set((state) => {
          state.adaptiveSessionId = session.id;
          state.adaptivePhase = session.currentPhase;
          state.adaptiveCurrentQuestion = firstQuestion;
          state.adaptiveDifficulty = session.currentDifficulty;
          state.adaptiveQuestionsAnswered = session.questionsAnswered;
          state.adaptiveCorrectAnswers = session.correctAnswers;
          state.status = 'inProgress';
          state.loading = false;
        });
      },

      setAdaptivePhase: (phase) => {
        set((state) => {
          state.adaptivePhase = phase;
        });
      },

      setAdaptiveCurrentQuestion: (question) => {
        set((state) => {
          state.adaptiveCurrentQuestion = question;
        });
      },

      setAdaptiveDifficulty: (difficulty) => {
        set((state) => {
          state.adaptiveDifficulty = difficulty;
        });
      },

      updateAdaptiveProgress: (answered, correct, ability) => {
        set((state) => {
          state.adaptiveQuestionsAnswered = answered;
          state.adaptiveCorrectAnswers = correct;
          state.adaptiveAbilityEstimate = ability;
        });
      },

      setAdaptiveTestComplete: (complete) => {
        set((state) => {
          state.adaptiveTestComplete = complete;
          if (complete) state.status = 'completed';
        });
      },

      setAdaptiveResults: (results) => {
        set((state) => {
          state.adaptiveResults = results;
        });
      },

      resetAdaptive: () => {
        set((state) => {
          state.adaptiveSessionId = null;
          state.adaptivePhase = null;
          state.adaptiveCurrentQuestion = null;
          state.adaptiveDifficulty = 3;
          state.adaptiveQuestionsAnswered = 0;
          state.adaptiveCorrectAnswers = 0;
          state.adaptiveAbilityEstimate = 0;
          state.adaptiveTestComplete = false;
          state.adaptiveResults = null;
        });
      },

      setResultData: (data) => {
        set((state) => {
          state.resultId = data.resultId;
          state.riasecScores = data.riasecScores;
          state.strengthScores = data.strengthScores;
          state.learningPreferences = data.learningPreferences;
          state.aptitudeScores = data.aptitudeScores;
          state.profileSnapshot = data.profileSnapshot;
          state.loading = false;
          state.error = null;
        });
      },

      incrementAnalysisRetryCount: () => {
        set((state) => {
          state.analysisRetryCount += 1;
        });
      },

      resetAnalysisRetry: () => {
        set((state) => {
          state.analysisRetryCount = 0;
        });
      },

      resetResults: () => {
        set((state) => {
          state.resultId = null;
          state.riasecScores = null;
          state.strengthScores = null;
          state.learningPreferences = null;
          state.aptitudeScores = null;
          state.profileSnapshot = null;
          state.analysisRetryCount = 0;
        });
      },
    })),
    { name: 'assessmentStore' }
  )
);

// Convenience hooks - Regular Assessment
export const useAssessmentStatus = () => useAssessmentStore((state) => state.status);
export const useAssessmentLoading = () => useAssessmentStore((state) => state.loading);
export const useAssessmentError = () => useAssessmentStore((state) => state.error);
export const useAssessmentAnswers = () => useAssessmentStore((state) => state.answers);
export const useCurrentSection = () => {
  const store = useAssessmentStore();
  return store.sections[store.currentSectionIndex];
};
export const useCurrentQuestion = () => {
  const store = useAssessmentStore();
  const section = store.sections[store.currentSectionIndex];
  return section?.questions[store.currentQuestionIndex];
};

// Convenience hooks - Adaptive Aptitude
export const useAdaptiveSessionId = () => useAssessmentStore((state) => state.adaptiveSessionId);
export const useAdaptivePhase = () => useAssessmentStore((state) => state.adaptivePhase);
export const useAdaptiveCurrentQuestion = () => useAssessmentStore((state) => state.adaptiveCurrentQuestion);
export const useAdaptiveDifficulty = () => useAssessmentStore((state) => state.adaptiveDifficulty);
export const useAdaptiveProgress = () =>
  useAssessmentStore((state) => ({
    questionsAnswered: state.adaptiveQuestionsAnswered,
    correctAnswers: state.adaptiveCorrectAnswers,
    abilityEstimate: state.adaptiveAbilityEstimate,
  }));
export const useAdaptiveResults = () => useAssessmentStore((state) => state.adaptiveResults);
export const useAdaptiveTestComplete = () => useAssessmentStore((state) => state.adaptiveTestComplete);

// Convenience hooks - Assessment Results
export const useAssessmentResults = () =>
  useAssessmentStore((state) => ({
    resultId: state.resultId,
    riasecScores: state.riasecScores,
    strengthScores: state.strengthScores,
    learningPreferences: state.learningPreferences,
    aptitudeScores: state.aptitudeScores,
    profileSnapshot: state.profileSnapshot,
  }));
export const useAnalysisRetry = () =>
  useAssessmentStore((state) => ({
    retryCount: state.analysisRetryCount,
    maxRetries: state.analysisMaxRetries,
  }));
