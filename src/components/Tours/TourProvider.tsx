import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useMemo, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { TourConfig, TourState } from './types';
import { useTourProgress } from './hooks/useTourProgress';

interface TourContextType {
  startTour: (config: TourConfig) => void;
  stopTour: () => void;
  resetTour: (tourId: string) => void;
  isTourActive: boolean;
  currentTourId: string | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [tourState, setTourState] = useState<TourState>({
    run: false,
    stepIndex: 0,
    tourActive: false
  });
  
  const [currentConfig, setCurrentConfig] = useState<TourConfig | null>(null);
  const [currentTourId, setCurrentTourId] = useState<string | null>(null);

  // Store tour progress methods in a ref to avoid calling hooks conditionally
  const tourProgressRef = useRef<any>(null);

  // Cleanup tour on page navigation/unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (tourState.tourActive) {
        console.log('🧹 TourProvider: Cleaning up tour on page unload');
        setTourState({
          run: false,
          stepIndex: 0,
          tourActive: false
        });
        setCurrentConfig(null);
        setCurrentTourId(null);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && tourState.tourActive) {
        console.log('🧹 TourProvider: Page hidden, stopping tour');
        setTourState(prev => ({
          ...prev,
          run: false,
          tourActive: false
        }));
      }
    };

    // Handle hash/URL changes (for SPA navigation)
    const handleHashChange = () => {
      if (tourState.tourActive) {
        console.log('🧹 TourProvider: URL changed, stopping tour');
        setTourState(prev => ({
          ...prev,
          run: false,
          tourActive: false
        }));
        setCurrentConfig(null);
        setCurrentTourId(null);
      }
    };

    // Handle popstate (back/forward navigation)
    const handlePopState = () => {
      if (tourState.tourActive) {
        console.log('🧹 TourProvider: Navigation detected, stopping tour');
        setTourState(prev => ({
          ...prev,
          run: false,
          tourActive: false
        }));
        setCurrentConfig(null);
        setCurrentTourId(null);
      }
    };

    // Listen for various navigation events
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Force cleanup on unmount
      if (tourState.tourActive) {
        console.log('🧹 TourProvider: Force cleanup on unmount');
        setTourState({
          run: false,
          stepIndex: 0,
          tourActive: false
        });
      }
    };
  }, [tourState.tourActive]);

  const startTour = useCallback((config: TourConfig) => {
    setCurrentConfig(config);
    setCurrentTourId(config.id);
    setTourState({
      run: true,
      stepIndex: 0,
      tourActive: true
    });
  }, []);

  const stopTour = useCallback(() => {
    console.log('🛑 TourProvider: Stopping tour');
    setTourState(prev => ({
      ...prev,
      run: false,
      tourActive: false
    }));
    // Clear config to prevent restart
    setCurrentConfig(null);
    setCurrentTourId(null);
  }, []);

  const resetTour = useCallback((tourId: string) => {
    if (tourId === currentTourId) {
      stopTour();
    }
  }, [currentTourId, stopTour]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action, step } = data;

    console.log('🎯 Tour callback:', { status, type, index, action, step: step?.target });

    // Only proceed if we have a valid current tour ID and tour progress methods
    if (!currentTourId || !tourProgressRef.current) {
      return;
    }

    const tourProgress = tourProgressRef.current;

    // Handle overlay clicks and other interaction events
    if (type === 'overlay') {
      console.log('👆 User clicked overlay - tour continues');
      // Don't close tour on overlay click, just log it
      return;
    }

    // Handle tooltip clicks
    if (type === 'tooltip') {
      console.log('💬 User interacted with tooltip');
      return;
    }

    // Custom scrolling logic for better centering (only if enabled)
    if ((type === EVENTS.STEP_BEFORE || type === EVENTS.BEACON) && currentConfig?.options?.customScrolling !== false) {
      const target = step?.target;
      if (target && typeof target === 'string') {
        const element = document.querySelector(target);
        if (element) {
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const elementHeight = rect.height;
          
          // Calculate if element needs to be centered
          const isElementVisible = rect.top >= 0 && rect.bottom <= windowHeight;
          const isElementPartiallyVisible = rect.top < windowHeight && rect.bottom > 0;
          
          if (!isElementVisible || !isElementPartiallyVisible) {
            // Calculate center position
            const elementCenter = rect.top + window.scrollY + (elementHeight / 2);
            const windowCenter = windowHeight / 2;
            const targetScrollY = elementCenter - windowCenter;
            
            // Apply offset from configuration
            const offset = currentConfig?.options?.scrollOffset ?? 80;
            const finalScrollY = Math.max(0, targetScrollY - offset);
            
            console.log('🎯 Custom scroll centering:', {
              element: target,
              elementTop: rect.top,
              elementHeight,
              elementCenter,
              windowCenter,
              targetScrollY,
              finalScrollY,
              offset,
              isVisible: isElementVisible
            });
            
            // Add a small delay to ensure the tour step is ready
            setTimeout(() => {
              window.scrollTo({
                top: finalScrollY,
                behavior: 'smooth'
              });
            }, 100);
          }
        }
      }
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Update step progress (debounced in hook)
      tourProgress.updateStep(index);
      
      setTourState(prev => ({
        ...prev,
        stepIndex: index + (action === 'next' ? 1 : action === 'prev' ? -1 : 0)
      }));
    }

    // Handle completion/skip - cleanup UI state only (completion saving is handled in TourWrapper)
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      console.log(`🏁 TourProvider: Tour ${status}, cleaning up UI state only`);
      
      // Immediately stop the tour to prevent restart
      setTourState(prev => ({
        ...prev,
        run: false,
        tourActive: false
      }));
      
      // Clear current config to prevent restart
      setCurrentConfig(null);
      setCurrentTourId(null);
    }

    // Handle target not found - continue tour
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.log('⚠️ Tour target not found, continuing to next step');
      setTourState(prev => ({
        ...prev,
        stepIndex: prev.stepIndex + 1
      }));
    }

    // Handle tour errors
    if (status === STATUS.ERROR) {
      console.error('❌ Tour error occurred:', data);
      // Continue tour despite error
    }

    // Handle tour paused state
    if (status === STATUS.PAUSED) {
      console.log('⏸️ Tour paused');
    }

    // Handle tour running state
    if (status === STATUS.RUNNING) {
      console.log('▶️ Tour running');
    }
  }, [currentTourId, currentConfig]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<TourContextType>(() => ({
    startTour,
    stopTour,
    resetTour,
    isTourActive: tourState.tourActive,
    currentTourId
  }), [startTour, stopTour, resetTour, tourState.tourActive, currentTourId]);

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {currentConfig && (
        <TourWrapper 
          config={currentConfig}
          tourState={tourState}
          onCallback={handleJoyrideCallback}
          tourProgressRef={tourProgressRef}
        />
      )}
    </TourContext.Provider>
  );
};

