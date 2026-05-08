import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('tour-store');

// Types (from TourProvider)
export type TourKey =
  // Legacy keys (kept for backward compatibility)
  | 'dashboard'
  | 'assessment_test'
  | 'assessment_result'
  | 'assessment_result_after12'
  | 'assessment_result_generic'
  // Modern keys
  | 'learner_dashboard'
  | 'learner_assessment'
  | 'learner_learning'
  | 'learner_profile'
  | 'assessment_result_12'
  | 'educator_dashboard'
  | 'admin_dashboard';

export interface TourProgress {
  [key: string]: {
    completed: boolean;
    completedAt?: string;
    skipped?: boolean;
    skippedAt?: string;
  };
}

export interface TourState {
  isRunning: boolean;
  stepIndex: number;
  tourKey: TourKey | null;
  progress: TourProgress;
}

interface TourStore {
  // State
  state: TourState;
  loading: boolean;
  initialized: boolean;
  loadedForLearnerId: string | null;
  isTourRunning: boolean;
  activeTourKey: TourKey | null;

  // Actions
  startTour: (tourKey: TourKey) => boolean;
  completeTour: (tourKey: TourKey) => Promise<void>;
  skipTour: (tourKey: TourKey) => Promise<void>;
  updateProgress: (progress: Partial<TourProgress>) => Promise<void>;
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  stopTour: () => void;

  // Checkers
  isEligible: (tourKey: TourKey) => boolean;
  isCompleted: (tourKey: TourKey) => boolean;
  isSkipped: (tourKey: TourKey) => boolean;

  // Loading & sync
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setLoadedForLearnerId: (learnerId: string | null) => void;
  loadTourProgress: (learnerId: string) => Promise<void>;
  saveTourProgress: (progress: TourProgress, learnerId?: string) => Promise<void>;

  // Reset
  reset: () => void;
  clearAllProgress: () => Promise<void>;
}

// Local storage helpers (from original TourProvider utils)
const STORAGE_KEY = 'rareminds_tour_progress';

const getTourProgressFromStorage = (): TourProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveTourProgressToStorage = (progress: TourProgress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    // localStorage unavailable (quota exceeded, private browsing, etc.) — non-critical, silently skip to avoid disrupting UX
  }
};

const isEligibleForTour = (tourKey: TourKey, progress: TourProgress): boolean => {
  if (!progress[tourKey]) return true;
  const tour = progress[tourKey];
  return !tour.completed && !tour.skipped;
};

// Scroll lock helpers
const lockScroll = () => {
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
};

const forceUnlockScroll = () => {
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.top = '';
};

const initialState: TourState = {
  isRunning: false,
  stepIndex: 0,
  tourKey: null,
  progress: {},
};

