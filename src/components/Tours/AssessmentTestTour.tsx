import React, { useEffect, useState, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTour } from './TourProvider';
import { TOUR_KEYS } from './constants';
import {
  ASSESSMENT_TEST_TOUR_STEPS,
  ASSESSMENT_TEST_TOUR_OPTIONS,
  ASSESSMENT_TEST_TOUR_STYLES,
  ASSESSMENT_TEST_TOUR_LOCALE,
} from './configs';

const AssessmentTestTour: React.FC = () => {
  const { startTour, completeTour, skipTour, isEligible, loading } = useTour();
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
      console.log('🎯 Assessment test tour: Starting eligibility check');
      
      // CRITICAL: Only run on assessment test page
      const isOnAssessmentTestPage = window.location.pathname.includes('/student/assessment/test');
      if (!isOnAssessmentTestPage) {
        console.log('❌ Assessment test tour: Not on assessment test page, skipping', {
          currentPath: window.location.pathname,
          expectedPath: '/student/assessment/test'
        });
        eligibilityChecked.current = true; // Mark as checked to prevent re-runs
        return;
      }
      
      // CRITICAL: Wait for tour progress to load before checking eligibility
      if (loading) {
        console.log('⏳ Assessment test tour: Tour progress still loading, waiting...');
        return; // Don't mark as checked yet, allow retry when loading completes
      }
      
      // Mark as checked only after we've confirmed we're on the right page and loading is complete
      eligibilityChecked.current = true;
      
      // PURE eligibility check - no side effects
      const eligible = isEligible(TOUR_KEYS.ASSESSMENT_TEST);
      
      if (!eligible) {
        console.log('❌ Assessment test tour: Not eligible, skipping');
        return;
      }
      
      console.log('✅ Assessment test tour: Eligible, checking required elements');
      
      // Simple check: only start when both required elements are present
      const requiredElements = {
        sectionProgress: !!document.querySelector('[data-tour="section-progress"]'),
        questionContent: !!document.querySelector('[data-tour="question-content"]')
      };

      if (!requiredElements.sectionProgress || !requiredElements.questionContent) {
        console.warn('❌ Assessment test tour: Required elements not found, skipping tour');
        return;
      }
      
      console.log('✅ Assessment test tour: Required elements found, starting tour');
      
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        tourStarted.current = true;
        setShouldRun(true);
        startTour(TOUR_KEYS.ASSESSMENT_TEST); // This will trigger scroll lock via centralized state
      }, 500);
    };

    checkAndStartTour();
  }, [loading, isEligible]); // CRITICAL: Depend on loading state and isEligible

  // CRITICAL: Reset eligibility check when loading completes and tour is not eligible
  // OR when page changes
  useEffect(() => {
    if (!loading && eligibilityChecked.current && !tourStarted.current) {
      const isOnAssessmentTestPage = window.location.pathname.includes('/student/assessment/test');
      const eligible = isEligible(TOUR_KEYS.ASSESSMENT_TEST);
      
      if (!eligible || !isOnAssessmentTestPage) {
        console.log('🔄 Assessment test tour: Loading completed, tour not eligible or wrong page, resetting flags', {
          eligible,
          isOnAssessmentTestPage,
          currentPath: window.location.pathname
        });
        eligibilityChecked.current = false; // Allow future checks if needed
      }
    }
  }, [loading, isEligible]);

  // ADDITIONAL: Force re-check when loading changes from true to false
  useEffect(() => {
    if (!loading && !eligibilityChecked.current && !tourStarted.current) {
      console.log('🔄 Assessment test tour: Loading completed, forcing re-check');
      // Trigger the main effect by not preventing the check
    }
  }, [loading]);

  // FIXED: Handle tour events with proper cleanup
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    // FIXED: Proper tour completion and cleanup
    if (status === STATUS.FINISHED) {
      console.log('✅ Assessment test tour: Finished');
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_TEST); // This will unlock scroll via centralized state
    } else if (status === STATUS.SKIPPED) {
      console.log('⏭️ Assessment test tour: Skipped');
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_TEST); // This will unlock scroll via centralized state
    }
  };

  // FIXED: Cleanup effect - reset flags when component unmounts
  useEffect(() => {
    return () => {
      eligibilityChecked.current = false;
      tourStarted.current = false;
      setShouldRun(false);
      console.log('🔄 AssessmentTestTour unmounted - flags reset');
    };
  }, []);

  // FIXED: Don't render if not eligible, not running, or tour not started
  if (!isEligible(TOUR_KEYS.ASSESSMENT_TEST) || !shouldRun || !tourStarted.current) {
    return null;
  }

  return (
    <Joyride
      steps={ASSESSMENT_TEST_TOUR_STEPS}
      run={shouldRun}
      callback={handleJoyrideCallback}
      continuous={ASSESSMENT_TEST_TOUR_OPTIONS.continuous}
      showProgress={ASSESSMENT_TEST_TOUR_OPTIONS.showProgress}
      showSkipButton={ASSESSMENT_TEST_TOUR_OPTIONS.showSkipButton}
      styles={ASSESSMENT_TEST_TOUR_STYLES}
      locale={ASSESSMENT_TEST_TOUR_LOCALE}
      disableOverlayClose={ASSESSMENT_TEST_TOUR_OPTIONS.disableOverlayClose}
      disableCloseOnEsc={ASSESSMENT_TEST_TOUR_OPTIONS.disableCloseOnEsc}
      hideCloseButton={ASSESSMENT_TEST_TOUR_OPTIONS.hideCloseButton}
      scrollToFirstStep={ASSESSMENT_TEST_TOUR_OPTIONS.scrollToFirstStep}
      spotlightPadding={ASSESSMENT_TEST_TOUR_OPTIONS.spotlightPadding}
    />
  );
};

export default AssessmentTestTour;