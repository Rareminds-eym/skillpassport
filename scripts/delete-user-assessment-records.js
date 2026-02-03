#!/usr/bin/env node

/**
 * Delete User Assessment Records Script
 * 
 * This script removes all assessment-related records for a specific user
 * identified by their email address.
 * 
 * Usage:
 *   node scripts/delete-user-assessment-records.js
 * 
 * The script will:
 * 1. Prompt for user email
 * 2. Find the user in the database
 * 3. Show what will be deleted
 * 4. Ask for confirmation
 * 5. Delete all assessment records
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables from .env.development file ONLY
dotenv.config({ path: '.env.development' });

// Initialize Supabase client with DEVELOPMENT credentials only
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.development');
  process.exit(1);
}

console.log('🔧 Using DEVELOPMENT environment from .env.development');
console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Find user by email
 */
async function findUser(email) {
  console.log(`\n🔍 Looking up user: ${email}...`);
  
  // Only query students table (auth.users is not accessible via regular queries)
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, user_id, name, email, grade')
    .eq('email', email)
    .single();
  
  if (studentError && studentError.code !== 'PGRST116') {
    console.error('❌ Error querying students:', studentError.message);
    return null;
  }
  
  if (!student) {
    return null;
  }
  
  return {
    userId: student.user_id || student.id,
    email: student.email,
    name: student.name,
    grade: student.grade,
    studentId: student.id
  };
}

/**
 * Count assessment records for user
 */
async function countRecords(userId) {
  const counts = {
    attempts: 0,
    results: 0,
    responses: 0,
    adaptiveSessions: 0,
    adaptiveResponses: 0,
    aiQuestions: 0
  };

  
  // Count attempts
  const { count: attemptsCount } = await supabase
    .from('personal_assessment_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId);
  counts.attempts = attemptsCount || 0;
  
  // Count results
  const { count: resultsCount } = await supabase
    .from('personal_assessment_results')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId);
  counts.results = resultsCount || 0;
  
  // Get attempt IDs for counting related records
  const { data: attempts } = await supabase
    .from('personal_assessment_attempts')
    .select('id')
    .eq('student_id', userId);
  
  const attemptIds = attempts?.map(a => a.id) || [];
  
  if (attemptIds.length > 0) {
    // Count responses
    const { count: responsesCount } = await supabase
      .from('personal_assessment_responses')
      .select('*', { count: 'exact', head: true })
      .in('attempt_id', attemptIds);
    counts.responses = responsesCount || 0;
    
    // Count AI questions
    const { count: aiQuestionsCount } = await supabase
      .from('career_assessment_ai_questions')
      .select('*', { count: 'exact', head: true })
      .in('attempt_id', attemptIds);
    counts.aiQuestions = aiQuestionsCount || 0;
  }
  
  // Count adaptive sessions
  const { count: adaptiveSessionsCount } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId);
  counts.adaptiveSessions = adaptiveSessionsCount || 0;
  
  // Get session IDs for counting adaptive responses
  const { data: sessions } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('id')
    .eq('student_id', userId);
  
  const sessionIds = sessions?.map(s => s.id) || [];
  
  if (sessionIds.length > 0) {
    const { count: adaptiveResponsesCount } = await supabase
      .from('adaptive_aptitude_responses')
      .select('*', { count: 'exact', head: true })
      .in('session_id', sessionIds);
    counts.adaptiveResponses = adaptiveResponsesCount || 0;
  }
  
  return counts;
}

/**
 * Get detailed attempt information
 */
async function getAttemptDetails(userId) {
  const { data: attempts } = await supabase
    .from('personal_assessment_attempts')
    .select('id, grade_level, stream_id, status, started_at, completed_at')
    .eq('student_id', userId)
    .order('started_at', { ascending: false });
  
  return attempts || [];
}

/**
 * Delete all assessment records for user
 */
