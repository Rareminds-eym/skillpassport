import React, { useEffect, useState, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTour } from './TourProvider';
import { TOUR_KEYS } from './constants';
import { waitForElement } from './utils';
import {
  DASHBOARD_TOUR_STEPS,
  DASHBOARD_TOUR_OPTIONS,
  DASHBOARD_TOUR_STYLES,
  DASHBOARD_TOUR_LOCALE,
} from './configs';

// Professional scroll management for tour steps
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
const STEPS_NEEDING_SCROLL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; // Navigation steps, Dashboard tab, Analytics tab, and all dashboard cards

const StudentDashboardTour: React.FC = () => {
  const { startTour, completeTour, skipTour, isEligible, isTourRunning, loading } = useTour();
  const [shouldRun, setShouldRun] = useState(false);
  
  // Prevent multiple eligibility checks
  const eligibilityChecked = useRef(false);
  const tourStarted = useRef(false);

  // FIXED: Check eligibility and start tour ONLY once when component mounts
  // AND only after tour progress has loaded
  // AND only on the correct page
  useEffect(() => {
    // Prevent duplicate checks
    if (eligibilityChecked.current || tourStarted.current) {
      return;
    }
    
    const checkAndStartTour = async () => {
      console.log('🎯 Dashboard tour: Starting eligibility check');
      
      // CRITICAL: Only run on dashboard page
      const isOnDashboardPage = window.location.pathname === '/student/dashboard';
      if (!isOnDashboardPage) {
        console.log('❌ Dashboard tour: Not on dashboard page, skipping', {
          currentPath: window.location.pathname,
          expectedPath: '/student/dashboard'
        });
        eligibilityChecked.current = true; // Mark as checked to prevent re-runs
        return;
      }
      
      // CRITICAL: Wait for tour progress to load before checking eligibility
      if (loading) {
        console.log('⏳ Dashboard tour: Tour progress still loading, waiting...');
        return; // Don't mark as checked yet, allow retry when loading completes
      }
      
      // Mark as checked only after we've confirmed we're on the right page and loading is complete
      eligibilityChecked.current = true;
      
      // PURE eligibility check - no side effects
      const eligible = isEligible(TOUR_KEYS.DASHBOARD);
      
      if (!eligible) {
        console.log('❌ Dashboard tour: Not eligible, skipping');
        return;
      }
      
      console.log('✅ Dashboard tour: Eligible, checking required elements');
      
      // Wait for key elements to be ready
      const assessmentCard = await waitForElement('[data-tour="assessment-card"]', 3000);
      const opportunitiesCard = await waitForElement('[data-tour="opportunities-card"]', 3000);
      
      if (!assessmentCard || !opportunitiesCard) {
        console.warn('❌ Dashboard tour: Required elements not found, skipping tour');
        return;
      }
      
      console.log('✅ Dashboard tour: Required elements found, starting tour');
      
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        tourStarted.current = true;
        setShouldRun(true);
        startTour(TOUR_KEYS.DASHBOARD); // This will trigger scroll lock via centralized state
      }, 500);
    };

    checkAndStartTour();
  }, [loading, isEligible]); // CRITICAL: Depend on loading state and isEligible

  // CRITICAL: Reset eligibility check when loading completes and tour is not eligible
  // OR when page changes
  useEffect(() => {
    if (!loading && eligibilityChecked.current && !tourStarted.current) {
      const isOnDashboardPage = window.location.pathname === '/student/dashboard';
      const eligible = isEligible(TOUR_KEYS.DASHBOARD);
      
      if (!eligible || !isOnDashboardPage) {
        console.log('🔄 Dashboard tour: Loading completed, tour not eligible or wrong page, resetting flags', {
          eligible,
          isOnDashboardPage,
          currentPath: window.location.pathname
        });
        eligibilityChecked.current = false; // Allow future checks if needed
      }
    }
  }, [loading, isEligible]);

  // ADDITIONAL: Force re-check when loading changes from true to false
  useEffect(() => {
    if (!loading && !eligibilityChecked.current && !tourStarted.current) {
      console.log('🔄 Dashboard tour: Loading completed, forcing re-check');
      // Trigger the main effect by not preventing the check
    }
  }, [loading]);

  // FIXED: Handle tour events with proper cleanup
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action, step } = data;

    // Professional scroll management for specific steps
    if (type === 'step:before' && STEPS_NEEDING_SCROLL.includes(index)) {
      const targetElement = document.querySelector(step?.target as string);
      if (targetElement) {
        console.log(`🎯 Professional scroll management for step ${index}:`, {
          target: step?.target,
          element: targetElement,
          elementRect: targetElement.getBoundingClientRect(),
          currentScrollY: window.scrollY,
          isVisible: targetElement.getBoundingClientRect().top >= 0 && 
                     targetElement.getBoundingClientRect().bottom <= window.innerHeight
        });
        
        // Custom smooth scroll to ensure element is properly positioned
        setTimeout(() => {
          scrollToElementSmooth(targetElement, index);
        }, 100);
      }
    }

    // Debug logging for Analytics View step
    if (index === 7) { // Analytics View is step 7 (0-indexed)
      console.log('🔍 Analytics View Tour Step Debug:', {
        status,
        type,
        index,
        action,
        target: step?.target,
        placement: step?.placement,
        disableScrolling: step?.disableScrolling,
        floaterProps: step?.floaterProps,
        element: document.querySelector('[data-tour="analytics-tab"]'),
        elementRect: document.querySelector('[data-tour="analytics-tab"]')?.getBoundingClientRect(),
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight
      });
    }

    // Debug logging for Dashboard Card steps
    if (index >= 8 && index <= 17) {
      const cardNames: { [key: number]: string } = {
        8: 'Assessment Card',
        9: 'Training Card', 
        10: 'Opportunities Card',
        11: 'Projects Card',
        12: 'Certificates Card',
        13: 'Experience Card',
        14: 'Education Card',
        15: 'Technical Skills Card',
        16: 'Soft Skills Card',
        17: 'Floating AI Button'
      };
      
      console.log(`🎯 ${cardNames[index]} Debug:`, {
        status,
        type,
        index,
        action,
        target: step?.target,
        element: document.querySelector(step?.target as string),
        elementRect: document.querySelector(step?.target as string)?.getBoundingClientRect(),
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight
      });
    }

    // General debug logging for all steps
    console.log('🎯 Tour Step Debug:', {
      stepIndex: index,
      stepTarget: step?.target,
      status,
      type,
      action,
      element: step?.target ? document.querySelector(step.target as string) : null,
      isTourRunning,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position
    });

    // FIXED: Proper tour completion and cleanup
    if (status === STATUS.FINISHED) {
      console.log('✅ Dashboard tour: Finished');
      setShouldRun(false);
      completeTour(TOUR_KEYS.DASHBOARD); // This will unlock scroll via centralized state
    } else if (status === STATUS.SKIPPED) {
      console.log('⏭️ Dashboard tour: Skipped');
      setShouldRun(false);
      skipTour(TOUR_KEYS.DASHBOARD); // This will unlock scroll via centralized state
    }
  };

  // FIXED: Cleanup effect - reset flags when component unmounts
  useEffect(() => {
    return () => {
      eligibilityChecked.current = false;
      tourStarted.current = false;
      setShouldRun(false);
      console.log('🔄 StudentDashboardTour unmounted - flags reset');
    };
  }, []);

  // FIXED: Don't render if not eligible, not running, or tour not started
  if (!isEligible(TOUR_KEYS.DASHBOARD) || !shouldRun || !tourStarted.current) {
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