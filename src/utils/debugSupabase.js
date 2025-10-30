/**
 * Quick test to see what data is actually in Supabase
 * Run this in browser console or as a separate component
 */

import { supabase } from '../utils/api';

export async function debugSupabaseData() {
  try {
    console.log('🔍 Fetching sample student data from Supabase...');
    
    // Get first few students to see structure
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }

    console.log('📊 Sample student records:', data);
    
    if (data && data.length > 0) {
      const firstStudent = data[0];
      console.log('📊 First student structure:', firstStudent);
      console.log('📊 Profile keys:', Object.keys(firstStudent.profile || {}));
      console.log('📊 Profile content:', firstStudent.profile);
      
      // Check for skills in profile
      const profile = firstStudent.profile;
      if (profile) {
        console.log('📊 Skills in profile:', {
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
  console.log('🔧 Run debugSupabaseData() in console to see data structure');
}