export const useTourStore = create<TourStore>()(
  immer((set, get) => ({
    // Initial state
    state: { ...initialState },
    loading: true,
    initialized: false,
    loadedForLearnerId: null,
    isTourRunning: false,
    activeTourKey: null,

    // Start tour
    startTour: (tourKey) => {
      const { loading, state, isTourRunning, activeTourKey } = get();

      // Don't start if still loading
      if (loading) {
        return false;
      }

      // Don't start if not eligible
      if (!isEligibleForTour(tourKey, state.progress)) {
        return false;
      }

      // Don't start if another tour is running
      if (isTourRunning && activeTourKey !== tourKey) {
        return false;
      }

      // Don't start if same tour is already running
      if (isTourRunning && activeTourKey === tourKey) {
        return false;
      }

      set((store) => {
        store.state.isRunning = true;
        store.state.stepIndex = 0;
        store.state.tourKey = tourKey;
        store.isTourRunning = true;
        store.activeTourKey = tourKey;
      });

      // Lock scroll
      lockScroll();
      return true;
    },

    // Complete tour
    completeTour: async (tourKey) => {
      const { state, saveTourProgress, loadedForLearnerId } = get();

      const tourEntry = {
        completed: true,
        completedAt: new Date().toISOString(),
      };

      const updatedProgress: TourProgress = {
        ...state.progress,
        [tourKey]: tourEntry,
      };

      await saveTourProgress(updatedProgress, loadedForLearnerId || undefined);

      // Stop tour
      set((store) => {
        store.activeTourKey = null;
        store.isTourRunning = false;
        store.state.isRunning = false;
        store.state.stepIndex = 0;
        store.state.tourKey = null;
      });

      forceUnlockScroll();
    },

    // Skip tour
    skipTour: async (tourKey) => {
      const { state, saveTourProgress, loadedForLearnerId } = get();

      const tourEntry = {
        completed: true,
        skipped: true,
        skippedAt: new Date().toISOString(),
      };

      const updatedProgress: TourProgress = {
        ...state.progress,
        [tourKey]: tourEntry,
      };

      await saveTourProgress(updatedProgress, loadedForLearnerId || undefined);

      // Stop tour
      set((store) => {
        store.activeTourKey = null;
        store.isTourRunning = false;
        store.state.isRunning = false;
        store.state.stepIndex = 0;
        store.state.tourKey = null;
      });

      forceUnlockScroll();
    },

    // Update progress
    updateProgress: async (progressUpdate) => {
      const { state, saveTourProgress, loadedForLearnerId } = get();
      const updatedProgress: TourProgress = {
        ...state.progress,
        ...progressUpdate as TourProgress
      };
      await saveTourProgress(updatedProgress, loadedForLearnerId || undefined);
    },

    // Navigation
    goToStep: (stepIndex) => {
      set((store) => {
        store.state.stepIndex = Math.max(0, stepIndex);
      });
    },

    nextStep: () => {
      set((store) => {
        store.state.stepIndex += 1;
      });
    },

    previousStep: () => {
      set((store) => {
        if (store.state.stepIndex > 0) {
          store.state.stepIndex -= 1;
        }
      });
    },

    // Stop tour
    stopTour: () => {
      set((store) => {
        store.activeTourKey = null;
        store.isTourRunning = false;
        store.state.isRunning = false;
        store.state.stepIndex = 0;
        store.state.tourKey = null;
      });
      forceUnlockScroll();
    },

    // Checkers
    isEligible: (tourKey) => {
      const { loading, state } = get();
      if (loading) return false;
      return isEligibleForTour(tourKey, state.progress);
    },

    isCompleted: (tourKey) => {
      return !!get().state.progress[tourKey]?.completed;
    },

    isSkipped: (tourKey) => {
      return !!get().state.progress[tourKey]?.skipped;
    },

    // Setters
    setLoading: (loading) => {
      set((store) => {
        store.loading = loading;
      });
    },

    setInitialized: (initialized) => {
      set((store) => {
        store.initialized = initialized;
      });
    },

    setLoadedForLearnerId: (learnerId) => {
      set((store) => {
        store.loadedForLearnerId = learnerId;
      });
    },

    // Load tour progress
    loadTourProgress: async (learnerId) => {
      const { loadedForLearnerId, initialized } = get();

      // Don't load if already loaded for this learnerId
      if (loadedForLearnerId === learnerId && initialized) {
        return;
      }

      set((store) => {
        store.loading = true;
      });

      try {
        let progress: TourProgress = {};

        // Load from database
        const { data, error } = await supabase
          .from('learners')
          .select('tour_progress')
          .eq('user_id', learnerId)
          .maybeSingle();

        if (!error && data?.tour_progress) {
          progress = data.tour_progress;
          // Sync to localStorage
          saveTourProgressToStorage(progress);
        } else {
          // Fallback to localStorage
          progress = getTourProgressFromStorage();
        }

        set((store) => {
          store.state.progress = progress;
          store.loadedForLearnerId = learnerId;
        });
      } catch (error) {
        logger.error('Failed to load tour progress', error as Error);
        // Fallback to localStorage
        const progress = getTourProgressFromStorage();
        set((store) => {
          store.state.progress = progress;
        });
      } finally {
        set((store) => {
          store.loading = false;
          store.initialized = true;
        });
      }
    },

    // Save tour progress
    saveTourProgress: async (progress, learnerId) => {
      try {
        // Save to database if learner ID is available
        if (learnerId) {
          const { error } = await supabase
            .from('learners')
            .update({ tour_progress: progress })
            .eq('user_id', learnerId);

          if (error) {
            logger.error('Failed to save tour progress to database', new Error(error.message));
          }
        }

        // Always save to localStorage as fallback
        saveTourProgressToStorage(progress);

        set((store) => {
          store.state.progress = progress;
        });
      } catch (error) {
        logger.error('Failed to save tour progress', error as Error);
        // Still update localStorage
        saveTourProgressToStorage(progress);
        set((store) => {
          store.state.progress = progress;
        });
      }
    },

    // Reset
    reset: () => {
      set((store) => {
        store.state = { ...initialState };
        store.loading = true;
        store.initialized = false;
        store.loadedForLearnerId = null;
        store.isTourRunning = false;
        store.activeTourKey = null;
      });
      forceUnlockScroll();
    },

    // Clear all progress
    clearAllProgress: async () => {
      const { loadedForLearnerId, saveTourProgress } = get();
      await saveTourProgress({}, loadedForLearnerId || undefined);
    },
  }))
);

// Convenience hooks
export const useTourState = () => useTourStore((state) => state.state);
export const useTourLoading = () => useTourStore((state) => state.loading);
export const useIsTourRunning = () => useTourStore((state) => state.isTourRunning);
export const useActiveTourKey = () => useTourStore((state) => state.activeTourKey);
export const useTourProgress = () => useTourStore((state) => state.state.progress);

export const useTourActions = () =>
  useTourStore(useShallow((state) => ({
    startTour: state.startTour,
    completeTour: state.completeTour,
    skipTour: state.skipTour,
    stopTour: state.stopTour,
    nextStep: state.nextStep,
    previousStep: state.previousStep,
    goToStep: state.goToStep,
  })));

export const useTourEligibility = (tourKey: TourKey) =>
  useTourStore(useShallow((state) => ({
    isEligible: state.isEligible(tourKey),
    isCompleted: state.isCompleted(tourKey),
    isSkipped: state.isSkipped(tourKey),
  })));

// Combined convenience hook
export const useTour = () => {
  const state = useTourState();
  const loading = useTourLoading();
  const isTourRunning = useIsTourRunning();
  const activeTourKey = useActiveTourKey();
  const progress = useTourProgress();
  const tourStore = useTourStore();

  return {
    ...state,
    loading,
    isTourRunning,
    activeTourKey,
    progress,
    // Actions
    startTour: tourStore.startTour,
    completeTour: tourStore.completeTour,
    skipTour: tourStore.skipTour,
    stopTour: tourStore.stopTour,
    nextStep: tourStore.nextStep,
    previousStep: tourStore.previousStep,
    goToStep: tourStore.goToStep,
    // State checks
    isEligible: tourStore.isEligible,
    isCompleted: tourStore.isCompleted,
    isSkipped: tourStore.isSkipped,
  };
};
