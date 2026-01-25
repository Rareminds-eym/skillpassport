/**
 * Check Database State Before Fix
 * 
 * This script checks the current state of the database to understand
 * what needs to be fixed for the pipeline integration.
 */

import { supabase } from './src/lib/supabaseClient.js';

async function checkDatabaseState() {
  console.log('🔍 Checking Database State...\n');

  try {
    // 1. Check opportunities table structure and data
    console.log('1️⃣ Checking opportunities table...');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, job_title, title, requisition_id, is_active')
      .limit(10);

    if (oppError) {
      console.error('❌ Error querying opportunities:', oppError);
    } else {
      console.log(`✅ Found ${opportunities.length} opportunities (showing first 10)`);
      const withReqId = opportunities.filter(o => o.requisition_id).length;
      console.log(`   - ${withReqId}/${opportunities.length} have requisition_id`);
      
      if (opportunities.length > 0) {
        console.log('   Sample opportunity:', {
          id: opportunities[0].id,
          title: opportunities[0].job_title || opportunities[0].title,
          requisition_id: opportunities[0].requisition_id
        });
      }
    }

    // 2. Check requisitions table
    console.log('\n2️⃣ Checking requisitions table...');
    const { data: requisitions, error: reqError } = await supabase
      .from('requisitions')
      .select('id, title, status')
      .limit(5);

    if (reqError) {
      console.error('❌ Error querying requisitions:', reqError);
    } else {
      console.log(`✅ Found ${requisitions.length} requisitions`);
      if (requisitions.length > 0) {
        console.log('   Sample requisition:', requisitions[0]);
      }
    }

    // 3. Check pipeline_candidates table
    console.log('\n3️⃣ Checking pipeline_candidates table...');
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .limit(5);

    if (pipelineError) {
      console.error('❌ Error querying pipeline_candidates:', pipelineError);
    } else {
      console.log(`✅ Found ${pipeline.length} pipeline candidates`);
      if (pipeline.length > 0) {
        console.log('   Sample candidate:', {
          name: pipeline[0].candidate_name,
          stage: pipeline[0].stage,
          requisition_id: pipeline[0].requisition_id
        });
      }
    }

    // 4. Check applied_jobs table
    console.log('\n4️⃣ Checking applied_jobs table...');
    const { data: applications, error: appError } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        student_id,
        opportunity_id,
        application_status,
        applied_at,
        opportunity:opportunities(id, job_title, requisition_id)
      `)
      .limit(5);

    if (appError) {
      console.error('❌ Error querying applied_jobs:', appError);
    } else {
      console.log(`✅ Found ${applications.length} applications (showing first 5)`);
      applications.forEach((app, idx) => {
        console.log(`   ${idx + 1}. ${app.opportunity?.job_title || 'Unknown Job'} - Student: ${app.student_id} - Req ID: ${app.opportunity?.requisition_id || 'MISSING'}`);
      });
    }

    // 5. Check students table
    console.log('\n5️⃣ Checking students table...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, email')
      .limit(3);

    if (studentsError) {
      console.error('❌ Error querying students:', studentsError);
    } else {
      console.log(`✅ Found ${students.length} students (showing first 3)`);
      students.forEach(student => {
        console.log(`   - ${student.name} (${student.email})`);
      });
    }

    console.log('\n📋 Summary:');
    console.log('To fix the pipeline issue, we need to:');
    console.log('1. Ensure opportunities have requisition_id');
    console.log('2. Create requisitions if they don\'t exist');
    console.log('3. Add existing applications to pipeline_candidates');
    console.log('4. Set up trigger for future applications');

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

checkDatabaseState();