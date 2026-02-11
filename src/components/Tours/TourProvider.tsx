import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TourState, TourProgress, TourKey } from './types';
import { 
  getTourProgressFromStorage, 
  saveTourProgressToStorage, 
  markTourCompleted,
  isEligibleForTour,
  forceUnlockScroll,
  initializeScrollUtils,
  lockScroll
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
  // Current active tour
  activeTourKey: TourKey | null;
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
  const [initialized, setInitialized] = useState(false);
  
  // Single source of truth for tour running state
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [activeTourKey, setActiveTourKey] = useState<TourKey | null>(null);
  
  // Track if we've loaded progress for current studentId
  const loadedForStudentId = useRef<string | undefined>(undefined);

  // Load tour progress - ONLY when studentId is available
  const loadTourProgress = useCallback(async () => {
    // Don't load if already loaded for this studentId
    if (loadedForStudentId.current === studentId) {
      console.log('📚 Tour progress already loaded for this studentId, skipping');
      return;
    }

    // Don't load if studentId is not available yet
    if (!studentId) {
      console.log('📚 Waiting for studentId before loading tour progress...');
      setLoading(true);
      return;
    }

    setLoading(true);
    console.log('📚 Loading tour progress for studentId:', studentId);
    
    try {
      let progress: TourProgress = {};
      
      // Load from database
      const { data, error } = await supabase
        .from('students')
        .select('tour_progress')
        .eq('id', studentId)
        .single();
        
      if (!error && data?.tour_progress) {
        progress = data.tour_progress;
        console.log('📚 Tour progress loaded from database:', progress);
        // Sync to localStorage
        saveTourProgressToStorage(progress);
      } else {
        console.log('📚 No tour progress in database, using empty progress');
        progress = {};
      }
      
      setState(prev => ({ ...prev, progress }));
      loadedForStudentId.current = studentId;
      
    } catch (error) {
      console.error('Failed to load tour progress:', error);
      setState(prev => ({ ...prev, progress: {} }));
    } finally {
      setLoading(false);
      setInitialized(true);
      console.log('📚 Tour progress loading completed for studentId:', studentId);
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

  // Load progress when studentId becomes available
  useEffect(() => {
    if (studentId && !initialized) {
      console.log('🔄 StudentId available, initializing tour system:', studentId);
      initializeScrollUtils();
      loadTourProgress();
    }
  }, [studentId, initialized, loadTourProgress]);

  // CRITICAL: Centralized scroll lock management
  useEffect(() => {
    if (isTourRunning) {
      lockScroll();
      console.log('🔒 Scroll locked - tour is running');
    } else {
      forceUnlockScroll();
      console.log('🔓 Scroll unlocked - no tour running');
    }
  }, [isTourRunning]);

  // CRITICAL: Safety mechanism - stop tour if it becomes ineligible
  useEffect(() => {
    if (!loading && isTourRunning && activeTourKey) {
      const stillEligible = isEligibleForTour(activeTourKey, state.progress);
      if (!stillEligible) {
        console.warn(`🚨 Tour ${activeTourKey} is no longer eligible - stopping tour`);
        setActiveTourKey(null);
        setIsTourRunning(false);
        setState(prev => ({
          ...prev,
          isRunning: false,
          stepIndex: 0,
          tourKey: null,
        }));
      }
    }
  }, [loading, isTourRunning, activeTourKey, state.progress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setActiveTourKey(null);
      setIsTourRunning(false);
      forceUnlockScroll();
      console.log('🔓 TourProvider unmounted - scroll unlocked');
    };
  }, []);

  // Start tour - only if all conditions are met
  const startTour = useCallback((tourKey: TourKey) => {
    // Don't start if still loading
    if (loading) {
      console.log(`⚠️ Tour ${tourKey} requested but tour progress is still loading`);
      return;
    }
    
    // Don't start if not eligible
    if (!isEligibleForTour(tourKey, state.progress)) {
      console.log(`⚠️ Tour ${tourKey} requested but is not eligible`);
      return;
    }
    
    // Don't start if another tour is running
    if (isTourRunning && activeTourKey !== tourKey) {
      console.log(`⚠️ Tour ${tourKey} requested but tour ${activeTourKey} is already running`);
      return;
    }
    
    // Don't start if same tour is already running
    if (isTourRunning && activeTourKey === tourKey) {
      console.log(`⚠️ Tour ${tourKey} already running`);
      return;
    }
    
    console.log(`🎯 Starting tour: ${tourKey}`);
    
    setState(prev => ({
      ...prev,
      isRunning: true,
      stepIndex: 0,
      tourKey,
    }));
    
    setActiveTourKey(tourKey);
    setIsTourRunning(true);
  }, [loading, state.progress, isTourRunning, activeTourKey]);

  const completeTour = useCallback(async (tourKey: TourKey) => {
    console.log(`✅ Completing tour: ${tourKey}`);
    
    const updatedProgress = markTourCompleted(tourKey, state.progress);
    await saveTourProgress(updatedProgress);
    
    // Stop tour and unlock scroll via centralized state
    setActiveTourKey(null);
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
    setActiveTourKey(null);
    setIsTourRunning(false);
    
    // Mark as completed when skipped
    await completeTour(tourKey);
  }, [completeTour]);

  const updateProgress = useCallback(async (progressUpdate: Partial<TourProgress>) => {
    const updatedProgress = { ...state.progress, ...progressUpdate };
    await saveTourProgress(updatedProgress);
  }, [state.progress, saveTourProgress]);

  // Pure eligibility check - always return false if loading
  const isEligible = useCallback((tourKey: TourKey) => {
    if (loading) {
      return false;
    }
    
    return isEligibleForTour(tourKey, state.progress);
  }, [state.progress, loading]);

  const value: TourContextType = {
    state,
    startTour,
    completeTour,
    skipTour,
    updateProgress,
    isEligible,
    loading,
    isTourRunning, // Expose centralized tour running state
    activeTourKey, // Expose active tour key
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