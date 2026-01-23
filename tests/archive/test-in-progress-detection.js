/**
 * Test script to verify in-progress attempt detection
 * 
 * Run this in your browser console on the dashboard page:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 
 * It will test the getInProgressAttempt function directly
 */

(async function testInProgressDetection() {
  console.log('🧪 Testing in-progress attempt detection...');
  
  // Get the student email from localStorage
  const userEmail = localStorage.getItem('userEmail');
  console.log('📧 User email:', userEmail);
  
  if (!userEmail) {
    console.error('❌ No user email found in localStorage');
    return;
  }
  
  // Import supabase client
  const { supabase } = await import('./src/lib/supabaseClient.js');
  
  // Step 1: Get student record
  console.log('\n📋 Step 1: Getting student record...');
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, user_id, email, name')
    .eq('email', userEmail)
    .maybeSingle();
  
  if (studentError) {
    console.error('❌ Error fetching student:', studentError);
    return;
  }
  
  if (!student) {
    console.error('❌ No student record found for email:', userEmail);
    return;
  }
  
  console.log('✅ Student record found:');
  console.table(student);
  
  // Step 2: Check for in-progress attempts
  console.log('\n📋 Step 2: Checking for in-progress attempts...');
  const { data: attempts, error: attemptsError } = await supabase
    .from('personal_assessment_attempts')
    .select('*')
    .eq('student_id', student.id)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false });
  
  if (attemptsError) {
    console.error('❌ Error fetching attempts:', attemptsError);
    return;
  }
  
  console.log(`✅ Found ${attempts?.length || 0} in-progress attempts`);
  if (attempts && attempts.length > 0) {
    console.table(attempts);
  }
  
  // Step 3: Check for completed results
  console.log('\n📋 Step 3: Checking for completed results...');
  const { data: results, error: resultsError } = await supabase
    .from('personal_assessment_results')
    .select('*')
    .eq('student_id', student.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  
  if (resultsError) {
    console.error('❌ Error fetching results:', resultsError);
    return;
  }
  
  console.log(`✅ Found ${results?.length || 0} completed results`);
  if (results && results.length > 0) {
    console.table(results);
  }
  
  // Step 4: Test the getInProgressAttempt function
  console.log('\n📋 Step 4: Testing getInProgressAttempt function...');
  try {
    const { getInProgressAttempt } = await import('./src/services/assessmentService.js');
    
    console.log('🔍 Calling getInProgressAttempt with student.id:', student.id);
    const inProgressAttempt = await getInProgressAttempt(student.id);
    
    if (inProgressAttempt) {
      console.log('✅ getInProgressAttempt returned data:');
      console.table(inProgressAttempt);
    } else {
      console.log('❌ getInProgressAttempt returned null');
    }
  } catch (err) {
    console.error('❌ Error calling getInProgressAttempt:', err);
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('Student ID:', student.id);
  console.log('In-progress attempts:', attempts?.length || 0);
  console.log('Completed results:', results?.length || 0);
  console.log('\nExpected button:');
  if (results && results.length > 0) {
    console.log('🟢 "View Results" (has completed result)');
  } else if (attempts && attempts.length > 0) {
    console.log('🟠 "Continue Assessment" (has in-progress attempt, no result)');
  } else {
    console.log('🔵 "Start Assessment" (no attempts or results)');
  }
})();
