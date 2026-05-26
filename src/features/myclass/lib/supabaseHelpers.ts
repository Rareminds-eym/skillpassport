import { supabase } from '@/shared/api/supabaseClient';

/**
 * Reusable Supabase query helpers
 */

export const getAuthSession = async () => {
  const user = useAuthStore.getState().user;
    const error = null;
  
  if (error) {
    throw new Error(`Session error: ${error.message}`);
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
