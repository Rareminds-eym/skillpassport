/**
 * INLINE PIPELINE FIX - Run in Browser Console
 * 
 * This will check if pipeline data exists and create it if missing.
 * Copy and paste this into browser console (F12) on the ApplicantsList page.
 */

console.log('🔧 INLINE PIPELINE FIX - Starting...');

async function inlinePipelineFix() {
  try {
    console.log('1️⃣ Checking current pipeline data...');
    
    // Check if we have any pipeline candidates
    const { data: existingPipeline, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select('id')
      .limit(1);

    if (pipelineError) {
      console.error('❌ Error accessing pipeline_candidates:', pipelineError);
      return;
    }

    if (existingPipeline && existingPipeline.length > 0) {
      console.log('✅ Pipeline data already exists!');
      console.log('   Refreshing the page should show the data.');
      window.location.reload();
      return;
    }

    console.log('2️⃣ No pipeline data found. Creating from applications...');

    // Get all applications with their opportunities
    const { data: applications, error: appError } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        student_id,
        opportunity_id,
        applied_at,
        opportunity:opportunities(
          id,
          job_title,
          title,
          requisition_id
        )
      `)
      .neq('application_status', 'withdrawn');

    if (appError) {
      console.error('❌ Error fetching applications:', appError);
      return;
    }

    console.log(`Found ${applications.length} applications to process`);

    let processed = 0;
    let added = 0;
    let skipped = 0;

    for (const app of applications) {
      processed++;
      
      // Skip if no requisition_id
      if (!app.opportunity?.requisition_id) {
        console.log(`⚠️  App ${app.id}: No requisition_id, creating one...`);
        
        // Create requisition for this opportunity
        const reqId = `req_opp_${app.opportunity_id}`;
        
        try {
          // Insert requisition
          await supabase.from('requisitions').upsert({
            id: reqId,
            title: app.opportunity.job_title || app.opportunity.title || 'Job Position',
            department: 'General',
            location: 'Not Specified',
            job_type: 'full_time',
            status: 'active',
            priority: 'medium',
            description: '',
            salary_range: 'Not Specified',
            created_date: new Date().toISOString(),
            owner: 'system',
            hiring_manager: 'system'
          });

          // Update opportunity
          await supabase
            .from('opportunities')
            .update({ requisition_id: reqId })
            .eq('id', app.opportunity_id);

          // Update our local data
          app.opportunity.requisition_id = reqId;
          console.log(`✅ Created requisition ${reqId}`);
          
        } catch (error) {
          console.error(`❌ Error creating requisition for app ${app.id}:`, error);
          skipped++;
          continue;
        }
      }

      // Get student details
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, email, contact_number')
        .eq('id', app.student_id)
        .single();

      if (studentError || !student) {
        console.log(`⚠️  Student ${app.student_id} not found, skipping...`);
        skipped++;
        continue;
      }

      // Check if already in pipeline
      const { data: existing } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('requisition_id', app.opportunity.requisition_id)
        .eq('student_id', app.student_id)
        .maybeSingle();

      if (existing) {
        skipped++;
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
        console.error(`❌ Error adding ${student.name}:`, insertError);
        skipped++;
      } else {
        console.log(`✅ Added ${student.name} to pipeline (${app.opportunity.job_title})`);
        added++;
      }

      // Show progress
      if (processed % 5 === 0) {
        console.log(`Progress: ${processed}/${applications.length} (${added} added, ${skipped} skipped)`);
      }
    }

    console.log(`\n🎉 INLINE FIX COMPLETED!`);
    console.log(`   📊 Total processed: ${processed}`);
    console.log(`   ✅ Successfully added: ${added}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);

    if (added > 0) {
      console.log('\n🔄 Refreshing page to show updated pipeline data...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      console.log('\n❓ No candidates were added. Check if:');
      console.log('   - Students have applied to jobs');
      console.log('   - Opportunities exist in the system');
      console.log('   - Database permissions are correct');
    }

  } catch (error) {
    console.error('❌ Inline fix error:', error);
  }
}

// Run the fix
inlinePipelineFix();