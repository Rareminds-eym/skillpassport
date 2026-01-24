import React from 'react';
import { HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '../../Students/components/ui/button';
import { useTour } from '../TourProvider';
import { useTourProgress } from '../hooks/useTourProgress';
import { TourConfig } from '../types';

interface TourTriggerButtonProps {
  tourConfig: TourConfig;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const TourTriggerButton: React.FC<TourTriggerButtonProps> = ({
  tourConfig,
  variant = 'outline',
  size = 'sm',
  className = '',
  showIcon = true,
  children
}) => {
  const { startTour, isTourActive, currentTourId } = useTour();
  const { isCompleted, isSkipped, resetTour } = useTourProgress(tourConfig.id);

  const handleClick = () => {
    if (isTourActive && currentTourId === tourConfig.id) {
      // Tour is already running for this config, don't restart
      return;
    }

    if (isCompleted) {
      // Reset and restart completed tour
      resetTour();
      setTimeout(() => {
        startTour(tourConfig);
      }, 100);
    } else if (isSkipped) {
      // For skipped tours, just start again without resetting
      // This preserves the skipped status but allows the user to take the tour
      startTour(tourConfig);
    } else {
      // Start tour normally (not_started status)
      startTour(tourConfig);
    }
  };

  const isCurrentTourActive = isTourActive && currentTourId === tourConfig.id;
  const hasBeenTaken = isCompleted || isSkipped;

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      disabled={isCurrentTourActive}
      className={`
        ${className}
        ${isCurrentTourActive ? 'opacity-50 cursor-not-allowed' : ''}
        transition-all duration-200 hover:scale-105
      `}
      title={
        isCurrentTourActive 
          ? 'Tour is currently active'
          : isCompleted 
          ? 'Restart Dashboard Tour'
          : isSkipped
          ? 'Take Dashboard Tour (Previously Skipped)'
          : 'Take Dashboard Tour'
      }
    >
      {showIcon && (
        hasBeenTaken ? (
          <RotateCcw className="w-4 h-4 mr-2" />
        ) : (
          <HelpCircle className="w-4 h-4 mr-2" />
        )
      )}
      {children || (
        isCurrentTourActive 
          ? 'Tour Active...'
          : isCompleted 
          ? 'Retake Tour'
          : isSkipped
          ? 'Take Tour'
          : 'Take Tour'
      )}
    </Button>
  );
};