import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTour } from './TourProvider';
import { TOUR_KEYS } from './constants';
import { waitForElement, forceUnlockScroll, isScrollCurrentlyLocked } from './utils';
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
  const { state, startTour, completeTour, skipTour, isEligible } = useTour();
  const [shouldRun, setShouldRun] = useState(false);

  // Check if tour should run when component mounts
  useEffect(() => {
    const checkAndStartTour = async () => {
      // Only run if eligible and not already running
      if (isEligible(TOUR_KEYS.DASHBOARD) && !state.isRunning) {
        // Wait for key elements to be ready
        const assessmentCard = await waitForElement('[data-tour="assessment-card"]', 3000);
        const opportunitiesCard = await waitForElement('[data-tour="opportunities-card"]', 3000);
        
        // Debug: Check analytics tab element
        const analyticsTab = document.querySelector('[data-tour="analytics-tab"]') as HTMLElement;
        console.log('🔍 Analytics Tab Element Check:', {
          element: analyticsTab,
          exists: !!analyticsTab,
          visible: analyticsTab ? window.getComputedStyle(analyticsTab).display !== 'none' : false,
          rect: analyticsTab?.getBoundingClientRect(),
          offsetParent: analyticsTab?.offsetParent,
        });
        
        if (assessmentCard && opportunitiesCard) {
          // Small delay to ensure page is fully rendered
          setTimeout(() => {
            setShouldRun(true);
            startTour(TOUR_KEYS.DASHBOARD);
            // Scroll lock is now handled globally in TourProvider
          }, 500);
        } else {
          console.warn('Dashboard tour: Required elements not found, skipping tour');
        }
      }
    };

    checkAndStartTour();
  }, [isEligible, state.isRunning, startTour]);

  // Handle tour events with professional scroll management
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
      scrollLocked: isScrollCurrentlyLocked(),
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position
    });

    if (status === STATUS.FINISHED) {
      setShouldRun(false);
      completeTour(TOUR_KEYS.DASHBOARD);
      // Force unlock scroll to ensure scrollbar is restored
      setTimeout(() => {
        forceUnlockScroll();
        console.log('🔓 Dashboard tour completed - scroll forcefully unlocked');
      }, 100);
    } else if (status === STATUS.SKIPPED) {
      setShouldRun(false);
      skipTour(TOUR_KEYS.DASHBOARD);
      // Force unlock scroll to ensure scrollbar is restored
      setTimeout(() => {
        forceUnlockScroll();
        console.log('🔓 Dashboard tour skipped - scroll forcefully unlocked');
      }, 100);
    }
  };

  // Cleanup effect - ensure scroll is always unlocked when component unmounts
  useEffect(() => {
    return () => {
      // Force unlock scroll when component unmounts
      forceUnlockScroll();
      console.log('🔓 StudentDashboardTour unmounted - scroll unlocked');
    };
  }, []);

  // Additional cleanup when shouldRun changes to false
  useEffect(() => {
    if (!shouldRun) {
      // Small delay to ensure tour has fully stopped
      setTimeout(() => {
        forceUnlockScroll();
        console.log('🔓 Tour stopped - scroll unlocked');
      }, 200);
    }
  }, [shouldRun]);

  // Don't render if not eligible or not running
  if (!isEligible(TOUR_KEYS.DASHBOARD) || !shouldRun) {
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