import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
// import { supabase } from '@/shared/api/supabaseClient';

// /**
//  * Service for managing search history
//  */
// export class SearchHistoryService {
//   /**
//    * Add a search term to history
//    * @param {string} learnerId - Learner's UUID
//    * @param {string} searchTerm - Search term to save
//    * @returns {Promise<Object>} Result
//    */
//   static async addSearchTerm(learnerId, searchTerm) {
//     try {
//       if (!searchTerm || !searchTerm.trim()) {
//         return { success: false, message: 'Search term is empty' };
//       }

//       const trimmedTerm = searchTerm.trim();

//       // Get user session
//       const { data: { session } } = getCurrentSession();
//       if (!session) {
//         return { success: false, message: 'User not authenticated' };
//       }

//       // Check if term already exists
//       const { data: existing } = await supabase
//         .from('search_history')
//         .select('id, search_count')
//         .eq('learner_id', session.user.id) // Use authenticated user's ID
//         .eq('search_term', trimmedTerm)
//         .maybeSingle();

//       if (existing) {
//         // Update existing term - increment count and update timestamp
//         const { data, error } = await supabase
//           .from('search_history')
//           .update({
//             search_count: existing.search_count + 1,
//             last_searched_at: new Date().toISOString()
//           })
//           .eq('id', existing.id)
//           .select()
//           .single();

//         if (error) throw error;

//         return {
//           success: true,
//           message: 'Search term updated',
//           data
//         };
//       }

//       // Get current count of search history entries
//       const { count } = await supabase
//         .from('search_history')
//         .select('*', { count: 'exact', head: true })
//         .eq('learner_id', learnerId);

//       // If we have 5 or more entries, delete the oldest one
//       if (count >= 5) {
//         const { data: oldestEntry } = await supabase
//           .from('search_history')
//           .select('id')
//           .eq('learner_id', learnerId)
//           .order('last_searched_at', { ascending: true })
//           .limit(1)
//           .single();

//         if (oldestEntry) {
//           await supabase
//             .from('search_history')
//             .delete()
//             .eq('id', oldestEntry.id);
//         }
//       }

//       // Insert new search term
//       const { data, error } = await supabase
//         .from('search_history')
//         .insert([{
//           learner_id: session.user.id, // Use authenticated user's ID
//           search_term: trimmedTerm,
//           search_count: 1,
//           last_searched_at: new Date().toISOString()
//         }])
//         .select()
//         .single();

//       if (error) throw error;

//       return {
//         success: true,
//         message: 'Search term added',
//         data
//       };
//     } catch (error) {
//       console.error('Error in addSearchTerm:', error);
//       return {
//         success: false,
//         message: error.message || 'Failed to save search term',
//         error
//       };
//     }
//   }

//   /**
//    * Get search history for a learner (limited to 5, sorted by most recent)
//    * @param {string} learnerId - Learner's UUID
//    * @returns {Promise<Array>} List of recent searches
//    */
//   static async getSearchHistory(learnerId) {
//     try {
//       // Get user session
//       const { data: { session } } = getCurrentSession();
//       if (!session) {
//         return [];
//       }

//       const { data, error } = await supabase
//         .from('search_history')
//         .select('*')
//         .eq('learner_id', session.user.id)
//         .order('last_searched_at', { ascending: false })
//         .limit(5);

//       if (error) throw error;

//       return data || [];
//     } catch (error) {
//       console.error('Error in getSearchHistory:', error);
//       return [];
//     }
//   }

//   /**
//    * Delete a specific search term
//    * @param {string} learnerId - Learner's UUID
//    * @param {number} searchHistoryId - Search history entry ID
//    * @returns {Promise<Object>} Result
//    */
//   static async deleteSearchTerm(learnerId, searchHistoryId) {
//     try {
//       // Get user session
//       const { data: { session } } = getCurrentSession();
//       if (!session) {
//         return { success: false, message: 'User not authenticated' };
//       }

