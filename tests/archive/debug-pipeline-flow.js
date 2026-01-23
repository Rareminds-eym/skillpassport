// Debug Pipeline Data Flow
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfgkghnopcpbtaydpnoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZ2tnaG5vcGNwYnRheWRwbm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NDQzNjAsImV4cCI6MjA0NjAyMDM2MH0.nF8s4sGdIWQF-YNQ3yE4EB_AUC_OPWjC-72E2UdOE4c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPipelineFlow() {
  console.log('🔍 Debugging Pipeline Data Flow...\n');

  try {
    // 1. Check all requisitions
    console.log('1️⃣ All Requisitions:');
    const { data: requisitions, error: reqError } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_date', { ascending: false });
    
    if (reqError) throw reqError;
    console.log(`Found ${requisitions.length} requisitions:`);
    requisitions.forEach((req, i) => {
      console.log(`   ${i + 1}. ${req.id}: "${req.title}" (${req.status})`);
    });

    // 2. Check opportunities with requisition_id
    console.log('\n2️⃣ Opportunities linked to requisitions:');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, job_title, requisition_id')
      .not('requisition_id', 'is', null);
    
    if (oppError) throw oppError;
    console.log(`Found ${opportunities.length} opportunities with requisition_id:`);
    opportunities.forEach(opp => {
      console.log(`   - Opportunity ${opp.id}: "${opp.job_title}" → Requisition ${opp.requisition_id}`);
    });

    // 3. Check pipeline_candidates for each requisition
    console.log('\n3️⃣ Pipeline candidates by requisition:');
    for (const req of requisitions) {
      const { data: candidates, error: candidateError } = await supabase
        .from('pipeline_candidates')
        .select('id, student_id, candidate_name, stage, added_at')
        .eq('requisition_id', req.id);
      
      if (candidateError) {
        console.error(`   Error for ${req.id}:`, candidateError);
        continue;
      }
      
      console.log(`   Requisition ${req.id} ("${req.title}"):`);
      if (candidates.length === 0) {
        console.log(`     ❌ No pipeline candidates`);
      } else {
        candidates.forEach(candidate => {
          console.log(`     ✅ ${candidate.candidate_name} in ${candidate.stage} (ID: ${candidate.id})`);
        });
      }
    }

    // 4. Check applied_jobs that should become pipeline candidates
    console.log('\n4️⃣ Applied jobs that could be in pipeline:');
    const { data: applications, error: appError } = await supabase
      .from('applied_jobs')
      .select(`
        id, student_id, application_status, applied_at,
        student:students(name),
        opportunity:opportunities(id, job_title, requisition_id)
      `)
      .not('opportunity.requisition_id', 'is', null)
      .limit(10);
    
    if (appError) throw appError;
    console.log(`Found ${applications.length} applications linked to requisitions:`);
    applications.forEach(app => {
      console.log(`   - Student ${app.student?.name} applied to "${app.opportunity?.job_title}" (Status: ${app.application_status})`);
      console.log(`     → Should be in requisition: ${app.opportunity?.requisition_id}`);
    });

    // 5. Find discrepancies
    console.log('\n5️⃣ Looking for discrepancies...');
    
    // Check if pipeline page would show the right requisition
    const firstRequisition = requisitions[0];
    if (firstRequisition) {
      console.log(`Pipeline page would show: "${firstRequisition.title}" (${firstRequisition.id})`);
      
      const { data: pipelineCandidates } = await supabase
        .from('pipeline_candidates')
        .select('*')
        .eq('requisition_id', firstRequisition.id);
      
      console.log(`This requisition has ${pipelineCandidates?.length || 0} pipeline candidates`);
      
      // Check if there are applications for this requisition
      const { data: relatedApps } = await supabase
        .from('applied_jobs')
        .select('id, application_status, student:students(name)')
        .eq('opportunity.requisition_id', firstRequisition.id);
      
      console.log(`This requisition has ${relatedApps?.length || 0} related applications`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPipelineFlow();