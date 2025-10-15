import { useState, useEffect } from 'react';
import OpportunitiesService from '../services/opportunitiesService';

/**
 * Custom hook for managing opportunities data
 * @param {Object} options - Hook options
 * @param {boolean} options.fetchOnMount - Whether to fetch data on component mount
 * @param {Object} options.filters - Filters to apply to opportunities
 * @param {Array} options.studentSkills - Student skills for matching opportunities
 * @param {boolean} options.activeOnly - Whether to fetch only active opportunities
 * @returns {Object} Hook state and methods
 */
export const useOpportunities = (options = {}) => {
  const {
    fetchOnMount = true,
    filters = {},
    studentSkills = [],
    activeOnly = true
  } = options;

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch opportunities based on the provided options
   */
  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 useOpportunities: Starting fetch with options:', {
        studentSkills,
        activeOnly,
        filters
      });

      // Simplified: Always fetch all opportunities for now
      console.log('📋 Fetching all opportunities');
      const data = await OpportunitiesService.getAllOpportunities();

      console.log('📊 Raw data received:', data);

      // Format opportunities for display
      const formattedOpportunities = data.map(opp => 
        OpportunitiesService.formatOpportunityForDisplay(opp)
      );

      console.log('✨ Formatted opportunities:', formattedOpportunities);
      setOpportunities(formattedOpportunities);
    } catch (err) {
      console.error('❌ Error fetching opportunities:', err);
      setError(err.message || 'Failed to fetch opportunities');
      
      // Fallback to empty array on error
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh opportunities data
   */
  const refreshOpportunities = () => {
    fetchOpportunities();
  };

  /**
   * Filter opportunities by employment type
   */
  const filterByEmploymentType = async (employmentType) => {
    setLoading(true);
    setError(null);

    try {
      const data = await OpportunitiesService.getFilteredOpportunities({
        ...filters,
        employment_type: employmentType
      });

      const formattedOpportunities = data.map(opp => 
        OpportunitiesService.formatOpportunityForDisplay(opp)
      );

      setOpportunities(formattedOpportunities);
    } catch (err) {
      console.error('Error filtering opportunities:', err);
      setError(err.message || 'Failed to filter opportunities');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search opportunities by title or company
   */
  const searchOpportunities = async (searchTerm) => {
    if (!searchTerm.trim()) {
      fetchOpportunities();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allOpportunities = await OpportunitiesService.getAllOpportunities();
      
      const filteredOpportunities = allOpportunities.filter(opp => 
        opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const formattedOpportunities = filteredOpportunities.map(opp => 
        OpportunitiesService.formatOpportunityForDisplay(opp)
      );

      setOpportunities(formattedOpportunities);
    } catch (err) {
      console.error('Error searching opportunities:', err);
      setError(err.message || 'Failed to search opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch opportunities on mount if enabled
  useEffect(() => {
    console.log('🚀 useOpportunities: Mount effect triggered', { fetchOnMount });
    if (fetchOnMount) {
      fetchOpportunities();
    }
  }, [fetchOnMount]);

  // Re-fetch when dependencies change
  useEffect(() => {
    console.log('🔄 useOpportunities: Dependencies changed', {
      filters,
      studentSkills,
      activeOnly,
      fetchOnMount
    });
    if (fetchOnMount) {
      fetchOpportunities();
    }
  }, [JSON.stringify(filters), JSON.stringify(studentSkills), activeOnly]);

  return {
    opportunities,
    loading,
    error,
    fetchOpportunities,
    refreshOpportunities,
    filterByEmploymentType,
    searchOpportunities
  };
};

export default useOpportunities;