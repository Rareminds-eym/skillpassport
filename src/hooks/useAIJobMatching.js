import { useState, useEffect } from 'react';
import { matchJobsWithAI } from '../services/aiJobMatchingService';
import { opportunitiesService } from '../services/opportunitiesService';

/**
 * Custom hook for AI-powered job matching
 * @param {Object} studentProfile - Student profile data
 * @param {boolean} enabled - Whether to run matching (default: true)
 * @param {number} topN - Number of matches to return (default: 3)
 * @returns {Object} Hook state with matched jobs, loading, and error
 */
export const useAIJobMatching = (studentProfile, enabled = true, topN = 3) => {
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      // Don't run if disabled or no profile
      if (!enabled || !studentProfile) {
        setMatchedJobs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log({
          id: studentProfile?.id,
          email: studentProfile?.email,
          name: studentProfile?.name,
          department: studentProfile?.department,
          hasProfile: !!studentProfile?.profile,
          profileDept: studentProfile?.profile?.branch_field || studentProfile?.profile?.department
        });

        // Fetch all active opportunities
        const opportunities = await opportunitiesService.getAllOpportunities();

        // Filter only active opportunities
        const activeOpportunities = opportunities.filter(opp => {
          // Check if active flag is true
          if (opp.is_active === false || opp.status === 'draft') {
            return false;
          }

          // Check if deadline hasn't passed
          if (opp.deadline) {
            const deadline = new Date(opp.deadline);
            const now = new Date();
            if (deadline < now) {
              return false;
            }
          }

          return true;
        });


        if (activeOpportunities.length === 0) {
          setMatchedJobs([]);
          setLoading(false);
          return;
        }

        // Run AI matching
        const matches = await matchJobsWithAI(studentProfile, activeOpportunities, topN);

        setMatchedJobs(matches);

      } catch (err) {
        console.error('❌ Error in AI job matching:', err);
        setError(err.message || 'Failed to match jobs');
        setMatchedJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [
    studentProfile?.id, 
    studentProfile?.email,
    studentProfile?.department,
    studentProfile?.profile?.department,
    studentProfile?.profile?.branch_field,
    JSON.stringify(studentProfile?.profile?.technicalSkills || []),
    JSON.stringify(studentProfile?.profile?.technical_skills || []),
    enabled, 
    topN
  ]); // Re-run when student profile or key fields change

  /**
   * Manually refresh job matches
   */
  const refreshMatches = async () => {
    if (!studentProfile) return;

    try {
      setLoading(true);
      setError(null);

      const opportunities = await opportunitiesService.getAllOpportunities();
      const activeOpportunities = opportunities.filter(opp => 
        opp.is_active !== false && 
        opp.status !== 'draft' &&
        (!opp.deadline || new Date(opp.deadline) >= new Date())
      );

      const matches = await matchJobsWithAI(studentProfile, activeOpportunities, topN);
      setMatchedJobs(matches);
    } catch (err) {
      console.error('Error refreshing matches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    matchedJobs,
    loading,
    error,
    refreshMatches
  };
};

export default useAIJobMatching;
