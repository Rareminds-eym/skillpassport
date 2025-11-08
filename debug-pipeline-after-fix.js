/**
 * Debug Pipeline Issue - After SQL Fix
 * 
 * Run this in browser console to check what happened after running the SQL fix
 * Copy and paste this entire script into browser console (F12)
 */

console.log('🔍 Debugging Pipeline After SQL Fix...\n');

// Import Supabase client
const { supabase } = window;

async function debugPipelineIssue() {
  try {
    // 1. Check if pipeline_candidates table has any data
    console.log('1️⃣ Checking pipeline_candidates table...');
    const { data: pipelineCandidates, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .limit(10);

    if (pipelineError) {
      console.error('❌ Error accessing pipeline_candidates:', pipelineError);
      console.log('This might be a permissions issue. Let me check other tables...');
    } else {
      console.log(`✅ Pipeline candidates found: ${pipelineCandidates.length}`);
      if (pipelineCandidates.length > 0) {
        console.log('Sample candidate:', pipelineCandidates[0]);
      } else {
        console.log('⚠️ Table exists but is empty - sync may have failed');
      }
    }

    // 2. Check opportunities table for requisition_id
    console.log('\n2️⃣ Checking opportunities have requisition_id...');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, job_title, title, requisition_id, is_active')
      .limit(10);

    if (oppError) {
      console.error('❌ Error accessing opportunities:', oppError);
    } else {
      const withReqId = opportunities.filter(o => o.requisition_id).length;
      console.log(`✅ Opportunities: ${opportunities.length} total, ${withReqId} have requisition_id`);
      
      if (withReqId === 0) {
        console.log('❌ PROBLEM: No opportunities have requisition_id! The fix may not have run properly.');
      }
      
      console.log('Sample opportunity:', {
        id: opportunities[0]?.id,
        title: opportunities[0]?.job_title || opportunities[0]?.title,
        requisition_id: opportunities[0]?.requisition_id,
        is_active: opportunities[0]?.is_active
      });
    }

    // 3. Check applied_jobs
    console.log('\n3️⃣ Checking applied_jobs...');
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
      .limit(10);

    if (appError) {
      console.error('❌ Error accessing applied_jobs:', appError);
    } else {
      console.log(`✅ Applications found: ${applications.length}`);
      const applicationsWithReqId = applications.filter(app => app.opportunity?.requisition_id).length;
      console.log(`   - ${applicationsWithReqId}/${applications.length} applications have opportunity with requisition_id`);
      
      if (applications.length > 0 && applicationsWithReqId === 0) {
        console.log('❌ PROBLEM: Applications exist but their opportunities have no requisition_id!');
      }
      
      console.log('Sample application:', {
        id: applications[0]?.id,
        student_id: applications[0]?.student_id,
        job_title: applications[0]?.opportunity?.job_title,
        requisition_id: applications[0]?.opportunity?.requisition_id
      });
    }

    // 4. Check requisitions table
    console.log('\n4️⃣ Checking requisitions table...');
    const { data: requisitions, error: reqError } = await supabase
      .from('requisitions')
      .select('id, title, status')
      .limit(5);

    if (reqError) {
      console.error('❌ Error accessing requisitions:', reqError);
    } else {
      console.log(`✅ Requisitions found: ${requisitions.length}`);
      if (requisitions.length > 0) {
        console.log('Sample requisition:', requisitions[0]);
      } else {
        console.log('❌ PROBLEM: No requisitions exist! The fix may not have created them.');
      }
    }

    // 5. Check students table
    console.log('\n5️⃣ Checking students table...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, email')
      .limit(3);

    if (studentsError) {
      console.error('❌ Error accessing students:', studentsError);
    } else {
      console.log(`✅ Students found: ${students.length}`);
    }

    // 6. Try to manually check the sync
    console.log('\n6️⃣ Checking sync potential...');
    if (applications && applications.length > 0 && opportunities && opportunities.length > 0) {
      let canSync = 0;
      let hasReqId = 0;
      
      for (const app of applications) {
        const opp = opportunities.find(o => o.id === app.opportunity_id);
        if (opp) {
          if (opp.requisition_id) {
            hasReqId++;
            // Check if this combination could be synced
            if (app.student_id && opp.requisition_id) {
              canSync++;
            }
          }
        }
      }
      
      console.log(`   - Applications that could be synced: ${canSync}`);
      console.log(`   - Applications with requisition_id: ${hasReqId}`);
    }

    // 7. Summary and recommendations
    console.log('\n📋 SUMMARY & NEXT STEPS:');
    
    const hasApplications = applications && applications.length > 0;
    const hasOpportunities = opportunities && opportunities.length > 0;
    const hasRequisitions = requisitions && requisitions.length > 0;
    const hasStudents = students && students.length > 0;
    const hasPipelineData = pipelineCandidates && pipelineCandidates.length > 0;
    const opportunitiesHaveReqId = opportunities && opportunities.filter(o => o.requisition_id).length > 0;

    if (!hasApplications) {
      console.log('❌ No applications found - students haven\'t applied to any jobs yet');
    } else if (!hasOpportunities) {
      console.log('❌ No opportunities found - no jobs exist in the system');
    } else if (!hasRequisitions) {
      console.log('❌ No requisitions found - the SQL fix may not have run correctly');
      console.log('   → Try running the SQL fix again in Supabase SQL Editor');
    } else if (!opportunitiesHaveReqId) {
      console.log('❌ Opportunities don\'t have requisition_id - the SQL fix may have failed');
      console.log('   → Try running this in SQL Editor: UPDATE opportunities SET requisition_id = \'req_opp_\' || id::TEXT WHERE requisition_id IS NULL;');
    } else if (!hasPipelineData) {
      console.log('❌ Pipeline candidates table is empty - the sync part of the fix may have failed');
      console.log('   → Try running the manual sync script below');
    } else {
      console.log('✅ Everything looks good! The data should be showing up.');
      console.log('   → Try refreshing the recruiter pipeline page');
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugPipelineIssue();

// If the issue is just missing sync, here's a manual sync function
window.manualSyncToPipeline = async function() {
  console.log('\n🔄 Running manual sync to pipeline...');
  
  try {
    // Get applications with opportunities that have requisition_id
    const { data: applications, error: appError } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        student_id,
        opportunity_id,
        applied_at,
        opportunity:opportunities(id, job_title, requisition_id)
      `)
      .neq('application_status', 'withdrawn');

    if (appError) {
      console.error('Error fetching applications:', appError);
      return;
    }

    console.log(`Found ${applications.length} applications to process...`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const app of applications) {
      if (!app.opportunity?.requisition_id) {
        skipped++;
        continue;
      }

      // Get student details
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, email, contact_number')
        .eq('id', app.student_id)
        .single();

      if (studentError || !student) {
        skipped++;
        continue;
      }

      // Check if already in pipeline
      const { data: existing, error: existingError } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('requisition_id', app.opportunity.requisition_id)
        .eq('student_id', app.student_id)
        .maybeSingle();

      if (existingError) {
        errors++;
        continue;
      }

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
        console.error(`Error adding ${student.name}:`, insertError);
        errors++;
      } else {
        console.log(`✅ Added ${student.name} to pipeline`);
        synced++;
      }
    }

    console.log(`\n📊 Manual sync completed:`);
    console.log(`   - Successfully synced: ${synced}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Errors: ${errors}`);

    if (synced > 0) {
      console.log('\n🎉 Students should now appear in the recruiter pipeline!');
      console.log('   → Refresh the recruiter page to see the results');
    }

  } catch (error) {
    console.error('Manual sync error:', error);
  }
};

console.log('\n💡 If the debug shows sync issues, you can run: manualSyncToPipeline()');