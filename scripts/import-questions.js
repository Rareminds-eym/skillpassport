import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables.');
  console.error('   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY).');
  console.error('   Example:');
  console.error('     VITE_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node scripts/import-questions.js data.csv');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log(`✅ Supabase client initialized: ${supabaseUrl.substring(0, 30)}...`);

/**
 * Transform a CSV record to match the database schema.
 * Handles both uppercase (option_A) and lowercase (option_a) column names.
 */
function transformCSVRecord(record) {
  return {
    id: record.id,
    batch_id: record.batch_id,
    grade: String(record.grade),
    dimension: record.dimension,
    band: String(record.band),
    difficulty_rank: parseInt(record.difficulty_rank, 10),
    template_family: record.template_family,
    question_text: record.question_text,
    option_a: record.option_A || record.option_a,
    option_b: record.option_B || record.option_b,
    option_c: record.option_C || record.option_c,
    option_d: record.option_D || record.option_d,
    correct_answer: record.correct_answer,
    explanation_step_1: record.explanation_step_1 || null,
    explanation_step_2: record.explanation_step_2 || null,
    explanation_step_3: record.explanation_step_3 || null,
    final_answer: record.final_answer || null,
    time_target_sec: record.time_target_sec ? parseInt(record.time_target_sec, 10) : null,
    solution_type: record.solution_type || null,
    solution_data: record.solution_data || null,
    explanation: record.explanation || null,
  };
}

/**
 * Validate a question record before insertion.
 */
function validateQuestion(q, index) {
  const errors = [];
  if (!q.id) errors.push('missing id');
  if (!q.batch_id) errors.push('missing batch_id');
  if (!q.grade) errors.push('missing grade');
  if (!q.dimension) errors.push('missing dimension');
  if (!q.band) errors.push('missing band');
  if (!q.template_family) errors.push('missing template_family');
  if (!q.question_text) errors.push('missing question_text');
  if (!q.option_a || !q.option_b || !q.option_c || !q.option_d) errors.push('missing options');
  if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) errors.push(`invalid correct_answer: "${q.correct_answer}"`);
  if (isNaN(q.difficulty_rank) || q.difficulty_rank < 1 || q.difficulty_rank > 5) errors.push(`invalid difficulty_rank: ${q.difficulty_rank}`);

  if (errors.length > 0) {
    console.warn(`⚠️  Row ${index + 1} (${q.id || 'no-id'}): ${errors.join(', ')}`);
    return false;
  }
  return true;
}

/**
 * Import questions from CSV file
 */
async function importQuestionsFromCSV(csvFilePath) {
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📄 Parsed ${records.length} rows from CSV`);

  const questions = records.map(transformCSVRecord);

  const valid = [];
  let skipped = 0;
  questions.forEach((q, i) => {
    if (validateQuestion(q, i)) {
      valid.push(q);
    } else {
      skipped++;
    }
  });

  console.log(`✅ ${valid.length} valid questions, ⚠️ ${skipped} skipped`);

  if (valid.length === 0) {
    console.error('❌ No valid questions to import.');
    process.exit(1);
  }

  await insertBatched(valid);
}

/**
 * Import questions from JSON file
 */
async function importQuestionsFromJSON(jsonFilePath) {
  const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
  const rawQuestions = JSON.parse(fileContent);

  if (!Array.isArray(rawQuestions)) {
    console.error('❌ JSON file must contain an array of question objects.');
    process.exit(1);
  }

  console.log(`📄 Parsed ${rawQuestions.length} questions from JSON`);

  // Normalize JSON records the same way as CSV (handles option_A vs option_a, etc.)
  const questions = rawQuestions.map(transformCSVRecord);

  const valid = [];
  let skipped = 0;
  questions.forEach((q, i) => {
    if (validateQuestion(q, i)) {
      valid.push(q);
    } else {
      skipped++;
    }
  });

  console.log(`✅ ${valid.length} valid questions, ⚠️ ${skipped} skipped`);

  if (valid.length === 0) {
    console.error('❌ No valid questions to import.');
    process.exit(1);
  }

  await insertBatched(valid);
}

/**
 * Insert questions in batches with upsert to handle duplicates.
 */
async function insertBatched(questions) {
  const batchSize = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(questions.length / batchSize);

    const { data, error } = await supabase
      .from('aptitude_questions')
      .upsert(batch, { onConflict: 'id' })
      .select('id');

    if (error) {
      console.error(`❌ Batch ${batchNum}/${totalBatches} failed:`, error.message);
      failed += batch.length;
    } else {
      inserted += (data ?? []).length;
      console.log(`✅ Batch ${batchNum}/${totalBatches}: ${(data ?? []).length} questions imported`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════');
  console.log(`  Import complete!`);
  console.log(`  ✅ Inserted/updated: ${inserted}`);
  if (failed > 0) console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total processed: ${questions.length}`);
  console.log('═══════════════════════════════════');
}

// ─── CLI ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/import-questions.js <file-path>');
  console.log('');
  console.log('Supported formats: .csv, .json');
  console.log('');
  console.log('Environment variables:');
  console.log('  VITE_SUPABASE_URL          - Your Supabase project URL');
  console.log('  SUPABASE_SERVICE_ROLE_KEY   - Service role key (for write access)');
  process.exit(1);
}

const filePath = args[0];

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

const ext = path.extname(filePath).toLowerCase();

if (ext === '.csv') {
  importQuestionsFromCSV(filePath).catch(err => {
    console.error('❌ Import failed:', err);
    process.exit(1);
  });
} else if (ext === '.json') {
  importQuestionsFromJSON(filePath).catch(err => {
    console.error('❌ Import failed:', err);
    process.exit(1);
  });
} else {
  console.error(`❌ Unsupported file format "${ext}". Use .csv or .json`);
  process.exit(1);
}
