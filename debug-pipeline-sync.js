/**
 * Debug Pipeline Sync Issue
 * This script checks why candidates aren't showing in the Pipeline after updating status
 * 
 * Run this in your browser console (F12) on the Recruiter Dashboard
 */

console.log('🔍 Debugging Pipeline Sync Issue...\n');

const { supabase } = window;

async function debugPipelineSync() {
  try {
    // 1. Get the specific opportunity (HVAC Engineer - Mumbai - Blue Star)
    console.log('1️⃣ Finding the HVAC Engineer opportunity...');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .ilike('job_title', '%HVAC%')
      .ilike('location', '%Mumbai%');

    if (oppError) {
      console.error('❌ Error fetching opportunities:', oppError);
      return;
    }

    console.log(`Found ${opportunities.length} HVAC opportunities:`, opportunities);

    if (opportunities.length === 0) {
      console.error('❌ No HVAC Engineer opportunities found!');
      return;
    }

    const hvacOpportunity = opportunities[0];
    console.log('✅ HVAC Opportunity:', {
      id: hvacOpportunity.id,
      job_title: hvacOpportunity.job_title,
      company_name: hvacOpportunity.company_name,
      location: hvacOpportunity.location
    });

    // 2. Check applied_jobs for this opportunity
    console.log('\n2️⃣ Checking applications for this opportunity...');
    const { data: applications, error: appError } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        student_id,
        opportunity_id,
        application_status,
        applied_at,
        updated_at
      `)
      .eq('opportunity_id', hvacOpportunity.id);

    if (appError) {
      console.error('❌ Error fetching applications:', appError);
      return;
    }

    console.log(`Found ${applications.length} applications:`, applications);

    if (applications.length === 0) {
      console.log('⚠️  No applications found for this opportunity!');
      return;
    }

    // 3. Check pipeline_candidates for this opportunity
    console.log('\n3️⃣ Checking pipeline_candidates for this opportunity...');
    const { data: pipelineCandidates, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .eq('opportunity_id', hvacOpportunity.id);

    if (pipelineError) {
      console.error('❌ Error fetching pipeline candidates:', pipelineError);
      return;
    }

    console.log(`Found ${pipelineCandidates.length} pipeline candidates:`, pipelineCandidates);

    // 4. Find the gap - applications NOT in pipeline
    console.log('\n4️⃣ Finding missing pipeline records...');
    const missingFromPipeline = applications.filter(app => 
      !pipelineCandidates.find(pc => pc.student_id === app.student_id)
    );

    console.log(`${missingFromPipeline.length} applications missing from pipeline:`, missingFromPipeline);

    if (missingFromPipeline.length > 0) {
      console.log('\n⚠️  ISSUE FOUND: Applications exist but not in pipeline_candidates table!');
      console.log('\n📋 Missing applications:');
      
      for (const app of missingFromPipeline) {
        // Get student details
        const { data: student } = await supabase
          .from('students')
          .select('id, name, email, profile')
          .eq('id', app.student_id)
          .single();

        console.log(`  - Student: ${student?.name || student?.profile?.name || 'Unknown'}`);
        console.log(`    Email: ${student?.email || student?.profile?.email || 'N/A'}`);
        console.log(`    Applied: ${app.applied_at}`);
        console.log(`    Status: ${app.application_status}`);
      }

      // 5. Offer to sync them
      console.log('\n\n✅ SOLUTION: Run the sync function below:\n');
      console.log('Copy and paste this command:');
      console.log('await window.syncMissingToPipeline();\n');

      // Create sync function
      window.syncMissingToPipeline = async function() {
        console.log('🔄 Starting sync...');
        
        let synced = 0;
        let errors = 0;

        for (const app of missingFromPipeline) {
          try {
            // Get student details
            const { data: student } = await supabase
              .from('students')
              .select('id, name, email, profile')
              .eq('id', app.student_id)
              .single();

            if (!student) {
              console.error(`Student ${app.student_id} not found`);
              errors++;
              continue;
            }

            // Extract name and email from profile if needed
            const studentName = student.name || student.profile?.name || 'Unknown';
            const studentEmail = student.email || student.profile?.email || '';
            const studentPhone = student.profile?.contact_number || '';

            console.log(`Adding ${studentName} to pipeline...`);

            // Insert into pipeline_candidates
            const { error: insertError } = await supabase
              .from('pipeline_candidates')
              .insert({
                opportunity_id: hvacOpportunity.id,
                student_id: app.student_id,
                candidate_name: studentName,
                candidate_email: studentEmail,
                candidate_phone: studentPhone,
                stage: 'sourced', // Default stage
                source: 'direct_application',
                status: 'active',
                added_at: app.applied_at,
                stage_changed_at: app.applied_at,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error(`Error adding ${studentName}:`, insertError);
              errors++;
            } else {
              console.log(`✅ Added ${studentName} to pipeline`);
              synced++;
            }
          } catch (err) {
            console.error('Error processing application:', err);
            errors++;
          }
        }

        console.log(`\n📊 Sync complete!`);
        console.log(`  ✅ Synced: ${synced}`);
        console.log(`  ❌ Errors: ${errors}`);
        console.log('\n🔄 Refresh the Pipeline page to see the candidates!');
      };

    } else {
      console.log('✅ All applications are already in the pipeline!');
      console.log('\n🔍 Checking if pipeline candidates are in correct stage...');

      for (const pc of pipelineCandidates) {
        console.log(`  - ${pc.candidate_name}: stage = ${pc.stage}, status = ${pc.status}`);
      }

      console.log('\n💡 If candidates are not showing:');
      console.log('   1. Make sure you\'re looking at the correct opportunity in the dropdown');
      console.log('   2. Check if the stage filter is applied');
      console.log('   3. Try refreshing the page');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugPipelineSync();
