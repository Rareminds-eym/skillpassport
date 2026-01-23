// Debug script to check educator data and authentication
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEducatorData() {
  console.log('🔍 Debugging educator data and authentication...\n');

  try {
    // Check 1: Look for educator by email (the way the app currently works)
    const testEmail = 'karthikeyan@rareminds.in';
    console.log(`📧 Checking for educator with email: ${testEmail}`);
    
    // Try multiple query approaches
    console.log('🔍 Approach 1: Exact match');
    const { data: educatorByEmail, error: emailError } = await supabase
      .from('school_educators')
      .select('*')
      .eq('email', testEmail)
      .maybeSingle();
      
    console.log('🔍 Approach 2: Case insensitive');
    const { data: educatorByEmailCI, error: emailErrorCI } = await supabase
      .from('school_educators')
      .select('*')
      .ilike('email', testEmail)
      .maybeSingle();
      
    console.log('🔍 Approach 3: Contains');
    const { data: educatorByEmailContains, error: emailErrorContains } = await supabase
      .from('school_educators')
      .select('*')
      .textSearch('email', testEmail)
      .maybeSingle();

    // Report results
    console.log('📊 Query Results:');
    console.log('Exact match:', emailError ? `Error: ${emailError.message}` : educatorByEmail ? 'Found' : 'Not found');
    console.log('Case insensitive:', emailErrorCI ? `Error: ${emailErrorCI.message}` : educatorByEmailCI ? 'Found' : 'Not found');
    console.log('Contains:', emailErrorContains ? `Error: ${emailErrorContains.message}` : educatorByEmailContains ? 'Found' : 'Not found');
    
    const foundEducator = educatorByEmail || educatorByEmailCI || educatorByEmailContains;
    
    if (foundEducator) {
      console.log('✅ Found educator data:');
      console.log({
        id: foundEducator.id,
        user_id: foundEducator.user_id,
        first_name: foundEducator.first_name,
        last_name: foundEducator.last_name,
        email: foundEducator.email,
        specialization: foundEducator.specialization,
        qualification: foundEducator.qualification,
        school_id: foundEducator.school_id,
      });
    } else {
      console.log('❌ No educator found with any approach');
    }

    // Check 2: Look for any educators in the table
    console.log('\n📊 Checking all educators in table:');
    const { data: allEducators, error: allError } = await supabase
      .from('school_educators')
      .select('id, email, first_name, last_name, user_id, school_id')
      .limit(5);

    if (allError) {
      console.log('❌ Error fetching all educators:', allError.message);
    } else {
      console.log(`✅ Found ${allEducators.length} educators total`);
      allEducators.forEach((educator, index) => {
        console.log(`${index + 1}. ${educator.email} - ${educator.first_name} ${educator.last_name} (ID: ${educator.id})`);
      });
    }

    // Check 3: Check auth users
    console.log('\n👤 Checking auth users:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot access auth users (expected with anon key)');
    } else {
      console.log(`✅ Found ${authUsers.users.length} auth users`);
    }

    // Check 4: Test RLS policies
    console.log('\n🔒 Testing RLS policies:');
    
    // Try to read without authentication
    const { data: testRead, error: testError } = await supabase
      .from('school_educators')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ RLS blocking read:', testError.message);
      console.log('💡 This might be why data isn\'t loading');
    } else {
      console.log('✅ Can read school_educators table');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (educatorByEmail) {
      console.log('✅ Educator data exists - the issue is likely authentication');
      console.log('🔧 Fix: Update Profile.tsx to use email-based lookup instead of user_id');
      
      if (!educatorByEmail.user_id) {
        console.log('⚠️  Warning: educator.user_id is null - this needs to be fixed');
      }
    } else {
      console.log('❌ No educator data found');
      console.log('🔧 Fix: Create educator record in database');
    }

    if (testError && testError.message.includes('RLS')) {
      console.log('🔧 Fix: Update RLS policies to allow reading');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugEducatorData();