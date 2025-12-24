/**
 * Quick Database Check
 * Copy and paste this into browser console to check what's in the database
 */

import { supabase } from './src/lib/supabaseClient.js';

async function checkDatabase() {
  console.log('🔍 Checking database for in-progress assessments...\n');
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.email);
    
    // Get student record
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('email', user?.email)
      .single();
    
    console.log('Student ID:', student?.id);
    
    // Get in-progress assessments
    const { data: attempts, error } = await supabase
      .from('external_assessment_attempts')
      .select('*')
      .eq('student_id', student?.id)
      .eq('status', 'in_progress')
      .order('last_activity_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (!attempts || attempts.length === 0) {
      console.log('⚠️ No in-progress assessments found');
      return;
    }
    
    console.log(`\n✅ Found ${attempts.length} in-progress assessment(s):\n`);
    
    attempts.forEach((attempt, idx) => {
      console.log(`Assessment ${idx + 1}:`);
      console.log('  ID:', attempt.id);
      console.log('  Course:', attempt.course_name);
      console.log('  Status:', attempt.status);
      console.log('  Current Question Index:', attempt.current_question_index);
      console.log('  Total Questions:', attempt.total_questions);
      console.log('  Questions Stored:', attempt.questions?.length || 0);
      console.log('  Answers Array Length:', attempt.student_answers?.length || 0);
      
      // Count answered questions
      const answeredCount = attempt.student_answers?.filter(a => a.selected_answer !== null).length || 0;
      console.log('  Answered Questions:', answeredCount);
      console.log('  Unanswered Questions:', (attempt.student_answers?.length || 0) - answeredCount);
      
      // Show first 5 answers
      console.log('  First 5 Answers:');
      for (let i = 0; i < Math.min(5, attempt.student_answers?.length || 0); i++) {
        const ans = attempt.student_answers[i];
        console.log(`    Q${i + 1}: ${ans.selected_answer || '(not answered)'}`);
      }
      
      console.log('  Time Remaining:', attempt.time_remaining, 'seconds');
      console.log('  Last Activity:', new Date(attempt.last_activity_at).toLocaleString());
      console.log('');
    });
    
    // Return the most recent one
    return attempts[0];
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it
checkDatabase().then(attempt => {
  if (attempt) {
    console.log('📋 Most Recent Attempt Details:');
    console.log('   Should resume at Question:', attempt.current_question_index + 1);
    console.log('   Has', attempt.questions?.length, 'questions stored');
    console.log('   Has', attempt.student_answers?.filter(a => a.selected_answer !== null).length, 'answers saved');
  }
});
