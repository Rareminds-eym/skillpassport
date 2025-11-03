/**
 * Simple debugging utility for recent updates
 * Run this in browser console: window.simpleDebug()
 */

import { supabase } from '../lib/supabaseClient';

export const simpleDebug = async () => {
  console.log('🔍 Simple Recent Updates Debug');
  console.log('================================');
  
  // 1. Check auth
  console.log('1. Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('   User:', user ? `${user.email} (${user.id})` : 'Not authenticated');
  console.log('   Auth Error:', authError?.message || 'None');
  
  // 2. Check table access
  console.log('2. Checking table access...');
  try {
    const { count, error } = await supabase
      .from('recent_updates')
      .select('*', { count: 'exact', head: true });
    console.log('   Table accessible:', !error);
    console.log('   Total records:', count);
    console.log('   Error:', error?.message || 'None');
  } catch (err) {
    console.log('   Table error:', err.message);
  }
  
  // 3. Try to fetch user data if authenticated
  if (user) {
    console.log('3. Checking user-specific data...');
    try {
      const { data, error } = await supabase
        .from('recent_updates')
        .select('*')
        .eq('user_id', user.id);
      console.log('   User records found:', data?.length || 0);
      console.log('   User data:', data);
      console.log('   Error:', error?.message || 'None');
    } catch (err) {
      console.log('   User data error:', err.message);
    }
  }
  
  console.log('================================');
  console.log('Debug complete!');
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.simpleDebug = simpleDebug;
}