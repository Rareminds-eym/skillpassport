import { Step } from 'react-joyride';
import { ReactNode } from 'react';

export interface TourStep extends Step {
  target: string;
  content: ReactNode;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
  disableBeacon?: boolean;
  hideCloseButton?: boolean;
  hideFooter?: boolean;
  showProgress?: boolean;
  showSkipButton?: boolean;
  spotlightClicks?: boolean;
  styles?: Record<string, any>;
}

export interface TourConfig {
  steps: TourStep[];
  options?: {
    continuous?: boolean;
    showProgress?: boolean;
    showSkipButton?: boolean;
    styles?: Record<string, any>;
    locale?: Record<string, string>;
  };
}

export interface TourProgress {
  dashboard_completed?: boolean;
  assessment_test_completed?: boolean;
  assessment_result_completed?: boolean;
  last_completed_tour?: string;
  completed_at?: string;
}

export interface TourState {
  isRunning: boolean;
  stepIndex: number;
  tourKey: string | null;
  progress: TourProgress;
}

export type TourKey = 'dashboard' | 'assessment_test' | 'assessment_result';