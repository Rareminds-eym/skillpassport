// Check current database state
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function checkDatabaseState() {
  console.log('🔍 Checking Database State...\n');

  try {
    // Test 1: Check opportunities table structure
    console.log('1️⃣ Checking opportunities table...');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .limit(1);

    if (oppError) {
      console.error('❌ Error querying opportunities:', oppError.message);
      return;
    }

    if (opportunities && opportunities.length > 0) {
      const columns = Object.keys(opportunities[0]).sort();
      console.log('✅ Available columns:', columns);
      
      if (columns.includes('requisition_id')) {
        console.log('✅ requisition_id column EXISTS');
      } else {
        console.log('❌ requisition_id column MISSING - This is the problem!');
      }
    } else {
      console.log('⚠️ No data in opportunities table');
    }

    // Test 2: Check if requisitions table exists
    console.log('\n2️⃣ Checking requisitions table...');
    const { data: requisitions, error: reqError } = await supabase
      .from('requisitions')
      .select('id, title')
      .limit(3);

    if (reqError) {
      console.error('❌ Error querying requisitions:', reqError.message);
      console.log('   This suggests requisitions table might not exist');
    } else {
      console.log(`✅ Found ${requisitions.length} requisitions`);
    }

    // Test 3: Check if pipeline_candidates table exists
    console.log('\n3️⃣ Checking pipeline_candidates table...');
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select('id, candidate_name, stage')
      .limit(3);

    if (pipelineError) {
      console.error('❌ Error querying pipeline_candidates:', pipelineError.message);
    } else {
      console.log(`✅ Found ${pipeline.length} pipeline candidates`);
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

checkDatabaseState();