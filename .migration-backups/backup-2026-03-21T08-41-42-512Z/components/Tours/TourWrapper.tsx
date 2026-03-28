import React, { useEffect, useMemo } from 'react';
import { useUser } from '@/stores';
import { useLocation } from 'react-router-dom';
import After10AssessmentResultTour from './components/After10AssessmentResultTour';
import After12AssessmentResultTour from './components/After12AssessmentResultTour';
import GenericAssessmentResultTour from './components/GenericAssessmentResultTour';
import AssessmentTestTour from './components/AssessmentTestTour';
import StudentDashboardTour from './components/StudentDashboardTour';
import { useTourStore } from '@/stores';

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
      console.log(`🎯 StudentId available, initializing tour system: ${user.id}`);
      loadTourProgress(user.id);
    } else {
      // Reset tour state when no user
      reset();
    }
  }, [user?.id, loadTourProgress, reset]);
  
  // Determine which tour to render based on current route
  const activeTour = useMemo(() => {
    const path = location.pathname;
    
    if (path === '/student/dashboard') {
      return <StudentDashboardTour />;
    }
    
    if (path.includes('/student/assessment/test')) {
      return <AssessmentTestTour />;
    }
    
    if (path.includes('/student/assessment/result')) {
      // All three result tours will self-validate grade eligibility
      // Only one will actually start based on student grade
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