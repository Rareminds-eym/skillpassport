// Analysis: Opportunities vs Requisitions Usage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfgkghnopcpbtaydpnoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZ2tnaG5vcGNwYnRheWRwbm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NDQzNjAsImV4cCI6MjA0NjAyMDM2MH0.nF8s4sGdIWQF-YNQ3yE4EB_AUC_OPWjC-72E2UdOE4c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeTablesUsage() {
  console.log('📊 ANALYZING OPPORTUNITIES vs REQUISITIONS USAGE\n');
  console.log('='.repeat(70));

  try {
    // 1. Get Opportunities data
    console.log('\n1️⃣ OPPORTUNITIES TABLE:');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('*');
    
    if (oppError) {
      console.error('❌ Error:', oppError);
    } else {
      console.log(`   Total Records: ${opportunities.length}`);
      const withReqId = opportunities.filter(o => o.requisition_id).length;
      console.log(`   With requisition_id: ${withReqId}/${opportunities.length}`);
      console.log(`   Without requisition_id: ${opportunities.length - withReqId}/${opportunities.length}`);
    }

    // 2. Get Requisitions data
    console.log('\n2️⃣ REQUISITIONS TABLE:');
    const { data: requisitions, error: reqError } = await supabase
      .from('requisitions')
      .select('*');
    
    if (reqError) {
      console.error('❌ Error:', reqError);
    } else {
      console.log(`   Total Records: ${requisitions.length}`);
    }

    // 3. Check relationships
    console.log('\n3️⃣ RELATIONSHIP ANALYSIS:');
    
    // Check applied_jobs references
    const { data: appliedJobs, error: ajError } = await supabase
      .from('applied_jobs')
      .select('opportunity_id')
      .limit(1000);
    
    if (!ajError && appliedJobs) {
      console.log(`   applied_jobs table: ${appliedJobs.length} records`);
      console.log(`   → References: opportunities.id (via opportunity_id foreign key)`);
    }

    // Check pipeline_candidates references
    const { data: pipelineCandidates, error: pcError } = await supabase
      .from('pipeline_candidates')
      .select('requisition_id')
      .limit(1000);
    
    if (!pcError && pipelineCandidates) {
      console.log(`   pipeline_candidates table: ${pipelineCandidates.length} records`);
      console.log(`   → References: requisitions.id (via requisition_id foreign key)`);
    }

    // 4. Usage in Code
    console.log('\n4️⃣ CODE USAGE PATTERN:');
    console.log(`
   OPPORTUNITIES TABLE:
   → Used by: Student features (job listings, applications)
   → Primary purpose: Job postings that students can apply to
   → Related to: applied_jobs (students applying to opportunities)
   → Fields: job_title, description, location, skills_required, etc.

   REQUISITIONS TABLE:
   → Used by: Recruiter features (pipeline management)
   → Primary purpose: Hiring requisitions/positions for pipeline tracking
   → Related to: pipeline_candidates (tracking candidates through hiring stages)
   → Fields: title, department, status, priority, hiring_manager, etc.
   `);

    // 5. Current Bridge
    console.log('\n5️⃣ CURRENT BRIDGE BETWEEN TABLES:');
    console.log(`
   opportunities.requisition_id → requisitions.id
   
   Purpose: Links student applications (opportunities) to recruiter pipeline (requisitions)
   Flow: Student applies to opportunity → Gets added to pipeline via requisition
   `);

    if (opportunities && requisitions) {
      // Find orphaned opportunities (no requisition link)
      const orphanedOpps = opportunities.filter(o => !o.requisition_id);
      
      // Find requisitions created from opportunities
      const autoCreatedReqs = requisitions.filter(r => r.id.startsWith('req_opp_'));
      
      // Find standalone requisitions
      const standaloneReqs = requisitions.filter(r => !r.id.startsWith('req_opp_'));

      console.log('\n6️⃣ CURRENT STATE:');
      console.log(`   Orphaned Opportunities (no requisition link): ${orphanedOpps.length}`);
      console.log(`   Auto-created Requisitions (from opportunities): ${autoCreatedReqs.length}`);
      console.log(`   Standalone Requisitions: ${standaloneReqs.length}`);
    }

    // 7. Recommendations
    console.log('\n7️⃣ RECOMMENDATIONS:');
    console.log(`
   OPTION A: Keep Both Tables (Current Approach)
   ✅ Pros:
      - Separates student-facing (opportunities) from recruiter-facing (requisitions)
      - Each has its own specialized fields
      - Clear separation of concerns
   ❌ Cons:
      - Duplicate data (job info in both tables)
      - Need to maintain sync via requisition_id
      - More complex queries

   OPTION B: Merge into Single Table
   ✅ Pros:
      - Single source of truth
      - Simpler queries
      - No sync issues
   ❌ Cons:
      - Mixing student and recruiter concerns
      - More fields in one table
      - May complicate permissions/access control

   CURRENT RECOMMENDATION: Keep both tables because:
   1. Your trigger already auto-links them via requisition_id
   2. Different use cases (students browse opportunities, recruiters manage requisitions)
   3. Already working in your codebase
   `);

    // 8. What to do
    console.log('\n8️⃣ WHAT TO DO:');
    console.log(`
   DO NOT DELETE either table. Here's why:

   ❌ Don't delete OPPORTUNITIES:
      - Students browse and apply to opportunities
      - applied_jobs table has foreign key to opportunities
      - Deleting would break student applications

   ❌ Don't delete REQUISITIONS:
      - Pipeline management depends on it
      - pipeline_candidates table has foreign key to requisitions
      - Deleting would break recruiter pipeline

   ✅ INSTEAD: Ensure proper linking
      - All opportunities should have requisition_id
      - Your current code already creates requisitions automatically
      - Keep both tables working together
   `);

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeTablesUsage();