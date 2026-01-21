import { useState, useEffect } from 'react';
import { opportunitiesService } from '../services/opportunitiesService';

/**
 * Custom hook for managing opportunities data with server-side pagination
 * @param {Object} options - Hook options
 * @param {boolean} options.fetchOnMount - Whether to fetch data on component mount
 * @param {Object} options.filters - Filters to apply to opportunities
 * @param {Array} options.studentSkills - Student skills for matching opportunities
 * @param {boolean} options.activeOnly - Whether to fetch only active opportunities
 * @param {string} options.searchTerm - Search term for filtering opportunities at DB level
 * @param {number} options.page - Current page number (1-indexed)
 * @param {number} options.pageSize - Number of items per page
 * @param {string} options.sortBy - Sort order ('newest' or 'oldest')
 * @param {boolean} options.serverSidePagination - Enable server-side pagination
 * @returns {Object} Hook state and methods
 */
export const useOpportunities = (options = {}) => {
  const {
    fetchOnMount = true,
    filters = {},
    studentSkills = [],
    activeOnly = true,
    searchTerm = '',
    page = 1,
    pageSize = 6,
    sortBy = 'newest',
    serverSidePagination = false,
  } = options;

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch opportunities with pagination support
   */
  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);

    try {
      let data;
      let count = 0;

      if (serverSidePagination) {
        // Use paginated fetch
        const result = await opportunitiesService.getPaginatedOpportunities({
          page,
          pageSize,
          searchTerm,
          sortBy,
          filters,
          activeOnly,
        });
        data = result.data || [];
        count = result.count || 0;
      } else if (searchTerm && searchTerm.trim()) {
        // Use search method when search term is provided
        data = await opportunitiesService.searchOpportunities(searchTerm);
        count = data.length;
      } else {
        // Fetch all opportunities when no search term
        data = await opportunitiesService.getAllOpportunities();
        count = data.length;
      }

      // Format opportunities for display
      const formattedOpportunities = data.map((opp) =>
        opportunitiesService.formatOpportunityForDisplay(opp)
      );

      setOpportunities(formattedOpportunities);
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
    } catch (err) {
      console.error('❌ Error fetching opportunities:', err);
      setError(err.message || 'Failed to fetch opportunities');

      // Fallback to empty array on error
      setOpportunities([]);
      setTotalCount(0);
      setTotalPages(1);
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
      const data = await opportunitiesService.getFilteredOpportunities({
        ...filters,
        employment_type: employmentType,
      });

      const formattedOpportunities = data.map((opp) =>
        opportunitiesService.formatOpportunityForDisplay(opp)
      );

      setOpportunities(formattedOpportunities);
      setTotalCount(formattedOpportunities.length);
      setTotalPages(Math.max(1, Math.ceil(formattedOpportunities.length / pageSize)));
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
  const searchOpportunities = async (term) => {
    if (!term.trim()) {
      fetchOpportunities();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allOpportunities = await opportunitiesService.getAllOpportunities();

      const filteredOpportunities = allOpportunities.filter(
        (opp) =>
          opp.title?.toLowerCase().includes(term.toLowerCase()) ||
          opp.company_name?.toLowerCase().includes(term.toLowerCase()) ||
          opp.description?.toLowerCase().includes(term.toLowerCase())
      );

      const formattedOpportunities = filteredOpportunities.map((opp) =>
        opportunitiesService.formatOpportunityForDisplay(opp)
      );

      setOpportunities(formattedOpportunities);
      setTotalCount(formattedOpportunities.length);
      setTotalPages(Math.max(1, Math.ceil(formattedOpportunities.length / pageSize)));
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

  // Re-fetch when dependencies change
  useEffect(() => {
    if (fetchOnMount) {
      fetchOpportunities();
    }
  }, [
    JSON.stringify(filters),
    JSON.stringify(studentSkills),
    activeOnly,
    searchTerm,
    page,
    pageSize,
    sortBy,
    serverSidePagination,
  ]);

  return {
    opportunities,
    loading,
    error,
    totalCount,
    totalPages,
    fetchOpportunities,
    refreshOpportunities,
    filterByEmploymentType,
    searchOpportunities,
  };
};

export default useOpportunities;
