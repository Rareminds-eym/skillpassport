import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TourState, TourProgress, TourKey } from './types';
import { 
  getTourProgressFromStorage, 
  saveTourProgressToStorage, 
  markTourCompleted,
  isEligibleForTour,
  forceUnlockScroll,
  initializeScrollUtils
} from './utils';

interface TourContextType {
  state: TourState;
  startTour: (tourKey: TourKey) => void;
  completeTour: (tourKey: TourKey) => Promise<void>;
  skipTour: (tourKey: TourKey) => Promise<void>;
  updateProgress: (progress: Partial<TourProgress>) => Promise<void>;
  isEligible: (tourKey: TourKey) => boolean;
  loading: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: React.ReactNode;
  studentId?: string;
  userEmail?: string;
}

export const TourProvider: React.FC<TourProviderProps> = ({ 
  children, 
  studentId,
  userEmail 
}) => {
  const [state, setState] = useState<TourState>({
    isRunning: false,
    stepIndex: 0,
    tourKey: null,
    progress: {},
  });
  const [loading, setLoading] = useState(true);

  // Load tour progress from database or localStorage
  const loadTourProgress = useCallback(async () => {
    setLoading(true);
    
    try {
      let progress: TourProgress = {};
      
      // Try to load from database first
      if (studentId) {
        const { data, error } = await supabase
          .from('students')
          .select('tour_progress')
          .eq('id', studentId)
          .single();
          
        if (!error && data?.tour_progress) {
          progress = data.tour_progress;
          console.log('📚 Tour progress loaded from database:', progress);
        } else {
          console.log('📚 No tour progress in database, checking localStorage');
          // Fallback to localStorage
          progress = getTourProgressFromStorage();
        }
      } else {
        // No student ID, use localStorage only
        progress = getTourProgressFromStorage();
      }
      
      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('Failed to load tour progress:', error);
      // Fallback to localStorage
      const progress = getTourProgressFromStorage();
      setState(prev => ({ ...prev, progress }));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // Save tour progress to database and localStorage
  const saveTourProgress = useCallback(async (progress: TourProgress) => {
    try {
      // Save to database if student ID is available
      if (studentId) {
        const { error } = await supabase
          .from('students')
          .update({ tour_progress: progress })
          .eq('id', studentId);
          
        if (error) {
          console.error('Failed to save tour progress to database:', error);
        } else {
          console.log('📚 Tour progress saved to database:', progress);
        }
      }
      
      // Always save to localStorage as fallback
      saveTourProgressToStorage(progress);
      
      setState(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('Failed to save tour progress:', error);
      // Still update local state
      setState(prev => ({ ...prev, progress }));
    }
  }, [studentId]);

  // Load progress on mount and initialize scroll utilities
  useEffect(() => {
    // Initialize scroll utilities to ensure clean state
    initializeScrollUtils();
    loadTourProgress();
  }, [loadTourProgress]);

  // Cleanup on unmount - ensure scroll is unlocked
  useEffect(() => {
    return () => {
      forceUnlockScroll();
    };
  }, []);

  const startTour = useCallback((tourKey: TourKey) => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      stepIndex: 0,
      tourKey,
    }));
    
    // Note: Scroll locking is disabled to prevent app-wide scroll issues
    console.log(`🎯 Tour started: ${tourKey} (scroll lock disabled)`);
  }, []);

  const completeTour = useCallback(async (tourKey: TourKey) => {
    const updatedProgress = markTourCompleted(tourKey, state.progress);
    await saveTourProgress(updatedProgress);
    
    // Ensure scroll is unlocked when tour completes
    forceUnlockScroll();
    
    setState(prev => ({
      ...prev,
      isRunning: false,
      stepIndex: 0,
      tourKey: null,
    }));
  }, [state.progress, saveTourProgress]);

  const skipTour = useCallback(async (tourKey: TourKey) => {
    // Ensure scroll is unlocked when tour is skipped
    forceUnlockScroll();
    
    // Mark as completed when skipped
    await completeTour(tourKey);
  }, [completeTour]);

  const updateProgress = useCallback(async (progressUpdate: Partial<TourProgress>) => {
    const updatedProgress = { ...state.progress, ...progressUpdate };
    await saveTourProgress(updatedProgress);
  }, [state.progress, saveTourProgress]);

  const isEligible = useCallback((tourKey: TourKey) => {
    return isEligibleForTour(tourKey, state.progress);
  }, [state.progress]);

  const value: TourContextType = {
    state,
    startTour,
    completeTour,
    skipTour,
    updateProgress,
    isEligible,
    loading,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};