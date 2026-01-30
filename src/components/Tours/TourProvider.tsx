import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  // New centralized scroll control
  isTourRunning: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: React.ReactNode;
  studentId?: string;
  userEmail?: string;
}

export const TourProvider: React.FC<TourProviderProps> = ({ 
  children, 
  studentId
}) => {
  const [state, setState] = useState<TourState>({
    isRunning: false,
    stepIndex: 0,
    tourKey: null,
    progress: {},
  });
  const [loading, setLoading] = useState(true);
  
  // Single source of truth for tour running state
  const [isTourRunning, setIsTourRunning] = useState(false);
  
  // Prevent duplicate eligibility checks
  const lastEligibilityCheck = useRef<{ [key: string]: boolean }>({});

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

  // CRITICAL: Centralized scroll lock management
  // Scroll is locked ONLY when isTourRunning is true
  useEffect(() => {
    if (isTourRunning) {
      lockScroll();
      console.log('🔒 Scroll locked - tour is running');
    } else {
      forceUnlockScroll();
      console.log('🔓 Scroll unlocked - no tour running');
    }
  }, [isTourRunning]);

  // Cleanup on unmount - ensure scroll is unlocked
  useEffect(() => {
    return () => {
      setIsTourRunning(false);
      forceUnlockScroll();
      console.log('🔓 TourProvider unmounted - scroll unlocked');
    };
  }, []);

  // Cleanup on route changes - ensure scroll is unlocked
  useEffect(() => {
    const handleRouteChange = () => {
      if (isTourRunning) {
        console.log('🔄 Route change detected - stopping tour and unlocking scroll');
        setIsTourRunning(false);
        setState(prev => ({
          ...prev,
          isRunning: false,
          stepIndex: 0,
          tourKey: null,
        }));
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isTourRunning]);

  // FIXED: startTour now only sets state, does NOT lock scroll
  // Scroll lock is handled by the centralized effect above
  const startTour = useCallback((tourKey: TourKey) => {
    console.log(`🎯 Starting tour: ${tourKey}`);
    
    setState(prev => ({
      ...prev,
      isRunning: true,
      stepIndex: 0,
      tourKey,
    }));
    
    // Set the centralized tour running state
    setIsTourRunning(true);
  }, []);

  const completeTour = useCallback(async (tourKey: TourKey) => {
    console.log(`✅ Completing tour: ${tourKey}`);
    
    const updatedProgress = markTourCompleted(tourKey, state.progress);
    await saveTourProgress(updatedProgress);
    
    // Stop tour and unlock scroll via centralized state
    setIsTourRunning(false);
    
    setState(prev => ({
      ...prev,
      isRunning: false,
      stepIndex: 0,
      tourKey: null,
    }));
  }, [state.progress, saveTourProgress]);

  const skipTour = useCallback(async (tourKey: TourKey) => {
    console.log(`⏭️ Skipping tour: ${tourKey}`);
    
    // Stop tour and unlock scroll via centralized state
    setIsTourRunning(false);
    
    // Mark as completed when skipped
    await completeTour(tourKey);
  }, [completeTour]);

  const updateProgress = useCallback(async (progressUpdate: Partial<TourProgress>) => {
    const updatedProgress = { ...state.progress, ...progressUpdate };
    await saveTourProgress(updatedProgress);
  }, [state.progress, saveTourProgress]);

  // FIXED: Pure eligibility check with caching to prevent duplicate checks
  const isEligible = useCallback((tourKey: TourKey) => {
    // Prevent duplicate checks during rapid re-renders
    const cacheKey = `${tourKey}_${JSON.stringify(state.progress)}`;
    if (lastEligibilityCheck.current[cacheKey] !== undefined) {
      return lastEligibilityCheck.current[cacheKey];
    }
    
    const eligible = isEligibleForTour(tourKey, state.progress);
    lastEligibilityCheck.current[cacheKey] = eligible;
    
    console.log(`🎯 Eligibility check for ${tourKey}: ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
    return eligible;
  }, [state.progress]);

  const value: TourContextType = {
    state,
    startTour,
    completeTour,
    skipTour,
    updateProgress,
    isEligible,
    loading,
    isTourRunning, // Expose centralized tour running state
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