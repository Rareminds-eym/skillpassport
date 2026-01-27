import React, { useEffect, useState } from 'react';
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
  const { state, startTour, completeTour, skipTour, isEligible } = useTour();
  const [shouldRun, setShouldRun] = useState(false);

  // Check if tour should run when component mounts
  useEffect(() => {
    const checkAndStartTour = async () => {
      // Only run if eligible and not already running
      if (isEligible(TOUR_KEYS.ASSESSMENT_TEST) && !state.isRunning) {
        // Simple check: only start when both required elements are present
        const requiredElements = [
          '[data-tour="section-progress"]',
          '[data-tour="question-content"]'
        ];

        const elementsReady = {
          sectionProgress: !!document.querySelector('[data-tour="section-progress"]'),
          questionContent: !!document.querySelector('[data-tour="question-content"]')
        };

        // Only start tour if both required elements are present
        if (elementsReady.sectionProgress && elementsReady.questionContent) {
          // Small delay to ensure page is fully rendered
          setTimeout(() => {
            setShouldRun(true);
            startTour(TOUR_KEYS.ASSESSMENT_TEST);
          }, 500);
        } else {
          console.warn('Assessment test tour: Required elements not found, skipping tour');
        }
      }
    };

    checkAndStartTour();
  }, [isEligible, state.isRunning, startTour]);

  // Handle tour events
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if (status === STATUS.FINISHED) {
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_TEST);
    } else if (status === STATUS.SKIPPED) {
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_TEST);
    }
  };

  // Don't render if not eligible or not running
  if (!isEligible(TOUR_KEYS.ASSESSMENT_TEST) || !shouldRun) {
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