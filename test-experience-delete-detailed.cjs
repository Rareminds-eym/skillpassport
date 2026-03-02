const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

// Create both anon and service role clients
const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const supabaseService = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDelete() {
  console.log('\n🧪 Testing Experience Delete with Service Role\n');
  
  const testStudentId = 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c';
  
  try {
    // Get current records
    const { data: before, error: beforeError } = await supabaseService
      .from('experience')
      .select('id, role, organization')
      .eq('student_id', testStudentId)
      .limit(5);
    
    if (beforeError) throw beforeError;
    
    console.log(`📋 Found ${before.length} records:`);
    before.forEach((exp, idx) => {
      console.log(`   ${idx + 1}. ${exp.role} at ${exp.organization} (${exp.id})`);
    });
    
    if (before.length === 0) {
      console.log('⚠️ No records to delete');
      return;
    }
    
    const recordToDelete = before[0];
    console.log(`\n🗑️ Attempting to delete: "${recordToDelete.role}" (${recordToDelete.id})`);
    
    // Try delete with service role (bypasses RLS)
    const { data: deleteData, error: deleteError } = await supabaseService
      .from('experience')
      .delete()
      .eq('id', recordToDelete.id)
      .select();
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      return;
    }
    
    console.log('✅ Delete returned:', deleteData);
    
    // Verify deletion
    const { data: after, error: afterError } = await supabaseService
      .from('experience')
      .select('id, role')
      .eq('student_id', testStudentId);
    
    if (afterError) throw afterError;
    
    console.log(`\n📊 After delete: ${after.length} records (was ${before.length})`);
    
    // Check if the deleted record still exists
    const stillExists = after.find(exp => exp.id === recordToDelete.id);
    if (stillExists) {
      console.error(`❌ RECORD STILL EXISTS! ${stillExists.role} (${stillExists.id})`);
      
      // Check if there's a trigger preventing delete
      console.log('\n🔍 Checking triggers...');
      const { data: triggers } = await supabaseService
        .rpc('exec_sql', {
          sql: `
            SELECT tgname, tgenabled, proname
            FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            WHERE tgrelid = 'experience'::regclass
              AND NOT tgisinternal
            ORDER BY tgname;
          `
        });
      
      console.log('Triggers:', JSON.stringify(triggers, null, 2));
      
    } else {
      console.log('✅ DELETE WORKS!');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testDelete();
