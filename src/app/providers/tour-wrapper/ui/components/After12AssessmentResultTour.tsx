import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
import React, { useEffect, useState, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { getLogger } from '@/shared/config/logging';

import { TOUR_KEYS } from '@/app/providers/tour-wrapper/lib/constants';
import { waitForElement } from '@/shared/lib/utils';
import { supabase } from '@/shared/api/supabaseClient';
import { useTour } from '@/shared/model/tourStore';

const logger = getLogger('After12AssessmentResultTour');
import {
  AFTER12_TOUR_STEPS,
  AFTER12_TOUR_OPTIONS,
  AFTER12_TOUR_STYLES,
  AFTER12_TOUR_LOCALE,
} from '@/app/providers/tour-wrapper/lib/configs/after12TourConfig';

/**
 * AFTER-12 Assessment Result Tour
 * Flow: Welcome → Navigation → Summary → Programs → Auto-switch to Career Tab → Career Tracks
 * 
 * Shows ONLY when personal_assessment_results.grade_level = 'after12'
 */
const After12AssessmentResultTour: React.FC = () => {
  const { startTour, completeTour, skipTour, isEligible, loading } = useTour();
  const [shouldRun, setShouldRun] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourSteps] = useState(AFTER12_TOUR_STEPS);
  
  const tourStarted = useRef(false);

  useEffect(() => {
    if (!loading && isEligible(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12) && !isReady && !tourStarted.current) {
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
          .select('grade_level')
          .eq('learner_id', learnerData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !resultData) {
          return;
        }

        // Check if this is an after12 assessment
        if (resultData.grade_level !== 'after12') {
          return;
        }
      } catch (validationError) {
        logger.error('Error validating assessment', validationError as Error);
        return;
      }
      
      // Required elements for AFTER-12 tour
      const requiredSelectors = [
        '[data-tour="navigation-actions"]',
        '[data-tour="ai-summary"]',
        '[data-tour="recommended-programs"]'
      ];

      try {
        const results = await Promise.all(
          requiredSelectors.map(selector => waitForElement(selector, 10000))
        );

        const allFound = results.every(el => el !== null);

        if (allFound) {
          tourStarted.current = true;
          setShouldRun(true);
          startTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
        }
      } catch (error) {
        logger.error('Error waiting for elements', error as Error);
      }
    };

    startTourWhenReady();
  }, [isReady, startTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action, lifecycle, type } = data;

    if (type === 'error:target_not_found') {
      logger.error('Target not found, ending tour', new Error('Target element not found'));
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
      return;
    }

    if (type === 'step:after') {
      setStepIndex(index + (action === 'prev' ? -1 : 1));
    }

    // Handle automatic tab switch FORWARD after "Top 3 Recommended Programs" step
    if (
      action === 'next' &&
      lifecycle === 'complete' &&
      tourSteps[index]?.target === '[data-tour="recommended-programs"]'
    ) {
      setShouldRun(false);
      switchToCareerTab();
      return;
    }

    // Handle automatic tab switch BACKWARD when going back from career tracks
    if (
      action === 'prev' &&
      lifecycle === 'complete' &&
      tourSteps[index]?.target === '[data-tour="career-track-1"]'
    ) {
      setShouldRun(false);
      switchToProgramsTab();
      return;
    }

    if (status === STATUS.FINISHED) {
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
    } else if (status === STATUS.SKIPPED) {
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
    }
  };

  const switchToCareerTab = async () => {
    const careerTab = document.querySelector('[data-tour="career-tab-button"]') as HTMLElement;

    if (!careerTab) {
      logger.error('Career tab button not found', new Error('Career tab not found'));
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
      return;
    }

    careerTab.click();
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const careerTrack1 = await waitForElement('[data-tour="career-track-1"]', 10000);

      if (careerTrack1) {
        const nextIndex = stepIndex + 1;

        setTimeout(() => {
          setStepIndex(nextIndex);
          setShouldRun(true);
        }, 500);
      } else {
        logger.error('Career tracks not found after tab switch', new Error('Career tracks not found'));
        completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
      }
    } catch (error) {
      logger.error('Error waiting for career tracks', error as Error);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
    }
  };

  const switchToProgramsTab = async () => {
    const programsTab = document.querySelector('[data-tour="programs-tab-button"]') as HTMLElement;

    if (!programsTab) {
      logger.error('Programs tab button not found', new Error('Programs tab not found'));
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
      return;
    }

    programsTab.click();
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const programsSection = await waitForElement('[data-tour="recommended-programs"]', 5000);

      if (programsSection) {
        const prevIndex = stepIndex - 1;

        setTimeout(() => {
          setStepIndex(prevIndex);
          setShouldRun(true);
        }, 500);
      } else {
        logger.error('Programs section not found after tab switch', new Error('Programs section not found'));
        completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
      }
    } catch (error) {
      logger.error('Error waiting for programs section', error as Error);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
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
      continuous={AFTER12_TOUR_OPTIONS.continuous}
      showProgress={AFTER12_TOUR_OPTIONS.showProgress}
      showSkipButton={AFTER12_TOUR_OPTIONS.showSkipButton}
      styles={AFTER12_TOUR_STYLES}
      locale={AFTER12_TOUR_LOCALE}
      disableOverlayClose={AFTER12_TOUR_OPTIONS.disableOverlayClose}
      disableCloseOnEsc={AFTER12_TOUR_OPTIONS.disableCloseOnEsc}
      hideCloseButton={AFTER12_TOUR_OPTIONS.hideCloseButton}
      scrollToFirstStep={AFTER12_TOUR_OPTIONS.scrollToFirstStep}
      spotlightPadding={AFTER12_TOUR_OPTIONS.spotlightPadding}
    />
  );
};

export default After12AssessmentResultTour;
