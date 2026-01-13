/**
 * Debug script to check why assessment is not being detected
 * Run this in browser console on the dashboard page
 */

// Step 1: Check current user
const checkCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('🔍 Current User:', user?.id);
  return user?.id;
};

// Step 2: Check student record
const checkStudentRecord = async (userId) => {
  const { data: student, error } = await supabase
    .from('students')
    .select('id, user_id, name')
    .eq('user_id', userId)
    .maybeSingle();
  
  console.log('👤 Student Record:', student);
  console.log('❌ Student Error:', error);
  return student?.id;
};

// Step 3: Check assessment results
const checkAssessmentResults = async (studentId) => {
  const { data: results, error } = await supabase
    .from('personal_assessment_results')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  console.log('📊 Assessment Results:', results);
  console.log('❌ Results Error:', error);
  return results;
};

// Step 4: Check what getLatestResult returns
const testGetLatestResult = async (userId) => {
  // Simulate getLatestResult function
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (studentError) {
    console.error('❌ Student lookup error:', studentError);
    return null;
  }
  
  if (!student) {
    console.warn('⚠️ No student record found for user_id:', userId);
    return null;
  }

  console.log('✅ Found student ID:', student.id);

  const { data, error } = await supabase
    .from('personal_assessment_results')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('❌ Results lookup error:', error);
    return null;
  }

  console.log('📋 Latest Result:', data);
  console.log('✅ Status:', data?.status);
  console.log('✅ Has Result:', !!data);
  console.log('✅ Is Completed:', data?.status === 'completed');
  
  return data;
};

// Run all checks
const runDiagnostics = async () => {
  console.log('🔍 Starting Assessment Detection Diagnostics...\n');
  
  const userId = await checkCurrentUser();
  console.log('\n---\n');
  
  if (!userId) {
    console.error('❌ No user logged in!');
    return;
  }
  
  const studentId = await checkStudentRecord(userId);
  console.log('\n---\n');
  
  if (!studentId) {
    console.error('❌ No student record found!');
    return;
  }
  
  await checkAssessmentResults(studentId);
  console.log('\n---\n');
  
  const result = await testGetLatestResult(userId);
  console.log('\n---\n');
  
  if (result && result.status === 'completed') {
    console.log('✅ Assessment should be detected!');
    console.log('🔄 Try refreshing the page or clearing cache');
  } else {
    console.log('❌ Assessment not properly detected');
    console.log('Issue:', !result ? 'No result found' : 'Status not completed');
  }
};

// Run diagnostics
runDiagnostics();
