// Debug utility for Recent Updates
import { supabase } from '../lib/supabaseClient';

export const debugRecentUpdates = async () => {
  console.log('🔍 Starting Recent Updates Debug...');
  
  // 1. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('👤 Auth User:', user?.id, user?.email);
  console.log('❌ Auth Error:', authError);
  
  // 2. Check if user is authenticated
  if (!user) {
    console.log('⚠️ No user is authenticated!');
    return;
  }
  
  // 3. Try to fetch recent updates with detailed logging
  console.log('📡 Attempting to fetch recent updates...');
  const { data, error, count } = await supabase
    .from('recent_updates')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);
  
  console.log('📊 Query Result:', {
    data,
    error,
    count,
    dataLength: data?.length
  });
  
  // 4. If no data, try fetching ALL recent updates (to check RLS)
  console.log('📡 Trying to fetch ALL recent updates (RLS test)...');
  const { data: allData, error: allError } = await supabase
    .from('recent_updates')
    .select('*');
  
  console.log('📊 All Data Result:', {
    allData,
    allError,
    count: allData?.length
  });
  
  // 5. Check students table for user_id match
  console.log('📡 Checking students table...');
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('id, email, user_id')
    .eq('user_id', user.id);
  
  console.log('📊 Student Data:', {
    studentData,
    studentError
  });
  
  // 6. If student exists, try to find their recent updates by student_id
  if (studentData && studentData.length > 0) {
    const studentId = studentData[0].id;
    console.log('📡 Fetching updates by student_id:', studentId);
    
    const { data: updatesByStudent, error: updatesByStudentError } = await supabase
      .from('recent_updates')
      .select('*')
      .eq('student_id', studentId);
    
    console.log('📊 Updates by student_id:', {
      updatesByStudent,
      updatesByStudentError
    });
  }
  
  console.log('✅ Debug complete!');
};

// Run debug on import
if (typeof window !== 'undefined') {
  window.debugRecentUpdates = debugRecentUpdates;
  console.log('💡 Debug function available: window.debugRecentUpdates()');
}
