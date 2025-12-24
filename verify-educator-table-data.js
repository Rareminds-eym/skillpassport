// Quick script to verify educator data in both tables
// Run this with: node verify-educator-table-data.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEducatorTables() {
  console.log('🔍 Checking educator data in both tables...\n');

  try {
    // Check school_educators table
    console.log('📋 Checking school_educators table:');
    const { data: schoolEducators, error: schoolError } = await supabase
      .from('school_educators')
      .select('*')
      .limit(5);

    if (schoolError) {
      console.log('❌ Error querying school_educators:', schoolError.message);
    } else {
      console.log(`✅ Found ${schoolEducators.length} records in school_educators`);
      if (schoolEducators.length > 0) {
        console.log('📄 Sample record:', {
          id: schoolEducators[0].id,
          first_name: schoolEducators[0].first_name,
          last_name: schoolEducators[0].last_name,
          email: schoolEducators[0].email,
          specialization: schoolEducators[0].specialization,
          school_id: schoolEducators[0].school_id,
          user_id: schoolEducators[0].user_id,
        });
      }
    }

    console.log('\n📋 Checking educators table (for comparison - this table should not exist):');
    const { data: educators, error: educatorsError } = await supabase
      .from('educators')
      .select('*')
      .limit(5);

    if (educatorsError) {
      console.log('❌ Error querying educators:', educatorsError.message);
    } else {
      console.log(`✅ Found ${educators.length} records in educators`);
      if (educators.length > 0) {
        console.log('📄 Sample record:', {
          id: educators[0].id,
          full_name: educators[0].full_name,
          email: educators[0].email,
          department: educators[0].department,
        });
      }
    }

    // Check auth users
    console.log('\n👤 Checking auth.users:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error querying auth users:', authError.message);
    } else {
      console.log(`✅ Found ${authUsers.users.length} auth users`);
      if (authUsers.users.length > 0) {
        console.log('📄 Sample user:', {
          id: authUsers.users[0].id,
          email: authUsers.users[0].email,
          created_at: authUsers.users[0].created_at,
        });
      }
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (schoolEducators && schoolEducators.length > 0) {
      console.log('✅ Use school_educators table - it has data');
      console.log('✅ Your Profile.tsx component is correct');
      console.log('✅ Update educatorProfile.js service to use school_educators');
    } else if (educators && educators.length > 0) {
      console.log('⚠️  Data is in educators table');
      console.log('⚠️  Consider migrating to school_educators or update Profile.tsx');
    } else {
      console.log('❌ No educator data found in either table');
      console.log('❌ You need to create educator records');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyEducatorTables();