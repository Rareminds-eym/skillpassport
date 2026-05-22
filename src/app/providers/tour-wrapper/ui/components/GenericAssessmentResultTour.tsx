import React, { useEffect, useState, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { getLogger } from '@/shared/config/logging';

import { TOUR_KEYS } from '@/app/providers/tour-wrapper/lib/constants';
import { waitForElement } from '@/shared/lib/utils';
import { supabase } from '@/shared/api/supabaseClient';
import { useTour } from '@/shared/model/tourStore';

const logger = getLogger('GenericAssessmentResultTour');
import {
  GENERIC_ASSESSMENT_TOUR_STEPS,
  GENERIC_ASSESSMENT_TOUR_OPTIONS,
  GENERIC_ASSESSMENT_TOUR_STYLES,
  GENERIC_ASSESSMENT_TOUR_LOCALE,
} from '@/app/providers/tour-wrapper/lib/configs/genericAssessmentTourConfig';

/**
 * Generic Assessment Result Tour
 * 
 * For learners with grade_level NOT 'after10' or 'after12'
 * (e.g., 'college', 'higher_secondary', 'highschool', 'middle')
 * Flow: Welcome → Navigation → Summary → Finish
 */
const GenericAssessmentResultTour: React.FC = () => {
  const { startTour, completeTour, skipTour, isEligible, loading, isTourRunning, activeTourKey } = useTour();
  const [shouldRun, setShouldRun] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourSteps, setTourSteps] = useState(GENERIC_ASSESSMENT_TOUR_STEPS);
  
  const tourStarted = useRef(false);

  useEffect(() => {
    if (!loading && isEligible(TOUR_KEYS.ASSESSMENT_RESULT_GENERIC) && !isReady && !tourStarted.current) {
      setIsReady(true);
    }
  }, [loading, isEligible, isReady]);

  useEffect(() => {
    if (!isReady || tourStarted.current) {
      return;
    }

    const startTourWhenReady = async () => {
      // Don't start if another tour is already running
      if (isTourRunning && activeTourKey !== TOUR_KEYS.ASSESSMENT_RESULT_GENERIC) {
        return;
      }

      try {
        const user = useAuthStore.getState().user;
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
          .select('grade_level')
          .eq('learner_id', learnerData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !resultData) {
          return;
        }

        // Skip if this is after10 or after12 (they have specific tours)
        if (resultData.grade_level === 'after10' || resultData.grade_level === 'after12') {
          return;
        }
      } catch (validationError) {
        logger.error('Error validating assessment', validationError as Error);
        return;
      }

      // Check if After-10 or After-12 specific elements exist
      const after10Running = document.querySelector('[data-tour="recommended-stream"]');
      const after12Running = document.querySelector('[data-tour="recommended-programs"]');

      if (after10Running || after12Running) {
        return;
      }

      // For generic tour, check which elements are available
      const hasCareerTracks = document.querySelector('[data-tour="career-track-1"]');

      // Base elements that should always exist
      const baseSelectors = [
        '[data-tour="navigation-actions"]',
        '[data-tour="ai-summary"]'
      ];

      // Add career tracks if they exist
      const requiredSelectors = hasCareerTracks
        ? [...baseSelectors, '[data-tour="career-track-1"]', '[data-tour="career-track-2"]', '[data-tour="career-track-3"]']
        : baseSelectors;

      // Filter tour steps based on available elements
      const filteredSteps = GENERIC_ASSESSMENT_TOUR_STEPS.filter(step => {
        if (step.target === 'body') return true; // Always include welcome/finish steps
        if (!hasCareerTracks && step.target.includes('career-track')) return false;
        return true;
      });

      setTourSteps(filteredSteps);

      try {
        const results = await Promise.all(
          requiredSelectors.map(selector => waitForElement(selector, 10000))
        );

        const allFound = results.every(el => el !== null);

        if (allFound) {
          tourStarted.current = true;
          setShouldRun(true);
          startTour(TOUR_KEYS.ASSESSMENT_RESULT_GENERIC);
        }
      } catch (error) {
        logger.error('Error waiting for elements', error as Error);
      }
    };

    startTourWhenReady();
  }, [isReady, startTour, isTourRunning, activeTourKey]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action, type } = data;

    if (type === 'error:target_not_found') {
      logger.error('Target not found, ending tour', new Error('Target element not found'));
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_GENERIC);
      return;
    }

    if (type === 'step:after') {
      setStepIndex(index + (action === 'prev' ? -1 : 1));
    }

    if (status === STATUS.FINISHED) {
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_GENERIC);
    } else if (status === STATUS.SKIPPED) {
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_RESULT_GENERIC);
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
      steps={tourSteps}
      run={shouldRun}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous={GENERIC_ASSESSMENT_TOUR_OPTIONS.continuous}
      showProgress={GENERIC_ASSESSMENT_TOUR_OPTIONS.showProgress}
      showSkipButton={GENERIC_ASSESSMENT_TOUR_OPTIONS.showSkipButton}
      styles={GENERIC_ASSESSMENT_TOUR_STYLES}
      locale={GENERIC_ASSESSMENT_TOUR_LOCALE}
      disableOverlayClose={GENERIC_ASSESSMENT_TOUR_OPTIONS.disableOverlayClose}
      disableCloseOnEsc={GENERIC_ASSESSMENT_TOUR_OPTIONS.disableCloseOnEsc}
      hideCloseButton={GENERIC_ASSESSMENT_TOUR_OPTIONS.hideCloseButton}
      scrollToFirstStep={GENERIC_ASSESSMENT_TOUR_OPTIONS.scrollToFirstStep}
      spotlightPadding={GENERIC_ASSESSMENT_TOUR_OPTIONS.spotlightPadding}
    />
  );
};

export default GenericAssessmentResultTour;
