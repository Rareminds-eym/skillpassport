import { supabase } from '@/shared/api/supabaseClient';

/**
 * Reusable Supabase query helpers
 */

export const getAuthSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(`Session error: ${error.message}`);
  }
  
  if (!session?.access_token) {
    throw new Error('No access token found in session');
  }
  
  return session;
};

export const validateStorageConfig = () => {
  const storageApiUrl = import.meta.env.VITE_STORAGE_API_URL;
  
  if (!storageApiUrl) {
    throw new Error('Storage API URL not configured');
  }
  
  return storageApiUrl;
};

/**
 * Generic function to handle nested Supabase relations
 */
export const normalizeRelation = <T>(relation: T | T[]): T | null => {
  if (Array.isArray(relation) && relation.length > 0) {
    return relation[0];
  }
  return relation as T;
};
