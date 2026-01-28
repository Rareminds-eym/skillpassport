import React, { useEffect, useState, useRef } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useTour } from './TourProvider';
import { TOUR_KEYS } from './constants';
import { waitForElement } from './utils';
import {
  ASSESSMENT_RESULT_TOUR_STEPS,
  ASSESSMENT_RESULT_TOUR_OPTIONS,
  ASSESSMENT_RESULT_TOUR_STYLES,
  ASSESSMENT_RESULT_TOUR_LOCALE,
} from './configs';

const AssessmentResultTour: React.FC = () => {
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
      console.log('🎯 Assessment result tour: Starting eligibility check');
      
      // CRITICAL: Only run on assessment result page
      const isOnAssessmentResultPage = window.location.pathname.includes('/student/assessment/result');
      if (!isOnAssessmentResultPage) {
        console.log('❌ Assessment result tour: Not on assessment result page, skipping', {
          currentPath: window.location.pathname,
          expectedPath: '/student/assessment/result'
        });
        eligibilityChecked.current = true; // Mark as checked to prevent re-runs
        return;
      }
      
      // CRITICAL: Wait for tour progress to load before checking eligibility
      if (loading) {
        console.log('⏳ Assessment result tour: Tour progress still loading, waiting...');
        return; // Don't mark as checked yet, allow retry when loading completes
      }
      
      // Mark as checked only after we've confirmed we're on the right page and loading is complete
      eligibilityChecked.current = true;
      
      // PURE eligibility check - no side effects
      const eligible = isEligible(TOUR_KEYS.ASSESSMENT_RESULT);
      
      if (!eligible) {
        console.log('❌ Assessment result tour: Not eligible, skipping');
        return;
      }
      
      console.log('✅ Assessment result tour: Eligible, checking required elements');
      
      // Wait for key elements to be ready - look for existing tour elements
      const navigationActions = await waitForElement('[data-tour="navigation-actions"]', 3000);
      const reportHeader = await waitForElement('[data-tour="report-header"]', 5000);
      const aiSummary = await waitForElement('[data-tour="ai-summary"]', 3000);
      const careerTracks = await waitForElement('[data-tour="career-tracks"]', 3000);
      
      // Wait longer for individual career track elements since they're dynamically generated
      const careerTrack1 = await waitForElement('[data-tour="career-track-1"]', 5000);
      const careerTrack2 = await waitForElement('[data-tour="career-track-2"]', 5000);
      const careerTrack3 = await waitForElement('[data-tour="career-track-3"]', 5000);
      
      console.log('🎯 Assessment result tour: Element detection results', {
        navigationActions: !!navigationActions,
        reportHeader: !!reportHeader,
        aiSummary: !!aiSummary,
        careerTracks: !!careerTracks,
        careerTrack1: !!careerTrack1,
        careerTrack2: !!careerTrack2,
        careerTrack3: !!careerTrack3
      });
      
      // Start tour if we have basic elements AND at least one career track
      if ((navigationActions || reportHeader || aiSummary || careerTracks) && (careerTrack1 || careerTrack2 || careerTrack3)) {
        console.log('✅ Assessment result tour: Required elements found, starting tour');
        
        // Small delay to ensure page is fully rendered
        setTimeout(() => {
          tourStarted.current = true;
          setShouldRun(true);
          startTour(TOUR_KEYS.ASSESSMENT_RESULT); // This will trigger scroll lock via centralized state
        }, 1500); // Increased delay for career track elements to be ready
      } else {
        console.warn('❌ Assessment result tour: Required elements not found, skipping tour');
      }
    };

    checkAndStartTour();
  }, [loading, isEligible]); // CRITICAL: Depend on loading state and isEligible

  // CRITICAL: Reset eligibility check when loading completes and tour is not eligible
  // OR when page changes
  useEffect(() => {
    if (!loading && eligibilityChecked.current && !tourStarted.current) {
      const isOnAssessmentResultPage = window.location.pathname.includes('/student/assessment/result');
      const eligible = isEligible(TOUR_KEYS.ASSESSMENT_RESULT);
      
      if (!eligible || !isOnAssessmentResultPage) {
        console.log('🔄 Assessment result tour: Loading completed, tour not eligible or wrong page, resetting flags', {
          eligible,
          isOnAssessmentResultPage,
          currentPath: window.location.pathname
        });
        eligibilityChecked.current = false; // Allow future checks if needed
      }
    }
  }, [loading, isEligible]);

  // ADDITIONAL: Force re-check when loading changes from true to false
  useEffect(() => {
    if (!loading && !eligibilityChecked.current && !tourStarted.current) {
      console.log('🔄 Assessment result tour: Loading completed, forcing re-check');
      // Trigger the main effect by not preventing the check
    }
  }, [loading]);

  // FIXED: Handle tour events with proper cleanup
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    console.log('Tour callback:', { status, type, index, action });

    // FIXED: Proper tour completion and cleanup
    if (status === STATUS.FINISHED) {
      console.log('✅ Assessment result tour: Finished');
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT); // This will unlock scroll via centralized state
    } else if (status === STATUS.SKIPPED) {
      console.log('⏭️ Assessment result tour: Skipped');
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_RESULT); // This will unlock scroll via centralized state
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn('Tour target not found for step:', index);
    }
  };

  // FIXED: Cleanup effect - reset flags when component unmounts
  useEffect(() => {
    return () => {
      eligibilityChecked.current = false;
      tourStarted.current = false;
      setShouldRun(false);
      console.log('🔄 AssessmentResultTour unmounted - flags reset');
    };
  }, []);

  // FIXED: Don't render if not eligible, not running, or tour not started
  if (!isEligible(TOUR_KEYS.ASSESSMENT_RESULT) || !shouldRun || !tourStarted.current) {
    return null;
  }

  return (
    <Joyride
      steps={ASSESSMENT_RESULT_TOUR_STEPS}
      run={shouldRun}
      callback={handleJoyrideCallback}
      continuous={ASSESSMENT_RESULT_TOUR_OPTIONS.continuous}
      showProgress={ASSESSMENT_RESULT_TOUR_OPTIONS.showProgress}
      showSkipButton={ASSESSMENT_RESULT_TOUR_OPTIONS.showSkipButton}
      styles={ASSESSMENT_RESULT_TOUR_STYLES}
      locale={ASSESSMENT_RESULT_TOUR_LOCALE}
      disableOverlayClose={ASSESSMENT_RESULT_TOUR_OPTIONS.disableOverlayClose}
      disableCloseOnEsc={ASSESSMENT_RESULT_TOUR_OPTIONS.disableCloseOnEsc}
      hideCloseButton={ASSESSMENT_RESULT_TOUR_OPTIONS.hideCloseButton}
      scrollToFirstStep={ASSESSMENT_RESULT_TOUR_OPTIONS.scrollToFirstStep}
      spotlightPadding={ASSESSMENT_RESULT_TOUR_OPTIONS.spotlightPadding}
    />
  );
};

export default AssessmentResultTour;