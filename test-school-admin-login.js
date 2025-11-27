/**
 * Test script to verify school admin login logic
 * Run with: node test-school-admin-login.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchoolAdminLogin() {
  console.log('🔍 Testing School Admin Login Logic\n');

  try {
    // Fetch all schools to see what's available
    console.log('📋 Fetching all schools from database...');
    const { data: schools, error: fetchError } = await supabase
      .from('schools')
      .select('id, name, email, approval_status, account_status, principal_name')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching schools:', fetchError);
      return;
    }

    if (!schools || schools.length === 0) {
      console.log('⚠️  No schools found in database');
      return;
    }

    console.log(`\n✅ Found ${schools.length} school(s):\n`);
    
    schools.forEach((school, index) => {
      console.log(`${index + 1}. ${school.name}`);
      console.log(`   Email: ${school.email || 'N/A'}`);
      console.log(`   Principal: ${school.principal_name || 'N/A'}`);
      console.log(`   Approval Status: ${school.approval_status}`);
      console.log(`   Account Status: ${school.account_status}`);
      console.log(`   Can Login: ${school.approval_status === 'approved' ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });

    // Test login with first approved school
    const approvedSchool = schools.find(s => s.approval_status === 'approved');
    
    if (approvedSchool && approvedSchool.email) {
      console.log(`\n🧪 Testing login with approved school: ${approvedSchool.email}`);
      
      const { data: school, error: loginError } = await supabase
        .from('schools')
        .select('*')
        .eq('email', approvedSchool.email)
        .single();

      if (loginError) {
        console.error('❌ Login test failed:', loginError);
      } else {
        console.log('✅ Login query successful!');
        console.log('   School data retrieved:', {
          id: school.id,
          name: school.name,
          email: school.email,
          approval_status: school.approval_status,
          account_status: school.account_status
        });
      }
    } else {
      console.log('\n⚠️  No approved schools with email found for testing');
    }

    // Test with non-existent email
    console.log('\n🧪 Testing with non-existent email...');
    const { data: notFound, error: notFoundError } = await supabase
      .from('schools')
      .select('*')
      .eq('email', 'nonexistent@test.com')
      .single();

    if (notFoundError) {
      console.log('✅ Correctly returns error for non-existent email');
    } else {
      console.log('⚠️  Unexpected: Found school with test email');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSchoolAdminLogin();
