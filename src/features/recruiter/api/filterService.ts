import { apiPost } from '@/shared/api/apiClient';

/**
 * Fetch available tags from shortlists
 */
export async function fetchShortlistTags(): Promise<string[]> {
  try {
    const { data } = await apiPost('/recruiter/actions', { action: 'fetch-shortlist-tags' });
    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch shortlist creators
 */
export async function fetchShortlistCreators(): Promise<string[]> {
  try {
    const { data } = await apiPost('/recruiter/actions', { action: 'fetch-shortlist-creators' });
    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch available departments from opportunities
 */
export async function fetchDepartments(): Promise<string[]> {
  try {
    const { data } = await apiPost('/recruiter/actions', { action: 'fetch-departments' });
    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch available locations from opportunities
 */
export async function fetchLocations(): Promise<string[]> {
  try {
    const { data } = await apiPost('/recruiter/actions', { action: 'fetch-locations' });
    return data || [];
  } catch (error) {
    return [];
  }
}
