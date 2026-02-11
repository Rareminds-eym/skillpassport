import React, { useEffect, useState, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTour } from '../TourProvider';
import { TOUR_KEYS } from '../constants';
import { waitForElement } from '../utils';
import { supabase } from '../../../lib/supabaseClient';
import {
  GENERIC_ASSESSMENT_TOUR_STEPS,
  GENERIC_ASSESSMENT_TOUR_OPTIONS,
  GENERIC_ASSESSMENT_TOUR_STYLES,
  GENERIC_ASSESSMENT_TOUR_LOCALE,
} from '../configs/genericAssessmentTourConfig';

/**
 * Generic Assessment Result Tour
 * 
 * For students with grade_level NOT 'after10' or 'after12'
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
      console.log('✅ Generic assessment tour: Prerequisites met');
      setIsReady(true);
    }
  }, [loading, isEligible, isReady]);

  useEffect(() => {
    if (!isReady || tourStarted.current) {
      return;
    }

    const startTourWhenReady = async () => {
      console.log('🎯 Generic assessment tour: Checking assessment result grade_level...');
      
      // Don't start if another tour is already running
      if (isTourRunning && activeTourKey !== TOUR_KEYS.ASSESSMENT_RESULT_GENERIC) {
        console.log('⏭️ Generic tour: Another tour is running');
        return;
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('⏭️ Generic tour: No user found');
          return;
        }

        // Get student record first (studentId in TourProvider is actually user_id)
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (studentError || !studentData) {
          console.log('⏭️ Generic tour: No student record found');
          return;
        }

        // Query the assessment result to get grade_level (source of truth)
        const { data: resultData, error } = await supabase
          .from('personal_assessment_results')
          .select('grade_level')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !resultData) {
          console.log('⏭️ Generic tour: No assessment result found');
          return;
        }

        // Skip if this is after10 or after12 (they have specific tours)
        if (resultData.grade_level === 'after10' || resultData.grade_level === 'after12') {
          console.log('⏭️ Generic tour: Student has specific tour (grade_level:', resultData.grade_level, ')');
          return;
        }

        console.log('✅ Generic tour: Validated for generic tour (grade_level:', resultData.grade_level, ')');
      } catch (validationError) {
        console.error('❌ Generic tour: Error validating assessment', validationError);
        return;
      }
      
      // Check if After-10 or After-12 specific elements exist
      const after10Running = document.querySelector('[data-tour="recommended-stream"]');
      const after12Running = document.querySelector('[data-tour="recommended-programs"]');
      
      if (after10Running || after12Running) {
        console.log('⏭️ Generic tour: After-10/12 tour elements found, skipping');
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

      console.log('🔍 Generic tour: Required elements:', requiredSelectors);
      
      // Filter tour steps based on available elements
      const filteredSteps = GENERIC_ASSESSMENT_TOUR_STEPS.filter(step => {
        if (step.target === 'body') return true; // Always include welcome/finish steps
        if (!hasCareerTracks && step.target.includes('career-track')) return false;
        return true;
      });
      
      setTourSteps(filteredSteps);
      console.log('🔍 Generic tour: Using', filteredSteps.length, 'steps');

      try {
        const results = await Promise.all(
          requiredSelectors.map(selector => waitForElement(selector, 10000))
        );

        const allFound = results.every(el => el !== null);

        if (allFound) {
          console.log('✅ Generic assessment tour: All elements ready');
          tourStarted.current = true;
          setShouldRun(true);
          startTour(TOUR_KEYS.ASSESSMENT_RESULT_GENERIC);
        } else {
          console.warn('❌ Generic assessment tour: Some elements not found');
        }
      } catch (error) {
        console.error('❌ Generic assessment tour: Error waiting for elements', error);
      }
    };

    startTourWhenReady();
  }, [isReady, startTour, isTourRunning, activeTourKey]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action, type } = data;

    if (type === 'error:target_not_found') {
      console.error('❌ Generic tour: Target not found, ending tour');
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_GENERIC);
      return;
    }

    if (type === 'step:after') {
      setStepIndex(index + (action === 'prev' ? -1 : 1));
    }

    if (status === STATUS.FINISHED) {
      console.log('✅ Generic tour: Finished');
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_GENERIC);
    } else if (status === STATUS.SKIPPED) {
      console.log('⏭️ Generic tour: Skipped');
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_RESULT_GENERIC);
    }
  };

  useEffect(() => {
    return () => {
      tourStarted.current = false;
      setIsReady(false);
      setShouldRun(false);
      console.log('🔄 Generic Tour unmounted');
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
