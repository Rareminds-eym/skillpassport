// Filter API Service
import { supabase } from '@/shared/api/supabaseClient';

/**
 * Fetch available tags from shortlists
 */
export async function fetchShortlistTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('shortlists')
      .select('tags')
      .not('tags', 'is', null);

    if (error) throw error;

    // Extract unique tags from all shortlists
    const allTags = new Set<string>();
    data?.forEach(row => {
      if (Array.isArray(row.tags)) {
        row.tags.forEach(tag => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  } catch (error) {
    console.error('Error fetching shortlist tags:', error);
    return [];
  }
}

/**
 * Fetch shortlist creators
 */
export async function fetchShortlistCreators(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('shortlists')
      .select('created_by')
      .not('created_by', 'is', null);

    if (error) throw error;

    // Extract unique creators
    const creators = new Set<string>();
    data?.forEach(row => {
      if (row.created_by) {
        creators.add(row.created_by);
      }
    });

    return Array.from(creators).sort();
  } catch (error) {
    console.error('Error fetching shortlist creators:', error);
    return [];
  }
}

/**
 * Fetch available departments from opportunities
 */
export async function fetchDepartments(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('department')
      .not('department', 'is', null);

    if (error) throw error;

    const departments = new Set<string>();
    data?.forEach(row => {
      if (row.department) {
        departments.add(row.department);
      }
    });

    return Array.from(departments).sort();
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

/**
 * Fetch available locations from opportunities
 */
export async function fetchLocations(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('location')
      .not('location', 'is', null);

    if (error) throw error;

    const locations = new Set<string>();
    data?.forEach(row => {
      if (row.location) {
        locations.add(row.location);
      }
    });

    return Array.from(locations).sort();
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}
