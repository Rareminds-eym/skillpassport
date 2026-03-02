#!/usr/bin/env node
/**
 * Test Experience CRUD operations
 * Tests: Add, Update, Delete operations on experience table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

const STUDENT_ID = '3531e63e-589e-46e7-9248-4a769e84b00d';

async function testExperienceCRUD() {
  console.log('🧪 Testing Experience CRUD Operations\n');
  
  let testRecordId = null;

  try {
    // TEST 1: CREATE (Add new experience)
    console.log('📝 TEST 1: Adding new experience...');
    const { data: createData, error: createError } = await supabase
      .from('experience')
      .insert({
        student_id: STUDENT_ID,
        organization: 'Test Company CRUD',
        role: 'Test Engineer',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        duration: 'Jan 2024 - Dec 2024',
        description: 'Testing CRUD operations',
        verified: false,
        approval_status: 'pending',
        enabled: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ CREATE failed:', createError);
      return;
    }

    testRecordId = createData.id;
    console.log('✅ CREATE successful:', {
      id: createData.id,
      role: createData.role,
      organization: createData.organization,
      approval_status: createData.approval_status,
      approval_authority: createData.approval_authority
    });
    console.log('');

    // TEST 2: UPDATE (Edit existing experience)
    console.log('📝 TEST 2: Updating experience...');
    const { data: updateData, error: updateError } = await supabase
      .from('experience')
      .update({
        role: 'Senior Test Engineer',
        organization: 'Updated Test Company',
        updated_at: new Date().toISOString()
      })
      .eq('id', testRecordId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ UPDATE failed:', updateError);
      return;
    }

    console.log('✅ UPDATE successful:', {
      id: updateData.id,
      role: updateData.role,
      organization: updateData.organization
    });
    console.log('');

    // TEST 3: UPDATE with versioning (simulate editing approved record)
    console.log('📝 TEST 3: Testing versioning (edit approved record)...');
    
    // First approve the record
    const { error: approveError } = await supabase
      .from('experience')
      .update({
        approval_status: 'approved',
        verified: true
      })
      .eq('id', testRecordId);

    if (approveError) {
      console.error('❌ APPROVE failed:', approveError);
      return;
    }

    // Now edit it with versioning
    const { data: versionData, error: versionError } = await supabase
      .from('experience')
      .update({
        role: 'Lead Test Engineer',
        verified_data: {
          role: 'Senior Test Engineer',
          organization: 'Updated Test Company',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          duration: 'Jan 2024 - Dec 2024',
          description: 'Testing CRUD operations',
          enabled: true
        },
        pending_edit_data: {
          role: 'Lead Test Engineer',
          organization: 'Updated Test Company',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          duration: 'Jan 2024 - Dec 2024',
          description: 'Testing CRUD operations',
          enabled: true
        },
        has_pending_edit: true,
        approval_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', testRecordId)
      .select()
      .single();

    if (versionError) {
      console.error('❌ VERSIONING UPDATE failed:', versionError);
      console.error('Error details:', JSON.stringify(versionError, null, 2));
      return;
    }

    console.log('✅ VERSIONING UPDATE successful:', {
      id: versionData.id,
      role: versionData.role,
      has_pending_edit: versionData.has_pending_edit,
      approval_status: versionData.approval_status,
      verified_data_keys: versionData.verified_data ? Object.keys(versionData.verified_data) : null,
      pending_edit_data_keys: versionData.pending_edit_data ? Object.keys(versionData.pending_edit_data) : null
    });
    console.log('');

    // TEST 4: DELETE
    console.log('📝 TEST 4: Deleting experience...');
    const { error: deleteError } = await supabase
      .from('experience')
      .delete()
      .eq('id', testRecordId);

    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError);
      return;
    }

    console.log('✅ DELETE successful');
    console.log('');

    // Verify deletion
    const { data: verifyData } = await supabase
      .from('experience')
      .select('id')
      .eq('id', testRecordId)
      .single();

    if (!verifyData) {
      console.log('✅ Verification: Record successfully deleted');
    } else {
      console.log('⚠️  Warning: Record still exists after deletion');
    }

    console.log('\n✨ All CRUD tests completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    // Cleanup: Try to delete test record if it exists
    if (testRecordId) {
      console.log('\n🧹 Cleaning up test record...');
      await supabase
        .from('experience')
        .delete()
        .eq('id', testRecordId);
    }
  }
}

testExperienceCRUD();
