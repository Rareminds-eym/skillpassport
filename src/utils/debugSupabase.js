/**
 * Quick test to see what data is actually in Supabase
 * Run this in browser console or as a separate component
 */

import { supabase } from '../utils/api';

export async function debugSupabaseData() {
  try {
    // Get first few students to see structure
    const { data, error } = await supabase.from('students').select('*').limit(3);

    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }

    if (data && data.length > 0) {
      const firstStudent = data[0];

      // Check for skills in profile
      const profile = firstStudent.profile;
      if (profile) {
        console.log({
          technicalSkills: profile.technicalSkills || 'Not found',
          softSkills: profile.softSkills || 'Not found',
          training: profile.training || 'Not found',
          experience: profile.experience || 'Not found',
          education: profile.education || 'Not found',
        });
      }
    }

    return data;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Auto-run if in development
if (typeof window !== 'undefined') {
  window.debugSupabaseData = debugSupabaseData;
}
