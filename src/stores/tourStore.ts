import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../lib/supabaseClient';

// Types (from TourProvider)
export type TourKey = 
  | 'student_dashboard'
  | 'student_assessment'
  | 'student_learning'
  | 'student_profile'
  | 'assessment_result'
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
  loadedForStudentId: string | null;
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
  setLoadedForStudentId: (studentId: string | null) => void;
  loadTourProgress: (studentId: string) => Promise<void>;
  saveTourProgress: (progress: TourProgress, studentId?: string) => Promise<void>;
  
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
    console.error('Failed to save tour progress to localStorage:', error);
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
    loadedForStudentId: null,
    isTourRunning: false,
    activeTourKey: null,

    // Start tour
    startTour: (tourKey) => {
      const { loading, state, isTourRunning, activeTourKey } = get();
      
      // Don't start if still loading
      if (loading) {
        console.log(`⚠️ Tour ${tourKey} requested but tour progress is still loading`);
        return false;
      }

      // Don't start if not eligible
      if (!isEligibleForTour(tourKey, state.progress)) {
        console.log(`⚠️ Tour ${tourKey} requested but is not eligible`);
        return false;
      }

      // Don't start if another tour is running
      if (isTourRunning && activeTourKey !== tourKey) {
        console.log(`⚠️ Tour ${tourKey} requested but tour ${activeTourKey} is already running`);
        return false;
      }

      // Don't start if same tour is already running
      if (isTourRunning && activeTourKey === tourKey) {
        console.log(`⚠️ Tour ${tourKey} already running`);
        return false;
      }

      console.log(`🎯 Starting tour: ${tourKey}`);

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
      const { state, saveTourProgress, loadedForStudentId } = get();
      
      const tourEntry = {
        completed: true,
        completedAt: new Date().toISOString(),
      };
      
      const updatedProgress: TourProgress = {
        ...state.progress,
        [tourKey]: tourEntry,
      };

      await saveTourProgress(updatedProgress, loadedForStudentId || undefined);

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
      const { state, saveTourProgress, loadedForStudentId } = get();
      
      const tourEntry = {
        completed: true,
        skipped: true,
        skippedAt: new Date().toISOString(),
      };
      
      const updatedProgress: TourProgress = {
        ...state.progress,
        [tourKey]: tourEntry,
      };

      await saveTourProgress(updatedProgress, loadedForStudentId || undefined);

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
      const { state, saveTourProgress, loadedForStudentId } = get();
      const updatedProgress: TourProgress = { 
        ...state.progress,
        ...progressUpdate as TourProgress 
      };
      await saveTourProgress(updatedProgress, loadedForStudentId || undefined);
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

    setLoadedForStudentId: (studentId) => {
      set((store) => {
        store.loadedForStudentId = studentId;
      });
    },

    // Load tour progress
    loadTourProgress: async (studentId) => {
      const { loadedForStudentId, initialized } = get();
      
      // Don't load if already loaded for this studentId
      if (loadedForStudentId === studentId && initialized) {
        return;
      }

      set((store) => {
        store.loading = true;
      });

      try {
        let progress: TourProgress = {};

        // Load from database
        const { data, error } = await supabase
          .from('students')
          .select('tour_progress')
          .eq('user_id', studentId)
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
          store.loadedForStudentId = studentId;
        });
      } catch (error) {
        console.error('Failed to load tour progress:', error);
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
    saveTourProgress: async (progress, studentId) => {
      try {
        // Save to database if student ID is available
        if (studentId) {
          const { error } = await supabase
            .from('students')
            .update({ tour_progress: progress })
            .eq('user_id', studentId);

          if (error) {
            console.error('Failed to save tour progress to database:', error);
          }
        }

        // Always save to localStorage as fallback
        saveTourProgressToStorage(progress);

        set((store) => {
          store.state.progress = progress;
        });
      } catch (error) {
        console.error('Failed to save tour progress:', error);
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
        store.loadedForStudentId = null;
        store.isTourRunning = false;
        store.activeTourKey = null;
      });
      forceUnlockScroll();
    },

    // Clear all progress
    clearAllProgress: async () => {
      const { loadedForStudentId, saveTourProgress } = get();
      await saveTourProgress({}, loadedForStudentId || undefined);
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
  useTourStore((state) => ({
    startTour: state.startTour,
    completeTour: state.completeTour,
    skipTour: state.skipTour,
    stopTour: state.stopTour,
    nextStep: state.nextStep,
    previousStep: state.previousStep,
    goToStep: state.goToStep,
  }));

export const useTourEligibility = (tourKey: TourKey) =>
  useTourStore((state) => ({
    isEligible: state.isEligible(tourKey),
    isCompleted: state.isCompleted(tourKey),
    isSkipped: state.isSkipped(tourKey),
  }));
