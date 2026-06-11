
import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('SearchHistoryService');

/**
 * Service for managing search history
 */
export class SearchHistoryService {
  /**
   * Add a search term to history
   * @param {string} learnerId - Learner's UUID
   * @param {string} searchTerm - Search term to save
   * @returns {Promise<Object>} Result
   */
  static async addSearchTerm(learnerId, searchTerm) {
    try {
      
      if (!learnerId) {
        return { success: false, message: 'Learner ID is required' };
      }

      if (!searchTerm || !searchTerm.trim()) {
        return { success: false, message: 'Search term is empty' };
      }

      const trimmedTerm = searchTerm.trim();

      // Check if term already exists
      const response: any = await apiPost('/opportunities', { action: 'add-search-term', learner_id: learnerId, search_term: trimmedTerm });
      if (response?.error) throw new Error(response.error.message || 'Failed to save search term');
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to save search term',
        error
      };
    }
  }

  /**
   * Get search history for a learner (limited to 5, sorted by most recent)
   * @param {string} learnerId - Learner's UUID
   * @returns {Promise<Array>} List of recent searches
   */
  static async getSearchHistory(learnerId) {
    try {
      
      if (!learnerId) {
        return [];
      }

      const response: any = await apiPost('/opportunities', { action: 'get-search-history', learner_id: learnerId });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.history || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete a specific search term
   * @param {string} learnerId - Learner's UUID
   * @param {number} searchHistoryId - Search history entry ID
   * @returns {Promise<Object>} Result
   */
  static async deleteSearchTerm(learnerId, searchHistoryId) {
    try {
      
      if (!learnerId) {
        return { success: false, message: 'Learner ID is required' };
      }

      const response: any = await apiPost('/opportunities', { action: 'delete-search-term', learner_id: learnerId, id: searchHistoryId });
      if (response?.error) throw new Error(response.error.message);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete search term',
        error
      };
    }
  }

  /**
   * Clear all search history for a learner
   * @param {string} learnerId - Learner's UUID
   * @returns {Promise<Object>} Result
   */
  static async clearSearchHistory(learnerId) {
    try {
      
      if (!learnerId) {
        return { success: false, message: 'Learner ID is required' };
      }

      const response: any = await apiPost('/opportunities', { action: 'clear-search-history', learner_id: learnerId });
      if (response?.error) throw new Error(response.error.message);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to clear search history',
        error
      };
    }
  }

  /**
   * Get most searched terms for a learner
   * @param {string} learnerId - Learner's UUID
   * @param {number} limit - Number of terms to return (default 5)
   * @returns {Promise<Array>} List of popular searches
   */
  static async getMostSearchedTerms(learnerId, limit = 5) {
    try {
      
      if (!learnerId) {
        return [];
      }

      const response: any = await apiPost('/opportunities', { action: 'get-most-searched-terms', learner_id: learnerId, limit });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.terms || [];
    } catch (error) {
      return [];
    }
  }
}

export default SearchHistoryService;