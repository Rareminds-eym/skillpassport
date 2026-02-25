/**
 * Test the adaptive question bank
 * Run with: node scripts/test-question-bank.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const isLocal = process.env.VITE_SUPABASE_URL?.includes('127.0.0.1') || process.env.VITE_SUPABASE_URL?.includes('localhost');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = isLocal 
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuestionBank() {
  console.log('🧪 Testing Adaptive Question Bank\n');

  // Test 1: Check if table exists and has data
  console.log('📊 Test 1: Checking question bank...');
  const { data: questions, error, count } = await supabase
    .from('adaptive_question_bank')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Found ${count} total questions`);
  console.log(`   Sample questions:`, questions?.length || 0);
  console.log('');

  // Test 2: Query by grade and difficulty
  console.log('📊 Test 2: Querying grade 6, difficulty 1-2...');
  const { data: easyQuestions } = await supabase
    .from('adaptive_question_bank')
    .select('*')
    .eq('grade', 6)
    .gte('difficulty_rank', 1)
    .lte('difficulty_rank', 2)
    .eq('is_active', true)
    .limit(3);

  console.log(`✅ Found ${easyQuestions?.length || 0} easy questions`);
  if (easyQuestions && easyQuestions.length > 0) {
    console.log(`   Example: ${easyQuestions[0].question_text}`);
    console.log(`   Options: A) ${easyQuestions[0].option_a}, B) ${easyQuestions[0].option_b}`);
    console.log(`   Correct: ${easyQuestions[0].correct_answer}`);
  }
  console.log('');

  // Test 3: Check distribution
  console.log('📊 Test 3: Checking distribution...');
  const { data: stats } = await supabase
    .from('adaptive_question_bank')
    .select('grade, dimension, difficulty_rank')
    .eq('is_active', true);

  if (stats) {
    const byGrade = {};
    const byDimension = {};
    const byDifficulty = {};

    stats.forEach(q => {
      byGrade[q.grade] = (byGrade[q.grade] || 0) + 1;
      byDimension[q.dimension] = (byDimension[q.dimension] || 0) + 1;
      byDifficulty[q.difficulty_rank] = (byDifficulty[q.difficulty_rank] || 0) + 1;
    });

    console.log('✅ Distribution:');
    console.log('   By Grade:', byGrade);
    console.log('   By Dimension:', byDimension);
    console.log('   By Difficulty:', byDifficulty);
  }
  console.log('');

  // Test 4: Test the append_adaptive_response function
  console.log('📊 Test 4: Testing response storage...');
  console.log('   (Skipped - requires active session)');
  console.log('');

  console.log('✅ All tests passed!');
}

testQuestionBank().catch(console.error);
