import { Step } from 'react-joyride';

export interface TourStep extends Step {
  target: string;
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';
  disableBeacon?: boolean;
  hideCloseButton?: boolean;
  hideFooter?: boolean;
  showProgress?: boolean;
  showSkipButton?: boolean;
  spotlightClicks?: boolean;
  styles?: any;
}

export interface TourConfig {
  id: string;
  name: string;
  steps: TourStep[];
  options?: {
    continuous?: boolean;
    showProgress?: boolean;
    showSkipButton?: boolean;
    spotlightClicks?: boolean;
    disableOverlayClose?: boolean;
    hideCloseButton?: boolean;
    // Scrolling options
    scrollToFirstStep?: boolean;
    scrollOffset?: number;
    disableScrolling?: boolean;
    disableScrollParentFix?: boolean;
    customScrolling?: boolean; // Enable custom scroll centering
    styles?: any;
  };
}

export interface TourState {
  run: boolean;
  stepIndex: number;
  tourActive: boolean;
}

export interface TourProgress {
  tourId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  lastStepIndex?: number;
}