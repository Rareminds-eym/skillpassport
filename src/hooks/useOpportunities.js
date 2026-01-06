import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OpportunitiesService from '../services/opportunitiesService';

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
   * Fetch opportunities with server-side pagination
   */
  const fetchPaginatedOpportunities = useCallback(async (currentFilters) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    setLoading(true);
    setError(null);

    try {
      const result = await OpportunitiesService.getPaginatedOpportunities({
        page,
        pageSize,
        searchTerm,
        filters: currentFilters,
        sortBy
      });

      const formattedOpportunities = result.data.map(opp => 
        OpportunitiesService.formatOpportunityForDisplay(opp)
      );

      setOpportunities(formattedOpportunities);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('❌ Error fetching paginated opportunities:', err);
      setError(err.message || 'Failed to fetch opportunities');
      setOpportunities([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [page, pageSize, searchTerm, sortBy]);

  /**
   * Fetch all opportunities (legacy method for non-paginated use)
   */
  const fetchAllOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data;
      if (searchTerm && searchTerm.trim()) {
        data = await OpportunitiesService.searchOpportunities(searchTerm);
      } else {
        data = await OpportunitiesService.getAllOpportunities();
      }

      const formattedOpportunities = data.map(opp => 
        OpportunitiesService.formatOpportunityForDisplay(opp)
      );

      setOpportunities(formattedOpportunities);
      setTotalCount(formattedOpportunities.length);
      setTotalPages(Math.ceil(formattedOpportunities.length / pageSize));
    } catch (err) {
      console.error('❌ Error fetching opportunities:', err);
      setError(err.message || 'Failed to fetch opportunities');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pageSize]);

  /**
   * Main fetch function that routes to appropriate method
   */
  const fetchOpportunities = useCallback(() => {
    if (serverSidePagination) {
      fetchPaginatedOpportunities(filters);
    } else {
      fetchAllOpportunities();
    }
  }, [serverSidePagination, fetchPaginatedOpportunities, fetchAllOpportunities, filters]);

  /**
   * Refresh opportunities data
   */
  const refreshOpportunities = useCallback(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

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
      
      if (serverSidePagination) {
        fetchPaginatedOpportunities(filters);
      } else {
        fetchAllOpportunities();
      }
    }
  }, [searchTerm, filtersKey, page, sortBy, serverSidePagination, fetchPaginatedOpportunities, fetchAllOpportunities, filters]);

  return {
    opportunities,
    loading,
    error,
    totalCount,
    totalPages,
    fetchOpportunities,
    refreshOpportunities
  };
};

export default useOpportunities;
