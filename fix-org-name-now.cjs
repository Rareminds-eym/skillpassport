#!/usr/bin/env node
/**
 * Quick fix script to remove org_name from JSONB fields
 * This fixes the "column org_name does not exist" error
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrgName() {
  console.log('🔧 Starting org_name fix...\n');

  try {
    // Check how many records have org_name
    const { data: beforeData, error: beforeError } = await supabase
      .from('experience')
      .select('id, role, verified_data, pending_edit_data')
      .or('verified_data->org_name.not.is.null,pending_edit_data->org_name.not.is.null');

    if (beforeError) {
      console.error('❌ Error checking records:', beforeError);
      return;
    }

    console.log(`📊 Found ${beforeData?.length || 0} records with org_name in JSONB fields\n`);

    if (!beforeData || beforeData.length === 0) {
      console.log('✅ No records need fixing!');
      return;
    }

    // Show affected records
    console.log('📋 Affected records:');
    beforeData.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.role} (ID: ${record.id})`);
      if (record.verified_data?.org_name) {
        console.log(`     - verified_data has org_name: "${record.verified_data.org_name}"`);
      }
      if (record.pending_edit_data?.org_name) {
        console.log(`     - pending_edit_data has org_name: "${record.pending_edit_data.org_name}"`);
      }
    });
    console.log('');

    // Fix each record
    console.log('🔄 Fixing records...\n');
    let fixedCount = 0;

    for (const record of beforeData) {
      const updates = {};
      let needsUpdate = false;

      // Clean verified_data
      if (record.verified_data && record.verified_data.org_name) {
        const { org_name, ...cleanedVerified } = record.verified_data;
        updates.verified_data = Object.keys(cleanedVerified).length > 0 ? cleanedVerified : null;
        needsUpdate = true;
      }

      // Clean pending_edit_data
      if (record.pending_edit_data && record.pending_edit_data.org_name) {
        const { org_name, ...cleanedPending } = record.pending_edit_data;
        updates.pending_edit_data = Object.keys(cleanedPending).length > 0 ? cleanedPending : null;
        needsUpdate = true;
      }

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('experience')
          .update(updates)
          .eq('id', record.id);

        if (updateError) {
          console.error(`  ❌ Failed to fix ${record.role}:`, updateError.message);
        } else {
          console.log(`  ✅ Fixed ${record.role}`);
          fixedCount++;
        }
      }
    }

    console.log(`\n✨ Successfully fixed ${fixedCount} out of ${beforeData.length} records!\n`);

    // Verify the fix
    const { data: afterData, error: afterError } = await supabase
      .from('experience')
      .select('id')
      .or('verified_data->org_name.not.is.null,pending_edit_data->org_name.not.is.null');

    if (afterError) {
      console.error('❌ Error verifying fix:', afterError);
      return;
    }

    if (!afterData || afterData.length === 0) {
      console.log('✅ Verification passed: No records with org_name remaining!');
    } else {
      console.log(`⚠️  Warning: ${afterData.length} records still have org_name`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixOrgName();
