import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { opportunitiesService } from '../services/opportunitiesService';

/**
 * Custom hook for managing opportunities data with server-side pagination
 * @param {Object} options - Hook options
 * @param {boolean} options.fetchOnMount - Whether to fetch data on component mount
 * @param {Object} options.filters - Advanced filters to apply
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
    activeOnly = true,
    searchTerm = '',
    page = 1,
    pageSize = 12,
    sortBy = 'newest',
    serverSidePagination = false
  } = options;

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Memoize filters key for stable comparison
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  // Track if initial fetch has happened
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  
  // Track previous values for change detection
  const prevValuesRef = useRef({
    searchTerm,
    filtersKey,
    page,
    sortBy
  });

  /**
   * Fetch all opportunities (main method using our service)
   */
  const fetchAllOpportunities = useCallback(async () => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    setLoading(true);
    setError(null);

    try {
      // Build filters object
      const opportunityFilters = {
        ...filters,
        is_active: activeOnly,
        search: searchTerm && searchTerm.trim() ? searchTerm : undefined
      };

      // Fetch opportunities with filters
      const data = await opportunitiesService.getAllOpportunities(opportunityFilters);

      setOpportunities(data);
      setTotalCount(data.length);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (err) {
      console.error('❌ Error fetching opportunities:', err);
      setError(err.message || 'Failed to fetch opportunities');
      setOpportunities([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [filters, activeOnly, searchTerm, pageSize]);

  /**
   * Main fetch function
   */
  const fetchOpportunities = useCallback(() => {
    fetchAllOpportunities();
  }, [fetchAllOpportunities]);

  /**
   * Refresh opportunities data
   */
  const refreshOpportunities = useCallback(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  /**
   * Filter opportunities by employment type
   */
  const filterByEmploymentType = useCallback(async (employmentType) => {
    setLoading(true);
    setError(null);

    try {
      const data = await opportunitiesService.getAllOpportunities({
        ...filters,
        employment_type: employmentType,
        is_active: activeOnly
      });

      setOpportunities(data);
      setTotalCount(data.length);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (err) {
      console.error('Error filtering opportunities:', err);
      setError(err.message || 'Failed to filter opportunities');
    } finally {
      setLoading(false);
    }
  }, [filters, activeOnly, pageSize]);

  /**
   * Search opportunities by title or company
   */
  const searchOpportunities = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      fetchOpportunities();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await opportunitiesService.getAllOpportunities({
        ...filters,
        search: searchTerm,
        is_active: activeOnly
      });

      setOpportunities(data);
      setTotalCount(data.length);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (err) {
      console.error('Error searching opportunities:', err);
      setError(err.message || 'Failed to search opportunities');
    } finally {
      setLoading(false);
    }
  }, [filters, activeOnly, pageSize, fetchOpportunities]);

  // Initial fetch on mount
  useEffect(() => {
    if (!fetchOnMount) return;
    
    hasFetchedRef.current = true;
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Re-fetch when params change (after initial fetch)
  useEffect(() => {
    // Skip if initial fetch hasn't happened yet
    if (!hasFetchedRef.current) return;

    const prev = prevValuesRef.current;
    const hasChanges = 
      searchTerm !== prev.searchTerm ||
      filtersKey !== prev.filtersKey ||
      page !== prev.page ||
      sortBy !== prev.sortBy;

    if (hasChanges) {
      // Update previous values
      prevValuesRef.current = { searchTerm, filtersKey, page, sortBy };
      fetchAllOpportunities();
    }
  }, [searchTerm, filtersKey, page, sortBy, fetchAllOpportunities]);

  return {
    opportunities,
    loading,
    error,
    totalCount,
    totalPages,
    fetchOpportunities,
    refreshOpportunities,
    filterByEmploymentType,
    searchOpportunities
  };
};

export default useOpportunities;
