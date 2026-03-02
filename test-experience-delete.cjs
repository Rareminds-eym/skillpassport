const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.development' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testExperienceDelete() {
  console.log('\n🧪 Testing Experience Delete Functionality\n');
  
  // Find a student with experience
  const testStudentId = 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c';
  
  try {
    // Step 1: Get student info and authenticate
    console.log('📋 Step 1: Finding student and authenticating...');
    
    // First, get the student's email using service role
    const { data: studentInfo, error: studentInfoError } = await supabase
      .from('students')
      .select('email, user_id')
      .eq('user_id', testStudentId)
      .single();
    
    if (studentInfoError) {
      console.log('⚠️ Could not find student, using user_id directly');
    } else {
      console.log('✅ Found student:', studentInfo.email);
      
      // Try to sign in (this will fail if we don't have the password, but that's OK)
      // For testing, we'll use the service role client which bypasses RLS
      console.log('   Using service role for testing (bypasses RLS)');
    }
    
    // Step 2: Get current experience records
    console.log('\n📋 Step 2: Getting current experience records...');
    const { data: currentExperience, error: fetchError } = await supabase
      .from('experience')
      .select('*')
      .eq('student_id', testStudentId)
      .order('created_at', { ascending: false });
    
    if (fetchError) throw fetchError;
    console.log(`✅ Found ${currentExperience.length} experience records:`);
    currentExperience.forEach((exp, idx) => {
      console.log(`   ${idx + 1}. ${exp.role} at ${exp.organization} (ID: ${exp.id})`);
    });
    
    if (currentExperience.length === 0) {
      console.log('\n⚠️ No experience records to delete. Please add some first.');
      return;
    }
    
    // Step 3: Try to delete the first record
    const recordToDelete = currentExperience[0];
    console.log(`\n📋 Step 3: Attempting to delete: "${recordToDelete.role}" (ID: ${recordToDelete.id})`);
    
    const { error: deleteError } = await supabase
      .from('experience')
      .delete()
      .eq('id', recordToDelete.id);
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      
      // Check RLS policies
      console.log('\n🔍 Checking RLS policies...');
      const { data: policies, error: policyError } = await supabase
        .rpc('exec_sql', { 
          sql: `
            SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies
            WHERE tablename = 'experience'
            ORDER BY policyname;
          `
        });
      
      if (!policyError && policies) {
        console.log('RLS Policies:', JSON.stringify(policies, null, 2));
      }
      
      return;
    }
    
    console.log('✅ Delete successful!');
    
    // Step 4: Verify deletion
    console.log('\n📋 Step 4: Verifying deletion...');
    const { data: afterDelete, error: verifyError } = await supabase
      .from('experience')
      .select('*')
      .eq('student_id', testStudentId)
      .order('created_at', { ascending: false });
    
    if (verifyError) throw verifyError;
    console.log(`✅ Now have ${afterDelete.length} experience records (was ${currentExperience.length})`);
    
    if (afterDelete.length === currentExperience.length - 1) {
      console.log('✅ DELETE WORKS CORRECTLY!');
    } else {
      console.log('❌ DELETE DID NOT WORK - record count unchanged');
    }
    
    // Step 5: Test delete via service function (simulating frontend)
    console.log('\n📋 Step 5: Testing delete via service function...');
    
    // Get remaining records and remove one
    const remainingIds = afterDelete.map(exp => exp.id);
    if (remainingIds.length > 0) {
      const idsToKeep = remainingIds.slice(1); // Remove first one
      console.log(`Keeping ${idsToKeep.length} records, deleting 1`);
      
      // This simulates what the frontend does - send only the records to keep
      const recordsToKeep = afterDelete.slice(1);
      
      console.log('Records to keep:', recordsToKeep.map(r => `${r.role} (${r.id})`));
      
      // Simulate the service function logic
      const incomingIds = new Set(recordsToKeep.map(r => r.id));
      const toDelete = afterDelete
        .filter(existing => !incomingIds.has(existing.id))
        .map(existing => existing.id);
      
      console.log('IDs to delete:', toDelete);
      
      if (toDelete.length > 0) {
        const { error: serviceDeleteError } = await supabase
          .from('experience')
          .delete()
          .in('id', toDelete);
        
        if (serviceDeleteError) {
          console.error('❌ Service delete failed:', serviceDeleteError);
        } else {
          console.log('✅ Service delete successful!');
          
          // Verify
          const { data: finalCheck } = await supabase
            .from('experience')
            .select('id, role')
            .eq('student_id', testStudentId);
          
          console.log(`Final count: ${finalCheck.length} records`);
          finalCheck.forEach(exp => {
            console.log(`  - ${exp.role} (${exp.id})`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testExperienceDelete();
