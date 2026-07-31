import { useAuthStore } from '@/shared/model/authStore';

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

/**
 * Generic function to handle nested Supabase relations
 */
export const normalizeRelation = <T>(relation: T | T[]): T | null => {
  if (Array.isArray(relation) && relation.length > 0) {
    return relation[0];
  }
  return relation as T;
};
