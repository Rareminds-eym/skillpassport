import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  [key: string]: any;
}

export interface SearchFilters {
  category?: string;
  type?: string;
  dateRange?: { start: string; end: string };
}

interface SearchState {
  // Query state
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  searchError: string | null;
  
  // Filters
  filters: SearchFilters;
  activeFilters: string[];
  
  // History
  searchHistory: string[];
  
  // Pagination
  totalResults: number;
  currentPage: number;
  resultsPerPage: number;
  hasMoreResults: boolean;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSearchError: (error: string | null) => void;
  
  // Filter actions
  setFilters: (filters: SearchFilters) => void;
  addFilter: (key: keyof SearchFilters, value: any) => void;
  removeFilter: (key: keyof SearchFilters) => void;
  clearFilters: () => void;
  setActiveFilters: (filters: string[]) => void;
  
  // History actions
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
  
  // Pagination actions
  setCurrentPage: (page: number) => void;
  setTotalResults: (total: number) => void;
  setResultsPerPage: (count: number) => void;
  setHasMoreResults: (hasMore: boolean) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // Main actions
  handleSearch: (query: string) => void;
  clearSearch: () => void;
  
  // Computed
  hasResults: () => boolean;
  hasActiveFilters: () => boolean;
  pageCount: () => number;
}

const MAX_HISTORY_ITEMS = 10;

export const useSearchStore = create<SearchState>()(
  immer((set, get) => ({
    // Initial state
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    searchError: null,
    
    filters: {},
    activeFilters: [],
    
    searchHistory: [],
    
    totalResults: 0,
    currentPage: 1,
    resultsPerPage: 20,
    hasMoreResults: false,

    // Basic setters
    setSearchQuery: (query) => {
      set((state) => {
        state.searchQuery = query;
      });
    },

    setSearchResults: (results) => {
      set((state) => {
        state.searchResults = results;
        state.totalResults = results.length;
        state.isSearching = false;
        state.searchError = null;
      });
    },

    setIsSearching: (isSearching) => {
      set((state) => {
        state.isSearching = isSearching;
      });
    },

    setSearchError: (error) => {
      set((state) => {
        state.searchError = error;
        state.isSearching = false;
      });
    },

    // Filter actions
    setFilters: (filters) => {
      set((state) => {
        state.filters = filters;
        state.activeFilters = Object.keys(filters).filter(
          (key) => filters[key as keyof SearchFilters] !== undefined
        );
        state.currentPage = 1; // Reset to first page when filters change
      });
    },

    addFilter: (key, value) => {
      set((state) => {
        state.filters[key] = value;
        if (!state.activeFilters.includes(key)) {
          state.activeFilters.push(key);
        }
        state.currentPage = 1;
      });
    },

    removeFilter: (key) => {
      set((state) => {
        delete state.filters[key];
        state.activeFilters = state.activeFilters.filter((f) => f !== key);
        state.currentPage = 1;
      });
    },

    clearFilters: () => {
      set((state) => {
        state.filters = {};
        state.activeFilters = [];
        state.currentPage = 1;
      });
    },

    setActiveFilters: (filters) => {
      set((state) => {
        state.activeFilters = filters;
      });
    },

    // History actions
    addToHistory: (query) => {
      if (!query.trim()) return;
      
      set((state) => {
        // Remove duplicate if exists
        state.searchHistory = state.searchHistory.filter((q) => q !== query);
        // Add to beginning
        state.searchHistory.unshift(query);
        // Keep only max items
        if (state.searchHistory.length > MAX_HISTORY_ITEMS) {
          state.searchHistory = state.searchHistory.slice(0, MAX_HISTORY_ITEMS);
        }
      });
    },

    clearHistory: () => {
      set((state) => {
        state.searchHistory = [];
      });
    },

    removeFromHistory: (query) => {
      set((state) => {
        state.searchHistory = state.searchHistory.filter((q) => q !== query);
      });
    },

    // Pagination actions
    setCurrentPage: (page) => {
      set((state) => {
        state.currentPage = Math.max(1, page);
      });
    },

    setTotalResults: (total) => {
      set((state) => {
        state.totalResults = total;
      });
    },

    setResultsPerPage: (count) => {
      set((state) => {
        state.resultsPerPage = count;
        state.currentPage = 1;
      });
    },

    setHasMoreResults: (hasMore) => {
      set((state) => {
        state.hasMoreResults = hasMore;
      });
    },

    nextPage: () => {
      set((state) => {
        const maxPage = Math.ceil(state.totalResults / state.resultsPerPage);
        if (state.currentPage < maxPage) {
          state.currentPage += 1;
        }
      });
    },

    previousPage: () => {
      set((state) => {
        if (state.currentPage > 1) {
          state.currentPage -= 1;
        }
      });
    },

    // Main actions
    handleSearch: (query) => {
      set((state) => {
        state.searchQuery = query;
        state.isSearching = true;
        state.searchError = null;
        state.currentPage = 1;
      });
      // Add to history
      get().addToHistory(query);
    },

    clearSearch: () => {
      set((state) => {
        state.searchQuery = '';
        state.searchResults = [];
        state.isSearching = false;
        state.searchError = null;
        state.filters = {};
        state.activeFilters = [];
        state.currentPage = 1;
        state.totalResults = 0;
        state.hasMoreResults = false;
      });
    },

    // Computed (use getters as functions for compatibility)
    hasResults: () => {
      return get().searchResults.length > 0;
    },

    hasActiveFilters: () => {
      return get().activeFilters.length > 0;
    },

    pageCount: () => {
      const { totalResults, resultsPerPage } = get();
      return Math.ceil(totalResults / resultsPerPage);
    },
  }))
);

// Convenience hooks
export const useSearchQuery = () => useSearchStore((state) => state.searchQuery);
export const useSearchResults = () => useSearchStore((state) => state.searchResults);
export const useIsSearching = () => useSearchStore((state) => state.isSearching);
export const useSearchFilters = () => useSearchStore((state) => state.filters);
export const useSearchHistory = () => useSearchStore((state) => state.searchHistory);
export const useSearchActions = () =>
  useSearchStore((state) => ({
    handleSearch: state.handleSearch,
    clearSearch: state.clearSearch,
    setSearchQuery: state.setSearchQuery,
    setSearchResults: state.setSearchResults,
    setIsSearching: state.setIsSearching,
    addFilter: state.addFilter,
    removeFilter: state.removeFilter,
    clearFilters: state.clearFilters,
  }));