// Memoized TourWrapper to prevent unnecessary re-renders
const TourWrapper = React.memo<{
  config: TourConfig;
  tourState: TourState;
  onCallback: (data: CallBackProps) => void;
  tourProgressRef: React.MutableRefObject<any>;
}>(({ config, tourState, onCallback, tourProgressRef }) => {
  const tourProgress = useTourProgress(config.id);
  
  // Store the tour progress methods in the ref
  tourProgressRef.current = tourProgress;

  // Create a callback that has access to the latest tourProgress methods
  const handleCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;
    
    console.log('🎯 TourWrapper callback:', { 
      status, 
      type, 
      index, 
      action,
      statusFinished: status === STATUS.FINISHED,
      statusSkipped: status === STATUS.SKIPPED,
      statusValues: { STATUS_FINISHED: STATUS.FINISHED, STATUS_SKIPPED: STATUS.SKIPPED }
    });

    // Handle completion directly here with access to fresh tourProgress methods
    if (status === STATUS.FINISHED) {
      console.log('✅ TourWrapper: Tour finished, calling completeTour directly');
      console.log('🔍 TourProgress methods available:', {
        hasCompleteTour: typeof tourProgress.completeTour === 'function',
        tourProgressKeys: Object.keys(tourProgress)
      });
      
      if (typeof tourProgress.completeTour === 'function') {
        tourProgress.completeTour().then(() => {
          console.log('✅ TourWrapper: Tour completion saved successfully');
        }).catch((error: any) => {
          console.error('❌ TourWrapper: Error saving tour completion:', error);
        });
      } else {
        console.error('❌ TourWrapper: completeTour method not available');
      }
    } else if (status === STATUS.SKIPPED) {
      console.log('🚫 TourWrapper: Tour skipped, calling skipTour directly');
      console.log('🔍 TourProgress methods available:', {
        hasSkipTour: typeof tourProgress.skipTour === 'function',
        tourProgressKeys: Object.keys(tourProgress)
      });
      
      if (typeof tourProgress.skipTour === 'function') {
        tourProgress.skipTour().then(() => {
          console.log('✅ TourWrapper: Tour skip saved successfully');
        }).catch((error: any) => {
          console.error('❌ TourWrapper: Error saving tour skip:', error);
        });
      } else {
        console.error('❌ TourWrapper: skipTour method not available');
      }
    }

    // Call the original callback for other handling
    onCallback(data);
  }, [tourProgress, onCallback]);

  // Start the tour when component mounts - optimized with proper dependencies
  React.useEffect(() => {
    console.log('🎯 TourWrapper: Checking if should start tour:', {
      tourActive: tourState.tourActive,
      loading: tourProgress.loading,
      hasStartTour: !!tourProgress.startTour,
      isCompleted: tourProgress.isCompleted,
      isSkipped: tourProgress.isSkipped,
      progressStatus: tourProgress.progress?.status
    });
    
    if (tourState.tourActive && !tourProgress.loading && tourProgress.startTour) {
      // Additional safeguard: don't start if tour is already completed or skipped
      if (tourProgress.isCompleted || tourProgress.isSkipped) {
        console.log('🛑 TourWrapper: Tour already completed/skipped, not starting');
        return;
      }
      
      console.log('🚀 TourWrapper: All conditions met, starting tour in 100ms');
      const timer = setTimeout(() => {
        console.log('🚀 TourWrapper: Starting tour now');
        tourProgress.startTour();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      console.log('🛑 TourWrapper: Tour start conditions not met');
    }
  }, [tourState.tourActive, tourProgress.loading, tourProgress.startTour, tourProgress.isCompleted, tourProgress.isSkipped, tourProgress.progress]);

  // Memoize Joyride props to prevent unnecessary re-renders
  const joyrideProps = useMemo(() => ({
    steps: config.steps,
    run: tourState.run,
    stepIndex: tourState.stepIndex,
    continuous: config.options?.continuous ?? true,
    showProgress: config.options?.showProgress ?? true,
    showSkipButton: config.options?.showSkipButton ?? true,
    spotlightClicks: config.options?.spotlightClicks ?? false,
    disableOverlayClose: config.options?.disableOverlayClose ?? false,
    hideCloseButton: config.options?.hideCloseButton ?? false,
    // Conditionally disable default scrolling if custom scrolling is enabled
    disableScrolling: config.options?.customScrolling !== false ? true : (config.options?.disableScrolling ?? false),
    scrollToFirstStep: config.options?.customScrolling !== false ? false : (config.options?.scrollToFirstStep ?? true),
    scrollOffset: config.options?.scrollOffset ?? 20,
    disableScrollParentFix: config.options?.disableScrollParentFix ?? false,
    styles: config.options?.styles,
    callback: handleCallback, // Use the new callback that handles completion directly
    locale: {
      back: 'Previous',
      close: 'Close',
      last: 'Finish Tour',
      next: 'Next',
      skip: 'Skip Tour'
    }
  }), [config, tourState.run, tourState.stepIndex, handleCallback]);

  return <Joyride {...joyrideProps} />;
});

TourWrapper.displayName = 'TourWrapper';

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};