/**
 * Test script to verify institutions data fetching
 * Run this in browser console on the Settings page
 */

import { supabase } from './src/lib/supabaseClient';

async function testInstitutionsFetch() {
  console.log('🧪 Testing institutions fetch...');
  
  // Test 1: University Colleges
  console.log('\n1️⃣ Testing university_colleges...');
  const { data: ucData, error: ucError } = await supabase
    .from('university_colleges')
    .select('id, name, code')
    .order('name');
  
  if (ucError) {
    console.error('❌ Error:', ucError);
  } else {
    console.log('✅ Success:', ucData?.length || 0, 'records');
    console.log('Data:', ucData);
  }
  
  // Test 2: Programs
  console.log('\n2️⃣ Testing programs...');
  const { data: progData, error: progError } = await supabase
    .from('programs')
    .select('id, name, code, degree_level')
    .order('name');
  
  if (progError) {
    console.error('❌ Error:', progError);
  } else {
    console.log('✅ Success:', progData?.length || 0, 'records');
    console.log('Data:', progData);
  }
  
  // Test 3: School Classes
  console.log('\n3️⃣ Testing school_classes...');
  const { data: scData, error: scError } = await supabase
    .from('school_classes')
    .select('id, name, grade, section')
    .order('grade, section');
  
  if (scError) {
    console.error('❌ Error:', scError);
  } else {
    console.log('✅ Success:', scData?.length || 0, 'records');
    console.log('Data:', scData);
  }
  
  console.log('\n✨ Test complete!');
}

// Run the test
testInstitutionsFetch();