async function deleteRecords(userId) {
  console.log('\n🗑️  Starting deletion process...\n');
  
  try {
    // Step 1: Delete assessment results
    console.log('1️⃣  Deleting assessment results...');
    const { error: resultsError } = await supabase
      .from('personal_assessment_results')
      .delete()
      .eq('student_id', userId);
    
    if (resultsError) throw resultsError;
    console.log('   ✅ Assessment results deleted');
    
    // Step 2: Get attempt IDs
    const { data: attempts } = await supabase
      .from('personal_assessment_attempts')
      .select('id')
      .eq('student_id', userId);
    
    const attemptIds = attempts?.map(a => a.id) || [];
    
    if (attemptIds.length > 0) {
      // Step 3: Delete assessment responses
      console.log('2️⃣  Deleting assessment responses...');
      const { error: responsesError } = await supabase
        .from('personal_assessment_responses')
        .delete()
        .in('attempt_id', attemptIds);
      
      if (responsesError) throw responsesError;
      console.log('   ✅ Assessment responses deleted');
      
      // Step 4: Delete AI questions
      console.log('3️⃣  Deleting AI questions...');
      const { error: aiQuestionsError } = await supabase
        .from('career_assessment_ai_questions')
        .delete()
        .in('attempt_id', attemptIds);
      
      if (aiQuestionsError) throw aiQuestionsError;
      console.log('   ✅ AI questions deleted');
    }
    
    // Step 5: Get adaptive session IDs
    const { data: sessions } = await supabase
      .from('adaptive_aptitude_sessions')
      .select('id')
      .eq('student_id', userId);
    
    const sessionIds = sessions?.map(s => s.id) || [];
    
    if (sessionIds.length > 0) {
      // Step 6: Delete adaptive responses
      console.log('4️⃣  Deleting adaptive aptitude responses...');
      const { error: adaptiveResponsesError } = await supabase
        .from('adaptive_aptitude_responses')
        .delete()
        .in('session_id', sessionIds);
      
      if (adaptiveResponsesError) throw adaptiveResponsesError;
      console.log('   ✅ Adaptive responses deleted');
    }
    
    // Step 7: Delete adaptive sessions
    console.log('5️⃣  Deleting adaptive aptitude sessions...');
    const { error: adaptiveSessionsError } = await supabase
      .from('adaptive_aptitude_sessions')
      .delete()
      .eq('student_id', userId);
    
    if (adaptiveSessionsError) throw adaptiveSessionsError;
    console.log('   ✅ Adaptive sessions deleted');
    
    // Step 8: Delete assessment attempts
    console.log('6️⃣  Deleting assessment attempts...');
    const { error: attemptsError } = await supabase
      .from('personal_assessment_attempts')
      .delete()
      .eq('student_id', userId);
    
    if (attemptsError) throw attemptsError;
    console.log('   ✅ Assessment attempts deleted');
    
    return true;
  } catch (error) {
    console.error('\n❌ Error during deletion:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Delete User Assessment Records Script                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  WARNING: This will permanently delete all assessment records');
  console.log('   for the specified user, including:');
  console.log('   • Assessment attempts');
  console.log('   • Assessment results');
  console.log('   • Individual responses');
  console.log('   • Adaptive aptitude sessions');
  console.log('   • AI-generated questions');
  console.log('');
  
  try {
    // Get email from user
    const email = await question('📧 Enter user email: ');
    
    if (!email || !email.includes('@')) {
      console.log('❌ Invalid email address');
      rl.close();
      return;
    }
    
    // Find user
    const user = await findUser(email.trim());
    
    if (!user) {
      console.log(`\n❌ User not found: ${email}`);
      rl.close();
      return;
    }
    
    // Display user info
    console.log('\n✅ User found:');
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Grade: ${user.grade || 'N/A'}`);
    console.log(`   User ID: ${user.userId}`);
    
    // Count records
    console.log('\n📊 Counting assessment records...');
    const counts = await countRecords(user.userId);
    
    console.log('\n📋 Records to be deleted:');
    console.log(`   • Assessment Attempts: ${counts.attempts}`);
    console.log(`   • Assessment Results: ${counts.results}`);
    console.log(`   • Assessment Responses: ${counts.responses}`);
    console.log(`   • Adaptive Sessions: ${counts.adaptiveSessions}`);
    console.log(`   • Adaptive Responses: ${counts.adaptiveResponses}`);
    console.log(`   • AI Questions: ${counts.aiQuestions}`);
    console.log(`   ─────────────────────────────────────`);
    console.log(`   TOTAL RECORDS: ${counts.attempts + counts.results + counts.responses + counts.adaptiveSessions + counts.adaptiveResponses + counts.aiQuestions}`);
    
    // Show attempt details if any
    if (counts.attempts > 0) {
      console.log('\n📝 Assessment Attempts:');
      const attempts = await getAttemptDetails(user.userId);
      attempts.forEach((attempt, index) => {
        console.log(`   ${index + 1}. ${attempt.grade_level} - ${attempt.stream_id}`);
        console.log(`      Status: ${attempt.status}`);
        console.log(`      Started: ${new Date(attempt.started_at).toLocaleString()}`);
        if (attempt.completed_at) {
          console.log(`      Completed: ${new Date(attempt.completed_at).toLocaleString()}`);
        }
      });
    }
    
    // Check if there are any records to delete
    const totalRecords = counts.attempts + counts.results + counts.responses + 
                         counts.adaptiveSessions + counts.adaptiveResponses + counts.aiQuestions;
    
    if (totalRecords === 0) {
      console.log('\n✅ No assessment records found for this user.');
      rl.close();
      return;
    }
    
    // Confirm deletion
    console.log('\n⚠️  This action cannot be undone!');
    const confirm = await question('\n❓ Are you sure you want to delete all these records? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Deletion cancelled.');
      rl.close();
      return;
    }
    
    // Double confirmation for safety
    const doubleConfirm = await question(`\n❓ Type the email address again to confirm: `);
    
    if (doubleConfirm.trim() !== email.trim()) {
      console.log('\n❌ Email does not match. Deletion cancelled.');
      rl.close();
      return;
    }
    
    // Perform deletion
    const success = await deleteRecords(user.userId);
    
    if (success) {
      // Verify deletion
      console.log('\n✅ Verifying deletion...');
      const finalCounts = await countRecords(user.userId);
      
      console.log('\n📊 Final verification:');
      console.log(`   • Assessment Attempts: ${finalCounts.attempts}`);
      console.log(`   • Assessment Results: ${finalCounts.results}`);
      console.log(`   • Assessment Responses: ${finalCounts.responses}`);
      console.log(`   • Adaptive Sessions: ${finalCounts.adaptiveSessions}`);
      console.log(`   • Adaptive Responses: ${finalCounts.adaptiveResponses}`);
      console.log(`   • AI Questions: ${finalCounts.aiQuestions}`);
      
      const allDeleted = Object.values(finalCounts).every(count => count === 0);
      
      if (allDeleted) {
        console.log('\n✅ SUCCESS! All assessment records have been deleted.');
        console.log(`   User ${email} can now start fresh with a new assessment.`);
      } else {
        console.log('\n⚠️  WARNING: Some records may not have been deleted.');
        console.log('   Please check the database manually.');
      }
    } else {
      console.log('\n❌ Deletion failed. Please check the error messages above.');
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
main();
