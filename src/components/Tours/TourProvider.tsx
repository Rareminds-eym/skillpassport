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
  
  // Single source of truth for tour running state
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [activeTourKey, setActiveTourKey] = useState<TourKey | null>(null);
  
  // Prevent duplicate eligibility checks
  const lastEligibilityCheck = useRef<{ [key: string]: boolean }>({});

  // Load tour progress from database or localStorage
  const loadTourProgress = useCallback(async () => {
    setLoading(true);
    
    // CRITICAL: Clear any existing eligibility cache when loading starts
    lastEligibilityCheck.current = {};
    
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
          // Also sync to localStorage for consistency
          saveTourProgressToStorage(progress);
        } else {
          console.log('📚 No tour progress in database, checking localStorage');
          // Fallback to localStorage
          progress = getTourProgressFromStorage();
          
          // If localStorage has data but database doesn't, sync to database
          if (Object.keys(progress).length > 0) {
            console.log('📚 Syncing localStorage tour progress to database');
            const { error: syncError } = await supabase
              .from('students')
              .update({ tour_progress: progress })
              .eq('id', studentId);
            if (syncError) {
              console.warn('Failed to sync tour progress to database:', syncError);
            }
          }
        }
      } else {
        // No student ID, use localStorage only
        progress = getTourProgressFromStorage();
      }
      
      setState(prev => ({ ...prev, progress }));
      
      // CRITICAL: Clear eligibility cache after progress is loaded
      lastEligibilityCheck.current = {};
      
    } catch (error) {
      console.error('Failed to load tour progress:', error);
      // Fallback to localStorage
      const progress = getTourProgressFromStorage();
      setState(prev => ({ ...prev, progress }));
    } finally {
      setLoading(false);
      console.log('📚 Tour progress loading completed');
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
  // Added debouncing to prevent rapid lock/unlock cycles
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isTourRunning) {
        lockScroll();
        console.log('🔒 Scroll locked - tour is running');
      } else {
        forceUnlockScroll();
        console.log('🔓 Scroll unlocked - no tour running');
      }
    }, 100); // Small delay to prevent rapid changes

    return () => clearTimeout(timeoutId);
  }, [isTourRunning]);

  // CRITICAL: Safety mechanism - if loading completes and a tour is running but shouldn't be
  useEffect(() => {
    if (!loading && isTourRunning && activeTourKey) {
      // Double-check if the currently running tour should still be eligible
      const stillEligible = isEligibleForTour(activeTourKey, state.progress);
      if (!stillEligible) {
        console.warn(`🚨 Tour ${activeTourKey} was running but is no longer eligible after loading completed - stopping tour`);
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

  // Cleanup on unmount - ensure scroll is unlocked
  useEffect(() => {
    return () => {
      setActiveTourKey(null);
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
        setActiveTourKey(null);
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

  // FIXED: startTour with race condition prevention
  // Scroll lock is handled by the centralized effect above
  const startTour = useCallback((tourKey: TourKey) => {
    // CRITICAL: Don't start if loading is still in progress
    if (loading) {
      console.log(`⚠️ Tour ${tourKey} requested but tour progress is still loading`);
      return;
    }
    
    // CRITICAL: Double-check eligibility before starting (prevents race condition)
    if (!isEligibleForTour(tourKey, state.progress)) {
      console.log(`⚠️ Tour ${tourKey} requested but is not eligible (race condition prevented)`);
      return;
    }
    
    // Prevent starting a new tour if one is already running
    if (isTourRunning && activeTourKey !== tourKey) {
      console.log(`⚠️ Tour ${tourKey} requested but tour ${activeTourKey} is already running`);
      return;
    }
    
    // Prevent duplicate starts of the same tour
    if (isTourRunning && activeTourKey === tourKey) {
      console.log(`⚠️ Tour ${tourKey} already running, ignoring duplicate start request`);
      return;
    }
    
    console.log(`🎯 Starting tour: ${tourKey}`);
    
    setState(prev => ({
      ...prev,
      isRunning: true,
      stepIndex: 0,
      tourKey,
    }));
    
    // Set the centralized tour running state
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

  // FIXED: Pure eligibility check with caching to prevent duplicate checks
  // CRITICAL: Always return false if still loading to prevent race conditions
  const isEligible = useCallback((tourKey: TourKey) => {
    // CRITICAL: Never allow tours to be eligible while loading
    if (loading) {
      return false;
    }
    
    // Prevent duplicate checks during rapid re-renders
    const cacheKey = `${tourKey}_${JSON.stringify(state.progress)}_${loading}`;
    if (lastEligibilityCheck.current[cacheKey] !== undefined) {
      return lastEligibilityCheck.current[cacheKey];
    }
    
    const eligible = isEligibleForTour(tourKey, state.progress);
    lastEligibilityCheck.current[cacheKey] = eligible;
    
    console.log(`🎯 Eligibility check for ${tourKey}: ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (loading: ${loading})`);
    return eligible;
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