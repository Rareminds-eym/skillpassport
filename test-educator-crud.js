// Test script to verify educator CRUD operations
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

async function testEducatorOperations() {
  console.log('🧪 Testing educator CRUD operations...\n');

  try {
    // Test 1: Try to read existing data
    console.log('📖 Test 1: Reading existing educator data');
    const { data: existingEducators, error: readError } = await supabase
      .from('school_educators')
      .select('*')
      .limit(5);

    if (readError) {
      console.log('❌ Read error:', readError.message);
    } else {
      console.log(`✅ Successfully read ${existingEducators.length} educators`);
      if (existingEducators.length > 0) {
        console.log('📄 Sample educator:', {
          id: existingEducators[0].id,
          email: existingEducators[0].email,
          first_name: existingEducators[0].first_name,
          last_name: existingEducators[0].last_name,
        });
      }
    }

    // Test 2: Try to create a test educator (this might fail due to constraints)
    console.log('\n📝 Test 2: Creating test educator');
    const testEducator = {
      email: 'test.educator@example.com',
      first_name: 'Test',
      last_name: 'Educator',
      specialization: 'Computer Science',
      qualification: 'M.Tech',
      experience_years: 5,
      designation: 'Senior Educator',
      department: 'Computer Science',
      account_status: 'active',
      verification_status: 'Pending',
      // Note: user_id and school_id are required but we don't have valid ones
    };

    const { data: newEducator, error: createError } = await supabase
      .from('school_educators')
      .insert([testEducator])
      .select()
      .single();

    if (createError) {
      console.log('❌ Create error:', createError.message);
      console.log('💡 This is expected if user_id or school_id constraints fail');
    } else {
      console.log('✅ Successfully created educator:', newEducator.id);
      
      // Test 3: Update the created educator
      console.log('\n✏️  Test 3: Updating educator');
      const { data: updatedEducator, error: updateError } = await supabase
        .from('school_educators')
        .update({ 
          specialization: 'Mathematics',
          experience_years: 6 
        })
        .eq('id', newEducator.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Update error:', updateError.message);
      } else {
        console.log('✅ Successfully updated educator');
      }

      // Test 4: Delete the test educator
      console.log('\n🗑️  Test 4: Deleting test educator');
      const { error: deleteError } = await supabase
        .from('school_educators')
        .delete()
        .eq('id', newEducator.id);

      if (deleteError) {
        console.log('❌ Delete error:', deleteError.message);
      } else {
        console.log('✅ Successfully deleted test educator');
      }
    }

    // Test 5: Check RLS policies
    console.log('\n🔒 Test 5: Checking RLS policies');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_table_policies', { table_name: 'school_educators' });

    if (policyError) {
      console.log('❌ Policy check error:', policyError.message);
    } else {
      console.log('✅ RLS policies found:', policies?.length || 0);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testEducatorOperations();