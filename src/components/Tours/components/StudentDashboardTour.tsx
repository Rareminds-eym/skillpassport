import React, { useEffect, useState, useRef, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTour } from '../TourProvider';
import { TOUR_KEYS } from '../constants';
import { waitForElement } from '../utils';
import {
  DASHBOARD_TOUR_STEPS,
  DASHBOARD_TOUR_OPTIONS,
  DASHBOARD_TOUR_STYLES,
  DASHBOARD_TOUR_LOCALE,
} from '../configs';

// Professional scroll management for tour steps - memoized
const scrollToElementSmooth = (element: Element, stepIndex: number) => {
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.pageYOffset;
  
  // Different scroll offsets for different types of elements
  let offset = 120; // Default offset
  
  if (stepIndex >= 1 && stepIndex <= 5) {
    // Navigation elements need to scroll to top with minimal offset
    offset = 80;
  } else if (stepIndex >= 8 && stepIndex <= 17) {
    // Dashboard cards need more offset to show properly
    offset = 100;
  } else if (stepIndex === 6 || stepIndex === 7) {
    // Tab elements need less offset
    offset = 100;
  }
  
  const targetScrollTop = absoluteElementTop - offset;
  
  console.log(`📍 Scrolling to step ${stepIndex}:`, {
    element: element.tagName,
    elementRect,
    absoluteElementTop,
    offset,
    targetScrollTop: Math.max(0, targetScrollTop),
    currentScrollY: window.scrollY
  });
  
  window.scrollTo({
    top: Math.max(0, targetScrollTop),
    behavior: 'smooth'
  });
};

// Steps that need custom scroll handling (navigation, tabs and cards that might be off-screen)
const STEPS_NEEDING_SCROLL = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]); // Use Set for O(1) lookup

const StudentDashboardTour: React.FC = () => {
  const { startTour, completeTour, skipTour, isEligible, loading } = useTour();
  const [shouldRun, setShouldRun] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const tourStarted = useRef(false);
  const checkInProgress = useRef(false);

  // STEP 1: Wait for prerequisites - simplified (route check removed, handled by TourWrapper)
  useEffect(() => {
    if (!loading && isEligible(TOUR_KEYS.DASHBOARD) && !isReady && !tourStarted.current) {
      console.log('✅ Dashboard tour: Prerequisites met');
      setIsReady(true);
    }
  }, [loading, isEligible, isReady]);

  // STEP 2: Once ready, wait for dashboard elements and start tour
  useEffect(() => {
    if (!isReady || tourStarted.current || checkInProgress.current) {
      return;
    }

    checkInProgress.current = true;

    const startTourWhenReady = async () => {
      console.log('🎯 Dashboard tour: Waiting for dashboard elements...');
      
      // Wait for both critical elements with a reasonable timeout
      const [assessmentCard, opportunitiesCard] = await Promise.all([
        waitForElement('[data-tour="assessment-card"]', 15000),
        waitForElement('[data-tour="opportunities-card"]', 15000)
      ]);
      
      if (!assessmentCard || !opportunitiesCard) {
        console.warn('❌ Dashboard tour: Required elements not found, tour will not start');
        checkInProgress.current = false;
        return;
      }
      
      console.log('✅ Dashboard tour: All elements ready, starting tour');
      
      // Mark as started to prevent duplicate starts
      tourStarted.current = true;
      
      // Start the tour
      setShouldRun(true);
      startTour(TOUR_KEYS.DASHBOARD);
      
      checkInProgress.current = false;
    };

    startTourWhenReady();
  }, [isReady, startTour]);

  // STEP 3: Handle tour completion and cleanup - memoized callback
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, step } = data;

    // Professional scroll management for specific steps - use Set for faster lookup
    if (type === 'step:before' && STEPS_NEEDING_SCROLL.has(index)) {
      const targetElement = document.querySelector(step?.target as string);
      if (targetElement) {
        setTimeout(() => {
          scrollToElementSmooth(targetElement, index);
        }, 100);
      }
    }

    // Tour completion
    if (status === STATUS.FINISHED) {
      console.log('✅ Dashboard tour: Finished');
      setShouldRun(false);
      completeTour(TOUR_KEYS.DASHBOARD);
    } else if (status === STATUS.SKIPPED) {
      console.log('⏭️ Dashboard tour: Skipped');
      setShouldRun(false);
      skipTour(TOUR_KEYS.DASHBOARD);
    }
  }, [completeTour, skipTour]);

  // STEP 4: Cleanup on unmount
  useEffect(() => {
    return () => {
      tourStarted.current = false;
      checkInProgress.current = false;
      setIsReady(false);
      setShouldRun(false);
      console.log('🔄 StudentDashboardTour unmounted - state reset');
    };
  }, []);

  // Don't render if not ready or already started
  if (!shouldRun || !tourStarted.current) {
    return null;
  }

  return (
    <Joyride
      steps={DASHBOARD_TOUR_STEPS}
      run={shouldRun}
      callback={handleJoyrideCallback}
      continuous={DASHBOARD_TOUR_OPTIONS.continuous}
      showProgress={DASHBOARD_TOUR_OPTIONS.showProgress}
      showSkipButton={DASHBOARD_TOUR_OPTIONS.showSkipButton}
      styles={DASHBOARD_TOUR_STYLES as any}
      locale={DASHBOARD_TOUR_LOCALE as any}
      disableOverlayClose={DASHBOARD_TOUR_OPTIONS.disableOverlayClose}
      hideCloseButton={DASHBOARD_TOUR_OPTIONS.hideCloseButton}
      spotlightClicks={DASHBOARD_TOUR_OPTIONS.spotlightClicks}
      disableScrolling={DASHBOARD_TOUR_OPTIONS.disableScrolling}
    />
  );
};

export default StudentDashboardTour;