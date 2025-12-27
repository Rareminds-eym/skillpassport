import { useState, useEffect } from 'react';
import OpportunitiesService from '../services/opportunitiesService';

/**
 * Custom hook for managing opportunities data
 * @param {Object} options - Hook options
 * @param {boolean} options.fetchOnMount - Whether to fetch data on component mount
 * @param {Object} options.filters - Filters to apply to opportunities
 * @param {Array} options.studentSkills - Student skills for matching opportunities
 * @param {boolean} options.activeOnly - Whether to fetch only active opportunities
 * @param {string} options.searchTerm - Search term for filtering opportunities at DB level
 * @returns {Object} Hook state and methods
 */
export const useOpportunities = (options = {}) => {
  const {
    fetchOnMount = true,
    filters = {},
    studentSkills = [],
    activeOnly = true,
    searchTerm = ''
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
      // Fetch opportunities with search term if provided
      let data;
      if (searchTerm && searchTerm.trim()) {
        // Use search method when search term is provided
        data = await OpportunitiesService.searchOpportunities(searchTerm);
      } else {
        // Fetch all opportunities when no search term
        data = await OpportunitiesService.getAllOpportunities();
      }

      // Format opportunities for display
      const formattedOpportunities = data.map(opp => 
        OpportunitiesService.formatOpportunityForDisplay(opp)
      );

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
    if (fetchOnMount) {
      fetchOpportunities();
    }
  }, [fetchOnMount]);

  // Re-fetch when dependencies change (including searchTerm)
  useEffect(() => {
    if (fetchOnMount) {
      fetchOpportunities();
    }
  }, [JSON.stringify(filters), JSON.stringify(studentSkills), activeOnly, searchTerm]);

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