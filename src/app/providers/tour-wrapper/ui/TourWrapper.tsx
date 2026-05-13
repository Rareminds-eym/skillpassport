import React, { useEffect, useMemo } from 'react';

import { useLocation } from 'react-router-dom';
import After10AssessmentResultTour from './components/After10AssessmentResultTour';
import After12AssessmentResultTour from './components/After12AssessmentResultTour';
import GenericAssessmentResultTour from './components/GenericAssessmentResultTour';
import AssessmentTestTour from './components/AssessmentTestTour';
import LearnerDashboardTour from './components/LearnerDashboardTour';

import { useUser } from '@/shared/model/authStore';
import { useTourStore } from '@/shared/model/tourStore';
/**
 * TourWrapper Component - Optimized
 * 
 * Only renders the tour component relevant to the current route.
 * Prevents multiple tours from competing and reduces unnecessary renders.
 * Uses Zustand store for tour state management.
 */
const TourWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useUser();
  const location = useLocation();
  const { loadTourProgress, reset } = useTourStore();
  
  // Load tour progress when user is available - only once per user
  useEffect(() => {
    if (user?.id) {
      loadTourProgress(user.id);
    } else {
      // Reset tour state when no user
      reset();
    }
  }, [user?.id, loadTourProgress, reset]);
  
  // Determine which tour to render based on current route
  const activeTour = useMemo(() => {
    const path = location.pathname;
    
    if (path === '/learner/dashboard') {
      return <LearnerDashboardTour />;
    }
    
    if (path.includes('/learner/assessment/test')) {
      return <AssessmentTestTour />;
    }
    
    if (path.includes('/learner/assessment/result')) {
      // All three result tours will self-validate grade eligibility
      // Only one will actually start based on learner grade
      return (
        <>
          <After10AssessmentResultTour />
          <After12AssessmentResultTour />
          <GenericAssessmentResultTour />
        </>
      );
    }
    
    return null;
  }, [location.pathname]);
  
  return (
    <>
      {activeTour}
      {children}
    </>
  );
};

export default TourWrapper;
