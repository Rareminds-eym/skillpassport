import React, { useEffect, useState, useRef, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { getLogger } from '@/shared/config/logging';

import { TOUR_KEYS } from '@/app/providers/tour-wrapper/lib/constants';
import { waitForElement } from '@/shared/lib/utils';
import { useTour } from '@/shared/model/tourStore';

const logger = getLogger('AssessmentTestTour');
import {
  ASSESSMENT_TEST_TOUR_STEPS,
  ASSESSMENT_TEST_TOUR_OPTIONS,
  ASSESSMENT_TEST_TOUR_STYLES,
  ASSESSMENT_TEST_TOUR_LOCALE,
} from '@/app/providers/tour-wrapper/lib/configs';

const AssessmentTestTour: React.FC = () => {
  const { startTour, completeTour, skipTour, isEligible, loading } = useTour();
  const [shouldRun, setShouldRun] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const tourStarted = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Wait for prerequisites - simplified (route check removed, handled by TourWrapper)
  useEffect(() => {
    if (!loading && isEligible(TOUR_KEYS.ASSESSMENT_TEST) && !isReady && !tourStarted.current) {
      setIsReady(true);
    }
  }, [loading, isEligible, isReady]);

  // Start tour when ready
  useEffect(() => {
    if (!isReady || tourStarted.current) {
      return;
    }

    const checkAndStartTour = async () => {
      const requiredSelectors = [
        '[data-tour="section-progress"]',
        '[data-tour="navigation-controls"]'
      ];

      const optionalSelectors = [
        '[data-tour="question-content"]',
        '[data-tour="answer-options"]'
      ];

      try {
        const requiredResults = await Promise.all(
          requiredSelectors.map(selector => waitForElement(selector, 15000))
        );

        const optionalResults = await Promise.all(
          optionalSelectors.map(selector => waitForElement(selector, 15000).catch(() => null))
        );

        const allRequiredFound = requiredResults.every(el => el !== null);
        const someOptionalFound = optionalResults.some(el => el !== null);

        if (allRequiredFound && someOptionalFound) {
          tourStarted.current = true;
          setShouldRun(true);
          startTour(TOUR_KEYS.ASSESSMENT_TEST);
        }
      } catch (error) {
        logger.error('Error waiting for elements', error as Error);
      }
    };

    const startTourWhenReady = async () => {
      // Check if on "Start Section" screen
      const allButtons = Array.from(document.querySelectorAll('button'));
      const hasStartSectionButton = allButtons.some(b => b.textContent?.includes('Start Section'));

      if (hasStartSectionButton) {
        // Wait for user to start section
        const observer = new MutationObserver(async () => {
          const questionContent = document.querySelector('[data-tour="question-content"]');
          const answerOptions = document.querySelector('[data-tour="answer-options"]');

          if (questionContent || answerOptions) {
            observer.disconnect();
            observerRef.current = null;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            setTimeout(() => checkAndStartTour(), 500);
          }
        });

        observerRef.current = observer;
        observer.observe(document.body, { childList: true, subtree: true });

        timeoutRef.current = setTimeout(() => {
          if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        }, 60000);

        return;
      }

      // Not on start screen, check elements immediately
      await checkAndStartTour();
    };

    startTourWhenReady();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isReady, startTour]);

  // Handle tour completion
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, lifecycle } = data;

    // Remove title attributes from buttons to prevent browser tooltips
    if (lifecycle === 'tooltip' && action === 'update') {
      setTimeout(() => {
        document.querySelectorAll('.react-joyride__tooltip button[title]').forEach(button => {
          button.removeAttribute('title');
        });
      }, 0);
    }

    if (status === STATUS.FINISHED) {
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_TEST);
    } else if (status === STATUS.SKIPPED) {
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_TEST);
    }
  }, [completeTour, skipTour]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tourStarted.current = false;
      setIsReady(false);
      setShouldRun(false);

      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  if (!shouldRun || !tourStarted.current) {
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
