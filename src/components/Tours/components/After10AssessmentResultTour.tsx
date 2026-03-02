import React, { useEffect, useState, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTour } from '../TourProvider';
import { TOUR_KEYS } from '../constants';
import { waitForElement } from '../utils';
import { supabase } from '../../../lib/supabaseClient';
import {
  ASSESSMENT_RESULT_TOUR_STEPS,
  ASSESSMENT_RESULT_TOUR_OPTIONS,
  ASSESSMENT_RESULT_TOUR_STYLES,
  ASSESSMENT_RESULT_TOUR_LOCALE,
} from '../configs/after10TourConfig';

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
      console.log('✅ AFTER-10 tour: Prerequisites met');
      setIsReady(true);
    }
  }, [loading, isEligible, isReady]);

  useEffect(() => {
    if (!isReady || tourStarted.current) {
      return;
    }

    const startTourWhenReady = async () => {
      console.log('🎯 AFTER-10 tour: Checking assessment result grade_level...');
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('⏭️ AFTER-10 tour: No user found');
          return;
        }

        // Get student record first (studentId in TourProvider is actually user_id)
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (studentError || !studentData) {
          console.log('⏭️ AFTER-10 tour: No student record found');
          return;
        }

        // Query the assessment result to get grade_level (source of truth)
        const { data: resultData, error } = await supabase
          .from('personal_assessment_results')
          .select('grade_level, stream_id')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !resultData) {
          console.log('⏭️ AFTER-10 tour: No assessment result found');
          return;
        }

        // Check if this is an after10 assessment
        if (resultData.grade_level !== 'after10') {
          console.log('⏭️ AFTER-10 tour: Not after10 assessment (grade_level:', resultData.grade_level, ')');
          return;
        }

        console.log('✅ AFTER-10 tour: Validated as after10 assessment');
      } catch (validationError) {
        console.error('❌ AFTER-10 tour: Error validating assessment', validationError);
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
          console.log('✅ AFTER-10 tour: All elements ready');
          tourStarted.current = true;
          setShouldRun(true);
          startTour(TOUR_KEYS.ASSESSMENT_RESULT);
        } else {
          console.log('⏭️ AFTER-10 tour: Elements not found after 15s');
        }
      } catch (error) {
        console.error('❌ AFTER-10 tour: Error waiting for elements', error);
      }
    };

    startTourWhenReady();
  }, [isReady, startTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action, lifecycle, type } = data;

    if (type === 'error:target_not_found') {
      console.error('❌ AFTER-10 tour: Target not found, ending tour');
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
      console.log('🔄 AFTER-10 tour: Auto-switching to Career Clusters...');
      
      setShouldRun(false);
      
      setTimeout(() => {
        const button = document.querySelector('[data-tour="view-career-clusters-button"]') as HTMLElement;
        if (button) {
          console.log('🔄 Auto-clicking View Career Clusters button...');
          button.click();
          
          setTimeout(async () => {
            try {
              const careerTrack1 = await waitForElement('[data-tour="career-track-1"]', 10000);
              if (careerTrack1) {
                console.log('✅ Career Clusters loaded, resuming tour...');
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
                  console.error('❌ Career track 1 step not found in tour config');
                  completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
                }
              }
            } catch (error) {
              console.error('❌ Error waiting for career tracks:', error);
              completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
            }
          }, 500);
        } else {
          console.error('❌ View Career Clusters button not found');
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
      console.log('🔄 AFTER-10 tour: Going back to Stream...');
      setShouldRun(false);
      switchBackToStream();
      return;
    }

    if (status === STATUS.FINISHED) {
      console.log('✅ AFTER-10 tour: Finished');
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
    } else if (status === STATUS.SKIPPED) {
      console.log('⏭️ AFTER-10 tour: Skipped');
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_RESULT);
    }
  };

  const switchBackToStream = async () => {
    console.log('🔄 Going back to Stream...');
    
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
      console.error('❌ Stream step not found in tour config');
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT);
    }
  };

  useEffect(() => {
    return () => {
      tourStarted.current = false;
      setIsReady(false);
      setShouldRun(false);
      console.log('🔄 AFTER-10 Tour unmounted');
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
