const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeImport() {
  try {
    console.log('Reading SQL file...');
    const sql = fs.readFileSync('import-all-internships.sql', 'utf8');
    
    console.log('Executing SQL via Supabase...');
    console.log('Note: This will insert 50 learning internships');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('✅ Successfully imported all 50 internships!');
    
    // Verify the import
    const { data: count, error: countError } = await supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('recruiter_id', '902d03ef-71c0-4781-8e09-c2ef46511cbb');
    
    if (!countError) {
      console.log(`\n📊 Total internships with recruiter_id: ${count}`);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

executeImport();
