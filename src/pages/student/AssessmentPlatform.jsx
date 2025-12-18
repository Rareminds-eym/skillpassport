import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmbeddedAssessment from '../../components/assessment/EmbeddedAssessment';

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
      navigate('/student/dashboard', {
        state: {
          assessmentCompleted: true,
          showResults: true,
          results: results
        }
      });
    } else {
      // User exited without completing
      navigate('/student/my-learning');
    }
  };

  return <EmbeddedAssessment onClose={handleAssessmentClose} />;
};

export default AssessmentPlatform;
