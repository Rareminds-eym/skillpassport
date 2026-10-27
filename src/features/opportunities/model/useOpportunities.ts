import { useState, useEffect, useRef } from 'react';
import { opportunitiesService } from '@/features/opportunities';
import type { Opportunity } from '../api/opportunitiesService';

interface OpportunityPageOptions {
  fetchOnMount?: boolean;
  filters?: Record<string, unknown>;
  learnerSkills?: unknown[];
  activeOnly?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  serverSidePagination?: boolean;
  includeFactoryVisits?: boolean;
}

/**
 * Custom hook for managing opportunities data with server-side pagination
 * @param {Object} options - Hook options
 * @param {boolean} options.fetchOnMount - Whether to fetch data on component mount
 * @param {Object} options.filters - Filters to apply to opportunities
 * @param {Array} options.learnerSkills - Learner skills for matching opportunities
 * @param {boolean} options.activeOnly - Whether to fetch only active opportunities
 * @param {string} options.searchTerm - Search term for filtering opportunities at DB level
 * @param {number} options.page - Current page number (1-indexed)
 * @param {number} options.pageSize - Number of items per page
 * @param {string} options.sortBy - Sort order ('newest' or 'oldest')
 * @param {boolean} options.serverSidePagination - Enable server-side pagination
 * @param {boolean} options.includeFactoryVisits - Include industrial visits in results
 * @returns {Object} Hook state and methods
 */
export const useOpportunities = (options: OpportunityPageOptions = {}) => {
  const {
    fetchOnMount = true,
    filters = {},
    learnerSkills = [],
    activeOnly = true,
    searchTerm = '',
    page = 1,
    pageSize = 6,
    sortBy = 'newest',
    serverSidePagination = false,
    includeFactoryVisits = false
  } = options;

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageKey = JSON.stringify([filters, activeOnly, searchTerm, page, pageSize, sortBy, serverSidePagination, includeFactoryVisits]);
  const [resolvedPageKey, setResolvedPageKey] = useState('');

  /**
   * Fetch opportunities with pagination support
   */
  const requestVersion = useRef(0);
  const pendingRequest = useRef<AbortController | null>(null);
  const fetchOpportunities = async () => {
    const version = ++requestVersion.current;
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
    setLoading(true);
    setError(null);

    try {
      let data;
      let count = 0;

      if (serverSidePagination) {
        // Validate page number before fetching
        if (page < 1) {
          setOpportunities([]);
          setTotalCount(0);
          setTotalPages(1);
          setLoading(false);
          return;
        }

        // Use paginated fetch
        const result = await opportunitiesService.getPaginatedOpportunities({
          page,
          pageSize,
          searchTerm,
          sortBy,
          filters,
          activeOnly,
          signal: controller.signal
        });
        data = result.data || [];
        count = result.count || 0;
      } else if (searchTerm && searchTerm.trim()) {
        // Use search method when search term is provided
        data = await opportunitiesService.searchOpportunities(searchTerm);
        count = data.length;
      } else {
        // Fetch all opportunities when no search term
        data = await opportunitiesService.getAllOpportunities({
          is_active: activeOnly,
          includeFactoryVisits
        });
        count = data.length;
      }

      if (version !== requestVersion.current) return;
      // Format opportunities for display
      const formattedOpportunities = data.map(opp => 
        opportunitiesService.formatOpportunityForDisplay(opp)
      );

      const calculatedTotalPages = Math.max(1, Math.ceil(count / pageSize));

      setOpportunities(formattedOpportunities);
      setTotalCount(count);
      setTotalPages(calculatedTotalPages);
      setResolvedPageKey(pageKey);
    } catch (err) {
      if (version !== requestVersion.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
      setResolvedPageKey(pageKey);

      // Fallback to empty array on error
      setOpportunities([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      if (version === requestVersion.current) setLoading(false);
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
  const filterByEmploymentType = async (employmentType: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await opportunitiesService.getFilteredOpportunities({
        ...filters,
        employment_type: employmentType
      });

      const formattedOpportunities = data.map(opp => 
        opportunitiesService.formatOpportunityForDisplay(opp)
      );

      setOpportunities(formattedOpportunities);
      setTotalCount(formattedOpportunities.length);
      setTotalPages(Math.max(1, Math.ceil(formattedOpportunities.length / pageSize)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter opportunities');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search opportunities by title or company
   */
  const searchOpportunities = async (term: string) => {
    if (!term.trim()) {
      fetchOpportunities();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allOpportunities = await opportunitiesService.getAllOpportunities();
      
      const filteredOpportunities = allOpportunities.filter(opp => 
        opp.title?.toLowerCase().includes(term.toLowerCase()) ||
        opp.company_name?.toLowerCase().includes(term.toLowerCase()) ||
        opp.description?.toLowerCase().includes(term.toLowerCase())
      );

      const formattedOpportunities = filteredOpportunities.map(opp => 
        opportunitiesService.formatOpportunityForDisplay(opp)
      );

      setOpportunities(formattedOpportunities);
      setTotalCount(formattedOpportunities.length);
      setTotalPages(Math.max(1, Math.ceil(formattedOpportunities.length / pageSize)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch opportunities when dependencies change
  useEffect(() => {
    if (fetchOnMount) {
      fetchOpportunities();
    }
    return () => { requestVersion.current += 1; pendingRequest.current?.abort(); };
  }, [fetchOnMount, JSON.stringify(filters), JSON.stringify(learnerSkills), activeOnly, searchTerm, page, pageSize, sortBy, serverSidePagination, includeFactoryVisits]);

  return {
    opportunities,
    loading: loading || (fetchOnMount && resolvedPageKey !== pageKey),
    hasLoadedPage: resolvedPageKey === pageKey,
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
