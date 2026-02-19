import { useState } from 'react';

/**
 * Hook to manage demo mode functionality
 * Returns modal state and handler to show demo modal
 */
export const useDemoMode = (message = "This feature is for demo purposes only.") => {
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleDemoClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowDemoModal(true);
  };

  const closeDemoModal = () => {
    setShowDemoModal(false);
  };

  return {
    showDemoModal,
    handleDemoClick,
    closeDemoModal,
    demoMessage: message
  };
};
