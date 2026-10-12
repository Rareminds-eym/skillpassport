/**
 * Analytics Filters Hook
 * Global filter state management with URL sync and persistence
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FilterState, DateRange, DateRangePreset } from '../types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DATE_RANGE: DateRange = {
  preset: 'last_30_days',
  from: null,
  to: null,
};

const DEFAULT_FILTERS: FilterState = {
  dateRange: DEFAULT_DATE_RANGE,
  departments: [],
  locations: [],
  jobTypes: [],
  recruiters: [],
  status: [],
  priority: [],
};

const STORAGE_KEY = 'analytics_filters';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate date range from preset
 */
function calculateDateRange(preset: DateRangePreset): { from: string; to: string } | null {
  if (preset === 'custom' || preset === 'all_time') return null;

  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from = new Date();

  switch (preset) {
    case 'last_7_days':
      from.setDate(now.getDate() - 7);
      break;
    case 'last_30_days':
      from.setDate(now.getDate() - 30);
      break;
    case 'last_90_days':
      from.setDate(now.getDate() - 90);
      break;
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case 'this_quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), currentQuarter * 3, 1);
      break;
    case 'last_quarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      from = new Date(now.getFullYear(), lastQuarter * 3, 1);
      break;
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'year_to_date':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return null;
  }

  return {
    from: from.toISOString().split('T')[0],
    to,
  };
}

/**
 * Parse filters from URL parameters
 */
function parseFiltersFromUrl(searchParams: URLSearchParams): Partial<FilterState> {
  const filters: Partial<FilterState> = {};

  // Date range
  const preset = searchParams.get('dateRange') as DateRangePreset;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  if (preset) {
    const calculatedRange = calculateDateRange(preset);
    filters.dateRange = {
      preset,
      from: preset === 'custom' && from ? from : calculatedRange?.from || null,
      to: preset === 'custom' && to ? to : calculatedRange?.to || null,
    };
  }

  // Multi-select filters
  const departments = searchParams.get('departments');
  if (departments) filters.departments = departments.split(',');

  const locations = searchParams.get('locations');
  if (locations) filters.locations = locations.split(',');

  const jobTypes = searchParams.get('jobTypes');
  if (jobTypes) filters.jobTypes = jobTypes.split(',');

  const recruiters = searchParams.get('recruiters');
  if (recruiters) filters.recruiters = recruiters.split(',');

  const status = searchParams.get('status');
  if (status) filters.status = status.split(',');

  const priority = searchParams.get('priority');
  if (priority) filters.priority = priority.split(',');

  return filters;
}

/**
 * Convert filters to URL parameters
 */
function filtersToUrlParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  // Date range
  if (filters.dateRange.preset !== DEFAULT_DATE_RANGE.preset) {
    params.set('dateRange', filters.dateRange.preset);
    if (filters.dateRange.preset === 'custom') {
      if (filters.dateRange.from) params.set('from', filters.dateRange.from);
      if (filters.dateRange.to) params.set('to', filters.dateRange.to);
    }
  }

  // Multi-select filters
  if (filters.departments.length > 0) {
    params.set('departments', filters.departments.join(','));
  }
  if (filters.locations.length > 0) {
    params.set('locations', filters.locations.join(','));
  }
  if (filters.jobTypes.length > 0) {
    params.set('jobTypes', filters.jobTypes.join(','));
  }
  if (filters.recruiters.length > 0) {
    params.set('recruiters', filters.recruiters.join(','));
  }
  if (filters.status && filters.status.length > 0) {
    params.set('status', filters.status.join(','));
  }
  if (filters.priority && filters.priority.length > 0) {
    params.set('priority', filters.priority.join(','));
  }

  return params;
}

/**
 * Save filters to localStorage
 */
function saveFiltersToStorage(filters: FilterState): void {
  try {
    const data = {
      ...filters,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
}

/**
 * Load filters from localStorage
 */
function loadFiltersFromStorage(): Partial<FilterState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    
    // Check if saved data is stale (older than 7 days)
    if (data.savedAt) {
      const savedDate = new Date(data.savedAt);
      const daysSinceSaved = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSaved > 7) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }

    delete data.savedAt;
    return data;
  } catch (error) {
    console.error('Failed to load filters from localStorage:', error);
    return null;
  }
}

// ============================================================================
// Context
// ============================================================================

