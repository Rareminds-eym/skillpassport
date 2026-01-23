// Test script to verify RLS fix works
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

async function testAfterRLSFix() {
  console.log('🧪 Testing after RLS policy fix...\n');

  try {
    // Test 1: Basic read access
    console.log('📖 Test 1: Basic read access');
    const { data: allEducators, error: readError } = await supabase
      .from('school_educators')
      .select('email, first_name, last_name')
      .limit(5);

    if (readError) {
      console.log('❌ Read error:', readError.message);
      console.log('💡 RLS policies might still be blocking access');
    } else {
      console.log(`✅ Successfully read ${allEducators.length} educators`);
      allEducators.forEach(educator => {
        console.log(`  - ${educator.email}: ${educator.first_name} ${educator.last_name}`);
      });
    }

    // Test 2: Specific educator lookup
    console.log('\n🎯 Test 2: Specific educator lookup');
    const { data: specificEducator, error: specificError } = await supabase
      .from('school_educators')
      .select('*')
      .eq('email', 'karthikeyan@rareminds.in')
      .maybeSingle();

    if (specificError) {
      console.log('❌ Specific lookup error:', specificError.message);
    } else if (specificEducator) {
      console.log('✅ Found specific educator:');
      console.log({
        id: specificEducator.id,
        name: `${specificEducator.first_name} ${specificEducator.last_name}`,
        email: specificEducator.email,
        specialization: specificEducator.specialization,
        qualification: specificEducator.qualification,
        school_id: specificEducator.school_id,
      });
    } else {
      console.log('❌ Educator not found');
    }

    // Test 3: Update test (if educator exists)
    if (specificEducator) {
      console.log('\n✏️  Test 3: Update test');
      const { error: updateError } = await supabase
        .from('school_educators')
        .update({ 
          updated_at: new Date().toISOString(),
          // Add a test field to verify update works
          metadata: { 
            ...specificEducator.metadata, 
            last_test: new Date().toISOString() 
          }
        })
        .eq('id', specificEducator.id);

      if (updateError) {
        console.log('❌ Update error:', updateError.message);
      } else {
        console.log('✅ Update successful');
      }
    }

    // Test 4: Count total records
    console.log('\n📊 Test 4: Count records');
    const { count, error: countError } = await supabase
      .from('school_educators')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Count error:', countError.message);
    } else {
      console.log(`✅ Total educators in database: ${count}`);
    }

    // Summary
    console.log('\n📋 Summary:');
    if (!readError && !specificError) {
      console.log('✅ RLS policies are working correctly');
      console.log('✅ Data is accessible');
      console.log('✅ Profile component should work now');
    } else {
      console.log('❌ Still having issues with RLS policies');
      console.log('💡 Try running the fix-rls-policies.sql script in Supabase SQL Editor');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAfterRLSFix();