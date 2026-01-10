// Quick test to check placement data
import { supabase } from './src/lib/supabaseClient.js';

async function testPlacementData() {
  console.log('🔍 Testing placement data...');

  // Test 1: Check applied_jobs table
  const { data: jobs, error: jobsError } = await supabase
    .from('applied_jobs')
    .select('*')
    .limit(3);

  console.log('Applied jobs:', jobs?.length || 0, 'records');
  if (jobsError) console.error('Jobs error:', jobsError.message);

  // Test 2: Check students table
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('user_id, name, student_id, branch_field')
    .limit(3);

  console.log('Students:', students?.length || 0, 'records');
  if (studentsError) console.error('Students error:', studentsError.message);

  // Test 3: Check opportunities table
  const { data: opportunities, error: oppsError } = await supabase
    .from('opportunities')
    .select('id, title, company_name, employment_type')
    .limit(3);

  console.log('Opportunities:', opportunities?.length || 0, 'records');
  if (oppsError) console.error('Opportunities error:', oppsError.message);

  // Test 4: Test join query
  const { data: joined, error: joinError } = await supabase
    .from('applied_jobs')
    .select(`
      id,
      application_status,
      students!fk_applied_jobs_student (
        name,
        branch_field
      ),
      opportunities!fk_applied_jobs_opportunity (
        title,
        company_name
      )
    `)
    .limit(2);

  console.log('Joined data:', joined?.length || 0, 'records');
  if (joinError) console.error('Join error:', joinError.message);
  if (joined && joined.length > 0) {
    console.log('Sample joined record:', JSON.stringify(joined[0], null, 2));
  }
}

testPlacementData();