import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '../TourProvider';
import { useTourProgress } from '../hooks/useTourProgress';
import { assessmentResultTour } from '../configs/assessmentResultTour';

interface AssessmentResultTourProps {
  autoStart?: boolean;
  children?: React.ReactNode;
}

export const AssessmentResultTour: React.FC<AssessmentResultTourProps> = ({
  autoStart = true,
  children
}) => {
  const { startTour, isTourActive, stopTour } = useTour();
  const { shouldAutoStart, loading, isCompleted, isSkipped } = useTourProgress(assessmentResultTour.id);
  
  // Local state to track if tour was completed/skipped in this session
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const tourStartedRef = useRef(false);

  // Cleanup tour on component unmount
  useEffect(() => {
    return () => {
      if (isTourActive) {
        console.log('🧹 AssessmentResultTour: Cleaning up tour on unmount');
        stopTour();
      }
    };
  }, [isTourActive, stopTour]);

  // Monitor tour completion in this session
  useEffect(() => {
    if (isCompleted || isSkipped) {
      setSessionCompleted(true);
      console.log('🏁 Tour completed/skipped in this session, preventing restart');
    }
  }, [isCompleted, isSkipped]);

  useEffect(() => {
    console.log('🎯 AssessmentResultTour useEffect:', {
      autoStart,
      shouldAutoStart,
      isTourActive,
      loading,
      isCompleted,
      isSkipped,
      sessionCompleted,
      tourStarted: tourStartedRef.current,
      canStart: autoStart && shouldAutoStart && !isTourActive && !loading && !isCompleted && !isSkipped && !sessionCompleted && !tourStartedRef.current
    });

    // Prevent starting tour if it's already completed, skipped, or started in this session
    if (isCompleted || isSkipped || sessionCompleted || tourStartedRef.current) {
      console.log('🚫 Tour already completed/skipped/started, not starting');
      return;
    }

    if (autoStart && shouldAutoStart && !isTourActive && !loading) {
      // Check if we have the required tour elements on the page
      const checkElements = () => {
        const requiredElements = [
          '[data-tour="navigation-actions"]',
          '[data-tour="ai-summary"]',
          '[data-tour="career-track-1"]'
        ];
        
        const requiredFound = requiredElements.every(selector => 
          document.querySelector(selector) !== null
        );
        
        const track2Found = document.querySelector('[data-tour="career-track-2"]') !== null;
        const track3Found = document.querySelector('[data-tour="career-track-3"]') !== null;
        
        console.log('🔍 Tour elements check:', {
          requiredFound,
          navigationActions: !!document.querySelector('[data-tour="navigation-actions"]'),
          aiSummary: !!document.querySelector('[data-tour="ai-summary"]'),
          careerTrack1: !!document.querySelector('[data-tour="career-track-1"]'),
          careerTrack2: track2Found,
          careerTrack3: track3Found,
          totalTracks: document.querySelectorAll('[data-tour^="career-track-"]').length
        });
        
        if (requiredFound) {
          console.log('✅ Starting assessment result tour...');
          console.log(`📊 Found ${document.querySelectorAll('[data-tour^="career-track-"]').length} career tracks`);
          tourStartedRef.current = true; // Mark as started
          startTour(assessmentResultTour);
        } else {
          console.log('⏳ Required tour elements not ready, retrying in 1 second...');
          setTimeout(checkElements, 1000);
        }
      };

      // Start checking after a short delay to allow page to fully load
      const timer = setTimeout(checkElements, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, shouldAutoStart, isTourActive, startTour, loading, isCompleted, isSkipped, sessionCompleted, stopTour]);

  return <>{children}</>;
};