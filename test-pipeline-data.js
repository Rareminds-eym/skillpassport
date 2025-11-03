// Quick test script to verify pipeline data loading
// Run this in browser console after opening pipelines page

console.log('=== PIPELINE DATA DEBUG TEST ===');

// Test 1: Check if getPipelineCandidatesByStage is available
import { getPipelineCandidatesByStage } from './services/pipelineService';

// Test 2: Get requisition ID from the page
const requisitionId = document.querySelector('[data-requisition-id]')?.getAttribute('data-requisition-id');
console.log('Current requisition ID:', requisitionId);

// Test 3: Manually call the service
if (requisitionId) {
  console.log('Testing getPipelineCandidatesByStage for "sourced" stage...');
  getPipelineCandidatesByStage(requisitionId, 'sourced').then(result => {
    console.log('Result:', result);
    if (result.data) {
      console.log(`✅ Found ${result.data.length} candidates in sourced stage`);
      console.log('First candidate:', result.data[0]);
    } else {
      console.log('❌ No data returned');
      console.log('Error:', result.error);
    }
  });
} else {
  console.log('❌ No requisition ID found. Make sure a job is selected.');
}

// Test 4: Check pipeline_candidates table directly
console.log('\nTo check database directly, run in Supabase SQL Editor:');
console.log('SELECT * FROM pipeline_candidates WHERE status = \'active\' LIMIT 10;');
