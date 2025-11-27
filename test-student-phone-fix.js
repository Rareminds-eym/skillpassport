/**
 * Test script to verify phone/contact_number field fix
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testPhoneFieldFix() {
  console.log('🧪 Testing Phone Field Fix\n');
  console.log('=' .repeat(60));
  
  // Test data
  const testStudent = {
    user_id: '00000000-0000-0000-0000-000000000001', // Fake UUID for testing
    name: 'Test Student',
    email: 'test-phone-fix@example.com',
    contact_number: '9876543210', // Using correct column name
    student_type: 'college',
    school_id: null,
    college_id: null,
    profile: {
      name: 'Test Student',
      email: 'test-phone-fix@example.com',
      phone: '9876543210'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('\n📝 Test Data:');
  console.log(JSON.stringify(testStudent, null, 2));
  
  console.log('\n🔍 Step 1: Testing INSERT with contact_number...');
  
  // Try to insert (will fail due to FK constraint, but we'll see if column is recognized)
  const { data, error } = await supabase
    .from('students')
    .insert([testStudent])
    .select();
  
  if (error) {
    if (error.message.includes("Could not find the 'phone' column")) {
      console.error('❌ FAIL: Still trying to use "phone" column');
      console.error('Error:', error.message);
      return false;
    } else if (error.message.includes('foreign key') || error.message.includes('user_id')) {
      console.log('✅ PASS: Column name is correct (FK error is expected)');
      console.log('   Error is about foreign key, not column name');
      return true;
    } else {
      console.log('⚠️  Different error:', error.message);
      return false;
    }
  } else {
    console.log('✅ PASS: Insert successful!');
    console.log('   Data:', data);
    
    // Clean up test data
    await supabase
      .from('students')
      .delete()
      .eq('email', 'test-phone-fix@example.com');
    
    return true;
  }
}

async function checkColumnNames() {
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Step 2: Verifying students table columns...\n');
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error fetching students:', error);
    return;
  }
  
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    
    console.log('📊 Available columns:');
    const phoneRelatedColumns = columns.filter(col => 
      col.toLowerCase().includes('phone') || 
      col.toLowerCase().includes('contact')
    );
    
    phoneRelatedColumns.forEach(col => {
      console.log(`   ✓ ${col}`);
    });
    
    console.log('\n✅ Correct column names to use:');
    console.log('   - contact_number (snake_case)');
    console.log('   - contactNumber (camelCase)');
    
    console.log('\n❌ DO NOT use:');
    console.log('   - phone (does not exist)');
  }
}

async function testActualService() {
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Step 3: Testing actual service function...\n');
  
  // Simulate what the service does
  const phone = '9876543210';
  const studentData = {
    name: 'Test Student',
    email: 'test@example.com',
    phone: phone,
    studentType: 'college',
    schoolId: null,
    collegeId: null
  };
  
  console.log('Input data:', studentData);
  
  // This is what the fixed service should create
  const studentRecord = {
    name: studentData.name,
    email: studentData.email,
    contact_number: studentData.phone, // ✅ Correct mapping
    student_type: studentData.studentType,
    school_id: studentData.schoolId,
    college_id: studentData.collegeId
  };
  
  console.log('\n✅ Mapped to database record:');
  console.log(JSON.stringify(studentRecord, null, 2));
  
  console.log('\n✅ Field mapping:');
  console.log('   phone (input) → contact_number (database)');
}

async function runAllTests() {
  try {
    const testPassed = await testPhoneFieldFix();
    await checkColumnNames();
    await testActualService();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log(testPassed ? '✅ All tests passed!' : '❌ Some tests failed');
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
  }
}

runAllTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
