import { APIFunction, Integration } from '../types';
import { StoreIntegrator } from './StoreIntegrator';

/**
 * Specialized integrator for search API functions with search store
 */
export class SearchStoreIntegrator {
  private storeIntegrator: StoreIntegrator;

  constructor() {
    this.storeIntegrator = new StoreIntegrator();
  }

  /**
   * Create enhanced search API functions with store integration
   */
  async integrateSearchAPIs(searchFunctions: APIFunction[]): Promise<Map<string, string>> {
    const integratedCode = new Map<string, string>();

    for (const searchFunction of searchFunctions) {
      const code = await this.generateSearchIntegration(searchFunction);
      integratedCode.set(searchFunction.name, code);
    }

    return integratedCode;
  }

  /**
   * Generate store-integrated version of a search API function
   */
  private async generateSearchIntegration(searchFunction: APIFunction): Promise<string> {
    const functionName = searchFunction.name;
    const functionNameLower = functionName.toLowerCase();

    let code = `import { useSearchActions, useSearchStore, useSearch } from '../../stores/searchStore';\n\n`;

    // Generate function based on search operation type
    if (functionNameLower.includes('search') && !functionNameLower.includes('history')) {
      code += this.generateSearchIntegration(searchFunction);
    } else if (functionNameLower.includes('history')) {
      code += this.generateSearchHistoryIntegration(searchFunction);
    } else if (functionNameLower.includes('filter')) {
      code += this.generateSearchFilterIntegration(searchFunction);
    } else {
      // Generic search function integration
      code += this.generateGenericSearchIntegration(searchFunction);
    }

    return code;
  }

