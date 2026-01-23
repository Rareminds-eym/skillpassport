// Test script to verify educator data access after disabling RLS
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

async function testAfterRLSDisable() {
  console.log('🧪 Testing educator data access after RLS disable...\n');

  try {
    // Test 1: Count all records
    console.log('📊 Test 1: Counting all educator records');
    const { count, error: countError } = await supabase
      .from('school_educators')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Count error:', countError.message);
    } else {
      console.log(`✅ Total educators in table: ${count}`);
    }

    // Test 2: Fetch all records
    console.log('\n📋 Test 2: Fetching all educator records');
    const { data: allEducators, error: allError } = await supabase
      .from('school_educators')
      .select('id, email, first_name, last_name, specialization')
      .limit(10);

    if (allError) {
      console.log('❌ Fetch all error:', allError.message);
    } else {
      console.log(`✅ Successfully fetched ${allEducators.length} educators:`);
      allEducators.forEach((educator, index) => {
        console.log(`  ${index + 1}. ${educator.email} - ${educator.first_name} ${educator.last_name}`);
      });
    }

    // Test 3: Fetch specific educator by email
    console.log('\n🎯 Test 3: Fetching specific educator by email');
    const testEmail = 'karthikeyan@rareminds.in';
    const { data: specificEducator, error: specificError } = await supabase
      .from('school_educators')
      .select('*')
      .eq('email', testEmail)
      .maybeSingle();

    if (specificError) {
      console.log('❌ Specific educator error:', specificError.message);
    } else if (specificEducator) {
      console.log('✅ Found specific educator:');
      console.log({
        id: specificEducator.id,
        email: specificEducator.email,
        name: `${specificEducator.first_name} ${specificEducator.last_name}`,
        specialization: specificEducator.specialization,
        qualification: specificEducator.qualification,
        experience_years: specificEducator.experience_years,
        designation: specificEducator.designation,
        department: specificEducator.department,
        school_id: specificEducator.school_id,
        user_id: specificEducator.user_id,
        verification_status: specificEducator.verification_status,
      });
    } else {
      console.log('❌ No educator found with email:', testEmail);
    }

    // Test 4: Test update operation
    if (specificEducator) {
      console.log('\n✏️  Test 4: Testing update operation');
      const { error: updateError } = await supabase
        .from('school_educators')
        .update({ 
          updated_at: new Date().toISOString(),
          // Add a test field to verify update works
          metadata: { 
            ...specificEducator.metadata, 
            last_test_update: new Date().toISOString() 
          }
        })
        .eq('id', specificEducator.id);

      if (updateError) {
        console.log('❌ Update error:', updateError.message);
      } else {
        console.log('✅ Update successful');
      }
    }

    // Summary
    console.log('\n📋 Summary:');
    if (count > 0) {
      console.log('✅ RLS disable successful - data is accessible');
      console.log('✅ Your Profile component should now work');
      console.log('🔧 Next step: Test the profile page in your browser');
    } else {
      console.log('❌ No data found - check if records exist in database');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAfterRLSDisable();