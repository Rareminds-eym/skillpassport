import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
import React, { useEffect, useState, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { getLogger } from '@/shared/config/logging';

import { TOUR_KEYS } from '@/app/providers/tour-wrapper/lib/constants';
import { waitForElement } from '@/shared/lib/utils';
import { supabase } from '@/shared/api/supabaseClient';
import { useTour } from '@/shared/model/tourStore';

const logger = getLogger('after10-assessment-tour');
import {
  ASSESSMENT_RESULT_TOUR_STEPS,
  ASSESSMENT_RESULT_TOUR_OPTIONS,
  ASSESSMENT_RESULT_TOUR_STYLES,
  ASSESSMENT_RESULT_TOUR_LOCALE,
} from '@/app/providers/tour-wrapper/lib/configs/after10TourConfig';

/**
 * AFTER-10 Assessment Result Tour
 * Flow: Welcome → Navigation → Summary → Stream → Auto-switch to Career Tab → Career Tracks
 * 
 * Shows ONLY when personal_assessment_results.grade_level = 'after10'
 */
const After10AssessmentResultTour: React.FC = () => {
  const { startTour, completeTour, skipTour, isEligible, loading } = useTour();
  const [shouldRun, setShouldRun] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  
  const tourStarted = useRef(false);

  useEffect(() => {
    if (!loading && isEligible(TOUR_KEYS.ASSESSMENT_RESULT) && !isReady && !tourStarted.current) {
      setIsReady(true);
    }
  }, [loading, isEligible, isReady]);

  useEffect(() => {
    if (!isReady || tourStarted.current) {
      return;
    }

    const startTourWhenReady = async () => {
      
      try {
        const { data: { user } } = await getCurrentUser();
        if (!user) {
          return;
        }

        // Get learner record first (learnerId in TourProvider is actually user_id)
        const { data: learnerData, error: learnerError } = await supabase
          .from('learners')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (learnerError || !learnerData) {
          return;
        }

        // Query the assessment result to get grade_level (source of truth)
        const { data: resultData, error } = await supabase
          .from('personal_assessment_results')
          .select('grade_level, stream_id')
          .eq('learner_id', learnerData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !resultData) {
          return;
        }

        // Check if this is an after10 assessment
        if (resultData.grade_level !== 'after10') {
          return;
        }

      } catch (validationError) {
        logger.error('Error validating assessment', validationError as Error, {});
        return;
      }
      
      // Check for required elements
      const requiredSelectors = [
        '[data-tour="navigation-actions"]',
        '[data-tour="ai-summary"]',
        '[data-tour="recommended-stream"]'
      ];

      try {
        const results = await Promise.all(
          requiredSelectors.map(selector => waitForElement(selector, 15000))
        );

        const allFound = results.every(el => el !== null);

        if (allFound) {
          tourStarted.current = true;
          setShouldRun(true);
          startTour(TOUR_KEYS.ASSESSMENT_RESULT);
        }
      } catch (error: unknown) {
        logger.error('Error waiting for elements', error as Error);
      }
    };

    startTourWhenReady();
  }, [isReady, startTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action, lifecycle, type } = data;

    if (type === 'error:target_not_found') {
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
      return;
    }

    // Auto-click the button when we reach the "View Career Clusters" step
    if (
      type === 'step:after' &&
      action === 'next' &&
      ASSESSMENT_RESULT_TOUR_STEPS[index]?.target === '[data-tour="recommended-stream"]'
    ) {
      
      setShouldRun(false);
      
      setTimeout(() => {
        const button = document.querySelector('[data-tour="view-career-clusters-button"]') as HTMLElement;
        if (button) {
          button.click();
          
          setTimeout(async () => {
            try {
              const careerTrack1 = await waitForElement('[data-tour="career-track-1"]', 10000);
              if (careerTrack1) {
                const careerTrack1Index = ASSESSMENT_RESULT_TOUR_STEPS.findIndex(
                  step => step.target === '[data-tour="career-track-1"]'
                );
                if (careerTrack1Index !== -1) {
                  careerTrack1.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  
                  setTimeout(() => {
                    setStepIndex(careerTrack1Index);
                    setShouldRun(true);
                  }, 300);
                } else {
                  completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
                }
              }
            } catch (error) {
              logger.error('Error waiting for career tracks', error as Error, {});
              completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
            }
          }, 500);
        } else {
          completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
        }
      }, 300);
      return;
    }

    if (type === 'step:after') {
      setStepIndex(index + (action === 'prev' ? -1 : 1));
    }

    // Auto-switch BACKWARD when going back from career tracks
    if (
      action === 'prev' && 
      lifecycle === 'complete' &&
      ASSESSMENT_RESULT_TOUR_STEPS[index]?.target === '[data-tour="career-track-1"]'
    ) {
      setShouldRun(false);
      switchBackToStream();
      return;
    }

    if (status === STATUS.FINISHED) {
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
    } else if (status === STATUS.SKIPPED) {
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_RESULT);
    }
  };

  const switchBackToStream = async () => {
    
    const backButton = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Back to Stream')
    ) as HTMLElement;
    
    if (backButton) {
      backButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const streamIndex = ASSESSMENT_RESULT_TOUR_STEPS.findIndex(
      step => step.target === '[data-tour="recommended-stream"]'
    );
    
    if (streamIndex !== -1) {
      setTimeout(() => {
        setStepIndex(streamIndex);
        setShouldRun(true);
      }, 300);
    } else {
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
    }
  };

  useEffect(() => {
    return () => {
      tourStarted.current = false;
      setIsReady(false);
      setShouldRun(false);
    };
  }, []);

  if (!shouldRun || !tourStarted.current) {
    return null;
  }

  return (
    <Joyride
      steps={ASSESSMENT_RESULT_TOUR_STEPS}
      run={shouldRun}
      stepIndex={stepIndex}
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

export default After10AssessmentResultTour;