  /**
   * Generate main search integration
   */
  private generateMainSearchIntegration(searchFunction: APIFunction): string {
    return `
/**
 * Enhanced ${searchFunction.name} with search store integration
 * Connects with useSearchActions and useSearchStore
 */
export const ${searchFunction.name}Enhanced = async (query: string, filters?: any) => {
  const { handleSearch, setSearchResults, setIsSearching, addToHistory } = useSearchActions();
  
  try {
    // Update search store with query and loading state
    handleSearch(query);
    setIsSearching(true);
    
    // Call original search service
    const result = await originalSearchService.${searchFunction.name}(query, filters);
    
    // Update search store with results
    if (result.results) {
      setSearchResults(result.results);
    }
    
    // Add successful search to history
    if (query.trim()) {
      addToHistory(query);
    }
    
    return result;
  } catch (error) {
    // Update store with error state
    setIsSearching(false);
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${searchFunction.name.charAt(0).toUpperCase() + searchFunction.name.slice(1)} = () => {
  const { handleSearch, setSearchResults, setIsSearching, addToHistory } = useSearchActions();
  
  return async (query: string, filters?: any) => {
    try {
      handleSearch(query);
      setIsSearching(true);
      
      const result = await originalSearchService.${searchFunction.name}(query, filters);
      
      if (result.results) {
        setSearchResults(result.results);
      }
      
      if (query.trim()) {
        addToHistory(query);
      }
      
      return result;
    } catch (error) {
      setIsSearching(false);
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate search history integration
   */
  private generateSearchHistoryIntegration(searchFunction: APIFunction): string {
    const functionNameLower = searchFunction.name.toLowerCase();
    
    if (functionNameLower.includes('add')) {
      return `
/**
 * Enhanced ${searchFunction.name} with search store integration
 */
export const ${searchFunction.name}Enhanced = async (studentId: string, searchTerm: string) => {
  const { addToHistory } = useSearchActions();
  
  try {
    // Call original search history service
    const result = await originalSearchHistoryService.${searchFunction.name}(studentId, searchTerm);
    
    // Update search store history
    addToHistory(searchTerm);
    
    return result;
  } catch (error) {
    console.error('Failed to add search term to history:', error);
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${searchFunction.name.charAt(0).toUpperCase() + searchFunction.name.slice(1)} = () => {
  const { addToHistory } = useSearchActions();
  
  return async (studentId: string, searchTerm: string) => {
    try {
      const result = await originalSearchHistoryService.${searchFunction.name}(studentId, searchTerm);
      addToHistory(searchTerm);
      return result;
    } catch (error) {
      console.error('Failed to add search term to history:', error);
      throw error;
    }
  };
};
`;
    } else if (functionNameLower.includes('clear')) {
      return `
/**
 * Enhanced ${searchFunction.name} with search store integration
 */
export const ${searchFunction.name}Enhanced = async (studentId: string) => {
  const { clearHistory } = useSearchActions();
  
  try {
    // Call original search history service
    const result = await originalSearchHistoryService.${searchFunction.name}(studentId);
    
    // Clear search store history
    clearHistory();
    
    return result;
  } catch (error) {
    console.error('Failed to clear search history:', error);
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${searchFunction.name.charAt(0).toUpperCase() + searchFunction.name.slice(1)} = () => {
  const { clearHistory } = useSearchActions();
  
  return async (studentId: string) => {
    try {
      const result = await originalSearchHistoryService.${searchFunction.name}(studentId);
      clearHistory();
      return result;
    } catch (error) {
      console.error('Failed to clear search history:', error);
      throw error;
    }
  };
};
`;
    } else {
      return `
/**
 * Enhanced ${searchFunction.name} with search store integration
 */
export const ${searchFunction.name}Enhanced = async (...args: any[]) => {
  const searchStore = useSearchStore();
  
  try {
    // Call original search history service
    const result = await originalSearchHistoryService.${searchFunction.name}(...args);
    
    // Update search store history if we get history data
    if (result.history && Array.isArray(result.history)) {
      searchStore.setState((state) => ({
        ...state,
        searchHistory: result.history.map((item: any) => item.searchTerm || item)
      }));
    }
    
    return result;
  } catch (error) {
    console.error('Search history operation failed:', error);
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${searchFunction.name.charAt(0).toUpperCase() + searchFunction.name.slice(1)} = () => {
  const searchStore = useSearchStore();
  
  return async (...args: any[]) => {
    try {
      const result = await originalSearchHistoryService.${searchFunction.name}(...args);
      
      if (result.history && Array.isArray(result.history)) {
        searchStore.setState((state) => ({
          ...state,
          searchHistory: result.history.map((item: any) => item.searchTerm || item)
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Search history operation failed:', error);
      throw error;
    }
  };
};
`;
    }
  }

  /**
   * Generate search filter integration
   */
  private generateSearchFilterIntegration(searchFunction: APIFunction): string {
    return `
/**
 * Enhanced ${searchFunction.name} with search store integration
 */
export const ${searchFunction.name}Enhanced = async (filters: any) => {
  const { addFilter, setFilters } = useSearchActions();
  
  try {
    // Call original search service
    const result = await originalSearchService.${searchFunction.name}(filters);
    
    // Update search store with filters
    if (filters) {
      setFilters(filters);
    }
    
    return result;
  } catch (error) {
    console.error('Search filter operation failed:', error);
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${searchFunction.name.charAt(0).toUpperCase() + searchFunction.name.slice(1)} = () => {
  const { addFilter, setFilters } = useSearchActions();
  
  return async (filters: any) => {
    try {
      const result = await originalSearchService.${searchFunction.name}(filters);
      
      if (filters) {
        setFilters(filters);
      }
      
      return result;
    } catch (error) {
      console.error('Search filter operation failed:', error);
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate generic search integration
   */
  private generateGenericSearchIntegration(searchFunction: APIFunction): string {
    return `
/**
 * Enhanced ${searchFunction.name} with search store integration
 */
export const ${searchFunction.name}Enhanced = async (...args: any[]) => {
  const searchStore = useSearchStore();
  
  try {
    // Call original search service
    const result = await originalSearchService.${searchFunction.name}(...args);
    
    return result;
  } catch (error) {
    console.error('Search operation failed:', error);
    throw error;
  }
};

/**
 * Hook-based version for React components
 */
export const use${searchFunction.name.charAt(0).toUpperCase() + searchFunction.name.slice(1)} = () => {
  const searchStore = useSearchStore();
  
  return async (...args: any[]) => {
    try {
      const result = await originalSearchService.${searchFunction.name}(...args);
      return result;
    } catch (error) {
      console.error('Search operation failed:', error);
      throw error;
    }
  };
};
`;
  }

  /**
   * Generate a complete search API file with all integrations
   */
  async generateSearchAPIFile(searchFunctions: APIFunction[]): Promise<string> {
    let code = `// Enhanced search API with Zustand store integration
// This file connects search operations with useSearchActions and useSearchStore

import { useSearchActions, useSearchStore, useSearch } from '../../stores/searchStore';
import * as originalSearchService from '../../services/searchService';
import * as originalSearchHistoryService from '../../services/searchHistoryService';

`;

    // Generate all search function integrations
    const integrations = await this.integrateSearchAPIs(searchFunctions);
    
    for (const [functionName, functionCode] of integrations) {
      code += functionCode + '\n';
    }

    // Add utility functions
    code += `
// Utility functions for search state management

/**
 * Get current search state with reactive updates
 */
export const useCurrentSearch = () => {
  return useSearch();
};

/**
 * Perform search with store integration
 */
export const usePerformSearch = () => {
  const { handleSearch, setSearchResults, setIsSearching, addToHistory } = useSearchActions();
  
  return async (query: string, filters?: any) => {
    try {
      handleSearch(query);
      setIsSearching(true);
      
      // This would call the actual search API
      // const result = await searchAPI(query, filters);
      // setSearchResults(result.results);
      
      if (query.trim()) {
        addToHistory(query);
      }
      
      return { success: true };
    } catch (error) {
      setIsSearching(false);
      throw error;
    }
  };
};

/**
 * Clear search with store integration
 */
export const useClearSearch = () => {
  const { clearSearch } = useSearchActions();
  
  return () => {
    clearSearch();
  };
};

// Export original services for backward compatibility
export { originalSearchService, originalSearchHistoryService };
`;

    return code;
  }
}