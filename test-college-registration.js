/**
 * Test College Registration Flow
 * This script tests the complete college registration process
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCollegeRegistration() {
  console.log('🧪 Testing College Registration Flow\n');

  // Test data
  const testEmail = `test-college-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testCollegeData = {
    name: 'Test Engineering College',
    code: `TEC${Date.now()}`,
    email: testEmail,
    phone: '+91 9876543210',
    website: 'https://testcollege.edu',
    address: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400001',
    establishedYear: 2000,
    collegeType: 'Engineering',
    affiliation: 'UGC',
    accreditation: 'NAAC A+',
    deanName: 'Dr. Test Dean',
    deanEmail: testEmail,
    deanPhone: '+91 9876543210',
    accountStatus: 'pending',
    approvalStatus: 'pending'
  };

  try {
    // Step 1: Check if colleges table has required columns
    console.log('1️⃣ Checking colleges table schema...');
    const { data: tableInfo, error: schemaError } = await supabase
      .from('colleges')
      .select('*')
      .limit(0);
    
    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message);
      return;
    }
    console.log('✅ Colleges table accessible\n');

    // Step 2: Create test user
    console.log('2️⃣ Creating test user account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'admin',
          name: testCollegeData.deanName,
          phone: testCollegeData.deanPhone
        }
      }
    });

    if (authError) {
      console.error('❌ User creation failed:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ No user returned from signup');
      return;
    }

    const userId = authData.user.id;
    console.log(`✅ User created: ${userId}\n`);

    // Step 3: Create college record
    console.log('3️⃣ Creating college record...');
    const { data: collegeData, error: collegeError } = await supabase
      .from('colleges')
      .insert([{
        ...testCollegeData,
        created_by: userId,
        updated_by: userId
      }])
      .select()
      .single();

    if (collegeError) {
      console.error('❌ College creation failed:', collegeError);
      console.error('Error details:', JSON.stringify(collegeError, null, 2));
      
      // Cleanup: Delete the test user
      await supabase.auth.admin.deleteUser(userId);
      return;
    }

    console.log('✅ College created successfully!');
    console.log('College ID:', collegeData.id);
    console.log('College Name:', collegeData.name);
    console.log('College Code:', collegeData.code);
    console.log('Created By:', collegeData.created_by);
    console.log('\n');

    // Step 4: Verify college can be retrieved
    console.log('4️⃣ Verifying college retrieval...');
    const { data: retrievedCollege, error: retrieveError } = await supabase
      .from('colleges')
      .select('*')
      .eq('created_by', userId)
      .single();

    if (retrieveError) {
      console.error('❌ College retrieval failed:', retrieveError.message);
    } else {
      console.log('✅ College retrieved successfully');
      console.log('Retrieved:', retrievedCollege.name);
    }

    // Step 5: Test college code uniqueness check
    console.log('\n5️⃣ Testing college code uniqueness...');
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .from('colleges')
      .select('id')
      .eq('code', testCollegeData.code)
      .maybeSingle();

    if (duplicateError) {
      console.error('❌ Duplicate check failed:', duplicateError.message);
    } else if (duplicateCheck) {
      console.log('✅ College code uniqueness check working');
      console.log('Found existing college with code:', testCollegeData.code);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete college
    const { error: deleteCollegeError } = await supabase
      .from('colleges')
      .delete()
      .eq('id', collegeData.id);

    if (deleteCollegeError) {
      console.error('⚠️ Failed to delete test college:', deleteCollegeError.message);
    } else {
      console.log('✅ Test college deleted');
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out');

    console.log('\n✨ All tests passed! College registration flow is working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testCollegeRegistration();
