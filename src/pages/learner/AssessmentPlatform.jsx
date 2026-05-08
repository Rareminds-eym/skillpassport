import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmbeddedAssessment } from '@/features/assessment';

/**
 * Assessment Platform Page
 * Full-page view for the embedded assessment
 */
const AssessmentPlatform = () => {
  const navigate = useNavigate();

  const handleAssessmentClose = (results) => {
    // Handle assessment completion or exit
    if (results) {
      // Assessment was completed successfully
      navigate('/learner/dashboard', {
        state: {
          assessmentCompleted: true,
          showResults: true,
          results: results
        }
      });
    } else {
      // User exited without completing
      navigate('/learner/my-learning');
    }
  };

  return <EmbeddedAssessment onClose={handleAssessmentClose} />;
};

export default AssessmentPlatform;
