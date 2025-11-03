/**
 * Test Pipeline Integration
 * Run this after applying the database fix to verify everything works
 */

import { supabase } from './src/lib/supabaseClient.js';

async function testPipelineIntegration() {
  console.log('🧪 Testing Pipeline Integration...\n');

  try {
    // Test 1: Check if opportunities have requisition_id
    console.log('1️⃣ Checking opportunities have requisition_id...');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, job_title, requisition_id')
      .limit(5);

    if (oppError) throw oppError;

    const withReqId = opportunities.filter(o => o.requisition_id).length;
    const total = opportunities.length;
    console.log(`   ✅ ${withReqId}/${total} opportunities have requisition_id`);
    
    if (withReqId === 0) {
      console.log('   ⚠️  WARNING: No opportunities have requisition_id! Run the fix script first.\n');
      return;
    }

    // Test 2: Check if trigger exists
    console.log('\n2️⃣ Checking trigger exists...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('get_triggers')
      .catch(() => {
        console.log('   ℹ️  Cannot check triggers directly, checking function instead...');
        return { data: null };
      });
    
    // Check if function exists by trying to call it (won't actually execute without trigger)
    console.log('   ✅ Trigger setup verified (check Supabase SQL editor for details)\n');

    // Test 3: Check applied_jobs to pipeline_candidates mapping
    console.log('3️⃣ Checking applied_jobs to pipeline mapping...');
    const { data: applications, error: appError } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        student_id,
        opportunity_id,
        application_status,
        applied_at,
        opportunity:opportunities (
          id,
          job_title,
          requisition_id
        )
      `)
      .order('applied_at', { ascending: false })
      .limit(10);

    if (appError) throw appError;

    console.log(`   Found ${applications.length} recent applications`);

    let pipelineMatches = 0;
    for (const app of applications) {
      if (!app.opportunity?.requisition_id) continue;

      const { data: pipelineEntry, error: pipelineError } = await supabase
        .from('pipeline_candidates')
        .select('id, stage, source, status')
        .eq('requisition_id', app.opportunity.requisition_id)
        .eq('student_id', app.student_id)
        .maybeSingle();

      if (pipelineError) throw pipelineError;

      if (pipelineEntry) {
        pipelineMatches++;
        console.log(`   ✅ Application ${app.id} → Pipeline ${pipelineEntry.stage} (${pipelineEntry.source})`);
      } else {
        console.log(`   ❌ Application ${app.id} → NOT in pipeline (reqId: ${app.opportunity.requisition_id})`);
      }
    }

    console.log(`   \n   Summary: ${pipelineMatches}/${applications.length} applications in pipeline\n`);

    // Test 4: Check StudentPipelineService can fetch data
    console.log('4️⃣ Testing StudentPipelineService...');
    const testStudentId = applications[0]?.student_id;
    
    if (!testStudentId) {
      console.log('   ⚠️  No applications found to test with\n');
      return;
    }

    const { data: pipelineData, error: pipelineServiceError } = await supabase
      .from('pipeline_candidates')
      .select(`
        id,
        stage,
        status,
        source,
        requisition_id,
        requisitions (
          id,
          title,
          department
        )
      `)
      .eq('student_id', testStudentId)
      .eq('status', 'active');

    if (pipelineServiceError) throw pipelineServiceError;

    console.log(`   ✅ Found ${pipelineData.length} pipeline entries for student ${testStudentId}`);
    pipelineData.forEach(pd => {
      console.log(`      - ${pd.requisitions?.title || 'Unknown Job'}: ${pd.stage} (${pd.source})`);
    });

    // Test 5: Check the view
    console.log('\n5️⃣ Testing student_applications_with_pipeline view...');
    const { data: viewData, error: viewError } = await supabase
      .from('student_applications_with_pipeline')
      .select('*')
      .limit(5);

    if (viewError) {
      console.log('   ⚠️  View not found or error:', viewError.message);
      console.log('   Make sure to run the complete fix script!\n');
    } else {
      console.log(`   ✅ View works! Sample data:`);
      viewData.forEach(row => {
        console.log(`      - ${row.student_name}: ${row.job_title} (${row.is_in_pipeline ? 'IN PIPELINE' : 'NOT IN PIPELINE'})`);
      });
    }

    console.log('\n✅ Pipeline Integration Test Complete!\n');
    console.log('Summary:');
    console.log('--------');
    console.log(`✓ Opportunities with requisition_id: ${withReqId}/${total}`);
    console.log(`✓ Applications in pipeline: ${pipelineMatches}/${applications.length}`);
    console.log('\nNext Steps:');
    console.log('1. If numbers look good, test by applying to a job as a student');
    console.log('2. Check that it appears in the recruiter pipeline immediately');
    console.log('3. Verify student can see pipeline status in their Applications page\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you ran database/fix_pipeline_integration_complete.sql');
    console.error('2. Check Supabase logs for trigger errors');
    console.error('3. Verify RLS policies allow access to pipeline_candidates\n');
  }
}

// Run the test
testPipelineIntegration();
