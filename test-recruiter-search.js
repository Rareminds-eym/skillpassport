import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testRecruiterSearch() {
  console.log('🔍 Testing recruiter search flow...\n');

  // Step 1: Get some students
  console.log('Step 1: Fetching students...');
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('user_id, name, email')
    .limit(5);

  if (studentError) {
    console.error('❌ Error fetching students:', studentError);
    return;
  }

  console.log(`✅ Found ${students.length} students`);
  const studentIds = students.map(s => s.user_id);
  console.log('Student IDs:', studentIds);

  // Step 2: Fetch skills for these students (like recruiter copilot does)
  console.log('\nStep 2: Fetching skills for these students...');
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('student_id, name, level, type')
    .in('student_id', studentIds)
    .eq('enabled', true);

  console.log('Skills query result:', {
    count: skills?.length || 0,
    error: skillsError?.message,
    data: skills
  });

  // Step 3: Check if RLS is the issue
  console.log('\nStep 3: Checking RLS policies...');
  const { data: allSkills, error: allSkillsError } = await supabase
    .from('skills')
    .select('student_id, name')
    .limit(10);

  console.log('All skills query (no filters):', {
    count: allSkills?.length || 0,
    error: allSkillsError?.message,
    data: allSkills
  });

  console.log('\n✅ Test complete');
}

testRecruiterSearch();
