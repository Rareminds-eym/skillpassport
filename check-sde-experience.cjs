#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSDEExperience() {
  console.log('🔍 Checking SDE experience record...\n');

  const { data, error } = await supabase
    .from('experience')
    .select('*')
    .eq('student_id', '3531e63e-589e-46e7-9248-4a769e84b00d')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${data.length} experience records:\n`);

  data.forEach((exp, index) => {
    console.log(`${index + 1}. ${exp.role} at ${exp.organization}`);
    console.log(`   ID: ${exp.id}`);
    console.log(`   Approval Status: ${exp.approval_status}`);
    console.log(`   Has Pending Edit: ${exp.has_pending_edit}`);
    console.log(`   Verified: ${exp.verified}`);
    console.log(`   Enabled: ${exp.enabled}`);
    
    if (exp.verified_data) {
      console.log(`   ✅ Has verified_data:`, JSON.stringify(exp.verified_data, null, 2));
    } else {
      console.log(`   ❌ No verified_data`);
    }
    
    if (exp.pending_edit_data) {
      console.log(`   ⏳ Has pending_edit_data:`, JSON.stringify(exp.pending_edit_data, null, 2));
    } else {
      console.log(`   ❌ No pending_edit_data`);
    }
    
    console.log('');
  });
}

checkSDEExperience();
