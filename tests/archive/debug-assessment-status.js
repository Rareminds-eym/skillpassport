// Debug script to check assessment status for a student
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Replace with your student ID (check localStorage or the students table)
const STUDENT_ID = '374d93e2-0c5f-41e0-9028-f27882173b9f';

async function checkAssessmentStatus() {
  console.log('=== Checking Assessment Status ===\n');
  console.log('Student ID:', STUDENT_ID);

  // 1. Check personal_assessment_attempts
  const { data: attempts, error: attemptsError } = await supabase
    .from('personal_assessment_attempts')
    .select('id, status, stream_id, grade_level, created_at, completed_at')
    .eq('student_id', STUDENT_ID)
    .order('created_at', { ascending: false });

  console.log('\n--- Assessment Attempts ---');
  if (attemptsError) {
    console.error('Error fetching attempts:', attemptsError);
  } else if (!attempts || attempts.length === 0) {
    console.log('No attempts found');
  } else {
    console.log(`Found ${attempts.length} attempt(s):`);
    attempts.forEach((a, i) => {
      console.log(`  ${i + 1}. Status: ${a.status}, Stream: ${a.stream_id}, Grade: ${a.grade_level}`);
      console.log(`     Created: ${a.created_at}, Completed: ${a.completed_at || 'N/A'}`);
    });
  }

  // 2. Check personal_assessment_results
  const { data: results, error: resultsError } = await supabase
    .from('personal_assessment_results')
    .select('id, status, stream_id, grade_level, created_at, riasec_code, employability_readiness')
    .eq('student_id', STUDENT_ID)
    .order('created_at', { ascending: false });

  console.log('\n--- Assessment Results ---');
  if (resultsError) {
    console.error('Error fetching results:', resultsError);
  } else if (!results || results.length === 0) {
    console.log('No results found - THIS IS WHY "Start Assessment" SHOWS!');
  } else {
    console.log(`Found ${results.length} result(s):`);
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. Status: ${r.status}, Stream: ${r.stream_id}, Grade: ${r.grade_level}`);
      console.log(`     RIASEC: ${r.riasec_code || 'N/A'}, Employability: ${r.employability_readiness || 'N/A'}`);
      console.log(`     Created: ${r.created_at}`);
    });
  }

  // 3. Check in-progress attempts
  const { data: inProgress, error: inProgressError } = await supabase
    .from('personal_assessment_attempts')
    .select('id, status, stream_id, current_section_index, current_question_index')
    .eq('student_id', STUDENT_ID)
    .eq('status', 'in_progress');

  console.log('\n--- In-Progress Attempts ---');
  if (inProgressError) {
    console.error('Error:', inProgressError);
  } else if (!inProgress || inProgress.length === 0) {
    console.log('No in-progress attempts');
  } else {
    console.log(`Found ${inProgress.length} in-progress attempt(s):`);
    inProgress.forEach((a, i) => {
      console.log(`  ${i + 1}. ID: ${a.id}, Section: ${a.current_section_index}, Question: ${a.current_question_index}`);
    });
  }

  console.log('\n=== Summary ===');
  const hasCompletedResult = results && results.some(r => r.status === 'completed');
  const hasInProgress = inProgress && inProgress.length > 0;
  
  console.log(`Has completed result: ${hasCompletedResult}`);
  console.log(`Has in-progress attempt: ${hasInProgress}`);
  
  if (!hasCompletedResult && !hasInProgress) {
    console.log('\n⚠️  ISSUE: No completed results found. The assessment may not have saved properly.');
    console.log('   Possible causes:');
    console.log('   1. Assessment was completed but results failed to save to database');
    console.log('   2. The student_id used during assessment differs from current login');
    console.log('   3. Database RLS policies blocking the insert');
  }
}

checkAssessmentStatus().catch(console.error);
