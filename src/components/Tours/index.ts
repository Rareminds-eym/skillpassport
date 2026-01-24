// Main exports for the Tours system
export { TourProvider, useTour } from './TourProvider';
export { useTourProgress } from './hooks/useTourProgress';
export { TourTriggerButton } from './components/TourTriggerButton';
export { AssessmentTestTour } from './components/AssessmentTestTour';
export { AssessmentResultTour } from './components/AssessmentResultTour';

// Tour configurations
export { studentDashboardTour } from './configs/studentDashboardTour';
export { assessmentTestTour } from './configs/assessmentTestTour';
export { assessmentResultTour } from './configs/assessmentResultTour';

// Types
export type { 
  TourStep, 
  TourConfig, 
  TourState, 
  TourProgress 
} from './types';