//       const { error } = await supabase
//         .from('search_history')
//         .delete()
//         .eq('id', searchHistoryId)
//         .eq('learner_id', session.user.id);

//       if (error) throw error;

//       return {
//         success: true,
//         message: 'Search term deleted'
//       };
//     } catch (error) {
//       console.error('Error in deleteSearchTerm:', error);
//       return {
//         success: false,
//         message: error.message || 'Failed to delete search term',
//         error
//       };
//     }
//   }

//   /**
//    * Clear all search history for a learner
//    * @param {string} learnerId - Learner's UUID
//    * @returns {Promise<Object>} Result
//    */
//   static async clearSearchHistory(learnerId) {
//     try {
//       // Get user session
//       const { data: { session } } = getCurrentSession();
//       if (!session) {
//         return { success: false, message: 'User not authenticated' };
//       }

//       const { error } = await supabase
//         .from('search_history')
//         .delete()
//         .eq('learner_id', session.user.id);

//       if (error) throw error;

//       return {
//         success: true,
//         message: 'Search history cleared'
//       };
//     } catch (error) {
//       console.error('Error in clearSearchHistory:', error);
//       return {
//         success: false,
//         message: error.message || 'Failed to clear search history',
//         error
//       };
//     }
//   }

//   /**
//    * Get most searched terms for a learner
//    * @param {string} learnerId - Learner's UUID
//    * @param {number} limit - Number of terms to return (default 5)
//    * @returns {Promise<Array>} List of popular searches
//    */
//   static async getMostSearchedTerms(learnerId, limit = 5) {
//     try {
//       // Get user session
//       const { data: { session } } = getCurrentSession();
//       if (!session) {
//         return [];
//       }

//       const { data, error } = await supabase
//         .from('search_history')
//         .select('*')
//         .eq('learner_id', session.user.id)
//         .order('search_count', { ascending: false })
//         .limit(limit);

//       if (error) throw error;

//       return data || [];
//     } catch (error) {
//       console.error('Error in getMostSearchedTerms:', error);
//       return [];
//     }
//   }
  
// }

// export default SearchHistoryService;


import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

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
      const { data: existing, error: existingError } = await supabase
        .from('search_history')
        .select('id, search_count')
        .eq('learner_id', learnerId)
        .eq('search_term', trimmedTerm)
        .maybeSingle();


      if (existingError) {
        throw existingError;
      }

      if (existing) {
        // Update existing term - increment count and update timestamp
        const { data, error } = await supabase
          .from('search_history')
          .update({
            search_count: existing.search_count + 1,
            last_searched_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return {
          success: true,
          message: 'Search term updated',
          data
        };
      }

      // Get current count of search history entries
      const { count, error: countError } = await supabase
        .from('search_history')
        .select('*', { count: 'exact', head: true })
        .eq('learner_id', learnerId);


      if (countError) {
        throw countError;
      }

      // If we have 5 or more entries, delete the oldest one
      if (count >= 5) {
        const { data: oldestEntry, error: oldestError } = await supabase
          .from('search_history')
          .select('id')
          .eq('learner_id', learnerId)
          .order('last_searched_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (oldestError) {
          logger.error('Error finding oldest search term:', oldestError as Error);
        }

        if (oldestEntry) {
          const { error: deleteError } = await supabase
            .from('search_history')
            .delete()
            .eq('id', oldestEntry.id);

          if (deleteError) {
            logger.error('Error deleting oldest search term:', deleteError as Error);
          } 
        }
      }

      // Insert new search term
      const { data, error } = await supabase
        .from('search_history')
        .insert([{
          learner_id: learnerId,
          search_term: trimmedTerm,
          search_count: 1,
          last_searched_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Search term added',
        data
      };
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

      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('learner_id', learnerId)
        .order('last_searched_at', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      return data || [];
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

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchHistoryId)
        .eq('learner_id', learnerId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Search term deleted'
      };
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

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('learner_id', learnerId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: 'Search history cleared'
      };
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

      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('learner_id', learnerId)
        .order('search_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }
}

export default SearchHistoryService;