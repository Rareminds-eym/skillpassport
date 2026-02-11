import React, { useEffect, useState, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTour } from '../TourProvider';
import { TOUR_KEYS } from '../constants';
import { waitForElement } from '../utils';
import { supabase } from '../../../lib/supabaseClient';
import {
  AFTER12_TOUR_STEPS,
  AFTER12_TOUR_OPTIONS,
  AFTER12_TOUR_STYLES,
  AFTER12_TOUR_LOCALE,
} from '../configs/after12TourConfig';

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
      console.log('✅ AFTER-12 tour: Prerequisites met');
      setIsReady(true);
    }
  }, [loading, isEligible, isReady]);

  useEffect(() => {
    if (!isReady || tourStarted.current) {
      return;
    }

    const startTourWhenReady = async () => {
      console.log('🎯 AFTER-12 tour: Checking assessment result grade_level...');
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('⏭️ AFTER-12 tour: No user found');
          return;
        }

        // Get student record first (studentId in TourProvider is actually user_id)
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (studentError || !studentData) {
          console.log('⏭️ AFTER-12 tour: No student record found');
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
          console.log('⏭️ AFTER-12 tour: No assessment result found');
          return;
        }

        // Check if this is an after12 assessment
        if (resultData.grade_level !== 'after12') {
          console.log('⏭️ AFTER-12 tour: Not after12 assessment (grade_level:', resultData.grade_level, ')');
          return;
        }

        console.log('✅ AFTER-12 tour: Validated as after12 assessment');
      } catch (validationError) {
        console.error('❌ AFTER-12 tour: Error validating assessment', validationError);
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
          console.log('✅ AFTER-12 tour: All elements ready');
          tourStarted.current = true;
          setShouldRun(true);
          startTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
        } else {
          console.warn('❌ AFTER-12 tour: Some elements not found');
        }
      } catch (error) {
        console.error('❌ AFTER-12 tour: Error waiting for elements', error);
      }
    };

    startTourWhenReady();
  }, [isReady, startTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action, lifecycle, type } = data;

    if (type === 'error:target_not_found') {
      console.error('❌ AFTER-12 tour: Target not found, ending tour');
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
      console.log('🔄 AFTER-12 tour: Triggering automatic tab switch...');
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
      console.log('🔄 AFTER-12 tour: Going back - switching to Programs tab...');
      setShouldRun(false);
      switchToProgramsTab();
      return;
    }

    if (status === STATUS.FINISHED) {
      console.log('✅ AFTER-12 tour: Finished');
      setShouldRun(false);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
    } else if (status === STATUS.SKIPPED) {
      console.log('⏭️ AFTER-12 tour: Skipped');
      setShouldRun(false);
      skipTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
    }
  };

  const switchToCareerTab = async () => {
    console.log('🔄 Switching to Career Recommendations tab...');
    
    const careerTab = document.querySelector('[data-tour="career-tab-button"]') as HTMLElement;
    
    if (!careerTab) {
      console.error('❌ Career tab button not found');
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
      return;
    }

    careerTab.click();
    console.log('✅ Career tab clicked, waiting for content...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const careerTrack1 = await waitForElement('[data-tour="career-track-1"]', 10000);
      
      if (careerTrack1) {
        console.log('✅ Career tab content loaded');
        const nextIndex = stepIndex + 1;
        
        setTimeout(() => {
          setStepIndex(nextIndex);
          setShouldRun(true);
        }, 500);
      } else {
        console.error('❌ Career tracks not found after tab switch');
        completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
      }
    } catch (error) {
      console.error('❌ Error waiting for career tracks:', error);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
    }
  };

  const switchToProgramsTab = async () => {
    console.log('🔄 Switching back to Recommended Programs tab...');
    
    const programsTab = document.querySelector('[data-tour="programs-tab-button"]') as HTMLElement;
    
    if (!programsTab) {
      console.error('❌ Programs tab button not found');
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
      return;
    }

    programsTab.click();
    console.log('✅ Programs tab clicked, waiting for content...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const programsSection = await waitForElement('[data-tour="recommended-programs"]', 5000);
      
      if (programsSection) {
        console.log('✅ Programs tab content loaded');
        const prevIndex = stepIndex - 1;
        
        setTimeout(() => {
          setStepIndex(prevIndex);
          setShouldRun(true);
        }, 500);
      } else {
        console.error('❌ Programs section not found after tab switch');
        completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
      }
    } catch (error) {
      console.error('❌ Error waiting for programs section:', error);
      completeTour(TOUR_KEYS.ASSESSMENT_RESULT_AFTER12);
    }
  };

  useEffect(() => {
    return () => {
      tourStarted.current = false;
      setIsReady(false);
      setShouldRun(false);
      console.log('🔄 AFTER-12 Tour unmounted');
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
