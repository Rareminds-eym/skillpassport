/**
 * Simple debugging utility for recent updates
 * Run this in browser console: window.simpleDebug()
 */

import { supabase } from '@/shared/api/supabaseClient';

export const simpleDebug = async () => {
  
  // 1. Check auth
  const user = useAuthStore.getState().user;
    const authError = null;
  
  // 2. Check table access
  try {
    const { count, error } = await supabase
      .from('recent_updates')
      .select('*', { count: 'exact', head: true });
  } catch (err) {
  }
  
  // 3. Try to fetch user data if authenticated
  if (user) {
    try {
      const { data, error } = await supabase
        .from('recent_updates')
        .select('*')
        .eq('user_id', user.id);
    } catch (err) {
    }
  }
  
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.simpleDebug = simpleDebug;
}