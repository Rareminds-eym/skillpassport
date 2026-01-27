import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AssessmentResultTour from './AssessmentResultTour';
import AssessmentTestTour from './AssessmentTestTour';
import StudentDashboardTour from './StudentDashboardTour';
import { TourProvider } from './TourProvider';

/**
 * TourWrapper Component
 * 
 * Wrapper component that provides tour context with user authentication data.
 * This component accesses the AuthContext to get user information and passes
 * it to the TourProvider, then renders all tour components directly.
 */
const TourWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <TourProvider studentId={user?.id} userEmail={user?.email}>
      {/* Dashboard Tour - Shows on student dashboard */}
      <StudentDashboardTour />
      
      {/* Assessment Test Tour - Shows during assessment test */}
      <AssessmentTestTour />
      
      {/* Assessment Result Tour - Shows on assessment results page */}
      <AssessmentResultTour />
      
      {children}
    </TourProvider>
  );
};

export default TourWrapper;