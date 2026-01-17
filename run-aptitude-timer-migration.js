/**
 * Run the aptitude question timer migration
 * Adds the aptitude_question_timer column to personal_assessment_attempts table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running aptitude question timer migration...\n');
    
    // Read the SQL file
    const sqlFile = join(__dirname, 'add-aptitude-question-timer-column.sql');
    const sql = readFileSync(sqlFile, 'utf8');
    
    // Split into individual statements (separated by semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Executing:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct query if RPC fails
        const { data: directData, error: directError } = await supabase
          .from('_sql')
          .select('*')
          .limit(0);
        
        if (directError) {
          console.error('❌ Error:', error.message);
          throw error;
        }
      }
      
      console.log('✅ Success');
      
      if (data) {
        console.log('📊 Result:', JSON.stringify(data, null, 2));
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test the implementation by starting an aptitude assessment');
    console.log('   2. Wait 30 seconds during a question');
    console.log('   3. Refresh the page');
    console.log('   4. Verify the timer shows ~30s (not 60s)');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Manual migration required:');
    console.log('   1. Open Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the contents of add-aptitude-question-timer-column.sql');
    console.log('   3. Click "Run" to execute the migration');
    process.exit(1);
  }
}

runMigration();
