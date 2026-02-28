import React, { useEffect, useState, useRef, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTour } from '../TourProvider';
import { TOUR_KEYS } from '../constants';
import { waitForElement } from '../utils';
import {
  ASSESSMENT_TEST_TOUR_STEPS,
  ASSESSMENT_TEST_TOUR_OPTIONS,
  ASSESSMENT_TEST_TOUR_STYLES,
  ASSESSMENT_TEST_TOUR_LOCALE,
} from '../configs';

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
      console.log('✅ Assessment test tour: Prerequisites met');
      setIsReady(true);
    }
  }, [loading, isEligible, isReady]);

  // Start tour when ready
  useEffect(() => {
    if (!isReady || tourStarted.current) {
      return;
    }

    const checkAndStartTour = async () => {
      console.log('🎯 Assessment test tour: Checking elements...');
      
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
          console.log('✅ Assessment test tour: All elements ready, starting tour');
          tourStarted.current = true;
          setShouldRun(true);
          startTour(TOUR_KEYS.ASSESSMENT_TEST);
        } else {
          console.log('⏭️ Assessment test tour: Required elements not found');
        }
      } catch (error) {
        console.error('❌ Assessment test tour: Error waiting for elements', error);
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
  }, [isReady, startTour]);

  // Handle tour completion
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, lifecycle, type, index } = data;

    console.log('🎯 Assessment test tour callback:', { status, action, lifecycle, type, index });

    // Remove title attributes from buttons to prevent browser tooltips
    if (lifecycle === 'tooltip' && action === 'update') {
      setTimeout(() => {
        document.querySelectorAll('.react-joyride__tooltip button[title]').forEach(button => {
          button.removeAttribute('title');
        });
      }, 0);
    }

    if (status === STATUS.FINISHED) {
      console.log('✅ Assessment test tour: Finished');
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_TEST);
    } else if (status === STATUS.SKIPPED) {
      console.log('⏭️ Assessment test tour: Skipped');
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
      
      console.log('🔄 Assessment test tour unmounted');
    };
  }, []);

  console.log('🔍 Assessment test tour render:', { shouldRun, tourStarted: tourStarted.current, isReady });

  if (!shouldRun || !tourStarted.current) {
    return null;
  }

  console.log('✅ Rendering Joyride for assessment test tour');

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
