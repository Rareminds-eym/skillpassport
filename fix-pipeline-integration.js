/**
 * Fix Pipeline Integration - Run Database Updates
 * 
 * This script will execute the SQL commands needed to populate the pipeline_candidates
 * table with existing applications so they show up in the recruiter pipeline.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qdxqnrweqdgtkgsjwfqf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkeHFucndlcWRndGtnc2p3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMDY2NTEsImV4cCI6MjA0NjU4MjY1MX0.vZSxC5eILmFAUhnj0b8WJOoZBRJkAkI50oVJFJWqtQw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runPipelineFix() {
  console.log('🔧 Starting Pipeline Integration Fix...\n');

  try {
    // Step 1: Check current state
    console.log('1️⃣ Checking current pipeline data...');
    const { data: currentPipeline, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .limit(5);

    if (pipelineError) {
      console.error('❌ Error checking pipeline:', pipelineError);
      return;
    }

    console.log(`Current pipeline candidates: ${currentPipeline.length}`);

    // Step 2: Check applied jobs that need to be added to pipeline
    console.log('\n2️⃣ Checking applications that need to be added...');
    const { data: applications, error: appError } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        student_id,
        opportunity_id,
        applied_at,
        application_status,
        opportunity:opportunities (
          id,
          job_title,
          requisition_id
        )
      `)
      .neq('application_status', 'withdrawn')
      .order('applied_at', { ascending: false });

    if (appError) {
      console.error('❌ Error checking applications:', appError);
      return;
    }

    console.log(`Found ${applications.length} applications to check`);
    
    let needSync = 0;
    let alreadyInPipeline = 0;
    let noRequisitionId = 0;

    for (const app of applications) {
      if (!app.opportunity?.requisition_id) {
        noRequisitionId++;
        continue;
      }

      // Check if this application is already in pipeline
      const { data: existing, error: existingError } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('requisition_id', app.opportunity.requisition_id)
        .eq('student_id', app.student_id)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing:', existingError);
        continue;
      }

      if (existing) {
        alreadyInPipeline++;
      } else {
        needSync++;
      }
    }

    console.log(`Summary:`);
    console.log(`  - Already in pipeline: ${alreadyInPipeline}`);
    console.log(`  - Need to add to pipeline: ${needSync}`);
    console.log(`  - Missing requisition_id: ${noRequisitionId}`);

    if (needSync === 0) {
      console.log('\n✅ All applications are already synced to pipeline!');
      return;
    }

    // Step 3: Sync applications to pipeline
    console.log(`\n3️⃣ Adding ${needSync} applications to pipeline...`);
    let synced = 0;
    let errors = 0;

    for (const app of applications) {
      if (!app.opportunity?.requisition_id) continue;

      // Check if already exists
      const { data: existing } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('requisition_id', app.opportunity.requisition_id)
        .eq('student_id', app.student_id)
        .maybeSingle();

      if (existing) continue;

      // Get student details
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, email, contact_number')
        .eq('id', app.student_id)
        .maybeSingle();

      if (studentError || !student) {
        console.log(`⚠️  Student ${app.student_id} not found, skipping...`);
        continue;
      }

      // Add to pipeline
      const { error: insertError } = await supabase
        .from('pipeline_candidates')
        .insert({
          requisition_id: app.opportunity.requisition_id,
          student_id: app.student_id,
          candidate_name: student.name || 'Unknown Student',
          candidate_email: student.email || '',
          candidate_phone: student.contact_number || '',
          stage: 'sourced',
          source: 'direct_application',
          status: 'active',
          added_at: app.applied_at,
          stage_changed_at: app.applied_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`❌ Error adding ${student.name} to pipeline:`, insertError);
        errors++;
      } else {
        console.log(`✅ Added ${student.name} to pipeline for ${app.opportunity.job_title}`);
        synced++;
      }
    }

    console.log(`\n📊 Sync completed:`);
    console.log(`  - Successfully synced: ${synced}`);
    console.log(`  - Errors: ${errors}`);

    // Step 4: Verify the results
    console.log('\n4️⃣ Verifying results...');
    const { data: finalPipeline, error: finalError } = await supabase
      .from('pipeline_candidates')
      .select('*');

    if (finalError) {
      console.error('❌ Error checking final state:', finalError);
    } else {
      console.log(`✅ Final pipeline candidates count: ${finalPipeline.length}`);
      
      if (finalPipeline.length > 0) {
        console.log('\nSample pipeline entries:');
        finalPipeline.slice(0, 3).forEach(entry => {
          console.log(`  - ${entry.candidate_name} (${entry.stage}) for requisition ${entry.requisition_id}`);
        });
      }
    }

    console.log('\n🎉 Pipeline fix completed! Students should now appear in recruiter pipeline.');

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

runPipelineFix();