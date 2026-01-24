import React, { useEffect } from 'react';
import { useTour } from '../TourProvider';
import { useTourProgress } from '../hooks/useTourProgress';
import { studentDashboardTour } from '../configs/studentDashboardTour';

interface StudentDashboardTourProps {
  autoStart?: boolean;
  children?: React.ReactNode;
}

export const StudentDashboardTour: React.FC<StudentDashboardTourProps> = ({
  autoStart = true,
  children
}) => {
  const { startTour, isTourActive } = useTour();
  const { shouldAutoStart, loading } = useTourProgress(studentDashboardTour.id);

  useEffect(() => {
    if (autoStart && shouldAutoStart && !isTourActive && !loading) {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        startTour(studentDashboardTour);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoStart, shouldAutoStart, isTourActive, startTour, loading]);

  return <>{children}</>;
};