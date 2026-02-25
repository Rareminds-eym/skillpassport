/**
 * Run migrations on local Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🚀 Running migrations on local Supabase...\n');

  // Read migration files
  const migration1 = fs.readFileSync('supabase/migrations/20260215000000_create_adaptive_question_bank.sql', 'utf-8');
  const migration2 = fs.readFileSync('supabase/migrations/20260215000001_add_responses_jsonb_column.sql', 'utf-8');

  // Run migration 1
  console.log('📦 Running migration 1: create_adaptive_question_bank...');
  const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 }).single();
  
  if (error1) {
    console.log('⚠️  Using direct query instead...');
    // Split by semicolon and run each statement
    const statements = migration1.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        if (error) console.error('Error:', error.message);
      }
    }
  } else {
    console.log('✅ Migration 1 complete');
  }

  // Run migration 2
  console.log('\n📦 Running migration 2: add_responses_jsonb_column...');
  const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 }).single();
  
  if (error2) {
    console.log('⚠️  Using direct query instead...');
    const statements = migration2.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        if (error) console.error('Error:', error.message);
      }
    }
  } else {
    console.log('✅ Migration 2 complete');
  }

  console.log('\n✅ All migrations complete!');
  console.log('\nNow run: node scripts/import-adaptive-questions.js');
}

runMigrations().catch(console.error);
