import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import After10AssessmentResultTour from './components/After10AssessmentResultTour';
import After12AssessmentResultTour from './components/After12AssessmentResultTour';
import GenericAssessmentResultTour from './components/GenericAssessmentResultTour';
import AssessmentTestTour from './components/AssessmentTestTour';
import StudentDashboardTour from './components/StudentDashboardTour';
import { TourProvider } from './TourProvider';

/**
 * TourWrapper Component - Optimized
 * 
 * Only renders the tour component relevant to the current route.
 * Prevents multiple tours from competing and reduces unnecessary renders.
 */
const TourWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
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
    <TourProvider studentId={user?.id} userEmail={user?.email}>
      {activeTour}
      {children}
    </TourProvider>
  );
};

export default TourWrapper;