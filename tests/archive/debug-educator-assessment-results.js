import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpooleduinyyzxgrcwko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTQ2OTgsImV4cCI6MjA3NTU3MDY5OH0.LvId6Cq13yeASDt0RXbb0y83P2xAZw0L1Q4KJAXT4jk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEducatorAssessmentResults() {
  console.log('=== Debugging Educator Assessment Results ===\n');

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('❌ User not authenticated:', userError);
    return;
  }

  console.log('✅ Current user:', user.email);

  // Step 1: Find educator by email
  const { data: educator, error: educatorError } = await supabase
    .from('school_educators')
    .select('id, school_id, schools(name)')
    .eq('email', user.email)
    .single();

  if (educatorError) {
    console.error('❌ Error fetching educator:', educatorError);
    return;
  }

  if (!educator) {
    console.error('❌ No educator found for email:', user.email);
    return;
  }

  console.log('✅ Educator found:', {
    id: educator.id,
    school_id: educator.school_id,
    school_name: educator.schools?.name
  });

  if (!educator.school_id) {
    console.error('❌ No school_id associated with educator');
    return;
  }

  // Step 2: Get students from this school
  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select('user_id, name, email')
    .eq('school_id', educator.school_id);

  if (studentsError) {
    console.error('❌ Error fetching students:', studentsError);
    return;
  }

  console.log(`✅ Found ${studentsData?.length || 0} students in school`);

  if (!studentsData || studentsData.length === 0) {
    console.log('⚠️ No students found in this school');
    return;
  }

  // Filter out students with null user_id
  const validStudents = studentsData.filter((s) => s.user_id != null);
  console.log(`✅ ${validStudents.length} students have valid user_id`);

  if (validStudents.length === 0) {
    console.log('⚠️ No students with valid user_id');
    return;
  }

  const studentIds = validStudents.map((s) => s.user_id);
  console.log('Student IDs:', studentIds.slice(0, 5), '...');

  // Step 3: Fetch assessment results
  const { data: results, error: fetchError } = await supabase
    .from('personal_assessment_results')
    .select(`
      id,
      student_id,
      stream_id,
      riasec_code,
      aptitude_overall,
      employability_readiness,
      knowledge_score,
      status,
      created_at,
      career_fit,
      skill_gap,
      gemini_results
    `)
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ Error fetching assessment results:', fetchError);
    return;
  }

  console.log(`✅ Found ${results?.length || 0} assessment results`);

  if (results && results.length > 0) {
    console.log('\nSample result:');
    console.log(JSON.stringify(results[0], null, 2));
  }
}

debugEducatorAssessmentResults().catch(console.error);
