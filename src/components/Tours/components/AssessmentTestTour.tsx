import React, { useEffect } from 'react';
import { useTour } from '../TourProvider';
import { useTourProgress } from '../hooks/useTourProgress';
import { assessmentTestTour } from '../configs/assessmentTestTour';

interface AssessmentTestTourProps {
  autoStart?: boolean;
  children?: React.ReactNode;
}

export const AssessmentTestTour: React.FC<AssessmentTestTourProps> = ({
  autoStart = true,
  children
}) => {
  const { startTour, isTourActive } = useTour();
  const { shouldAutoStart, loading } = useTourProgress(assessmentTestTour.id);

  useEffect(() => {
    console.log('🎯 AssessmentTestTour useEffect:', {
      autoStart,
      shouldAutoStart,
      isTourActive,
      loading,
      canStart: autoStart && shouldAutoStart && !isTourActive && !loading
    });

    if (autoStart && shouldAutoStart && !isTourActive && !loading) {
      // Check if we have the required tour elements on the page
      const checkElements = () => {
        const requiredElements = [
          '[data-tour="section-progress"]',
          '[data-tour="question-content"]'
        ];
        
        const elementsFound = requiredElements.every(selector => 
          document.querySelector(selector) !== null
        );
        
        console.log('🔍 Tour elements check:', {
          elementsFound,
          sectionProgress: !!document.querySelector('[data-tour="section-progress"]'),
          questionContent: !!document.querySelector('[data-tour="question-content"]')
        });
        
        if (elementsFound) {
          console.log('✅ Starting assessment tour...');
          startTour(assessmentTestTour);
        } else {
          console.log('⏳ Tour elements not ready, retrying in 1 second...');
          setTimeout(checkElements, 1000);
        }
      };

      // Start checking after a short delay
      const timer = setTimeout(checkElements, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, shouldAutoStart, isTourActive, startTour, loading]);

  return <>{children}</>;
};