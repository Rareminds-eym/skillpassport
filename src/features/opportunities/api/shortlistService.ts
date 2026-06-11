import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('shortlist');

// ==================== SHORTLIST CRUD OPERATIONS ====================

/**
 * Get all shortlists with candidate counts
 */
export const getShortlists = async () => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'get-shortlists' });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.shortlists || [], error: null };
  } catch (error) {
    logger.error('Error fetching shortlists', error as Error);
    return { data: null, error };
  }
};

/**
 * Get a single shortlist by ID
 */
export const getShortlistById = async (shortlistId: string) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'get-shortlist-by-id', id: shortlistId });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.shortlist || null, error: null };
  } catch (error) {
    logger.error('Error fetching shortlist', error as Error, { shortlistId });
    return { data: null, error };
  }
};

/**
 * Create a new shortlist
 */
export const createShortlist = async (shortlistData: {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  created_by?: string;
}) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'create-shortlist', shortlist: shortlistData });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.shortlist || null, error: null };
  } catch (error) {
    logger.error('Error creating shortlist', error as Error, { name: shortlistData.name });
    return { data: null, error };
  }
};

/**
 * Update a shortlist
 */
export const updateShortlist = async (
  shortlistId: string,
  updates: Partial<{
    name: string;
    description: string;
    status: string;
    shared: boolean;
    share_link: string;
    share_expiry: string;
    watermark: boolean;
    include_pii: boolean;
    notify_on_access: boolean;
    tags: string[];
  }>
) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'update-shortlist', id: shortlistId, ...updates });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.shortlist || null, error: null };
  } catch (error) {
    logger.error('Error updating shortlist', error as Error, { shortlistId });
    return { data: null, error };
  }
};

/**
 * Delete a shortlist
 */
export const deleteShortlist = async (shortlistId: string) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'delete-shortlist', id: shortlistId });
    if (response?.error) return { error: response.error };
    return { error: null };
  } catch (error) {
    logger.error('Error deleting shortlist', error as Error, { shortlistId });
    return { error };
  }
};

// ==================== SHORTLIST CANDIDATES OPERATIONS ====================

/**
 * Get all candidates in a shortlist with full learner details
 */
export const getShortlistCandidates = async (shortlistId: string) => {
  try {
    
    // First, check if the shortlist exists
    // Shortlist candidates fetched via API
    const response: any = await apiPost('/opportunities', { action: 'get-shortlist-candidates', shortlist_id: shortlistId });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.candidates || [], error: null };
  } catch (error) {
    logger.error('Error fetching shortlist candidates', error as Error, { shortlistId });
    return { data: null, error };
  }
};

/**
 * Add a candidate to a shortlist
 */
export const addCandidateToShortlist = async (
  shortlistId: string,
  learnerId: string,
  addedBy?: string,
  notes?: string
) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'add-candidate-to-shortlist', shortlist_id: shortlistId, learner_id: learnerId, added_by: addedBy, notes });
    if (response?.error && !response.data) return { data: null, error: response.error };
    return { data: response?.data?.data, error: null };
  } catch (error) {
    logger.error('Error adding candidate to shortlist', error as Error, { shortlistId, learnerId });
    return { data: null, error };
  }
};

/**
 * Remove a candidate from a shortlist
 */
export const removeCandidateFromShortlist = async (
  shortlistId: string,
  learnerId: string
) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'remove-candidate-from-shortlist', shortlist_id: shortlistId, learner_id: learnerId });
    if (response?.error) return { error: response.error };
    return { error: null };
  } catch (error) {
    logger.error('Error removing candidate from shortlist', error as Error, { shortlistId, learnerId });
    return { error };
  }
};

/**
 * Check if a candidate is in a specific shortlist
 */
export const islearnerInShortlist = async (
  shortlistId: string,
  learnerId: string
) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'is-learner-in-shortlist', shortlist_id: shortlistId, learner_id: learnerId });
    if (response?.error) return { data: false, error: response.error };
    return { data: response?.data?.inShortlist || false, error: null };
  } catch (error) {
    logger.error('Error checking candidate in shortlist', error as Error, { shortlistId, learnerId });
    return { data: false, error };
  }
};

/**
 * Get all shortlists that contain a specific learner
 */
export const getShortlistsForLearner = async (learnerId: string) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'get-shortlists-for-learner', learner_id: learnerId });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.shortlists || [], error: null };
  } catch (error) {
    logger.error('Error fetching shortlists for learner', error as Error, { learnerId });
    return { data: null, error };
  }
};

/**
 * Update notes for a candidate in a shortlist
 */
export const updateCandidateNotes = async (
  shortlistId: string,
  learnerId: string,
  notes: string
) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'update-candidate-notes', shortlist_id: shortlistId, learner_id: learnerId, notes });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.data, error: null };
  } catch (error) {
    logger.error('Error updating candidate notes', error as Error, { shortlistId, learnerId });
    return { data: null, error };
  }
};

// ==================== EXPORT OPERATIONS ====================

/**
 * Log an export activity
 */
export const logExportActivity = async (exportData: {
  shortlist_id: string;
  export_format: string;
  export_type: string;
  exported_by?: string;
  include_pii?: boolean;
}) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'log-export-activity', export_data: exportData });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.data, error: null };
  } catch (error) {
    logger.error('Error logging export activity', error as Error, { shortlistId: exportData.shortlist_id });
    return { data: null, error };
  }
};

/**
 * Get export history for a shortlist
 */
export const getExportHistory = async (shortlistId: string) => {
  try {
    const response: any = await apiPost('/opportunities', { action: 'get-export-history', shortlist_id: shortlistId });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.exports || [], error: null };
  } catch (error) {
    logger.error('Error fetching export history', error as Error, { shortlistId });
    return { data: null, error };
  }
};
