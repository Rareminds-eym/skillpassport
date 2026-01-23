// Check RLS policies for conversations and messages tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔒 Checking RLS Policies...\n');

  try {
    // Check conversations table policies
    console.log('1️⃣ Conversations table policies:');
    const { data: convPolicies, error: convError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'conversations');

    if (convError) {
      console.error('❌ Error fetching conversation policies:', convError.message);
    } else {
      console.log(`   Found ${convPolicies?.length || 0} policies`);
      convPolicies?.forEach((policy, idx) => {
        console.log(`   ${idx + 1}. ${policy.policyname}`);
        console.log(`      Command: ${policy.cmd}`);
        console.log(`      Roles: ${policy.roles}`);
        console.log(`      Qual: ${policy.qual || 'N/A'}`);
        console.log(`      With Check: ${policy.with_check || 'N/A'}`);
        console.log('');
      });
    }

    // Check messages table policies
    console.log('\n2️⃣ Messages table policies:');
    const { data: msgPolicies, error: msgError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'messages');

    if (msgError) {
      console.error('❌ Error fetching message policies:', msgError.message);
    } else {
      console.log(`   Found ${msgPolicies?.length || 0} policies`);
      msgPolicies?.forEach((policy, idx) => {
        console.log(`   ${idx + 1}. ${policy.policyname}`);
        console.log(`      Command: ${policy.cmd}`);
        console.log(`      Roles: ${policy.roles}`);
        console.log(`      Qual: ${policy.qual || 'N/A'}`);
        console.log(`      With Check: ${policy.with_check || 'N/A'}`);
        console.log('');
      });
    }

    // Check if RLS is enabled
    console.log('\n3️⃣ Checking if RLS is enabled:');
    const { data: tables, error: tableError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['conversations', 'messages']);

    if (tableError) {
      console.error('❌ Error checking RLS status:', tableError.message);
    } else {
      tables?.forEach(table => {
        console.log(`   ${table.tablename}: RLS ${table.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRLSPolicies();