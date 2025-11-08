/**
 * QUICK FIX: Pipeline Still Showing 0
 * 
 * If you ran the SQL script but still see 0 candidates, 
 * copy and paste this ENTIRE script into browser console (F12)
 */

console.log('🚀 QUICK PIPELINE FIX - Checking and fixing now...');

async function quickPipelineFix() {
  try {
    // Quick check: Do we have the necessary data?
    const { data: apps } = await supabase.from('applied_jobs').select('id').limit(1);
    const { data: opps } = await supabase.from('opportunities').select('id, requisition_id').limit(1);
    const { data: pipeline } = await supabase.from('pipeline_candidates').select('id').limit(1);

    if (!apps || apps.length === 0) {
      console.log('❌ No applications found - students need to apply to jobs first');
      return;
    }

    if (!opps || opps.length === 0) {
      console.log('❌ No opportunities found - no jobs in system');
      return;
    }

    if (!opps[0].requisition_id) {
      console.log('🔧 Fixing opportunities without requisition_id...');
      
      // Fix opportunities missing requisition_id
      const { data: allOpps } = await supabase
        .from('opportunities')
        .select('id, job_title, requisition_id');

      let fixed = 0;
      for (const opp of allOpps) {
        if (!opp.requisition_id) {
          // Create requisition for this opportunity
          const reqId = `req_opp_${opp.id}`;
          
          // Insert requisition
          await supabase.from('requisitions').insert({
            id: reqId,
            title: opp.job_title || 'Untitled Position',
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
            .eq('id', opp.id);

          fixed++;
        }
      }
      console.log(`✅ Fixed ${fixed} opportunities with missing requisition_id`);
    }

    // Now sync applications to pipeline
    console.log('🔄 Syncing applications to pipeline...');
    
    const { data: applications } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        student_id,
        opportunity_id,
        applied_at,
        opportunity:opportunities(id, job_title, requisition_id)
      `)
      .neq('application_status', 'withdrawn');

    console.log(`Processing ${applications.length} applications...`);

    let synced = 0;
    for (const app of applications) {
      if (!app.opportunity?.requisition_id) continue;

      // Check if already in pipeline
      const { data: existing } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('requisition_id', app.opportunity.requisition_id)
        .eq('student_id', app.student_id)
        .maybeSingle();

      if (existing) continue;

      // Get student info
      const { data: student } = await supabase
        .from('students')
        .select('id, name, email, contact_number')
        .eq('id', app.student_id)
        .single();

      if (!student) continue;

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

      if (!insertError) {
        synced++;
        console.log(`✅ Added ${student.name} to pipeline for ${app.opportunity.job_title}`);
      } else {
        console.error(`❌ Error adding ${student.name}:`, insertError);
      }
    }

    console.log(`\n🎉 QUICK FIX COMPLETED!`);
    console.log(`   - Successfully synced: ${synced} students to pipeline`);
    console.log(`   - Students should now appear in "Sourced" column`);
    console.log(`   - Refresh the recruiter pipeline page to see results`);

    // Final verification
    const { data: finalPipeline } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .eq('status', 'active');

    console.log(`\n📊 Final count: ${finalPipeline.length} active candidates in pipeline`);

  } catch (error) {
    console.error('❌ Quick fix error:', error);
    console.log('Try running the debug script to identify the specific issue.');
  }
}

quickPipelineFix();