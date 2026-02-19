import React from 'react';
import { useDemoMode } from '../../hooks/useDemoMode';
import DemoModal from './DemoModal';

/**
 * Wrapper component that handles demo mode for any button
 * Usage: <DemoButton onClick={yourHandler}>{children}</DemoButton>
 */
export const DemoButton = ({ children, message, className, disabled, ...props }) => {
  const { showDemoModal, handleDemoClick, closeDemoModal, demoMessage } = useDemoMode(message);

  return (
    <>
      <button
        {...props}
        className={className}
        disabled={disabled}
        onClick={handleDemoClick}
      >
        {children}
      </button>
      <DemoModal 
        isOpen={showDemoModal} 
        onClose={closeDemoModal} 
        message={demoMessage}
      />
    </>
  );
};

/**
 * Hook with modal included - use this for custom implementations
 */
export const useDemoModeWithModal = (message) => {
  const { showDemoModal, handleDemoClick, closeDemoModal, demoMessage } = useDemoMode(message);
  
  const DemoModalComponent = () => (
    <DemoModal 
      isOpen={showDemoModal} 
      onClose={closeDemoModal} 
      message={demoMessage}
    />
  );

  return {
    handleDemoClick,
    DemoModalComponent
  };
};
