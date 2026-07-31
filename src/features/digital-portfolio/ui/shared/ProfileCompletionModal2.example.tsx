/**
 * Example Usage of ProfileCompletionModal2
 * 
 * This shows how to replace ProfileCompletionModal with ProfileCompletionModal2
 */

import React, { useState } from 'react';
import ProfileCompletionModal2 from './ProfileCompletionModal';

const ExampleUsage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Example incomplete sections
  const incompleteSections = [
    'Projects',
    'Achievements', 
    'Hobbies',
    'Interests',
    'Languages'
  ];

  const handleComplete = () => {
    console.log('Profile completed!');
    setIsModalOpen(false);
    // Refresh portfolio data or navigate
  };

  const handleSkip = () => {
    console.log('Skipped for now');
    setIsModalOpen(false);
    // Maybe set a reminder
  };

  const handleNeverShow = () => {
    console.log('Never show again');
    setIsModalOpen(false);
    // Save preference to local storage or backend
    localStorage.setItem('hideProfileCompletion', 'true');
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Open Profile Completion
      </button>

      <ProfileCompletionModal2
        isOpen={isModalOpen}
        incompleteSections={incompleteSections}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onNeverShow={handleNeverShow}
        onClose={handleClose}
      />
    </div>
  );
};

export default ExampleUsage;
