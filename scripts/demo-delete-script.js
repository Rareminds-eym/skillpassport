#!/usr/bin/env node

/**
 * Demo script showing what the interactive delete script does
 * This simulates the full flow without actually deleting anything
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function demoScript() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Delete User Assessment Records Script - DEMO             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  This is a DEMO - no actual deletion will occur');
  console.log('');
  
  // Simulate user input
  const email = 'gokul@rareminds.in';
  console.log(`📧 Simulated input: ${email}\n`);
  
  // Find user
  console.log('🔍 Looking up user...');
  const { data: student } = await supabase
    .from('students')
    .select('id, user_id, name, email, grade')
    .eq('email', email)
    .single();
  
  if (!student) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('\n✅ User found:');
  console.log(`   Name: ${student.name || 'N/A'}`);
  console.log(`   Email: ${student.email}`);
  console.log(`   Grade: ${student.grade || 'N/A'}`);
  console.log(`   User ID: ${student.id}`);
  
  // Count records
  console.log('\n📊 Counting assessment records...');
  
  const userId = student.id;
  
  const { count: attemptsCount } = await supabase
    .from('personal_assessment_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId);
  
  const { count: resultsCount } = await supabase
    .from('personal_assessment_results')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId);
  
  // Get attempt IDs
  const { data: attempts } = await supabase
    .from('personal_assessment_attempts')
    .select('id')
    .eq('student_id', userId);
  
  const attemptIds = attempts?.map(a => a.id) || [];
  
  let responsesCount = 0;
  let aiQuestionsCount = 0;
  
  if (attemptIds.length > 0) {
    const { count: rc } = await supabase
      .from('personal_assessment_responses')
      .select('*', { count: 'exact', head: true })
      .in('attempt_id', attemptIds);
    responsesCount = rc || 0;
    
    const { count: aq } = await supabase
      .from('career_assessment_ai_questions')
      .select('*', { count: 'exact', head: true })
      .in('attempt_id', attemptIds);
    aiQuestionsCount = aq || 0;
  }
  
  const { count: adaptiveSessionsCount } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId);
  
  const { data: sessions } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('id')
    .eq('student_id', userId);
  
  const sessionIds = sessions?.map(s => s.id) || [];
  
  let adaptiveResponsesCount = 0;
  if (sessionIds.length > 0) {
    const { count: arc } = await supabase
      .from('adaptive_aptitude_responses')
      .select('*', { count: 'exact', head: true })
      .in('session_id', sessionIds);
    adaptiveResponsesCount = arc || 0;
  }
  
  console.log('\n📋 Records that would be deleted:');
  console.log(`   • Assessment Attempts: ${attemptsCount || 0}`);
  console.log(`   • Assessment Results: ${resultsCount || 0}`);
  console.log(`   • Assessment Responses: ${responsesCount}`);
  console.log(`   • Adaptive Sessions: ${adaptiveSessionsCount || 0}`);
  console.log(`   • Adaptive Responses: ${adaptiveResponsesCount}`);
  console.log(`   • AI Questions: ${aiQuestionsCount}`);
  console.log(`   ─────────────────────────────────────`);
  const total = (attemptsCount || 0) + (resultsCount || 0) + responsesCount + 
                (adaptiveSessionsCount || 0) + adaptiveResponsesCount + aiQuestionsCount;
  console.log(`   TOTAL RECORDS: ${total}`);
  
  if (total === 0) {
    console.log('\n✅ No assessment records found for this user.');
    console.log('   Database is already clean.\n');
  } else {
    // Show attempt details
    const { data: attemptDetails } = await supabase
      .from('personal_assessment_attempts')
      .select('grade_level, stream_id, status, started_at, completed_at')
      .eq('student_id', userId)
      .order('started_at', { ascending: false });
    
    if (attemptDetails && attemptDetails.length > 0) {
      console.log('\n📝 Assessment Attempts:');
      attemptDetails.forEach((attempt, index) => {
        console.log(`   ${index + 1}. ${attempt.grade_level} - ${attempt.stream_id}`);
        console.log(`      Status: ${attempt.status}`);
        console.log(`      Started: ${new Date(attempt.started_at).toLocaleString()}`);
        if (attempt.completed_at) {
          console.log(`      Completed: ${new Date(attempt.completed_at).toLocaleString()}`);
        }
      });
    }
    
    console.log('\n⚠️  In the real script, you would now:');
    console.log('   1. Be asked: "Are you sure? (yes/no)"');
    console.log('   2. Type "yes" to confirm');
    console.log('   3. Be asked to re-type the email');
    console.log('   4. See deletion progress for each step');
    console.log('   5. See verification that all records are deleted\n');
  }
  
  console.log('✅ DEMO Complete!');
  console.log('\n📝 To run the actual script:');
  console.log('   node scripts/delete-user-assessment-records.js');
  console.log('\n⚠️  The actual script will:');
  console.log('   • Require interactive confirmation');
  console.log('   • Actually delete the records');
  console.log('   • Verify deletion was successful');
}

demoScript();
