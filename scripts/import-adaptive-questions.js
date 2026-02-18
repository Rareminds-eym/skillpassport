/**
 * Import Adaptive Aptitude Question Bank from CSV
 * Run with: node scripts/import-adaptive-questions.js
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use local Supabase for development
const isLocal = process.env.VITE_SUPABASE_URL?.includes('127.0.0.1') || process.env.VITE_SUPABASE_URL?.includes('localhost');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = isLocal 
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Connecting to:', supabaseUrl);
console.log('🔑 Using:', isLocal ? 'local service key' : 'remote service key');

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importQuestions() {
  console.log('📚 Starting import of adaptive question bank...\n');

  // First, create the table if it doesn't exist
  console.log('🔧 Creating table if not exists...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.adaptive_question_bank (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      grade INTEGER NOT NULL,
      dimension TEXT NOT NULL,
      band TEXT NOT NULL,
      difficulty_rank INTEGER NOT NULL,
      template_family TEXT NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
      explanation_step_1 TEXT,
      explanation_step_2 TEXT,
      explanation_step_3 TEXT,
      final_answer TEXT,
      time_target_sec INTEGER NOT NULL,
      solution_type TEXT,
      solution_data TEXT,
      explanation TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE
    );
  `;

  // Execute table creation using raw SQL
  const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
  
  if (createError) {
    console.log('⚠️  Table might already exist or using fallback method');
  } else {
    console.log('✅ Table created/verified\n');
  }

  // Read CSV file
  const csvContent = fs.readFileSync('Adaptive_Aptitud_Question bank.csv', 'utf-8');
  
  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`📊 Found ${records.length} questions in CSV\n`);

  // Transform records to match database schema
  const questions = records.map(record => ({
    id: record.id,
    batch_id: record.batch_id,
    grade: parseInt(record.grade),
    dimension: record.dimension,
    band: record.band,
    difficulty_rank: parseInt(record.difficulty_rank),
    template_family: record.template_family,
    question_text: record.question_text,
    option_a: record.option_A,
    option_b: record.option_B,
    option_c: record.option_C,
    option_d: record.option_D,
    correct_answer: record.correct_answer,
    explanation_step_1: record.explanation_step_1,
    explanation_step_2: record.explanation_step_2,
    explanation_step_3: record.explanation_step_3,
    final_answer: record.final_answer,
    time_target_sec: parseInt(record.time_target_sec),
    solution_type: record.solution_type,
    solution_data: record.solution_data,
    explanation: record.explanation,
    is_active: true
  }));

  // Insert in batches of 100
  const batchSize = 100;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('adaptive_question_bank')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`✅ Imported batch ${i / batchSize + 1} (${batch.length} questions)`);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Successfully imported: ${imported} questions`);
  console.log(`   ❌ Errors: ${errors} questions`);
  
  // Show statistics
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

    console.log(`\n📈 Question Distribution:`);
    console.log(`   By Grade:`, byGrade);
    console.log(`   By Dimension:`, byDimension);
    console.log(`   By Difficulty:`, byDifficulty);
  }

  console.log('\n✅ Import complete!');
}

importQuestions().catch(console.error);
