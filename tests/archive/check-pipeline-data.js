/**
 * Simple test to check pipeline candidates data
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qdxqnrweqdgtkgsjwfqf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkeHFucndlcWRndGtnc2p3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMDY2NTEsImV4cCI6MjA0NjU4MjY1MX0.vZSxC5eILmFAUhnj0b8WJOoZBRJkAkI50oVJFJWqtQw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPipelineData() {
  console.log('🔍 Checking Pipeline Data...\n');

  try {
    // 1. Check if pipeline_candidates table exists and has data
    console.log('1️⃣ Checking pipeline_candidates table...');
    const { data: pipelineCandidates, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .limit(10);

    if (pipelineError) {
      console.error('❌ Error querying pipeline_candidates:', pipelineError);
    } else {
      console.log(`✅ Found ${pipelineCandidates.length} records in pipeline_candidates`);
      if (pipelineCandidates.length > 0) {
        console.log('Sample record:', pipelineCandidates[0]);
      }
    }

    // 2. Check applied_jobs
    console.log('\n2️⃣ Checking applied_jobs...');
    const { data: appliedJobs, error: appliedError } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        student_id,
        opportunity_id,
        application_status,
        opportunity:opportunities (
          id,
          job_title,
          requisition_id
        )
      `)
      .limit(5);

    if (appliedError) {
      console.error('❌ Error querying applied_jobs:', appliedError);
    } else {
      console.log(`✅ Found ${appliedJobs.length} applied jobs`);
      appliedJobs.forEach(job => {
        console.log(`  - Job: ${job.opportunity?.job_title}, ReqID: ${job.opportunity?.requisition_id}`);
      });
    }

    // 3. Check opportunities have requisition_id
    console.log('\n3️⃣ Checking opportunities have requisition_id...');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, job_title, requisition_id')
      .limit(10);

    if (oppError) {
      console.error('❌ Error querying opportunities:', oppError);
    } else {
      const withReqId = opportunities.filter(o => o.requisition_id).length;
      console.log(`✅ ${withReqId}/${opportunities.length} opportunities have requisition_id`);
    }

    // 4. Test specific student pipeline data
    console.log('\n4️⃣ Testing specific student pipeline data...');
    if (appliedJobs.length > 0) {
      const testStudentId = appliedJobs[0].student_id;
      console.log(`Testing with student ID: ${testStudentId}`);

      const { data: studentPipeline, error: studentError } = await supabase
        .from('pipeline_candidates')
        .select('*')
        .eq('student_id', testStudentId);

      if (studentError) {
        console.error('❌ Error querying student pipeline:', studentError);
      } else {
        console.log(`✅ Student has ${studentPipeline.length} pipeline entries`);
        studentPipeline.forEach(entry => {
          console.log(`  - Stage: ${entry.stage}, Requisition: ${entry.requisition_id}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

checkPipelineData();