// Check Pipeline Integration Status
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfgkghnopcpbtaydpnoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZ2tnaG5vcGNwYnRheWRwbm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NDQzNjAsImV4cCI6MjA0NjAyMDM2MH0.nF8s4sGdIWQF-YNQ3yE4EB_AUC_OPWjC-72E2UdOE4c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkIntegrationStatus() {
  console.log('🔍 Checking Pipeline Integration Status...\n');

  try {
    // 1. Check requisitions
    console.log('1️⃣ Checking requisitions...');
    const { data: requisitions, error: reqError } = await supabase
      .from('requisitions')
      .select('id, title, status')
      .limit(5);
    
    if (reqError) throw reqError;
    console.log(`✅ Found ${requisitions.length} requisitions`);
    requisitions.forEach(req => {
      console.log(`   - ${req.id}: ${req.title} (${req.status})`);
    });

    // 2. Check opportunities with requisition_id
    console.log('\n2️⃣ Checking opportunities with requisition_id...');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, job_title, requisition_id')
      .not('requisition_id', 'is', null)
      .limit(5);
    
    if (oppError) throw oppError;
    console.log(`✅ Found ${opportunities.length} opportunities linked to requisitions`);
    opportunities.forEach(opp => {
      console.log(`   - ${opp.id}: ${opp.job_title} → ${opp.requisition_id}`);
    });

    // 3. Check applied_jobs
    console.log('\n3️⃣ Checking applied_jobs...');
    const { data: applications, error: appError } = await supabase
      .from('applied_jobs')
      .select('id, student_id, opportunity_id, application_status')
      .limit(5);
    
    if (appError) throw appError;
    console.log(`✅ Found ${applications.length} job applications`);
    applications.forEach(app => {
      console.log(`   - Student ${app.student_id} → Opportunity ${app.opportunity_id} (${app.application_status})`);
    });

    // 4. Check pipeline_candidates
    console.log('\n4️⃣ Checking pipeline_candidates...');
    const { data: pipelineCandidates, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select('id, requisition_id, student_id, stage, candidate_name')
      .limit(10);
    
    if (pipelineError) throw pipelineError;
    console.log(`✅ Found ${pipelineCandidates.length} pipeline candidates`);
    pipelineCandidates.forEach(pc => {
      console.log(`   - ${pc.candidate_name || 'Unknown'} in ${pc.stage} for req ${pc.requisition_id}`);
    });

    // 5. Check integration flow
    console.log('\n5️⃣ Checking integration flow...');
    if (requisitions.length > 0) {
      const firstReq = requisitions[0];
      const { data: reqCandidates, error: flowError } = await supabase
        .from('pipeline_candidates')
        .select('*')
        .eq('requisition_id', firstReq.id);
      
      if (flowError) throw flowError;
      console.log(`✅ Requisition ${firstReq.id} has ${reqCandidates.length} pipeline candidates`);
    }

    console.log('\n🎉 Integration status check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkIntegrationStatus();