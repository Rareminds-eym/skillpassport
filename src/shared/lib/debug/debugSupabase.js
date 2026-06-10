/**
 * Quick test to see what data is actually in Supabase
 * Run this in browser console or as a separate component
 */

import { apiPost } from "@/shared/api/apiClient";

export async function debugSupabaseData() {
  try {
    const data = await apiPost('/shared-widgets/actions', {
      action: 'debug-supabase',
    });
    
    if (data && data.length > 0) {
      const firstLearner = data[0];
      const profile = firstLearner.profile;
      if (profile) {
        console.log({
          technicalSkills: profile.technicalSkills || 'Not found',
          softSkills: profile.softSkills || 'Not found',
          training: profile.training || 'Not found',
          experience: profile.experience || 'Not found',
          education: profile.education || 'Not found'
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