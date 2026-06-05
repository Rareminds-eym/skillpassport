import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

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
export const getSavedSearches = async () => {
  try {
    const response: any = await apiPost('/opportunities', {
      action: 'recruiter-saved-searches',
      sub_action: 'get',
    });
    return { data: response?.data?.searches ?? [], error: null };
  } catch (error) {
    logger.error('Error fetching saved searches', error as Error);
    const defaultSearches = [
      { id: 'default-1', name: 'React + Node.js', search_criteria: { skills: ['React', 'Node.js'] }, created_at: new Date().toISOString() },
      { id: 'default-2', name: 'Python Developers', search_criteria: { skills: ['Python'] }, created_at: new Date().toISOString() },
      { id: 'default-3', name: 'Data Science + ML', search_criteria: { skills: ['Data Science', 'Machine Learning'] }, created_at: new Date().toISOString() },
      { id: 'default-4', name: 'Frontend (React/Angular)', search_criteria: { skills: ['React', 'Angular'] }, created_at: new Date().toISOString() },
      { id: 'default-5', name: 'Full Stack Developers', search_criteria: { query: 'Full Stack Developer' }, created_at: new Date().toISOString() },
      { id: 'default-6', name: 'DevOps Engineers', search_criteria: { skills: ['DevOps', 'CI/CD', 'Docker'] }, created_at: new Date().toISOString() },
    ];
    return { data: defaultSearches, error };
  }
};

/**
 * Create a new saved search
 */
export const createSavedSearch = async (name: string, searchCriteria: SavedSearch['search_criteria']) => {
  try {
    const response: any = await apiPost('/opportunities', {
      action: 'recruiter-saved-searches',
      sub_action: 'create',
      name,
      search_criteria: searchCriteria,
    });
    return { data: response?.data?.search ?? null, error: null };
  } catch (error) {
    logger.error('Error creating saved search', error as Error);
    return { data: null, error };
  }
};

/**
 * Update a saved search
 */
export const updateSavedSearch = async (searchId: string, updates: Partial<SavedSearch>) => {
  try {
    const response: any = await apiPost('/opportunities', {
      action: 'recruiter-saved-searches',
      sub_action: 'update',
      id: searchId,
      ...updates,
    });
    return { data: response?.data?.search ?? null, error: null };
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
    await apiPost('/opportunities', { action: 'recruiter-saved-searches', sub_action: 'delete', id: searchId });
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
    await apiPost('/opportunities', { action: 'increment-search-usage', search_id: searchId });
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
    const response: any = await apiPost('/opportunities', { action: 'recruiter-saved-searches', sub_action: 'get', id: searchId });
    return { data: response?.data?.search ?? null, error: null };
  } catch (error) {
    logger.error('Error fetching saved search', error as Error);
    return { data: null, error: null };
  }
};
