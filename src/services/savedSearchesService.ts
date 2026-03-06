import { supabase } from '../lib/supabaseClient';
import { getLogger } from '../config/logging';

const logger = getLogger('saved-searches');

export interface SavedSearch {
  id: string;
  recruiter_id: string;
  name: string;
  search_criteria: {
    query?: string;
    skills?: string[];
    location?: string;
    experience?: string;
    education?: string;
    [key: string]: any;
  };
  created_at: string;
  last_used?: string;
  use_count?: number;
}

/**
 * Get all saved searches for a recruiter
 */
export const getSavedSearches = async (recruiterId?: string) => {
  try {
    let query = supabase
      .from('recruiter_saved_searches')
      .select('*')
      .order('last_used', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (recruiterId) {
      query = query.eq('recruiter_id', recruiterId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    logger.error('Error fetching saved searches', error as Error);
    // Return default searches if table doesn't exist
    const defaultSearches = [
      {
        id: 'default-1',
        name: 'React + Node.js',
        search_criteria: { skills: ['React', 'Node.js'] },
        created_at: new Date().toISOString()
      },
      {
        id: 'default-2',
        name: 'Python Developers',
        search_criteria: { skills: ['Python'] },
        created_at: new Date().toISOString()
      },
      {
        id: 'default-3',
        name: 'Data Science + ML',
        search_criteria: { skills: ['Data Science', 'Machine Learning'] },
        created_at: new Date().toISOString()
      },
      {
        id: 'default-4',
        name: 'Frontend (React/Angular)',
        search_criteria: { skills: ['React', 'Angular'] },
        created_at: new Date().toISOString()
      },
      {
        id: 'default-5',
        name: 'Full Stack Developers',
        search_criteria: { query: 'Full Stack Developer' },
        created_at: new Date().toISOString()
      },
      {
        id: 'default-6',
        name: 'DevOps Engineers',
        search_criteria: { skills: ['DevOps', 'CI/CD', 'Docker'] },
        created_at: new Date().toISOString()
      }
    ];
    return { data: defaultSearches, error };
  }
};

/**
 * Create a new saved search
 */
export const createSavedSearch = async (
  name: string,
  searchCriteria: SavedSearch['search_criteria'],
  recruiterId?: string
) => {
  try {
    const { data, error } = await supabase
      .from('recruiter_saved_searches')
      .insert([
        {
          recruiter_id: recruiterId || 'default',
          name,
          search_criteria: searchCriteria,
          use_count: 0
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error creating saved search', error as Error);
    return { data: null, error };
  }
};

/**
 * Update a saved search
 */
export const updateSavedSearch = async (
  searchId: string,
  updates: Partial<SavedSearch>
) => {
  try {
    const { data, error } = await supabase
      .from('recruiter_saved_searches')
      .update(updates)
      .eq('id', searchId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error updating saved search', error as Error);
    return { data: null, error };
  }
};

/**
 * Delete a saved search
 */
export const deleteSavedSearch = async (searchId: string) => {
  try {
    const { error } = await supabase
      .from('recruiter_saved_searches')
      .delete()
      .eq('id', searchId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    logger.error('Error deleting saved search', error as Error);
    return { error };
  }
};

/**
 * Track when a saved search is used
 */
export const trackSearchUsage = async (searchId: string) => {
  try {
    // Increment use count and update last_used timestamp
    const { error } = await supabase.rpc('increment_search_usage', {
      search_id: searchId
    });

    if (error) {
      // If the function doesn't exist, try manual update
      const { error: updateError } = await supabase
        .from('recruiter_saved_searches')
        .update({
          last_used: new Date().toISOString(),
          use_count: supabase.sql`use_count + 1`
        })
        .eq('id', searchId);

      if (updateError) throw updateError;
    }

    return { error: null };
  } catch (error) {
    logger.error('Error tracking search usage', error as Error);
    return { error };
  }
};

/**
 * Get a single saved search by ID
 */
export const getSavedSearchById = async (searchId: string) => {
  try {
    const { data, error } = await supabase
      .from('recruiter_saved_searches')
      .select('*')
      .eq('id', searchId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error('Error fetching saved search', error as Error);
    return { data: null, error };
  }
};
