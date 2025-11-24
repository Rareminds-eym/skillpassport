// Quick test to check Supabase connection
// Run this in browser console or as a script

import { supabase } from './src/lib/supabaseClient';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test 1: Simple query
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email')
      .limit(5);
    
    if (error) {
      console.error('❌ Supabase query failed:', error);
      return;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log(`Found ${data?.length || 0} students`);
    console.log('Sample data:', data);
    
  } catch (err) {
    console.error('❌ Connection test failed:', err);
  }
}

testConnection();