interface AnalyticsFiltersContextValue {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  updateDateRange: (dateRange: DateRange) => void;
  updateDepartments: (departments: string[]) => void;
  updateLocations: (locations: string[]) => void;
  updateJobTypes: (jobTypes: string[]) => void;
  updateRecruiters: (recruiters: string[]) => void;
  updateStatus: (status: string[]) => void;
  updatePriority: (priority: string[]) => void;
  resetFilters: () => void;
  clearFilter: (filterKey: keyof FilterState) => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
}

const AnalyticsFiltersContext = createContext<AnalyticsFiltersContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface AnalyticsFiltersProviderProps {
  children: React.ReactNode;
}

export function AnalyticsFiltersProvider({ children }: AnalyticsFiltersProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<FilterState>(() => {
    // Priority: URL params > localStorage > defaults
    const urlFilters = parseFiltersFromUrl(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      return { ...DEFAULT_FILTERS, ...urlFilters };
    }

    const storedFilters = loadFiltersFromStorage();
    if (storedFilters) {
      return { ...DEFAULT_FILTERS, ...storedFilters };
    }

    return DEFAULT_FILTERS;
  });

  // Sync filters to URL when they change
  useEffect(() => {
    const params = filtersToUrlParams(filters);
    setSearchParams(params, { replace: true });
    saveFiltersToStorage(filters);
  }, [filters, setSearchParams]);

  // Calculate date range whenever preset changes
  useEffect(() => {
    if (filters.dateRange.preset !== 'custom' && filters.dateRange.preset !== 'all_time') {
      const calculatedRange = calculateDateRange(filters.dateRange.preset);
      if (calculatedRange) {
        setFiltersState((prev) => ({
          ...prev,
          dateRange: {
            ...prev.dateRange,
            from: calculatedRange.from,
            to: calculatedRange.to,
          },
        }));
      }
    }
  }, [filters.dateRange.preset]);

  // Update functions
  const updateDateRange = useCallback((dateRange: DateRange) => {
    setFiltersState((prev) => ({ ...prev, dateRange }));
  }, []);

  const updateDepartments = useCallback((departments: string[]) => {
    setFiltersState((prev) => ({ ...prev, departments }));
  }, []);

  const updateLocations = useCallback((locations: string[]) => {
    setFiltersState((prev) => ({ ...prev, locations }));
  }, []);

  const updateJobTypes = useCallback((jobTypes: string[]) => {
    setFiltersState((prev) => ({ ...prev, jobTypes }));
  }, []);

  const updateRecruiters = useCallback((recruiters: string[]) => {
    setFiltersState((prev) => ({ ...prev, recruiters }));
  }, []);

  const updateStatus = useCallback((status: string[]) => {
    setFiltersState((prev) => ({ ...prev, status }));
  }, []);

  const updatePriority = useCallback((priority: string[]) => {
    setFiltersState((prev) => ({ ...prev, priority }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearFilter = useCallback((filterKey: keyof FilterState) => {
    setFiltersState((prev) => {
      const updated = { ...prev };
      if (filterKey === 'dateRange') {
        updated.dateRange = DEFAULT_DATE_RANGE;
      } else if (Array.isArray(updated[filterKey])) {
        (updated[filterKey] as string[]) = [];
      }
      return updated;
    });
  }, []);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    
    // Date range counts if not default
    if (filters.dateRange.preset !== DEFAULT_DATE_RANGE.preset) count++;
    
    // Array filters count if non-empty
    if (filters.departments.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.jobTypes.length > 0) count++;
    if (filters.recruiters.length > 0) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.priority && filters.priority.length > 0) count++;
    
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  const contextValue: AnalyticsFiltersContextValue = {
    filters,
    setFilters: setFiltersState,
    updateDateRange,
    updateDepartments,
    updateLocations,
    updateJobTypes,
    updateRecruiters,
    updateStatus,
    updatePriority,
    resetFilters,
    clearFilter,
    activeFilterCount,
    hasActiveFilters,
  };

  return (
    <AnalyticsFiltersContext.Provider value={contextValue}>
      {children}
    </AnalyticsFiltersContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAnalyticsFilters(): AnalyticsFiltersContextValue {
  const context = useContext(AnalyticsFiltersContext);
  if (context === undefined) {
    throw new Error('useAnalyticsFilters must be used within AnalyticsFiltersProvider');
  }
  return context;
}

// ============================================================================
// Export helper functions for external use
// ============================================================================

export { calculateDateRange, filtersToUrlParams, parseFiltersFromUrl };
