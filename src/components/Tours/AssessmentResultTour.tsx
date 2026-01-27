import React, { useEffect, useState } from 'react';
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
  const { state, startTour, completeTour, skipTour, isEligible } = useTour();
  const [shouldRun, setShouldRun] = useState(false);

  // Check if tour should run when component mounts
  useEffect(() => {
    const checkAndStartTour = async () => {
      console.log('🎯 Assessment Result Tour: Starting eligibility check', {
        eligible: isEligible(TOUR_KEYS.ASSESSMENT_RESULT),
        isRunning: state.isRunning,
        currentPath: window.location.pathname,
        tourKey: TOUR_KEYS.ASSESSMENT_RESULT
      });
      
      // Only run if eligible and not already running
      if (isEligible(TOUR_KEYS.ASSESSMENT_RESULT) && !state.isRunning) {
        console.log('🎯 Assessment Result Tour: Eligible! Checking for elements...');
        
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
          console.log('🎯 Assessment result tour: Starting tour with available elements', {
            navigationActions: !!navigationActions,
            reportHeader: !!reportHeader,
            aiSummary: !!aiSummary,
            careerTracks: !!careerTracks,
            individualTracks: {
              track1: !!careerTrack1,
              track2: !!careerTrack2,
              track3: !!careerTrack3
            }
          });
          
          // Small delay to ensure page is fully rendered
          setTimeout(() => {
            setShouldRun(true);
            startTour(TOUR_KEYS.ASSESSMENT_RESULT);
            console.log('🎯 Assessment result tour: Tour started!');
            // Scroll lock is now handled globally in TourProvider
          }, 1500); // Increased delay for career track elements to be ready
        } else {
          console.warn('🎯 Assessment result tour: Required elements not found, skipping tour', {
            hasBasicElements: !!(navigationActions || reportHeader || aiSummary || careerTracks),
            hasCareerTracks: !!(careerTrack1 || careerTrack2 || careerTrack3)
          });
        }
      } else {
        console.log('🎯 Assessment result tour: Not eligible or already running', {
          eligible: isEligible(TOUR_KEYS.ASSESSMENT_RESULT),
          isRunning: state.isRunning,
          currentPath: window.location.pathname
        });
      }
    };

    checkAndStartTour();
  }, [isEligible, state.isRunning, startTour]);

  // Handle tour events
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    console.log('Tour callback:', { status, type, index, action });

    // Handle tour completion/skipping
    if (status === STATUS.FINISHED) {
      console.log('Tour finished');
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
      // Scroll unlock is now handled globally in TourProvider
    } else if (status === STATUS.SKIPPED) {
      console.log('Tour skipped');
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_RESULT);
      // Scroll unlock is now handled globally in TourProvider
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn('Tour target not found for step:', index);
    }
  };

  // Cleanup effect - scroll unlock is now handled globally
  useEffect(() => {
    return () => {
      // Global cleanup is handled by TourProvider
    };
  }, [shouldRun]);

  // Don't render if not eligible or not running
  if (!isEligible(TOUR_KEYS.ASSESSMENT_RESULT) || !shouldRun) {
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