// Browser Console Test Script - Paste this in the browser console
// This will help verify if candidates moved in ApplicantsList appear in Pipeline

console.log('🔍 Testing Pipeline Integration...\n');

// Test function to check pipeline data
async function testPipelineIntegration() {
  try {
    // Get the supabase client from window (if available)
    const supabase = window.supabase || window._supabase;
    if (!supabase) {
      console.error('❌ Supabase client not found in window. Make sure you are on the app page.');
      return;
    }

    console.log('1️⃣ Checking current pipeline candidates...');
    
    // Get all pipeline candidates
    const { data: pipelineCandidates, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .order('added_at', { ascending: false });
    
    if (pipelineError) {
      console.error('Error fetching pipeline candidates:', pipelineError);
      return;
    }
    
    console.log(`✅ Found ${pipelineCandidates.length} pipeline candidates:`);
    pipelineCandidates.forEach((candidate, i) => {
      console.log(`   ${i + 1}. ${candidate.candidate_name} - ${candidate.stage} (Req: ${candidate.requisition_id})`);
    });
    
    console.log('\n2️⃣ Checking requisitions...');
    
    // Get all requisitions
    const { data: requisitions, error: reqError } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_date', { ascending: false });
    
    if (reqError) {
      console.error('Error fetching requisitions:', reqError);
      return;
    }
    
    console.log(`✅ Found ${requisitions.length} requisitions:`);
    requisitions.forEach((req, i) => {
      const candidateCount = pipelineCandidates.filter(c => c.requisition_id === req.id).length;
      console.log(`   ${i + 1}. ${req.id}: "${req.title}" (${candidateCount} candidates)`);
    });
    
    console.log('\n3️⃣ Integration Status:');
    
    if (pipelineCandidates.length === 0) {
      console.log('⚠️  No pipeline candidates found. Try moving a candidate to "Sourced" in ApplicantsList first.');
    } else {
      console.log('✅ Pipeline candidates exist! They should appear in the Pipeline page.');
      console.log('💡 If they are not showing, try clicking the "🔄 Refresh" button on the Pipeline page.');
    }
    
    // Check the most recent requisition
    if (requisitions.length > 0) {
      const latestReq = requisitions[0];
      const latestCandidates = pipelineCandidates.filter(c => c.requisition_id === latestReq.id);
      console.log(`\n📊 Latest requisition "${latestReq.title}" has ${latestCandidates.length} pipeline candidates.`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPipelineIntegration();